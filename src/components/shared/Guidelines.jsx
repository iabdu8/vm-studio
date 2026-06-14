import { useState, useEffect } from "react";
import { S, C } from "../../styles/theme.js";
import { supabase } from "../../lib/supabase.js";

// ── FILE PREVIEW MODAL ────────────────────────────────────────
function FilePreview({ url, title, onClose }) {
  if (!url) return null;
  const isPDF = url.toLowerCase().includes(".pdf") || url.toLowerCase().includes("application/pdf");
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const pdfSrc = isPDF
    ? `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`
    : url;

  return (
    <div style={{
      position:"fixed", inset:0, background:"#000000cc", zIndex:700,
      display:"flex", flexDirection:"column",
    }}>
      {/* Header */}
      <div style={{
        display:"flex", justifyContent:"space-between", alignItems:"center",
        padding:"12px 20px", background:"var(--clr-surface)",
        borderBottom:`1px solid ${C.accentColor}22`,
        flexShrink:0,
      }}>
        <div style={{ fontWeight:700, fontSize:14, flex:1, marginRight:12,
          overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{title}</div>
        <div style={{ display:"flex", gap:8, flexShrink:0 }}>
          <a href={url} download target="_blank" rel="noopener noreferrer"
            style={{ textDecoration:"none", fontSize:12, padding:"6px 14px",
              background:C.accentColor+"22", color:C.accentColor,
              border:`1px solid ${C.accentColor}44`, borderRadius:8, cursor:"pointer" }}>
            ⬇️ Download
          </a>
          <a href={url} target="_blank" rel="noopener noreferrer"
            style={{ textDecoration:"none", fontSize:12, padding:"6px 14px",
              background:"transparent", color:C.mutedColor,
              border:`1px solid ${C.mutedColor}33`, borderRadius:8, cursor:"pointer" }}>
            ↗ New Tab
          </a>
          <button onClick={onClose} style={{ background:"none", border:"none",
            color:C.mutedColor, cursor:"pointer", fontSize:22, lineHeight:1 }}>✕</button>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex:1, overflow:"hidden", display:"flex",
        alignItems:"center", justifyContent:"center", background:"#111" }}>
        {isPDF ? (
          <iframe src={pdfSrc} style={{ width:"100%", height:"100%", border:"none" }} title={title}/>
        ) : (
          <img src={url} alt={title}
            style={{ maxWidth:"100%", maxHeight:"100%", objectFit:"contain" }}/>
        )}
      </div>
    </div>
  );
}

