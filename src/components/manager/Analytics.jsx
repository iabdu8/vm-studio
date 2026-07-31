import { useMemo, useState } from "react";
import { S, C } from "../../styles/theme.js";

// ============================================================
//  ANALYTICS DASHBOARD
//  Pure SVG charts — no external charting library needed
// ============================================================

// ── Mini Bar Chart ────────────────────────────────────────────
function BarChart({ data, color = C.accentColor, height = 80 }) {
  if (!data.length) return null;
  const max  = Math.max(...data.map(d => d.value), 1);
  const barW = 100 / data.length;

  return (
    <svg viewBox={`0 0 100 ${height}`} preserveAspectRatio="none"
      style={{ width:"100%", height, display:"block" }}>
      {data.map((d, i) => {
        const barH   = (d.value / max) * (height - 20);
        const x      = i * barW + barW * 0.15;
        const w      = barW * 0.7;
        const y      = height - barH - 16;
        return (
          <g key={i}>
            <rect x={x} y={y} width={w} height={barH}
              fill={color} rx="2" opacity="0.85" />
            <text x={x + w/2} y={height - 4} textAnchor="middle"
              fontSize="5" fill={C.mutedColor}>{d.label}</text>
            {barH > 10 && (
              <text x={x + w/2} y={y - 2} textAnchor="middle"
                fontSize="5" fill={color} fontWeight="700">{d.value}</text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// ── Donut Chart ───────────────────────────────────────────────
function DonutChart({ segments, size = 100 }) {
  const total  = segments.reduce((a, s) => a + s.value, 0);
  if (!total) return <div style={{ ...S.muted, textAlign:"center", padding:20 }}>No data</div>;

  const cx = size / 2, cy = size / 2, r = size * 0.38, sw = size * 0.14;
  let angle = -Math.PI / 2;

  const paths = segments.map(seg => {
    const slice    = (seg.value / total) * 2 * Math.PI;
    const x1       = cx + r * Math.cos(angle);
    const y1       = cy + r * Math.sin(angle);
    angle         += slice;
    const x2       = cx + r * Math.cos(angle);
    const y2       = cy + r * Math.sin(angle);
    const large    = slice > Math.PI ? 1 : 0;
    return { ...seg, d:`M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`, pct: Math.round((seg.value/total)*100) };
  });

  return (
    <div style={{ display:"flex", alignItems:"center", gap:16 }}>
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} style={{ flexShrink:0 }}>
        {paths.map((p, i) => (
          <path key={i} d={p.d} fill="none" stroke={p.color} strokeWidth={sw}
            strokeLinecap="butt" />
        ))}
        <text x={cx} y={cy+2} textAnchor="middle" fontSize={size*0.14}
          fontWeight="700" fill={C.textColor}>{total}</text>
        <text x={cx} y={cy+size*0.13} textAnchor="middle" fontSize={size*0.08}
          fill={C.mutedColor}>total</text>
      </svg>
      <div style={{ flex:1 }}>
        {paths.map((p, i) => (
          <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:5 }}>
            <div style={{ display:"flex", gap:6, alignItems:"center" }}>
              <div style={{ width:8, height:8, borderRadius:"50%", background:p.color, flexShrink:0 }} />
              <span style={{ fontSize:12 }}>{p.label}</span>
            </div>
            <span style={{ fontSize:12, fontWeight:700, color:p.color }}>{p.value} <span style={{ color:C.mutedColor, fontWeight:400 }}>({p.pct}%)</span></span>
          </div>
        ))}
      </div>
    </div>
  );
}

const monthLabel = (d) => d.toLocaleDateString("en-GB", { month:"long", year:"numeric" });
const inSameMonth = (dateStr, ref) => {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth();
};

// ── Branch card — expandable, lists every VM under it with their rating ──
function BranchCard({ branch, rank, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  const scoreColor = branch.avgScore == null ? C.mutedColor
    : branch.avgScore >= 80 ? "#4ade80" : branch.avgScore >= 60 ? C.accentColor : "#f87171";

  return (
    <div style={{ ...S.card, marginBottom:10 }}>
      <div style={{ display:"flex", alignItems:"center", gap:10, cursor:"pointer" }}
        onClick={() => setOpen(o => !o)}>
        <span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:18, fontWeight:700,
          color: rank===0?C.accentColor:C.mutedColor, width:22, flexShrink:0 }}>
          {rank===0?"🥇":rank===1?"🥈":rank===2?"🥉":rank+1}
        </span>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:14, fontWeight:700 }}>{branch.name}</div>
          <div style={{ ...S.muted, fontSize:11 }}>{branch.vms.length} VM{branch.vms.length===1?"":"s"} · {branch.total} submissions</div>
        </div>
        <div style={{ textAlign:"right", flexShrink:0 }}>
          <div style={{ fontSize:18, fontWeight:700, color:scoreColor }}>
            {branch.avgScore ?? `${branch.approvalRate}%`}
          </div>
          <div style={{ ...S.muted, fontSize:10 }}>{branch.avgScore != null ? "avg/100" : "approval"}</div>
        </div>
        <span style={{ color:C.mutedColor, fontSize:12, flexShrink:0, transform: open ? "rotate(180deg)" : "none", transition:"transform .2s" }}>▾</span>
      </div>

      {open && (
        <div style={{ marginTop:12, paddingTop:12, borderTop:`1px solid ${C.accentColor}14` }}>
          {branch.vms.length === 0 && <div style={{ ...S.muted, fontSize:12 }}>No submissions this month.</div>}
          {branch.vms.map((v, i) => (
            <div key={v.name} style={{ display:"flex", alignItems:"center", gap:10,
              padding:"7px 0", borderBottom: i < branch.vms.length-1 ? `1px solid ${C.accentColor}0a` : "none" }}>
              <div style={{ ...S.avatar(26), flexShrink:0, fontSize:11 }}>
                {v.name.split(" ").map(x => x[0]).join("").slice(0,2)}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:12, fontWeight:600 }}>{v.name}</div>
                <div style={{ ...S.muted, fontSize:10 }}>{v.total} submissions · {v.approved} approved</div>
              </div>
              <span style={{
                fontSize:12, fontWeight:700, padding:"3px 10px", borderRadius:12, flexShrink:0,
                color: v.avgScore == null ? C.mutedColor : v.avgScore>=80?"#4ade80":v.avgScore>=60?C.accentColor:"#f87171",
                background: (v.avgScore == null ? C.mutedColor : v.avgScore>=80?"#4ade80":v.avgScore>=60?C.accentColor:"#f87171")+"18",
              }}>
                {v.avgScore ?? `${v.approvalRate}%`}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Analytics Page ───────────────────────────────────────
export function AnalyticsDashboard({ tasks, submissions, company }) {
  const [monthOffset, setMonthOffset] = useState(0); // 0 = current month, -1 = last month...

  const refDate = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + monthOffset);
    return d;
  }, [monthOffset]);

  const stats = useMemo(() => {
    const monthSubs = submissions.filter(s => inSameMonth(s.created_at, refDate));
    const approved  = monthSubs.filter(s => s.status === "approved");
    const pending   = monthSubs.filter(s => s.status === "pending");
    const revision  = monthSubs.filter(s => s.status === "revision");
    const scored    = monthSubs.filter(s => s.score != null);
    const avgScore  = scored.length
      ? Math.round(scored.reduce((a, s) => a + s.score, 0) / scored.length)
      : 0;

    // Submissions per day — real data, last 7 calendar days
    const today = new Date();
    const byDay = Array.from({ length:7 }).map((_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - (6 - i));
      const dateStr = d.toISOString().slice(0, 10);
      const value = submissions.filter(s => (s.created_at ?? "").slice(0, 10) === dateStr).length;
      return { label: d.toLocaleDateString("en-GB", { weekday:"short" }), value };
    });

    // Branch → VM nested breakdown, scoped to the selected month
    const branchMap = {};
    monthSubs.forEach(s => {
      const bName = s.branch?.name ?? s.branch_name ?? "Unknown";
      if (!branchMap[bName]) branchMap[bName] = { name:bName, total:0, approved:0, scoreSum:0, scoreCount:0, vms:{} };
      const b = branchMap[bName];
      b.total++;
      if (s.status === "approved") b.approved++;
      if (s.score != null) { b.scoreSum += s.score; b.scoreCount++; }

      const vmName = s.submitter?.full_name ?? "Unknown";
      if (!b.vms[vmName]) b.vms[vmName] = { name:vmName, total:0, approved:0, scoreSum:0, scoreCount:0 };
      const v = b.vms[vmName];
      v.total++;
      if (s.status === "approved") v.approved++;
      if (s.score != null) { v.scoreSum += s.score; v.scoreCount++; }
    });

    // Ranking when scores/approval tie: avg score → approval rate → submission
    // volume (more completed work under an equal rating wins) → name, so the
    // result is always the same for the same data instead of depending on
    // insertion order.
    const rankCompare = (a, b) =>
      (b.avgScore ?? -1) - (a.avgScore ?? -1) ||
      b.approvalRate - a.approvalRate ||
      b.total - a.total ||
      a.name.localeCompare(b.name);

    const branchList = Object.values(branchMap).map(b => ({
      name: b.name,
      total: b.total,
      approvalRate: b.total ? Math.round((b.approved / b.total) * 100) : 0,
      avgScore: b.scoreCount ? Math.round(b.scoreSum / b.scoreCount) : null,
      vms: Object.values(b.vms)
        .map(v => ({
          name: v.name, total: v.total, approved: v.approved,
          approvalRate: v.total ? Math.round((v.approved / v.total) * 100) : 0,
          avgScore: v.scoreCount ? Math.round(v.scoreSum / v.scoreCount) : null,
        }))
        .sort(rankCompare),
    })).sort(rankCompare);

    const bestBranch = branchList.length > 0 && branchList[0].total > 0 ? branchList[0] : null;

    // Category breakdown
    const catMap = {};
    monthSubs.forEach(s => {
      const name = s.category?.name ?? "Other";
      catMap[name] = (catMap[name] ?? 0) + 1;
    });
    const catData = Object.entries(catMap).map(([label, value]) => ({ label, value }));

    // Score distribution
    const scoreDist = [
      { label:"90-100", value: scored.filter(s => s.score >= 90).length, color:"#4ade80" },
      { label:"70-89",  value: scored.filter(s => s.score >= 70 && s.score < 90).length, color:C.accentColor },
      { label:"50-69",  value: scored.filter(s => s.score >= 50 && s.score < 70).length, color:"#d4a82a" },
      { label:"<50",    value: scored.filter(s => s.score < 50).length, color:"#f87171" },
    ];

    return { monthSubs, approved, pending, revision, avgScore, byDay, branchList, bestBranch, catData, scoreDist };
  }, [submissions, refDate]);

  const monthTasks = tasks.filter(t => inSameMonth(t.created_at, refDate));
  const doneT = monthTasks.filter(t => t.is_done ?? t.done).length;
  const pct   = monthTasks.length ? Math.round((doneT / monthTasks.length) * 100) : 0;

  return (
    <div>
      <div style={{ ...S.h1, marginBottom:2 }} className="fu">
        Analytics <span style={S.accent}>Dashboard</span>
      </div>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }} className="fu">
        <div style={{ ...S.muted, fontSize:12 }}>{company?.name ?? "Company"}</div>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <button onClick={() => setMonthOffset(m => m - 1)}
            style={{ background:"none", border:"none", color:C.accentColor, cursor:"pointer", fontSize:16, padding:"0 4px" }}>‹</button>
          <span style={{ fontSize:12, fontWeight:700, minWidth:110, textAlign:"center" }}>{monthLabel(refDate)}</span>
          <button onClick={() => setMonthOffset(m => Math.min(0, m + 1))} disabled={monthOffset === 0}
            style={{ background:"none", border:"none", color: monthOffset===0 ? C.mutedColor : C.accentColor,
              cursor: monthOffset===0 ? "default" : "pointer", fontSize:16, padding:"0 4px" }}>›</button>
        </div>
      </div>

      {/* Best Branch of the Month */}
      {stats.bestBranch && (
        <div style={{ ...S.card, background:`linear-gradient(135deg,${C.accentColor}22,transparent)`,
          border:`1px solid ${C.accentColor}44`, marginBottom:14 }} className="fu2">
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ fontSize:32 }}>🏆</div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:10, fontWeight:700, color:C.accentColor, letterSpacing:1, textTransform:"uppercase" }}>
                Best Branch — {monthLabel(refDate)}
              </div>
              <div style={{ ...S.dFont, fontSize:20, fontWeight:700 }}>{stats.bestBranch.name}</div>
              <div style={{ ...S.muted, fontSize:12, marginTop:2 }}>
                {stats.bestBranch.vms[0] ? `Top VM: ${stats.bestBranch.vms[0].name}` : ""}
              </div>
              {stats.branchList[1] && stats.branchList[1].avgScore === stats.bestBranch.avgScore && (
                <div style={{ ...S.muted, fontSize:11, marginTop:4 }}>
                  Tied with {stats.branchList[1].name} on score — won on
                  {stats.branchList[1].approvalRate === stats.bestBranch.approvalRate
                    ? " submission volume" : " approval rate"}.
                </div>
              )}
            </div>
            <div style={{ textAlign:"right" }}>
              <div style={{ fontSize:26, fontWeight:700, color:C.accentColor }}>
                {stats.bestBranch.avgScore ?? `${stats.bestBranch.approvalRate}%`}
              </div>
              <div style={{ ...S.muted, fontSize:10 }}>{stats.bestBranch.avgScore != null ? "avg score" : "approval rate"}</div>
            </div>
          </div>
        </div>
      )}
      {!stats.bestBranch && (
        <div style={{ ...S.card, textAlign:"center", padding:"20px", marginBottom:14 }} className="fu2">
          <div style={{ ...S.muted, fontSize:12 }}>No submissions in {monthLabel(refDate)} yet.</div>
        </div>
      )}

      {/* Top KPIs */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8, marginBottom:14 }} className="fu2">
        {[
          { n:stats.monthSubs.length, l:"Submissions",  c:C.accentColor },
          { n:stats.approved.length, l:"Approved",  c:"#4ade80" },
          { n:`${stats.avgScore}`,   l:"Avg Score", c:"#818cf8" },
          { n:`${pct}%`,            l:"Task Done",  c:"#d4a82a" },
        ].map(k => (
          <div key={k.l} style={{ ...S.card, marginBottom:0, textAlign:"center", padding:"14px 8px" }}>
            <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:24, fontWeight:700, color:k.c, lineHeight:1 }}>{k.n}</div>
            <div style={{ fontSize:10, fontWeight:600, color:C.mutedColor, marginTop:3, textTransform:"uppercase", letterSpacing:.5 }}>{k.l}</div>
          </div>
        ))}
      </div>

      {/* Submissions per day — always last 7 real days regardless of month filter */}
      <div style={S.card} className="fu3">
        <div style={S.h3}>Submissions — Last 7 Days</div>
        <BarChart data={stats.byDay} color={C.accentColor} height={80} />
      </div>

      {/* Status donut + Score distribution */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:14 }}>
        <div style={{ ...S.card, marginBottom:0 }}>
          <div style={S.h3}>Status Split</div>
          <DonutChart size={100} segments={[
            { label:"Approved", value:stats.approved.length, color:"#4ade80" },
            { label:"Pending",  value:stats.pending.length,  color:"#d4a82a" },
            { label:"Revision", value:stats.revision.length, color:"#f87171" },
          ]} />
        </div>
        <div style={{ ...S.card, marginBottom:0 }}>
          <div style={S.h3}>Score Distribution</div>
          <DonutChart size={100} segments={stats.scoreDist} />
        </div>
      </div>

      {/* Branch performance — expandable, VM ratings underneath */}
      <div style={{ ...S.h3, marginBottom:10 }}>Branch Performance</div>
      {stats.branchList.length === 0 && (
        <div style={{ ...S.muted, textAlign:"center", padding:20 }}>No data for {monthLabel(refDate)}.</div>
      )}
      {stats.branchList.map((b, i) => (
        <BranchCard key={b.name} branch={b} rank={i} defaultOpen={i === 0} />
      ))}
    </div>
  );
}
