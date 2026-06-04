import { useState } from "react";
import { S, C } from "../../styles/theme.js";

// ── Reusable grid — used by VM page and Manager upload tab ──
export function GuidelinesGrid({ guidelines }) {
  const [filter, setFilter] = useState("All");
  const cats  = ["All", ...Array.from(new Set(guidelines.map(g => g.category)))];
  const shown = filter === "All" ? guidelines : guidelines.filter(g => g.category === filter);

  return (
    <div>
      <div style={{ display:"flex", gap:6, marginBottom:14, overflowX:"auto", paddingBottom:2 }}>
        {cats.map(c => (
          <button key={c} className="tab-btn" style={S.tab(filter === c)} onClick={() => setFilter(c)}>
            {c}
          </button>
        ))}
      </div>

      {shown.length === 0 && (
        <div style={{ ...S.muted, textAlign:"center", padding:30 }}>
          No guidelines published yet.
        </div>
      )}

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
        {shown.map((g, i) => (
          <div key={g.id ?? i} className="card-h"
            style={{ ...S.card, marginBottom:0, cursor:"pointer" }}>
            <div style={{ fontSize:26, marginBottom:8 }}>
              {g.fileType === "img" ? "🖼️" : "📘"}
            </div>
            <div style={{ fontSize:13, fontWeight:700, lineHeight:1.3, marginBottom:6 }}>
              {g.title}
            </div>
            <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:10 }}>
              <span style={S.chip("vm")}>{g.category}</span>
              {g.pages    && <span style={{ ...S.muted, fontSize:11 }}>{g.pages}p · {g.updated}</span>}
              {g.fileName && (
                <span style={{ ...S.muted, fontSize:11, maxWidth:90, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                  {g.fileName}
                </span>
              )}
            </div>
            {g.previewUrl && (
              <img src={g.previewUrl} alt="" style={{ width:"100%", height:64, objectFit:"cover", borderRadius:8, marginBottom:8, border:`1px solid ${C.accentColor}22` }} />
            )}
            <button className="btnG"
              style={{ ...S.btnG, width:"100%", fontSize:12, padding:"7px" }}
              onClick={() => g.fileUrl ? window.open(g.fileUrl, "_blank") : alert(`Opening: ${g.title}`)}>
              View →
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── VM-facing page ──
export function VMGuidelines({ guidelines }) {
  return (
    <div>
      <div style={{ ...S.h1, marginBottom:2 }} className="fu">
        Guideline <span style={S.accent}>Books</span>
      </div>
      <div style={{ ...S.muted, marginBottom:16, fontSize:12 }}>
        VM manuals & SOPs · published by management
      </div>
      <GuidelinesGrid guidelines={guidelines} />
    </div>
  );
}
