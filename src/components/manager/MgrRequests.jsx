import { useState } from "react";
import { S, C } from "../../styles/theme.js";
import { CommentThread } from "../shared/CommentThread.jsx";

export function MgrRequests({ submissions, onReview, onDeleteSubmission, profile }) {
  const [filter,       setFilter]       = useState("pending");
  const [revisionId,   setRevisionId]   = useState(null);
  const [revisionNote, setRevisionNote] = useState("");
  const [saving,       setSaving]       = useState(false);
  const [openId,       setOpenId]       = useState(null);

  const submitRevision = async () => {
    if (!revisionNote.trim()) return;
    setSaving(true);
    await onReview(revisionId, "revision", revisionNote);
    setRevisionId(null); setRevisionNote("");
    setSaving(false);
  };

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
        const catName = s.category?.name    ?? "—";
        const catIcon = s.category?.icon    ?? "📦";
        const subName = s.subcategory?.name ?? "—";
        const vmName  = s.submitter?.full_name ?? "—";
        const branch  = s.branch?.name ?? "—";

        return (
          <div key={s.id} style={S.card}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
              <div>
                <div style={{ fontWeight:700, fontSize:14 }}>{vmName}</div>
                <div style={{ ...S.muted, fontSize:12 }}>
                  {branch} · {catIcon} {catName} · {subName}
                </div>
                <div style={{ ...S.muted, fontSize:11, marginTop:2 }}>
                  {s.created_at?.slice(0,10) ?? "—"}
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

            {s.photos?.length > 0 && (
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:10 }}>
                {[["Before", s.photos.filter(p=>p.photo_type==="before")],
                  ["After",  s.photos.filter(p=>p.photo_type==="after")]
                ].map(([lbl, imgs]) => (
                  <div key={lbl}>
                    <div style={S.h3}>{lbl}</div>
                    {imgs.length === 0
                      ? <div style={{ ...S.muted, fontSize:12 }}>No photos</div>
                      : <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
                          {imgs.map((f, i) => (
                            <img loading="lazy" key={i} src={f.url ?? f} alt=""
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

            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              {s.status === "pending" && (
                <>
                  <button className="btnP"
                    style={{ ...S.btnP, fontSize:12, padding:"8px 16px" }}
                    onClick={() => onReview(s.id, "approved")}>
                    ✓ Approve
                  </button>
                  <button className="btnG"
                    style={{ ...S.btnG, fontSize:12, padding:"8px 14px", color:"#f87171", borderColor:"#f8717133" }}
                    onClick={() => { setRevisionId(s.id); setRevisionNote(""); }}>
                    ↩ Needs Revision
                  </button>
                </>
              )}
              {onDeleteSubmission && (
                <button className="btnG"
                  style={{ ...S.btnG, fontSize:12, padding:"8px 12px", color:"#f87171", borderColor:"#f8717133" }}
                  onClick={() => onDeleteSubmission(s.id)}>
                  🗑️
                </button>
              )}
              {s.task_id && (
                <button className="btnG" style={{ ...S.btnG, fontSize:12, padding:"8px 14px" }}
                  onClick={() => setOpenId(openId === s.id ? null : s.id)}>
                  💬 Comments
                </button>
              )}
            </div>
            {openId === s.id && s.task_id && profile && <CommentThread taskId={s.task_id} profile={profile} />}
          </div>
        );
      })}
      {/* Revision Modal */}
      {revisionId && (
        <div style={{
          position:"fixed", inset:0, background:"#00000088", zIndex:600,
          display:"flex", alignItems:"center", justifyContent:"center", padding:20,
        }}>
          <div style={{ background:"var(--clr-surface)", borderRadius:20, padding:28,
            width:"100%", maxWidth:420, border:"1px solid #f8717133" }}>
            <div style={{ fontWeight:700, fontSize:16, marginBottom:6 }}>↩ Needs Revision</div>
            <div style={{ ...S.muted, fontSize:12, marginBottom:16 }}>
              Write what needs to be fixed — the VM will see this message in their Tasks.
            </div>
            <textarea
              style={{ ...S.inp, minHeight:100, resize:"vertical" }}
              placeholder="e.g. The after photo is blurry, please retake..."
              value={revisionNote}
              onChange={e => setRevisionNote(e.target.value)}
              autoFocus
            />
            <div style={{ display:"flex", gap:8, marginTop:8 }}>
              <button className="btnP" style={{ ...S.btnP, flex:1,
                background:"#f87171", color:"#fff" }}
                onClick={submitRevision} disabled={saving || !revisionNote.trim()}>
                {saving ? "Sending…" : "Send Revision →"}
              </button>
              <button className="btnG" style={{ ...S.btnG }}
                onClick={() => setRevisionId(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}