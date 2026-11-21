import express from 'express';
import nodemailer from 'nodemailer';
import crypto from 'node:crypto';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildAutoNotificationEmail,
  resolveSmtpConfig,
  validateAutoNotifyPayload,
} from './src/lib/autoEmail.ts';
import { chunkRecipients, MAX_BCC_PER_BATCH } from './src/lib/gmailNotifications.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);
const IS_PROD = process.env.NODE_ENV === 'production';

const BOOTSTRAP_ADMIN_EMAILS = new Set([
  'salmikkhang@gmail.com',
  'blanchonokreksk@gmail.com',
]);

const PRIMARY_PROJECT_ID = 'fifth-chassis-zct7q';
const PRIMARY_DATABASE_ID = 'ai-studio-salmikkhanggaira-553f112d-8a98-4028-ba5f-1cdd71bd2af9';

function loadAllowedFirebaseProjects(): { projectIds: Set<string>; firestoreTargets: { projectId: string; databaseId: string }[] } {
  const projectIds = new Set<string>([PRIMARY_PROJECT_ID]);
  const firestoreTargets: { projectId: string; databaseId: string }[] = [
    { projectId: PRIMARY_PROJECT_ID, databaseId: PRIMARY_DATABASE_ID },
  ];

  try {
    const configPath = path.resolve(__dirname, 'firebase-applet-config.json');
    const raw = JSON.parse(fs.readFileSync(configPath, 'utf-8')) as {
      projectId?: string;
      firestoreDatabaseId?: string;
    };
    if (raw.projectId) {
      projectIds.add(raw.projectId);
      if (raw.firestoreDatabaseId) {
        firestoreTargets.unshift({
          projectId: raw.projectId,
          databaseId: raw.firestoreDatabaseId,
        });
      }
    }
  } catch {
    // Fallback to primary project ID
  }

  if (process.env.VITE_FIREBASE_PROJECT_ID) {
    projectIds.add(process.env.VITE_FIREBASE_PROJECT_ID.trim());
  }

  return { projectIds, firestoreTargets };
}

const { projectIds: ALLOWED_PROJECT_IDS, firestoreTargets: FIRESTORE_TARGETS } =
  loadAllowedFirebaseProjects();

// Cache Google's public Firebase SecureToken X.509 certificates in memory
let cachedCerts: Record<string, string> | null = null;
let certsExpiresAt = 0;

async function getFirebasePublicCerts(): Promise<Record<string, string>> {
  const now = Date.now();
  if (cachedCerts && now < certsExpiresAt) {
    return cachedCerts;
  }

  const res = await fetch(
    'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com'
  );
  if (!res.ok) {
    throw new Error('Could not fetch Firebase signing certificates.');
  }
  const cacheControl = res.headers.get('cache-control') || '';
  const maxAgeMatch = cacheControl.match(/max-age=(\d+)/i);
  const maxAgeSec = maxAgeMatch ? Number(maxAgeMatch[1]) : 3600;
  cachedCerts = (await res.json()) as Record<string, string>;
  certsExpiresAt = now + Math.max(60, maxAgeSec) * 1000;
  return cachedCerts;
}

interface VerifiedFirebaseToken {
  uid: string;
  email: string;
  emailVerified: boolean;
  projectId: string;
}

function decodeBase64UrlJson<T>(segment: string): T {
  const padded = segment.replace(/-/g, '+').replace(/_/g, '/');
  const json = Buffer.from(padded, 'base64').toString('utf-8');
  return JSON.parse(json) as T;
}

async function verifyFirebaseIdToken(idToken: string): Promise<VerifiedFirebaseToken | null> {
  const parts = idToken.split('.');
  if (parts.length !== 3) return null;

  try {
    const header = decodeBase64UrlJson<{ alg?: string; kid?: string }>(parts[0]);
    const payload = decodeBase64UrlJson<{
      aud?: string;
      iss?: string;
      sub?: string;
      exp?: number;
      iat?: number;
      email?: string;
      email_verified?: boolean;
    }>(parts[1]);

    if (header.alg !== 'RS256' || !header.kid) return null;
    if (!payload.aud || !ALLOWED_PROJECT_IDS.has(payload.aud)) return null;
    if (payload.iss !== `https://securetoken.google.com/${payload.aud}`) return null;
    if (!payload.sub || typeof payload.sub !== 'string') return null;

    const nowSec = Math.floor(Date.now() / 1000);
    if (!payload.exp || payload.exp <= nowSec) return null;
    if (payload.iat && payload.iat > nowSec + 300) return null;

    const certs = await getFirebasePublicCerts();
    const cert = certs[header.kid];
    if (!cert) return null;

    const verifier = crypto.createVerify('RSA-SHA256');
    verifier.update(`${parts[0]}.${parts[1]}`);
    verifier.end();

    const sigBuf = Buffer.from(parts[2].replace(/-/g, '+').replace(/_/g, '/'), 'base64');
    const validSig = verifier.verify(cert, sigBuf);
    if (!validSig) return null;

    const email = (payload.email || '').trim().toLowerCase();
    return {
      uid: payload.sub,
      email,
      emailVerified: payload.email_verified === true,
      projectId: payload.aud,
    };
  } catch {
    return null;
  }
}

