import { S, C } from "../../styles/theme.js";
import { todayStr } from "../../utils.js";

// ============================================================
//  AREA MANAGER SHELL
//  يشوف فروع منطقته — يتابع الكامبين — يعتمد التقارير
// ============================================================

export function AreaManagerOverview({ profile, tasks, submissions, campaign, campaignProgress, branches }) {
  const region = profile?.region?.name ?? "My Region";

  // فقط الفروع في منطقته
  const myBranches = branches.filter(b => b.region_id === profile?.region_id);

  const pending  = submissions.filter(s => s.status === "pending").length;
  const approved = submissions.filter(s => s.status === "approved").length;

  // Campaign progress للفروع بتاعته
  const myProgress = campaignProgress.filter(cp =>
    myBranches.some(b => b.id === cp.branch_id)
  );
  const cpCompleted  = myProgress.filter(b => b.status === "completed").length;
  const cpInProgress = myProgress.filter(b => b.status === "in_progress").length;
  const cpNotStarted = myProgress.filter(b => b.status === "not_started").length;
  const cpRate       = myProgress.length ? Math.round((cpCompleted / myProgress.length) * 100) : 0;

  // Branch performance
  const branchMap = {};
  submissions.forEach(s => {
    const name = s.branch?.name ?? "Unknown";
    if (!branchMap[name]) branchMap[name] = { approved:0, total:0 };
    if (s.status === "approved") branchMap[name].approved++;
    branchMap[name].total++;
  });
  const branchPerf = Object.entries(branchMap)
    .map(([branch, b]) => ({ branch, score: b.total ? Math.round((b.approved/b.total)*100):0 }))
    .sort((a,b) => b.score - a.score);

  return (
    <div>
      <div style={{ ...S.h1, marginBottom:2 }} className="fu">
        Area <span style={S.accent}>Overview</span>
      </div>
      <div style={{ ...S.muted, marginBottom:16, fontSize:12 }}>
        {region} · {todayStr()}
      </div>

      {/* Campaign Progress */}
      {campaign?.name && myProgress.length > 0 && (
        <div style={{ ...S.card, border:`1px solid ${C.accentColor}33`, marginBottom:14 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
            <div>
              <div style={S.h3}>Campaign Progress</div>
              <div style={{ ...S.dFont, fontSize:17, fontWeight:700, color:C.accentColor }}>
                {campaign.name}
              </div>
            </div>
            <span style={{ fontSize:20, fontWeight:700, color: cpRate>=70?"#4ade80":C.accentColor }}>
              {cpRate}%
            </span>
          </div>
          <div style={{ height:5, borderRadius:3, background:C.surfaceHigh, marginBottom:12 }}>
            <div style={{ height:"100%", borderRadius:3, width:`${cpRate}%`,
              background: cpRate>=70?"#4ade80":C.accentColor, transition:"width .5s" }}/>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
            {[
              { n:cpCompleted,  l:"Completed",   c:"#4ade80" },
              { n:cpInProgress, l:"In Progress", c:"#d4a82a" },
              { n:cpNotStarted, l:"Not Started", c:"#6b6880" },
            ].map(k => (
              <div key={k.l} style={{ textAlign:"center", padding:"8px",
                background:C.surfaceHigh, borderRadius:8 }}>
                <div style={{ fontSize:20, fontWeight:700, color:k.c }}>{k.n}</div>
                <div style={{ fontSize:10, color:C.mutedColor, marginTop:2 }}>{k.l}</div>
              </div>
            ))}
          </div>
          {/* Per branch */}
          <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginTop:12 }}>
            {myProgress.map(cp => {
              const colors = { completed:"#4ade80", in_progress:"#d4a82a", not_started:"#6b6880" };
              const color  = colors[cp.status] ?? "#6b6880";
              return (
                <div key={cp.branch_id} style={{ padding:"4px 10px", borderRadius:14,
                  background:color+"1c", color, border:`1px solid ${color}44`, fontSize:11, fontWeight:600 }}>
                  {cp.branch?.name ?? "—"}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* KPIs */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:14 }}>
        {[
          { n:pending,            l:"Pending Review", sub:"awaiting approval", c:"#d4a82a" },
          { n:approved,           l:"Approved",       sub:"this period",       c:"#4ade80" },
          { n:myBranches.length,  l:"My Branches",    sub:"in region",         c:"#818cf8" },
          { n:tasks.filter(t=>!(t.is_done??t.done)).length, l:"Open Tasks", sub:"", c:"#f87171" },
        ].map(k => (
          <div key={k.l} style={{ ...S.card, marginBottom:0 }}>
            <div style={{ ...S.dFont, fontSize:28, fontWeight:700, color:k.c, lineHeight:1 }}>{k.n}</div>
            <div style={{ fontSize:13, fontWeight:600, marginTop:4 }}>{k.l}</div>
            <div style={{ ...S.muted, fontSize:11 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Branch performance */}
      <div style={S.card}>
        <div style={S.h3}>Branch Performance · Approval Rate</div>
        {branchPerf.length === 0 && <div style={S.muted}>No submissions yet.</div>}
        {branchPerf.map((b, i) => (
          <div key={b.branch} style={{ marginBottom:12 }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
              <span style={{ fontSize:12, fontWeight:600 }}>
                {i===0?"🥇 ":i===1?"🥈 ":i===2?"🥉 ":""}{b.branch}
              </span>
              <span style={{ fontSize:12, fontWeight:700,
                color:b.score>=80?C.accentColor:b.score>=60?C.textColor:C.mutedColor }}>
                {b.score}%
              </span>
            </div>
            <div style={{ height:4, borderRadius:2, background:C.surfaceHigh }}>
              <div style={{ height:"100%", borderRadius:2, width:`${b.score}%`, transition:"width .5s",
                background:b.score>=80?C.accentColor:b.score>=60?"#4ade80":"#d4a82a" }}/>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}