const heights  = { sm: 32, md: 44, lg: 200 };
const maxWidths = { sm: 100, md: 140, lg: "100%" };

export function Logo({ size = "md" }) {
  const h  = heights[size]   ?? 44;
  const mw = maxWidths[size] ?? 140;
  return (
    <img
      loading="lazy"
      src="/logo.webp"
      alt="Vismo"
      style={{ height: h, width: "auto", maxWidth: mw, objectFit: "contain", display: "block" }}
    />
  );
}

export function LogoHTML() {
  return `<img src="/logo.webp" alt="Vismo" style="height:48px;object-fit:contain;display:block;"/>`;
}