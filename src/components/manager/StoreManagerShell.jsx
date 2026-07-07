import { useState } from "react";
import { S, C } from "../../styles/theme.js";
import { todayStr } from "../../utils.js";

// ============================================================
//  STORE MANAGER SHELL
//  يشوف فرعه فقط — يعطي ملاحظات — يتابع التنفيذ
// ============================================================

export function StoreManagerHome({ profile, tasks, submissions, campaign, promotions, floorWalks, demoHolds }) {
  const branch = profile?.branch?.name ?? "My Branch";

  const pending   = submissions.filter(s => s.status === "pending").length;
  const approved  = submissions.filter(s => s.status === "approved").length;
  const doneT     = tasks.filter(t => t.is_done ?? t.done).length;
  const pct       = tasks.length ? Math.round((doneT / tasks.length) * 100) : 0;

  return (
    <div>
      <div style={{ ...S.h1, marginBottom:2 }} className="fu">
        Store <span style={S.accent}>Dashboard</span>
      </div>
      <div style={{ ...S.muted, marginBottom:16, fontSize:12 }}>
        {branch} · {todayStr()}
      </div>

      {/* Campaign banner */}
      {campaign?.name && (
        <div style={{ ...S.card, border:`1px solid ${C.accentColor}33`, marginBottom:14 }}>
          <div style={S.h3}>Current Campaign</div>
          <div style={{ ...S.dFont, fontSize:20, fontWeight:700, color:C.accentColor }}>
            {campaign.name}
          </div>
          {(campaign.date_from || campaign.date_to) && (
            <div style={{ ...S.muted, fontSize:12, marginTop:4 }}>
              {campaign.date_from} → {campaign.date_to}
            </div>
          )}
        </div>
      )}

      {/* Promotions */}
      {promotions?.length > 0 && (
        <div style={{ ...S.card, marginBottom:14 }}>
          <div style={S.h3}>Active Promotions ({promotions.length})</div>
          {promotions.map(p => (
            <div key={p.id} style={{ padding:"7px 0", borderBottom:`1px solid ${C.accentColor}0a` }}>
              <div style={{ fontSize:13, fontWeight:700, color:C.accentColor }}>🏷️ {p.name}</div>
              <div style={{ ...S.muted, fontSize:11, marginTop:2 }}>{p.date_from} → {p.date_to}</div>
            </div>
          ))}
        </div>
      )}

      {/* KPIs */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:14 }}>
        {[
          { n:pending,  l:"Pending",    sub:"awaiting review", c:"#d4a82a" },
          { n:approved, l:"Approved",   sub:"this period",     c:"#4ade80" },
          { n:doneT,    l:"Tasks Done", sub:`of ${tasks.length} total`, c:C.accentColor },
          { n:`${pct}%`,l:"Completion", sub:"overall progress", c:"#818cf8" },
        ].map(k => (
          <div key={k.l} style={{ ...S.card, marginBottom:0 }}>
            <div style={{ ...S.dFont, fontSize:28, fontWeight:700, color:k.c, lineHeight:1 }}>{k.n}</div>
            <div style={{ fontSize:13, fontWeight:600, marginTop:4 }}>{k.l}</div>
            <div style={{ ...S.muted, fontSize:11 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Floor Walk */}
      {floorWalks?.length > 0 && (
        <div style={S.card}>
          <div style={S.h3}>Latest Floor Walk</div>
          {floorWalks.slice(0,1).map((fw, i) => (
            <div key={i}>
              {fw.note && <div style={{ fontSize:13, lineHeight:1.5 }}>{fw.note}</div>}
              {fw.photos?.length > 0 && (
                <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginTop:8 }}>
                  {fw.photos.map((p, j) => (
                    <img key={j} loading="lazy" src={p.url ?? p} alt=""
                      style={{ width:72, height:72, objectFit:"cover", borderRadius:8,
                        border:`1px solid ${C.accentColor}22` }}/>
                  ))}
                </div>
              )}
              <div style={{ ...S.muted, fontSize:11, marginTop:6 }}>
                By {fw.manager} · {fw.date}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Demo Holds */}
      {demoHolds?.length > 0 && (
        <div style={S.card}>
          <div style={S.h3}>Demo Holds ({demoHolds.length})</div>
          {demoHolds.slice(0,5).map((d, i) => (
            <div key={i} style={{ display:"flex", justifyContent:"space-between",
              padding:"7px 0", borderBottom:`1px solid ${C.accentColor}0a`, fontSize:13 }}>
              <span style={{ fontWeight:700, color:C.accentColor }}>{d.item_code}</span>
              <span style={{ ...S.muted, fontSize:11 }}>{d.note}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function StoreManagerRequests({ submissions, onAddNote }) {
  const [notes, setNotes] = useState({});
  const [saved, setSaved] = useState({});

  const save = async (id) => {
    if (!notes[id]?.trim()) return;
    await onAddNote(id, notes[id]);
    setSaved(p => ({ ...p, [id]: true }));
    setTimeout(() => setSaved(p => ({ ...p, [id]: false })), 3000);
  };

  return (
    <div>
      <div style={{ ...S.h1, marginBottom:2 }} className="fu">
        Branch <span style={S.accent}>Submissions</span>
      </div>
      <div style={{ ...S.muted, marginBottom:16, fontSize:12 }}>
        Review and add notes to VM submissions
      </div>

      {submissions.length === 0 && (
        <div style={{ ...S.muted, textAlign:"center", padding:40 }}>No submissions yet.</div>
      )}

      {submissions.map(s => (
        <div key={s.id} style={S.card}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
            <div>
              <div style={{ fontWeight:700, fontSize:14 }}>
                {s.submitter?.full_name ?? "VM"}
              </div>
              <div style={{ ...S.muted, fontSize:12 }}>
                {s.category?.icon} {s.category?.name} · {s.subcategory?.name}
              </div>
            </div>
            <span style={S.chip(s.status)}>{s.status}</span>
          </div>

          {/* Photos */}
          {s.photos?.length > 0 && (
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:10 }}>
              {[["Before", s.photos.filter(p=>p.photo_type==="before")],
                ["After",  s.photos.filter(p=>p.photo_type==="after")]].map(([lbl, imgs]) => (
                <div key={lbl}>
                  <div style={S.h3}>{lbl}</div>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
                    {imgs.map((p, i) => (
                      <img key={i} loading="lazy" src={p.url} alt=""
                        style={{ width:56, height:56, objectFit:"cover", borderRadius:6 }}/>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {s.note && (
            <div style={{ fontSize:13, padding:"8px 12px", background:C.surfaceHigh,
              borderRadius:8, marginBottom:10, lineHeight:1.5 }}>
              {s.note}
            </div>
          )}

          {/* Add note */}
          <div style={S.lbl}>Add Note</div>
          <textarea style={{ ...S.inp, minHeight:56, resize:"vertical" }}
            placeholder="Add observation or feedback…"
            value={notes[s.id] ?? ""}
            onChange={e => setNotes(p => ({ ...p, [s.id]: e.target.value }))}/>
          {saved[s.id] && <div style={{ color:"#4ade80", fontSize:12, marginBottom:6 }}>✓ Note saved</div>}
          <button className="btnP" style={{ ...S.btnP, fontSize:12, padding:"8px 16px" }}
            onClick={() => save(s.id)}>
            Save Note
          </button>
        </div>
      ))}
    </div>
  );
}