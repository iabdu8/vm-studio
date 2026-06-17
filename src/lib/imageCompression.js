// ============================================================
//  IMAGE COMPRESSION — WebP + Smart Dimensions
//  Compresses images client-side before upload to Supabase
//  Reduces file size ~85-92% with minimal quality loss
// ============================================================

// Check WebP support once
const WEBP_SUPPORTED = (() => {
  try {
    const c = document.createElement("canvas");
    return c.toDataURL("image/webp").startsWith("data:image/webp");
  } catch { return false; }
})();

const MIME   = WEBP_SUPPORTED ? "image/webp" : "image/jpeg";
const EXT    = WEBP_SUPPORTED ? ".webp"      : ".jpg";

// Presets per use-case
export const PRESETS = {
  beforeAfter: { maxWidth:1200, maxHeight:1200, quality:0.78 },
  visit:       { maxWidth:1000, maxHeight:1000, quality:0.75 },
  floorWalk:   { maxWidth:1000, maxHeight:1000, quality:0.75 },
  thumbnail:   { maxWidth:400,  maxHeight:400,  quality:0.70 },
  default:     { maxWidth:1200, maxHeight:1200, quality:0.78 },
};

export async function compressImage(file, preset = "default") {
  if (!file || !file.type?.startsWith("image/")) return file;
  if (file.size < 100 * 1024) return file; // skip < 100KB

  const opts = typeof preset === "string"
    ? (PRESETS[preset] ?? PRESETS.default)
    : { ...PRESETS.default, ...preset };

  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

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
          const newName = file.name.replace(/\.[^.]+$/, EXT);
          const compressed = new File([blob], newName, {
            type: MIME, lastModified: Date.now(),
          });
          resolve(compressed.size < file.size ? compressed : file);
        },
        MIME,
        opts.quality
      );
    };

    img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
    img.src = url;
  });
}

export async function compressImages(files, preset = "default") {
  return Promise.all(files.map(f => compressImage(f, preset)));
}

export async function compressAndPreview(files, preset = "default") {
  const compressed = await compressImages(files, preset);
  return compressed.map((f, i) => ({
    file: f,
    url:  URL.createObjectURL(f),
    originalSize:   files[i]?.size ?? f.size,
    compressedSize: f.size,
  }));
}

export function formatBytes(bytes) {
  if (bytes < 1024)        return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}