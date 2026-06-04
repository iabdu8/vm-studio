// ============================================================
//  IMAGE COMPRESSION
//  Compresses images client-side before upload to Supabase
//  Reduces file size ~70-85% with minimal quality loss
// ============================================================

const DEFAULT_OPTIONS = {
  maxWidth:  1280,
  maxHeight: 1280,
  quality:   0.82,    // 0–1 (0.82 = good balance quality/size)
  mimeType:  "image/jpeg",
};

/**
 * Compress a single File/Blob
 * @param {File} file
 * @param {object} options
 * @returns {Promise<File>}
 */
export async function compressImage(file, options = {}) {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Skip non-images
  if (!file.type.startsWith("image/")) return file;

  // Skip tiny files (< 200KB) — not worth compressing
  if (file.size < 200 * 1024) return file;

  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      // Calculate new dimensions keeping aspect ratio
      let { width, height } = img;
      if (width > opts.maxWidth || height > opts.maxHeight) {
        const ratio = Math.min(opts.maxWidth / width, opts.maxHeight / height);
        width  = Math.round(width  * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement("canvas");
      canvas.width  = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) { resolve(file); return; }
          const compressed = new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), {
            type: opts.mimeType,
            lastModified: Date.now(),
          });

          // If compression made it larger (rare), keep original
          resolve(compressed.size < file.size ? compressed : file);
        },
        opts.mimeType,
        opts.quality
      );
    };

    img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
    img.src = url;
  });
}

/**
 * Compress multiple files
 * @param {File[]} files
 * @param {object} options
 * @returns {Promise<File[]>}
 */
export async function compressImages(files, options = {}) {
  return Promise.all(files.map(f => compressImage(f, options)));
}

/**
 * Compress and attach preview URL — for use with ImageUploader
 * Input:  Array of File objects
 * Output: Array of { file, url } with compressed files and fresh preview URLs
 */
export async function compressAndPreview(files, options = {}) {
  const compressed = await compressImages(files, options);
  return compressed.map(f => ({
    file: f,
    url:  URL.createObjectURL(f),
    originalSize: files.find(o => o.name === f.name)?.size ?? f.size,
    compressedSize: f.size,
  }));
}

/**
 * Human-readable file size
 */
export function formatBytes(bytes) {
  if (bytes < 1024)        return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
