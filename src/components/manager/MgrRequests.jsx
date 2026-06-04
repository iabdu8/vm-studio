import { useState } from "react";
import { S, C } from "../../styles/theme.js";
import { calcScore } from "../../utils.js";

export function MgrRequests({ submissions, onReview }) {
  const [filter, setFilter] = useState("pending");

  const shown = filter === "all"
    ? submissions
    : submissions.filter(s => s.status === filter);

  return (
    <div>
      <div style={{ ...S.h1, marginBottom:2 }} className="fu">
        VM <span style={S.accent}>Requests</span>
      </div>
      <div style={{ ...S.muted, marginBottom:16, fontSize:12 }}>
        Review Before / After submissions from the floor
      </div>

      <div style={{ display:"flex", gap:6, marginBottom:14, overflowX:"auto" }}>
        {[["pending","⏳ Pending"],["approved","✓ Approved"],["revision","↩ Revision"],["all","All"]].map(([k,l]) => (
          <button key={k} className="tab-btn" style={S.tab(filter===k)} onClick={()=>setFilter(k)}>{l}</button>
        ))}
      </div>

      {shown.length === 0 && (
        <div style={{ ...S.muted, padding:30, textAlign:"center" }}>No submissions in this category.</div>
      )}

      {shown.map(s => {
        const catName  = s.category?.name    ?? "—";
        const catIcon  = s.category?.icon    ?? "📦";
        const subName  = s.subcategory?.name ?? "—";
        const vmName   = s.submitter?.full_name ?? s.vm ?? "—";
        const branch   = s.branch?.name ?? s.branch ?? "—";

        return (
          <div key={s.id} style={S.card}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
              <div>
                <div style={{ fontWeight:700, fontSize:14 }}>{vmName}</div>
                <div style={{ ...S.muted, fontSize:12 }}>
                  {branch} · {catIcon} {catName} · {subName}
                </div>
                <div style={{ ...S.muted, fontSize:11, marginTop:2 }}>
                  Submitted {s.submittedAt ?? s.created_at?.slice(11,16) ?? "—"}
                </div>
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:4, alignItems:"flex-end" }}>
                <span style={S.chip(s.status)}>{s.status}</span>
                {s.score != null && (
                  <span style={{ fontSize:11, color:C.accentColor, fontWeight:700 }}>
                    Score: {s.score}/100
                  </span>
                )}
              </div>
            </div>

            {/* Photos */}
            {(s.photos?.length > 0 || s.before?.length > 0 || s.after?.length > 0) && (
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:10 }}>
                {[["Before", s.photos?.filter(p=>p.photo_type==="before") ?? s.before ?? []],
                  ["After",  s.photos?.filter(p=>p.photo_type==="after")  ?? s.after  ?? []]
                ].map(([lbl, imgs]) => (
                  <div key={lbl}>
                    <div style={S.h3}>{lbl}</div>
                    {imgs.length === 0
                      ? <div style={{ ...S.muted, fontSize:12 }}>No photos</div>
                      : <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
                          {imgs.map((f, i) => (
                            <img key={i} src={f.url ?? f} alt=""
                              style={{ width:56, height:56, objectFit:"cover", borderRadius:6,
                                border:`1px solid ${C.accentColor}22` }}/>
                          ))}
                        </div>
                    }
                  </div>
                ))}
              </div>
            )}

            {s.note && (
              <div style={{ fontSize:13, opacity:.85, marginBottom:12,
                padding:"10px 12px", background:C.surfaceHigh, borderRadius:8, lineHeight:1.5 }}>
                {s.note}
              </div>
            )}

            {s.status === "pending" && (
              <div style={{ display:"flex", gap:8 }}>
                <button className="btnP"
                  style={{ ...S.btnP, fontSize:12, padding:"8px 16px" }}
                  onClick={() => onReview(s.id, "approved")}>
                  ✓ Approve
                </button>
                <button className="btnG"
                  style={{ ...S.btnG, fontSize:12, padding:"8px 14px", color:"#f87171", borderColor:"#f8717133" }}
                  onClick={() => onReview(s.id, "revision")}>
                  ↩ Needs Revision
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
