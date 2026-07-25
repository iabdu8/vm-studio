import { S, C } from "../../styles/theme.js";

const dayMs = 86400000;

function getStatus(dateTo) {
  const today = new Date().toISOString().slice(0, 10);
  const daysLeft = Math.round((new Date(dateTo) - new Date(today)) / dayMs);
  if (daysLeft < 0)  return { label: "Ended",        color: "#f87171", daysLeft };
  if (daysLeft === 0) return { label: "Ends today",   color: "#f87171", daysLeft };
  if (daysLeft <= 3)  return { label: `${daysLeft} day${daysLeft===1?"":"s"} left`, color: "#d4a82a", daysLeft };
  return { label: `${daysLeft} days left`, color: "#4ade80", daysLeft };
}

export function PromotionCard({ promotion, onDelete, extra }) {
  const p = promotion;
  const status = getStatus(p.date_to);

  return (
    <div style={{
      display:"flex", justifyContent:"space-between", alignItems:"flex-start",
      padding:"12px 14px", marginBottom:8, borderRadius:10,
      background:C.surfaceHigh, borderLeft:`4px solid ${status.color}`,
    }}>
      <div style={{ flex:1 }}>
        <div style={{ fontSize:14, fontWeight:700, color:C.accentColor }}>🏷️ {p.name}</div>
        <div style={{ ...S.muted, fontSize:11, marginTop:4 }}>
          {p.date_from} → {p.date_to}
        </div>
        {extra && <div style={{ ...S.muted, fontSize:11, marginTop:2 }}>{extra}</div>}
      </div>
      <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:6, flexShrink:0, marginLeft:10 }}>
        <span style={{
          fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:12,
          background:status.color+"22", color:status.color,
        }}>{status.label}</span>
        {onDelete && (
          <button onClick={() => onDelete(p.id)}
            style={{ background:"none", border:"none", color:C.mutedColor, cursor:"pointer", fontSize:14 }}>✕</button>
        )}
      </div>
    </div>
  );
}
