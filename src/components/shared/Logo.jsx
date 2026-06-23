import { useTheme } from "../../context/ThemeContext.jsx";

const heights = { sm: 32, md: 44, lg: 200 };

export function Logo({ size = "md" }) {
  const { mode } = useTheme();
  const h = heights[size] ?? 44;
  return (
    <img
      loading="lazy"
      src={mode === "dark" ? "/logo-dark.webp" : "/logo.webp"}
      alt="Vismo"
      style={{ height: h, width: "auto", maxWidth: "100%", objectFit: "contain", display: "block" }}
    />
  );
}

export function LogoHTML() {
  return `<img src="/logo.webp" alt="Vismo" style="height:48px;object-fit:contain;display:block;"/>`;
}