async function verifyCallerCanDispatch(
  verified: VerifiedFirebaseToken,
  idToken: string
): Promise<boolean> {
  if (!verified.emailVerified || !verified.email) return false;
  if (BOOTSTRAP_ADMIN_EMAILS.has(verified.email)) return true;

  // Verify active member/admin record via Firestore REST API using caller's own Firebase token
  const target =
    FIRESTORE_TARGETS.find((t) => t.projectId === verified.projectId) || FIRESTORE_TARGETS[0];

  try {
    const queryUrl = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(
      target.projectId
    )}/databases/${encodeURIComponent(target.databaseId)}/documents:runQuery`;

    const res = await fetch(queryUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${idToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId: 'members' }],
          where: {
            fieldFilter: {
              field: { fieldPath: 'ownerEmail' },
              op: 'EQUAL',
              value: { stringValue: verified.email },
            },
          },
          limit: 5,
        },
      }),
    });

    if (!res.ok) return false;
    const rows = (await res.json()) as Array<{
      document?: {
        fields?: {
          status?: { stringValue?: string };
          role?: { stringValue?: string };
        };
      };
    }>;

    return rows.some((row) => {
      const fields = row.document?.fields;
      if (!fields) return false;
      const status = fields.status?.stringValue || 'Active';
      return status !== 'Inactive';
    });
  } catch {
    return false;
  }
}

// Per-user in-memory rate limit: max 20 automatic dispatches per 10 minutes
const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_MAX_REQUESTS = 20;
const rateBuckets = new Map<string, number[]>();

function checkRateLimit(uid: string): boolean {
  const now = Date.now();
  const timestamps = (rateBuckets.get(uid) || []).filter((t) => now - t < RATE_WINDOW_MS);
  if (timestamps.length >= RATE_MAX_REQUESTS) {
    rateBuckets.set(uid, timestamps);
    return false;
  }
  timestamps.push(now);
  rateBuckets.set(uid, timestamps);
  return true;
}

async function createServer() {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '256kb' }));

  app.get('/api/auto-notify/status', (_req, res) => {
    const smtp = resolveSmtpConfig(process.env);
    res.json({ configured: smtp.configured });
  });

  app.post('/api/auto-notify', async (req, res) => {
    const authHeader = req.headers.authorization || '';
    const bearerMatch = authHeader.match(/^Bearer\s+(.+)$/i);
    if (!bearerMatch) {
      res.status(401).json({ ok: false, error: 'Authentication required.' });
      return;
    }

    const idToken = bearerMatch[1].trim();
    const verified = await verifyFirebaseIdToken(idToken);
    if (!verified) {
      res.status(401).json({ ok: false, error: 'Invalid or expired authentication token.' });
      return;
    }

    const authorized = await verifyCallerCanDispatch(verified, idToken);
    if (!authorized) {
      res.status(403).json({ ok: false, error: 'Only verified active community officers can dispatch alerts.' });
      return;
    }

    if (!checkRateLimit(verified.uid)) {
      res.status(429).json({ ok: false, error: 'Rate limit exceeded. Please wait before sending more alerts.' });
      return;
    }

    const validated = validateAutoNotifyPayload(req.body);
    if (!validated.ok) {
      res.status(400).json({ ok: false, error: validated.error });
      return;
    }

    const smtp = resolveSmtpConfig(process.env);
    if (!smtp.configured) {
      res.status(200).json({
        ok: false,
        configured: false,
        sentCount: 0,
        totalRecipients: validated.payload.recipients.length,
        message: 'Automatic email SMTP credentials are not configured on the server yet.',
      });
      return;
    }

    try {
      const transporter = nodemailer.createTransport({
        host: smtp.host,
        port: smtp.port,
        secure: smtp.secure,
        auth: {
          user: smtp.user,
          pass: smtp.pass,
        },
      });

      const emailContent = buildAutoNotificationEmail(
        validated.payload,
        smtp.user,
        smtp.fromName
      );
      const batches = chunkRecipients(validated.payload.recipients, MAX_BCC_PER_BATCH);

      let sentCount = 0;
      let failedRecipients = 0;

      for (const bccBatch of batches) {
        try {
          await transporter.sendMail({
            from: emailContent.from,
            to: smtp.user,
            bcc: bccBatch,
            subject: emailContent.subject,
            text: emailContent.text,
            html: emailContent.html,
          });
          sentCount += bccBatch.length;
        } catch (batchErr) {
          console.error('[auto-notify] SMTP batch error:', batchErr);
          failedRecipients += bccBatch.length;
        }
      }

      res.status(200).json({
        ok: sentCount > 0 && failedRecipients === 0,
        configured: true,
        sentCount,
        failedRecipients,
        totalRecipients: validated.payload.recipients.length,
      });
    } catch (err) {
      console.error('[auto-notify] SMTP dispatch failure:', err);
      res.status(502).json({
        ok: false,
        configured: true,
        sentCount: 0,
        error: 'Automatic email service could not reach the SMTP mail server.',
      });
    }
  });

  const httpServer = http.createServer(app);

  if (!IS_PROD) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
        ws: { server: httpServer },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir, { index: false }));
    app.get('/{*splat}', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Salmikkhang server running on http://0.0.0.0:${PORT}`);
  });
}

void createServer();
