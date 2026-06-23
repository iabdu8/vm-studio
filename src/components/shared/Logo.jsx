// ── VISMO LOGO ────────────────────────────────────────────────
const heights = { sm: 32, md: 44, lg: 72 };

export function Logo({ size = "md" }) {
  const h = heights[size] ?? 44;
  return (
    <img
      loading="lazy"
      src="/logo.webp"
      alt="Vismo"
      style={{
        height: h,
        width: "auto",
        maxWidth: size === "lg" ? 220 : size === "md" ? 140 : 100,
        objectFit: "contain",
        display: "block",
      }}
    />
  );
}

export function LogoHTML() {
  return `<img src="/logo.webp" alt="Vismo" style="height:48px;object-fit:contain;display:block;"/>`;
}