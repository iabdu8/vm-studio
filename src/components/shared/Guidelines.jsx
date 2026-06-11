import { useState } from "react";
import { S, C } from "../../styles/theme.js";
import { supabase } from "../../lib/supabase.js";

export function GuidelinesGrid({ guidelines }) {
  if (!guidelines.length) return (
    <div style={{ ...S.muted, textAlign:"center", padding:20 }}>No guidelines published yet.</div>
  );
  return (
    <div>
      {guidelines.map(g => (
        <div key={g.id} style={{ ...S.card, display:"flex", gap:12, alignItems:"center" }}>
          <div style={{ fontSize:28 }}>{g.file_type==="img" ? "🖼️" : g.file_type==="pdf" ? "📄" : "📎"}</div>
          <div style={{ flex:1 }}>
            <div style={{ fontWeight:700, fontSize:14 }}>{g.title}</div>
            <div style={{ ...S.muted, fontSize:12 }}>{g.category}</div>
          </div>
          {g.file_url && (
            <a href={g.file_url} target="_blank" rel="noopener noreferrer"
              style={{ textDecoration:"none", fontSize:12, padding:"6px 12px",
                background:"transparent", color:C.accentColor, border:`1px solid ${C.accentColor}33`,
                borderRadius:8, cursor:"pointer" }}>
              Open
            </a>
          )}
        </div>
      ))}
    </div>
  );
}

export function VMGuidelines({ guidelines, userId }) {
  const [acked,   setAcked]   = useState({});
  const [loading, setLoading] = useState({});

  const acknowledge = async (guidelineId) => {
    if (acked[guidelineId] || !userId) return;
    setLoading(p => ({ ...p, [guidelineId]: true }));
    await supabase.from("guideline_acks")
      .upsert({ guideline_id: guidelineId, user_id: userId });
    setAcked(p => ({ ...p, [guidelineId]: true }));
    setLoading(p => ({ ...p, [guidelineId]: false }));
  };

  if (!guidelines.length) return (
    <div style={{ ...S.muted, textAlign:"center", padding:40 }}>No guidelines published yet.</div>
  );

  return (
    <div>
      <div style={{ ...S.h1, marginBottom:2 }} className="fu">
        VM <span style={S.accent}>Guidelines</span>
      </div>
      <div style={{ ...S.muted, marginBottom:16, fontSize:12 }}>
        Review and acknowledge all guidelines
      </div>
      {guidelines.map(g => (
        <div key={g.id} style={S.card}>
          <div style={{ display:"flex", gap:12, alignItems:"center", marginBottom:10 }}>
            <div style={{ fontSize:28 }}>{g.file_type==="img" ? "🖼️" : g.file_type==="pdf" ? "📄" : "📎"}</div>
            <div style={{ flex:1 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <div style={{ fontWeight:700, fontSize:14 }}>{g.title}</div>
                {g.is_required && (
                  <span style={{ fontSize:10, fontWeight:700, color:"#f87171",
                    background:"#f8717118", padding:"2px 8px", borderRadius:10 }}>Required</span>
                )}
              </div>
              <div style={{ ...S.muted, fontSize:12 }}>{g.category}</div>
            </div>
            {g.file_url && (
              <a href={g.file_url} target="_blank" rel="noopener noreferrer"
                style={{ textDecoration:"none", fontSize:12, padding:"6px 12px",
                  background:"transparent", color:C.accentColor, border:`1px solid ${C.accentColor}33`,
                  borderRadius:8, cursor:"pointer" }}>
                Open
              </a>
            )}
          </div>
          <button
            onClick={() => acknowledge(g.id)}
            disabled={acked[g.id] || loading[g.id]}
            style={{
              width:"100%", padding:"9px", borderRadius:9,
              cursor: acked[g.id] ? "default" : "pointer",
              fontWeight:600, fontSize:13, border:"none", transition:"all .2s",
              background: acked[g.id] ? "#4ade8022" : C.surfaceHigh,
              color: acked[g.id] ? "#4ade80" : C.mutedColor,
              fontFamily:"'DM Sans',sans-serif",
            }}>
            {loading[g.id] ? "Saving…"
              : acked[g.id] ? "✓ I Have Reviewed This Guideline"
              : "I Have Reviewed This Guideline"}
          </button>
        </div>
      ))}
    </div>
  );
}