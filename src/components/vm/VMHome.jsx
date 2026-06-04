import { useState } from "react";
import { S, C } from "../../styles/theme.js";
import { todayStr } from "../../utils.js";

export function VMHome({ user, tasks, submissions, chat, demoHolds, onAddDemoHold, floorWalks, campaign }) {
  const [itemCode, setItemCode] = useState("");
  const [itemNote, setItemNote] = useState("");
  const [added,    setAdded]    = useState(false);

  const name     = user?.full_name ?? user?.name ?? "";
  const branch   = user?.branch?.name ?? user?.branch ?? "";
  const myTasks  = tasks.filter(t => t.assigned_to === "all" || t.assigned_to === user?.id);
  const done     = myTasks.filter(t => t.is_done ?? t.done).length;
  const pct      = myTasks.length ? Math.round((done / myTasks.length) * 100) : 0;
  const myScore  = submissions
    .filter(s => (s.submitter?.id ?? s.submitted_by) === user?.id && s.score != null)
    .reduce((a, s) => a + s.score, 0);
  const subCount = submissions.filter(s => (s.submitter?.id ?? s.submitted_by) === user?.id).length;

  const handleAddDemo = () => {
    if (!itemCode.trim()) return;
    onAddDemoHold({ item_code: itemCode.trim(), note: itemNote.trim(), vm: name, branch });
    setItemCode(""); setItemNote(""); setAdded(true);
    setTimeout(() => setAdded(false), 3000);
  };

  return (
    <div>
      {/* Greeting */}
      <div style={{ ...S.card, background:`linear-gradient(135deg,${C.accentColor},${C.accentColor}88)`,
        marginBottom:16, position:"relative", overflow:"hidden" }} className="fu">
        <div style={{ position:"absolute", right:-10, top:-10, fontSize:80, opacity:.07,
          fontFamily:"'Cormorant Garamond',serif", fontWeight:700 }}>VM</div>
        <div style={{ fontSize:10, fontWeight:700, letterSpacing:2, color:"#0a0a0f", opacity:.7 }}>GOOD MORNING</div>
        <div style={{ ...S.dFont, fontSize:24, fontWeight:700, color:"#0a0a0f", lineHeight:1.1, marginTop:2 }}>
          {name.split(" ")[0]}
        </div>
        <div style={{ fontSize:12, color:"#0a0a0f", opacity:.6, marginTop:4 }}>
          {branch} · {todayStr()}
        </div>
      </div>

      {/* Campaign */}
      {campaign?.name && (
        <div style={{ ...S.card, border:`1px solid ${C.accentColor}33`, marginBottom:16,
          display:"flex", justifyContent:"space-between", alignItems:"center" }} className="fu2">
          <div>
            <div style={S.h3}>Current Campaign</div>
            <div style={{ ...S.dFont, fontSize:20, fontWeight:700, color:C.accentColor }}>
              {campaign.name}
            </div>
            {(campaign.date_from || campaign.date_to) && (
              <div style={{ ...S.muted, fontSize:12, marginTop:3 }}>
                {campaign.date_from} {campaign.date_from && campaign.date_to ? "→" : ""} {campaign.date_to}
              </div>
            )}
          </div>
          <div style={{ fontSize:28, opacity:.3 }}>◈</div>
        </div>
      )}

      {/* KPIs */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, marginBottom:16 }} className="fu2">
        {[
          { n:`${pct}%`, l:"Done Today",  sub:`${done}/${myTasks.length} tasks` },
          { n:subCount,  l:"Submissions", sub:"this week" },
          { n:myScore,   l:"VM Points",   sub:"earned so far" },
        ].map(k => (
          <div key={k.l} style={{ ...S.card, marginBottom:0, textAlign:"center", padding:"16px 10px" }}>
            <div style={{ ...S.dFont, fontSize:26, fontWeight:700, color:C.accentColor, lineHeight:1 }}>{k.n}</div>
            <div style={{ fontSize:12, fontWeight:600, marginTop:3 }}>{k.l}</div>
            <div style={{ ...S.muted, fontSize:11 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* ── DEMO HOLD ── */}
      <div style={S.card} className="fu3">
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
          <div style={S.h3}>Demo Hold</div>
          {demoHolds?.length > 0 && (
            <span style={{ fontSize:11, color:C.accentColor, fontWeight:700 }}>
              {demoHolds.length} item(s) on hold
            </span>
          )}
        </div>
        <div style={{ display:"flex", gap:8, marginBottom:8 }}>
          <input
            style={{ ...S.inp, marginTop:0, marginBottom:0, flex:1 }}
            placeholder="Item / SKU code"
            value={itemCode}
            onChange={e => setItemCode(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleAddDemo()}
          />
          <button className="btnP" style={{ ...S.btnP, flexShrink:0, padding:"10px 16px" }}
            onClick={handleAddDemo}>
            + Hold
          </button>
        </div>
        <input
          style={{ ...S.inp, marginTop:0, marginBottom:8 }}
          placeholder="Location / note (optional)"
          value={itemNote}
          onChange={e => setItemNote(e.target.value)}
        />
        {added && <div style={{ color:"#4ade80", fontSize:12, marginBottom:8 }}>✓ Added to demo hold</div>}

        {/* Demo hold list */}
        {demoHolds?.length > 0 && (
          <div style={{ marginTop:8 }}>
            {demoHolds.slice(0, 5).map((d, i) => (
              <div key={i} style={{
                display:"flex", justifyContent:"space-between", alignItems:"center",
                padding:"7px 0", borderBottom:`1px solid ${C.accentColor}0a`, fontSize:13,
              }}>
                <div>
                  <span style={{ fontWeight:700, color:C.accentColor }}>{d.item_code}</span>
                  {d.note && <span style={{ color:C.mutedColor, marginLeft:8, fontSize:12 }}>{d.note}</span>}
                </div>
                <span style={{ ...S.muted, fontSize:11 }}>{d.time ?? ""}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── FLOOR WALK ── */}
      {floorWalks?.length > 0 && (
        <div style={S.card}>
          <div style={S.h3}>Floor Walk · This Week</div>
          {floorWalks.map((fw, i) => (
            <div key={i} style={{ marginBottom:14, paddingBottom:14, borderBottom:`1px solid ${C.accentColor}0a` }}>
              {fw.note && (
                <div style={{ fontSize:13, color:C.textColor, marginBottom:8, lineHeight:1.5 }}>{fw.note}</div>
              )}
              {fw.photos?.length > 0 && (
                <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                  {fw.photos.map((p, j) => (
                    <img key={j} src={p.url ?? p} alt=""
                      style={{ width:80, height:80, objectFit:"cover", borderRadius:8,
                        border:`1px solid ${C.accentColor}22` }}/>
                  ))}
                </div>
              )}
              <div style={{ ...S.muted, fontSize:11, marginTop:6 }}>
                Added by {fw.manager} · {fw.date ?? ""}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tasks preview */}
      <div style={S.card}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
          <div style={S.h3}>Today's Tasks</div>
          <span style={{ fontSize:11, color:C.accentColor }}>{done}/{myTasks.length} completed</span>
        </div>
        <div style={{ height:4, borderRadius:2, background:C.surfaceHigh, marginBottom:14 }}>
          <div style={{ height:"100%", borderRadius:2, background:C.accentColor,
            width:`${pct}%`, transition:"width .4s" }}/>
        </div>
        {myTasks.length === 0 && <div style={S.muted}>No tasks assigned yet.</div>}
        {myTasks.slice(0, 5).map(t => (
          <div key={t.id} style={{ display:"flex", gap:10, alignItems:"flex-start",
            padding:"9px 0", borderBottom:`1px solid ${C.accentColor}0a` }}>
            <div style={{ width:6, height:6, borderRadius:"50%",
              background: (t.is_done||t.done) ? "#4ade80" : C.accentColor,
              marginTop:5, flexShrink:0 }}/>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:11, color:C.accentColor, fontWeight:600 }}>
                {t.category?.icon} {t.category?.name ?? "—"} · {t.subcategory?.name ?? "—"}
              </div>
              <div style={{ fontSize:13, marginTop:1,
                color: (t.is_done||t.done) ? C.mutedColor : C.textColor,
                textDecoration: (t.is_done||t.done) ? "line-through" : "none" }}>
                {t.title ?? t.text}
              </div>
            </div>
            <span style={S.chip(t.priority)}>{t.priority}</span>
          </div>
        ))}
      </div>

      {/* Wall of Fame */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
        {["Employee of the Month", "Store of the Month"].map(t => (
          <div key={t} style={{ ...S.card, marginBottom:0, textAlign:"center", padding:"22px 14px" }}>
            <div style={{ fontSize:26, marginBottom:6 }}>🏆</div>
            <div style={S.h3}>{t}</div>
            <div style={{ ...S.dFont, fontSize:18, color:C.accentColor, fontWeight:600 }}>—</div>
          </div>
        ))}
      </div>
    </div>
  );
}