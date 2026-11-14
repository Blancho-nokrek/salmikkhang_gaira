import React, { useState } from 'react';
import { useCommunity } from '../context/CommunityContext';
import { DiscussionPost } from '../types';
import { resolveDiscussionAuthor, resolveReplyAuthor } from '../lib/memberDisplay';
import {
  Check,
  Droplet,
  Eye,
  MessageSquare,
  Send,
  ThumbsUp,
  Trash2,
} from 'lucide-react';

interface DiscussionForumProps {
  readOnly?: boolean;
  onNavigateToDirectory?: () => void;
  showSidebar?: boolean;
}

export const DiscussionForum: React.FC<DiscussionForumProps> = ({
  readOnly = false,
  onNavigateToDirectory,
  showSidebar = true,
}) => {
  const {
    t,
    discussions,
    members,
    currentMember,
    firebaseUser,
    isAdminLoggedIn,
    addDiscussionPost,
    likeDiscussionPost,
    addDiscussionReply,
    deleteDiscussionPost,
  } = useCommunity();

  const [newPostText, setNewPostText] = useState('');
  const [newPostCategory, setNewPostCategory] = useState<DiscussionPost['category']>('General');
  const [replyInputs, setReplyInputs] = useState<{ [key: string]: string }>({});
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const liveCurrentMember =
    (currentMember && members.find((m) => m.id === currentMember.id)) || currentMember;

  const posterName = liveCurrentMember?.name || firebaseUser?.displayName || (isAdminLoggedIn ? 'Salmikkhang Admin' : 'Community Member');
  const posterRole = liveCurrentMember?.role || (isAdminLoggedIn ? 'Admin' : 'Member');
  const posterVillage = liveCurrentMember?.village || 'Gaira';
  const posterAvatar = liveCurrentMember?.avatar;

  const handlePostSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (readOnly || !newPostText.trim()) return;
    addDiscussionPost(newPostText.trim(), newPostCategory);
    setNewPostText('');
  };

  const handleReplySubmit = (postId: string) => {
    if (readOnly) return;
    const text = replyInputs[postId]?.trim();
    if (!text) return;
    addDiscussionReply(postId, text);
    setReplyInputs((prev) => ({ ...prev, [postId]: '' }));
  };

  return (
    <div className={showSidebar ? 'grid xl:grid-cols-12 gap-6 items-start' : 'space-y-6'}>
      {/* Main Discussion Feed */}
      <div className={showSidebar ? 'xl:col-span-8 space-y-6 min-w-0' : 'space-y-6 min-w-0'}>
        {readOnly ? (
          <div className="glass-card p-4 sm:p-5 rounded-3xl border border-amber-300/60 dark:border-amber-800/60 bg-amber-50/70 dark:bg-amber-950/30 flex items-start sm:items-center gap-3 text-xs backdrop-blur-2xl">
            <Eye className="w-4 h-4 text-amber-800 dark:text-amber-300 shrink-0 mt-0.5 sm:mt-0" />
            <div className="text-amber-950 dark:text-amber-200 leading-relaxed">
              <strong>{t('Read-Only Forum Supervision:', 'ফোরাম পর্যবেক্ষণ (শুধু দেখার অনুমতি):')}</strong>{' '}
              {t(
                'You can view all youth discussions, roles, and replies, while creating, replying, or deleting posts is restricted to active members/Admin.',
                'আপনি সকল আলোচনা ও মন্তব্য দেখতে পারবেন, তবে পোস্ট, উত্তর বা মুছে ফেলা শুধুমাত্র অ্যাডমিন বা সদস্যদের জন্য নির্ধারিত।'
              )}
            </div>
          </div>
        ) : (
          /* Create Post Box */
          <div className="glass-card p-5 sm:p-6 rounded-3xl border border-white/40 dark:border-white/10 shadow-lg space-y-4 backdrop-blur-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600/20 text-emerald-700 dark:text-emerald-400 font-bold flex items-center justify-center text-sm border border-emerald-500/20 shadow-sm overflow-hidden shrink-0">
                {posterAvatar ? (
                  <img src={posterAvatar} alt={posterName} className="w-full h-full object-cover" />
                ) : (
                  posterName[0]
                )}
              </div>
              <div>
                <div className="font-bold text-sm text-slate-900 dark:text-slate-100">{posterName}</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">{posterRole} · {posterVillage}</div>
              </div>
            </div>

            <form onSubmit={handlePostSubmit} className="space-y-3">
              <textarea
                rows={3}
                value={newPostText}
                onChange={(e) => setNewPostText(e.target.value)}
                placeholder={t(
                  'Share an idea, question, or update with community youth...',
                  'কমিউনিটি সদস্যদের সাথে কোনো প্রস্তাব, ভাবনা বা প্রশ্ন শেয়ার করুন...'
                )}
                className="w-full px-4 py-3 text-sm rounded-2xl border border-white/30 dark:border-white/10 bg-white/60 dark:bg-slate-900/60 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 backdrop-blur-md"
              />

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{t('Topic:', 'বিষয়:')}</span>
                  <select
                    value={newPostCategory}
                    onChange={(e) => setNewPostCategory(e.target.value as DiscussionPost['category'])}
                    className="text-xs font-medium bg-white/60 dark:bg-slate-900/60 px-3 py-1.5 rounded-xl border border-white/30 dark:border-white/10 text-slate-700 dark:text-slate-300 backdrop-blur-md"
                  >
                    <option value="General">{t('General Thought', 'সাধারণ আলোচনা')}</option>
                    <option value="Project Idea">{t('Project Idea', 'উদ্যোগ প্রস্তাব')}</option>
                    <option value="Event Prep">{t('Event Prep', 'অনুষ্ঠানের প্রস্তুতি')}</option>
                    <option value="Question">{t('Question / Help', 'সহায়তা / প্রশ্ন')}</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md border border-white/20 transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{t('Post to Wall', 'পোস্ট করুন')}</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Discussions List */}
        {discussions.length === 0 ? (
          <div className="glass-card p-10 rounded-3xl border border-white/40 dark:border-white/10 text-center space-y-2 backdrop-blur-2xl">
            <MessageSquare className="w-8 h-8 mx-auto text-slate-400 opacity-60" />
            <div className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              {t('No discussions posted yet. Start the conversation!', 'এখনো কোনো আলোচনা পোস্ট করা হয়নি।')}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {discussions.map((post) => {
              const author = resolveDiscussionAuthor(members, post);
              const canDeletePost =
                !readOnly &&
                (isAdminLoggedIn || Boolean(firebaseUser?.uid && post.authorUid === firebaseUser.uid));

              return (
                <div
                  key={post.id}
                  className="glass-card p-4 sm:p-6 rounded-3xl border border-white/40 dark:border-white/10 shadow-lg space-y-4 backdrop-blur-2xl"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-slate-800 text-emerald-950 dark:text-emerald-300 font-bold flex items-center justify-center text-sm border border-emerald-100 dark:border-slate-700 shrink-0 overflow-hidden">
                        {author.avatar ? (
                          <img src={author.avatar} alt={author.name} className="w-full h-full object-cover" />
                        ) : (
                          author.name[0]
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-sm text-slate-950 dark:text-slate-100 truncate">{author.name}</div>
                        <div className="text-[11px] text-slate-800 dark:text-slate-400 truncate">
                          {author.role} · {post.date}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] font-bold px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950 text-emerald-950 dark:text-emerald-300 rounded-lg">
                        {post.category}
                      </span>

                      {canDeletePost && (
                        confirmDeleteId === post.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                deleteDiscussionPost(post.id);
                                setConfirmDeleteId(null);
                              }}
                              className="px-2 py-1 text-[10px] font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg"
                            >
                              {t('Delete', 'মুছুন')}
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              className="px-2 py-1 text-[10px] font-semibold bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg"
                            >
                              {t('Cancel', 'বাতিল')}
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(post.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                            title={t('Delete Post', 'পোস্ট মুছুন')}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )
                      )}
                    </div>
                  </div>

                  <p className="text-sm text-slate-950 dark:text-slate-200 leading-relaxed">
                    {post.text}
                  </p>

                  <div className="flex items-center gap-4 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                    <button
                      type="button"
                      disabled={readOnly}
                      onClick={() => !readOnly && likeDiscussionPost(post.id)}
                      className={`flex items-center gap-1.5 font-bold transition-colors ${
                        post.likedByMe
                          ? 'text-emerald-900 dark:text-emerald-400'
                          : 'text-slate-800 dark:text-slate-400 hover:text-emerald-900'
                      } disabled:opacity-60 disabled:cursor-default`}
                    >
                      <ThumbsUp className={`w-4 h-4 ${post.likedByMe ? 'fill-emerald-700' : ''}`} />
                      <span>{post.likes} {t('Appreciate', 'পছন্দ')}</span>
                    </button>
                    <span className="text-slate-400 dark:text-slate-600">·</span>
                    <span className="text-slate-800 dark:text-slate-400">
                      {post.replies.length} {t('Replies', 'মন্তব্য')}
                    </span>
                  </div>

                  {/* Replies list */}
                  {post.replies.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      {post.replies.map((reply) => {
                        const replyAuthor = resolveReplyAuthor(members, reply);
                        return (
                          <div key={reply.id} className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl space-y-1 text-xs">
                            <div className="flex flex-wrap items-center justify-between gap-1 text-slate-800 dark:text-slate-400">
                              <span className="font-bold text-slate-950 dark:text-slate-100">
                                {replyAuthor.name}{' '}
                                <small className="text-slate-700 dark:text-slate-400 font-normal">({replyAuthor.role})</small>
                              </span>
                              <span className="text-[10px] text-slate-700 dark:text-slate-400">{reply.date}</span>
                            </div>
                            <p className="text-slate-900 dark:text-slate-300">{reply.text}</p>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Add reply row */}
                  {!readOnly && (
                    <div className="flex items-center gap-2 pt-2">
                      <input
                        type="text"
                        value={replyInputs[post.id] || ''}
                        onChange={(e) => setReplyInputs({ ...replyInputs, [post.id]: e.target.value })}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleReplySubmit(post.id);
                          }
                        }}
                        placeholder={t('Write a supportive reply...', 'একটি মন্তব্য লিখুন...')}
                        className="flex-1 min-w-0 px-3 sm:px-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-950 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                      />
                      <button
                        type="button"
                        onClick={() => handleReplySubmit(post.id)}
                        className="px-3 py-2 bg-emerald-100 dark:bg-slate-800 hover:bg-emerald-200 dark:hover:bg-slate-700 text-emerald-950 dark:text-emerald-300 font-bold text-xs rounded-xl transition-colors shrink-0"
                      >
                        {t('Reply', 'উত্তর')}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Right Column: Values & Emergency Blood Donors Quick Box */}
      {showSidebar && (
        <div className="xl:col-span-4 space-y-6 min-w-0">
          {/* Urgent Blood Network Box */}
          <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-3xl p-5 space-y-3 text-rose-950 dark:text-rose-200">
            <div className="flex items-center gap-2 font-bold text-sm text-rose-900 dark:text-rose-300">
              <Droplet className="w-4 h-4 fill-rose-600 text-rose-600" />
              <span>{t('Emergency Blood Network', 'জরুরি রক্তের নেটওয়ার্ক')}</span>
            </div>
            <p className="text-xs text-rose-800/90 dark:text-rose-300/90 leading-relaxed">
              {t(
                'Salmikkhang members maintain a blood donor registry for Gaira & Jolchotro patients in Madhupur hospitals.',
                'মধুপুরের যে কোনো জরুরি প্রয়োজনে আমাদের সদস্যদের রক্তের গ্রুপ ও ফোন নম্বর প্রস্তুত রাখা আছে।'
              )}
            </p>
            {onNavigateToDirectory && (
              <button
                type="button"
                onClick={onNavigateToDirectory}
                className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition-colors"
              >
                {t('Find Blood Donors by Group →', 'রক্তদাতাদের তালিকা দেখুন →')}
              </button>
            )}
          </div>

          {/* Community Values Card */}
          <div className="bg-emerald-900 dark:bg-slate-800 text-white rounded-3xl p-6 space-y-3">
            <div className="text-emerald-300 font-bold text-xs uppercase tracking-wider">
              {t('YOUTH CODE OF CONDUCT', 'সদস্য নীতিমালা')}
            </div>
            <h3 className="font-extrabold text-base text-white">
              {t('Our Shared Commitments', 'আমাদের অঙ্গীকার')}
            </h3>
            <ul className="space-y-2 text-xs text-emerald-100/90 dark:text-slate-300 leading-relaxed">
              <li className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>Respect all community elders and encourage younger students.</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>Actively care for local trees and keep public spaces clean.</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>Honor and preserve Achik cultural heritage and songs.</span>
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
