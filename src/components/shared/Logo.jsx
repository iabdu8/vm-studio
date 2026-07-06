import { useTheme } from "../../context/ThemeContext.jsx";

const heights = { md: 40, lg: 80 };

export function Logo({ size = "md" }) {
  const { mode } = useTheme();
  const h = heights[size] ?? 40;
  return (
    <img
      loading="lazy"
      src={mode === "dark" ? "/logo-dark.png" : "/logo.png"}
      alt="Vismo"
      style={{
        height: h,
        width: "auto",
        maxWidth: "100%",
        objectFit: "contain",
        display: "block",
      }}
    />
  );
}

export function LogoHTML() {
  return `<img src="/logo.png" alt="Vismo" style="height:48px;object-fit:contain;display:block;"/>`;
}
