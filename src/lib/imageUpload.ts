/**
 * Resize and compress an uploaded image in the browser so it fits safely within Firestore limits.
 * Returns a JPEG data URL (roughly 120-320 KB for a normal photo).
 */
export function compressImage(file: File, maxWidth = 1280, maxChars = 350_000): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Please choose an image file.'));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read the file.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Could not open the image.'));
      img.onload = () => {
        let targetWidth = Math.min(img.width, maxWidth);
        let out = '';

        for (let attempt = 0; attempt < 5; attempt++) {
          const scale = targetWidth / img.width;
          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, Math.round(img.width * scale));
          canvas.height = Math.max(1, Math.round(img.height * scale));
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Image processing is not supported in this browser.'));
            return;
          }
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          let quality = 0.82;
          out = canvas.toDataURL('image/jpeg', quality);
          while (out.length > maxChars && quality > 0.35) {
            quality -= 0.1;
            out = canvas.toDataURL('image/jpeg', quality);
          }

          if (out.length <= maxChars || targetWidth <= 480) {
            break;
          }
          targetWidth = Math.max(480, Math.round(targetWidth * 0.78));
        }

        if (out.length > maxChars) {
          reject(new Error('Image is too large even after compression.'));
          return;
        }
        resolve(out);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}
