import { S, C } from "../../styles/theme.js";
import { Avatar } from "../shared/Atoms.jsx";

export function MgrReports({ tasks, submissions, onExportPDF }) {
  const totalSubs = submissions.length;
  const approved  = submissions.filter(s => s.status === "approved");
  const revision  = submissions.filter(s => s.status === "revision");
  const scored    = submissions.filter(s => s.score != null);
  const avgScore  = scored.length
    ? Math.round(scored.reduce((a, s) => a + s.score, 0) / scored.length)
    : 0;

  const doneT = tasks.filter(t => t.is_done ?? t.done).length;
  const pct   = tasks.length ? Math.round((doneT / tasks.length) * 100) : 0;

  // Per-category breakdown (dynamic)
  const catMap = {};
  submissions.forEach(s => {
    const name = s.category?.name ?? "Other";
    if (!catMap[name]) catMap[name] = { subs:0, icon: s.category?.icon ?? "📦" };
    catMap[name].subs++;
  });

  // VM leaderboard
  const vmMap = {};
  scored.forEach(s => {
    const name = s.submitter?.full_name ?? s.vm ?? "Unknown";
    if (!vmMap[name]) vmMap[name] = { name, branch: s.branch?.name ?? "", total:0, count:0 };
    vmMap[name].total += s.score;
    vmMap[name].count++;
  });
  const leaderboard = Object.values(vmMap)
    .map(v => ({ ...v, avg: Math.round(v.total / v.count) }))
    .sort((a, b) => b.avg - a.avg);

  return (
    <div>
      <div style={{ ...S.h1, marginBottom:2 }} className="fu">
        Reports & <span style={S.accent}>Analytics</span>
      </div>
      <div style={{ ...S.muted, marginBottom:16, fontSize:12 }}>Weekly performance snapshot</div>

      {/* Summary KPIs */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8, marginBottom:14 }} className="fu2">
        {[
          { n:totalSubs,       l:"Submissions", c:C.accentColor },
          { n:approved.length, l:"Approved",    c:"#4ade80" },
          { n:revision.length, l:"Revisions",   c:"#f87171" },
          { n:avgScore,        l:"Avg Score",   c:"#818cf8" },
        ].map(k => (
          <div key={k.l} style={{ ...S.card, marginBottom:0, textAlign:"center", padding:"14px 8px" }}>
            <div style={{ ...S.dFont, fontSize:24, fontWeight:700, color:k.c, lineHeight:1 }}>{k.n}</div>
            <div style={{ fontSize:11, fontWeight:600, marginTop:4, color:C.mutedColor }}>{k.l}</div>
          </div>
        ))}
      </div>

      {/* Task completion */}
      <div style={S.card}>
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
          <div style={S.h3}>Task Completion</div>
          <span style={{ fontSize:12, fontWeight:700, color:C.accentColor }}>{pct}%</span>
        </div>
        <div style={{ height:6, borderRadius:3, background:C.surfaceHigh }}>
          <div style={{ height:"100%", borderRadius:3, background:C.accentColor, width:`${pct}%`, transition:"width .5s" }}/>
        </div>
        <div style={{ ...S.muted, fontSize:11, marginTop:6 }}>{doneT} of {tasks.length} tasks completed</div>
      </div>

      {/* Category breakdown */}
      {Object.keys(catMap).length > 0 && (
        <div style={S.card}>
          <div style={S.h3}>Category Breakdown</div>
          {Object.entries(catMap).map(([name, d]) => (
            <div key={name} style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
              padding:"8px 0", borderBottom:`1px solid ${C.accentColor}0a` }}>
              <span style={{ fontSize:13 }}>{d.icon} {name}</span>
              <span style={{ fontSize:13, fontWeight:700, color:C.accentColor }}>{d.subs}</span>
            </div>
          ))}
        </div>
      )}

      {/* VM Leaderboard */}
      <div style={S.card}>
        <div style={S.h3}>🏆 VM Leaderboard</div>
        {leaderboard.length === 0 && <div style={S.muted}>No scored submissions yet.</div>}
        {leaderboard.map((v, i) => (
          <div key={v.name} style={{ display:"flex", alignItems:"center", gap:12,
            padding:"9px 0", borderBottom:`1px solid ${C.accentColor}0a` }}>
            <span style={{ ...S.dFont, fontSize:18, fontWeight:700,
              color: i===0 ? C.accentColor : C.mutedColor, width:24, flexShrink:0 }}>
              {i+1}
            </span>
            <Avatar initials={v.name.split(" ").map(x=>x[0]).join("").slice(0,2)} size={32}/>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13, fontWeight:600 }}>{v.name}</div>
              <div style={{ ...S.muted, fontSize:11 }}>{v.branch} · {v.count} submissions</div>
            </div>
            <div style={{ textAlign:"right" }}>
              <div style={{ fontSize:18, fontWeight:700, color: i===0?C.accentColor:C.textColor }}>{v.avg}</div>
              <div style={{ ...S.muted, fontSize:10 }}>avg/100</div>
            </div>
          </div>
        ))}
      </div>

      {/* Export */}
      <button className="btnD"
        style={{ ...S.btnD, width:"100%", marginTop:4, padding:"12px", fontWeight:600 }}
        onClick={onExportPDF}>
        ⬇ Export Weekly Report PDF
      </button>
    </div>
  );
}
