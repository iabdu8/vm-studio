// Short "how this page works" explainer — used across the app so a
// demo can be understood without someone walking the viewer through it.
// Deliberately blue, not the app's accent color, so it reads as a
// system tip and never blends in with real product UI.
const BLUE = "#3B82F6";

export function InfoBanner({ children }) {
  return (
    <div style={{
      display:"flex", gap:8, alignItems:"flex-start", fontSize:12, lineHeight:1.5,
      padding:"10px 12px", marginBottom:14, borderRadius:10,
      background: BLUE + "15", border:`1px solid ${BLUE}40`, color: BLUE,
    }}>
      <span style={{ flexShrink:0 }}>💡</span>
      <span>{children}</span>
    </div>
  );
}
