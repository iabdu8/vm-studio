// ── VISMO LOGO ────────────────────────────────────────────────
const heights = { sm: 28, md: 40, lg: 56 };

export function Logo({ size = "md" }) {
  const h = heights[size] ?? 40;
  return (
    <img
      src="/logo.webp"
      alt="Vismo"
      height={h}
      style={{ height: h, width: "auto", objectFit: "contain", display: "block" }}
    />
  );
}

export function LogoHTML() {
  return `<img src="/logo.webp" alt="Vismo" style="height:44px;object-fit:contain;"/>`;
}