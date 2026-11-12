/**
 * Resize and compress an uploaded image in the browser so it fits in localStorage.
 * Returns a JPEG data URL (roughly 150-500 KB for a normal photo).
 */
export function compressImage(file: File, maxWidth = 1600, maxChars = 650_000): Promise<string> {
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
        const scale = Math.min(1, maxWidth / img.width);
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Image processing is not supported in this browser.'));
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        let quality = 0.8;
        let out = canvas.toDataURL('image/jpeg', quality);
        while (out.length > maxChars && quality > 0.4) {
          quality -= 0.1;
          out = canvas.toDataURL('image/jpeg', quality);
        }
        resolve(out);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}