// ── GUIDELINES GRID (Manager view) ────────────────────────────
export function GuidelinesGrid({ guidelines, showAcks = false, companyId, onDelete }) {
  const [acks,    setAcks]    = useState({});
  const [preview, setPreview] = useState(null);
  const [search,  setSearch]  = useState("");

  useEffect(() => {
    if (!showAcks || !guidelines.length || !companyId) return;
    const ids = guidelines.map(g => g.id);
    supabase.from("guideline_acks")
      .select("guideline_id, user:user_id(full_name), acked_at")
      .in("guideline_id", ids)
      .then(({ data }) => {
        const map = {};
        (data ?? []).forEach(a => {
          if (!map[a.guideline_id]) map[a.guideline_id] = [];
          map[a.guideline_id].push(a);
        });
        setAcks(map);
      });
  }, [guidelines.length, showAcks]);

  const filtered = guidelines.filter(g =>
    g.title?.toLowerCase().includes(search.toLowerCase()) ||
    g.category?.toLowerCase().includes(search.toLowerCase())
  );

  if (!guidelines.length) return (
    <div style={{ ...S.muted, textAlign:"center", padding:20 }}>No guidelines published yet.</div>
  );

  return (
    <>
      {preview && <FilePreview url={preview.url} title={preview.title} onClose={() => setPreview(null)}/>}
      <div>
        <div style={{ position:"relative", marginBottom:14 }}>
          <span style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)",
            fontSize:14, color:C.mutedColor }}>🔍</span>
          <input style={{ ...S.inp, paddingLeft:36, marginBottom:0 }}
            placeholder="Search guidelines..."
            value={search} onChange={e => setSearch(e.target.value)}/>
          {search && (
            <button onClick={() => setSearch("")}
              style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)",
                background:"none", border:"none", color:C.mutedColor,
                cursor:"pointer", fontSize:16 }}>✕</button>
          )}
        </div>
        {filtered.length === 0 && search && (
          <div style={{ ...S.muted, textAlign:"center", padding:20 }}>
            No results for "{search}"
          </div>
        )}
        {filtered.map(g => (
          <div key={g.id} style={S.card}>
            <div style={{ display:"flex", gap:12, alignItems:"center", marginBottom: showAcks ? 10 : 0 }}>
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
              <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                {g.file_url && (
                  <>
                    <button onClick={() => setPreview({ url:g.file_url, title:g.title })}
                      style={{ fontSize:12, padding:"6px 12px", background:"transparent",
                        color:C.accentColor, border:`1px solid ${C.accentColor}33`,
                        borderRadius:8, cursor:"pointer" }}>
                      👁️ View
                    </button>
                    <a href={g.file_url} download target="_blank" rel="noopener noreferrer"
                      style={{ textDecoration:"none", fontSize:12, padding:"6px 10px",
                        background:C.accentColor+"18", color:C.accentColor,
                        border:`1px solid ${C.accentColor}33`, borderRadius:8, cursor:"pointer" }}>
                      ⬇️
                    </a>
                  </>
                )}
                {onDelete && (
                  <button onClick={() => onDelete(g.id)}
                    style={{ background:"none", border:"none", color:"#f87171",
                      cursor:"pointer", fontSize:16, padding:"4px" }}>🗑️</button>
                )}
              </div>
            </div>

            {showAcks && (
              <div style={{ borderTop:`1px solid ${C.accentColor}14`, paddingTop:10 }}>
                <div style={{ ...S.h3, marginBottom:6 }}>
                  Reviewed by ({(acks[g.id] ?? []).length})
                </div>
                {(acks[g.id] ?? []).length === 0 ? (
                  <div style={{ ...S.muted, fontSize:12 }}>No one has reviewed this yet.</div>
                ) : (
                  <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                    {(acks[g.id] ?? []).map((a, i) => (
                      <div key={i} style={{
                        fontSize:11, padding:"4px 10px", borderRadius:12,
                        background:"#4ade8018", color:"#4ade80", border:"1px solid #4ade8033",
                      }}>
                        ✓ {a.user?.full_name ?? "—"} · {new Date(a.acked_at).toLocaleDateString("en-GB")}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}

// ── VM GUIDELINES ─────────────────────────────────────────────
export function VMGuidelines({ guidelines, userId }) {
  const [acked,   setAcked]   = useState({});
  const [loading, setLoading] = useState({});
  const [preview, setPreview] = useState(null);
  const [search,  setSearch]  = useState("");

  useEffect(() => {
    if (!userId || !guidelines.length) return;
    supabase.from("guideline_acks")
      .select("guideline_id")
      .eq("user_id", userId)
      .in("guideline_id", guidelines.map(g => g.id))
      .then(({ data }) => {
        const map = {};
        (data ?? []).forEach(a => { map[a.guideline_id] = true; });
        setAcked(map);
      });
  }, [userId, guidelines.length]);

  const acknowledge = async (guidelineId) => {
    if (acked[guidelineId] || !userId) return;
    setLoading(p => ({ ...p, [guidelineId]: true }));
    await supabase.from("guideline_acks")
      .upsert({ guideline_id: guidelineId, user_id: userId });
    setAcked(p => ({ ...p, [guidelineId]: true }));
    setLoading(p => ({ ...p, [guidelineId]: false }));
  };

  const filtered = guidelines.filter(g =>
    g.title?.toLowerCase().includes(search.toLowerCase()) ||
    g.category?.toLowerCase().includes(search.toLowerCase())
  );

  if (!guidelines.length) return (
    <div style={{ ...S.muted, textAlign:"center", padding:40 }}>No guidelines published yet.</div>
  );

  return (
    <>
      {preview && <FilePreview url={preview.url} title={preview.title} onClose={() => setPreview(null)}/>}
      <div>
        <div style={{ ...S.h1, marginBottom:2 }} className="fu">
          VM <span style={S.accent}>Guidelines</span>
        </div>
        <div style={{ ...S.muted, marginBottom:12, fontSize:12 }}>
          Review and acknowledge all guidelines
        </div>
        {/* Search bar */}
        <div style={{ position:"relative", marginBottom:16 }}>
          <span style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)",
            fontSize:14, color:C.mutedColor }}>🔍</span>
          <input style={{ ...S.inp, paddingLeft:36, marginBottom:0 }}
            placeholder="Search guidelines by title or category..."
            value={search} onChange={e => setSearch(e.target.value)}/>
          {search && (
            <button onClick={() => setSearch("")}
              style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)",
                background:"none", border:"none", color:C.mutedColor,
                cursor:"pointer", fontSize:16 }}>✕</button>
          )}
        </div>
        {filtered.length === 0 && search && (
          <div style={{ ...S.muted, textAlign:"center", padding:24 }}>
            No guidelines found for "{search}"
          </div>
        )}
        {filtered.map(g => (
          <div key={g.id} style={S.card}>
            <div style={{ display:"flex", gap:12, alignItems:"center", marginBottom:12 }}>
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
                <div style={{ display:"flex", gap:6 }}>
                  <button onClick={() => setPreview({ url:g.file_url, title:g.title })}
                    style={{ fontSize:12, padding:"6px 12px", background:"transparent",
                      color:C.accentColor, border:`1px solid ${C.accentColor}33`,
                      borderRadius:8, cursor:"pointer" }}>
                    👁️ View
                  </button>
                  <a href={g.file_url} download target="_blank" rel="noopener noreferrer"
                    style={{ textDecoration:"none", fontSize:12, padding:"6px 10px",
                      background:C.accentColor+"18", color:C.accentColor,
                      border:`1px solid ${C.accentColor}33`, borderRadius:8, cursor:"pointer" }}>
                    ⬇️
                  </a>
                </div>
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
    </>
  );
}