const heights  = { sm: 32, md: 44, lg: 200 };

export function Logo({ size = "md" }) {
  const h = heights[size] ?? 44;
  return (
    <picture>
      <source srcSet="/logo-dark.webp" media="(prefers-color-scheme: dark)"/>
      <img
        loading="lazy"
        src="/logo.webp"
        alt="Vismo"
        style={{ height: h, width: "auto", maxWidth: "100%", objectFit: "contain", display: "block" }}
      />
    </picture>
  );
}

export function LogoHTML() {
  return `<img src="/logo.webp" alt="Vismo" style="height:48px;object-fit:contain;display:block;"/>`;
}