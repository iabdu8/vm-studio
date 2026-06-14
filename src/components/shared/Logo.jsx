// ── VISMO LOGO ────────────────────────────────────────────────
// size: "sm" | "md" | "lg"
export function Logo({ size = "md", color = "#4F46E5" }) {
  const sizes = {
    sm: { w:80,  h:22, vw:300, vh:64, fs1:40, fs2:40, barH:52, barY:6, bar2H:32, bar2Y:16 },
    md: { w:120, h:32, vw:300, vh:64, fs1:40, fs2:40, barH:52, barY:6, bar2H:32, bar2Y:16 },
    lg: { w:180, h:48, vw:300, vh:64, fs1:40, fs2:40, barH:52, barY:6, bar2H:32, bar2Y:16 },
  };
  const s = sizes[size];
  return (
    <svg width={s.w} height={s.h} viewBox={`0 0 ${s.vw} ${s.vh}`} xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y={s.barY} width="12" height={s.barH} rx="6" fill={color}/>
      <rect x="17" y={s.bar2Y} width="5" height={s.bar2H} rx="2.5" fill={color} opacity="0.35"/>
      <text x="30" y="46" fontFamily="DM Sans, sans-serif" fontSize={s.fs1} fontWeight="700" fill={color}>Vis</text>
      <text x="97" y="46" fontFamily="DM Sans, sans-serif" fontSize={s.fs2} fontWeight="400" fill="currentColor">mo</text>
    </svg>
  );
}

// Logo for print/PDF reports
export function LogoHTML(color = "#4F46E5") {
  return `<svg width="140" height="36" viewBox="0 0 300 64" xmlns="http://www.w3.org/2000/svg">
    <rect x="0" y="6" width="12" height="52" rx="6" fill="${color}"/>
    <rect x="17" y="16" width="5" height="32" rx="2.5" fill="${color}" opacity="0.35"/>
    <text x="30" y="46" font-family="DM Sans, sans-serif" font-size="40" font-weight="700" fill="${color}">Vis</text>
    <text x="97" y="46" font-family="DM Sans, sans-serif" font-size="40" font-weight="400" fill="#1a1a2e">mo</text>
  </svg>`;
}