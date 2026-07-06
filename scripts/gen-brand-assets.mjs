import sharp from "sharp";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pub = path.join(__dirname, "..", "public");
const PURPLE = "#4F46E5";

async function makeDarkLogo() {
  // Force every opaque/partially-opaque pixel to pure white while keeping
  // the alpha (shape) channel untouched — equivalent to the
  // brightness(0) invert(1) CSS filter used live in Logo.jsx, baked into
  // a static asset for consumers that can't apply CSS filters (e.g. email).
  const src = path.join(pub, "logo.png");
  const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  for (let i = 0; i < width * height; i++) {
    const o = i * channels;
    data[o] = 255;
    data[o + 1] = 255;
    data[o + 2] = 255;
  }
  await sharp(data, { raw: { width, height, channels } })
    .png()
    .toFile(path.join(pub, "logo-dark.png"));
  console.log("wrote logo-dark.png");
}

async function main() {
  await makeDarkLogo();
  // Isolate just the "V" checkmark glyph from the wordmark (excludes the
  // translucent "ismo" text, which sits to the right starting ~x=138).
  // The wordmark's tiny tagline ("One platform. Zero confusion.") sits
  // directly under the V at y~116-123, only a few px below the V's vertex
  // (~y110), so the crop must stop before it to avoid bleeding it into the icon.
  const vCropped = await sharp(path.join(pub, "logo.png"))
    .extract({ left: 76, top: 64, width: 59, height: 49 })
    .toBuffer();
  const vTrimmed = await sharp(vCropped).trim({ threshold: 10 }).toBuffer();
  const vMeta = await sharp(vTrimmed).metadata();

  async function makeIcon(size, outFile) {
    const targetW = Math.round(size * 0.56);
    const targetH = Math.round((targetW * vMeta.height) / vMeta.width);
    const vResized = await sharp(vTrimmed)
      .resize(targetW, targetH, { fit: "inside" })
      .toBuffer();
    const { width: rw, height: rh } = await sharp(vResized).metadata();

    await sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: PURPLE,
      },
    })
      .composite([
        {
          input: vResized,
          left: Math.round((size - rw) / 2),
          top: Math.round((size - rh) / 2),
        },
      ])
      .png()
      .toFile(path.join(pub, outFile));
    console.log(`wrote ${outFile} (${size}x${size}, V at ${rw}x${rh})`);
  }

  await makeIcon(192, "icon-192.png");
  await makeIcon(512, "icon-512.png");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
