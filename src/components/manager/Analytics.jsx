import { useMemo } from "react";
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

// ── Trend Line ────────────────────────────────────────────────
function TrendLine({ data, color = C.accentColor, height = 60 }) {
  if (data.length < 2) return null;
  const max  = Math.max(...data.map(d => d.value), 1);
  const step = 100 / (data.length - 1);

  const points = data.map((d, i) => ({
    x: i * step,
    y: height - (d.value / max) * (height - 10) - 5,
    ...d,
  }));

  const polyline = points.map(p => `${p.x},${p.y}`).join(" ");
  const area     = `M ${points[0].x},${height} ` +
    points.map(p => `L ${p.x},${p.y}`).join(" ") +
    ` L ${points[points.length-1].x},${height} Z`;

  return (
    <svg viewBox={`0 0 100 ${height}`} preserveAspectRatio="none"
      style={{ width:"100%", height, display:"block" }}>
      <path d={area} fill={color} fillOpacity="0.12" />
      <polyline points={polyline} fill="none" stroke={color} strokeWidth="1.5"
        strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="1.8" fill={color} />
      ))}
    </svg>
  );
}

// ── Main Analytics Page ───────────────────────────────────────
export function AnalyticsDashboard({ tasks, submissions, company }) {
  // ── Computed stats ──────────────────────────────────────────
  const stats = useMemo(() => {
    const approved = submissions.filter(s => s.status === "approved");
    const pending  = submissions.filter(s => s.status === "pending");
    const revision = submissions.filter(s => s.status === "revision");
    const scored   = submissions.filter(s => s.score != null);
    const avgScore = scored.length
      ? Math.round(scored.reduce((a, s) => a + s.score, 0) / scored.length)
      : 0;

    // Submissions by day (last 7 days)
    const days    = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
    const byDay   = days.map(label => ({ label, value: Math.floor(Math.random() * 8) + 1 }));
    // ↑ Replace with real groupBy date logic once Supabase connected

    // Branch performance
    const branchMap = {};
    submissions.forEach(s => {
      const name = s.branch?.name ?? s.branch ?? "Unknown";
      if (!branchMap[name]) branchMap[name] = { approved:0, total:0 };
      if (s.status === "approved") branchMap[name].approved++;
      branchMap[name].total++;
    });
    const branchPerf = Object.entries(branchMap).map(([label, b]) => ({
      label: label.split(" ")[0],
      value: b.total ? Math.round((b.approved / b.total) * 100) : 0,
    })).sort((a, b) => b.value - a.value);

    // VM leaderboard
    const vmMap = {};
    scored.forEach(s => {
      const name = s.submitter?.full_name ?? s.vm ?? "Unknown";
      if (!vmMap[name]) vmMap[name] = { name, total:0, count:0, branch: s.branch?.name ?? s.branch ?? "" };
      vmMap[name].total += s.score;
      vmMap[name].count++;
    });
    const leaderboard = Object.values(vmMap)
      .map(v => ({ ...v, avg: Math.round(v.total / v.count) }))
      .sort((a, b) => b.avg - a.avg);

    // Category breakdown
    const catMap = {};
    submissions.forEach(s => {
      const name = s.category?.name ?? "Other";
      if (!catMap[name]) catMap[name] = 0;
      catMap[name]++;
    });
    const catData = Object.entries(catMap).map(([label, value]) => ({ label, value }));

    // Score distribution
    const scoreDist = [
      { label:"90-100", value: scored.filter(s => s.score >= 90).length, color:"#4ade80" },
      { label:"70-89",  value: scored.filter(s => s.score >= 70 && s.score < 90).length, color:C.accentColor },
      { label:"50-69",  value: scored.filter(s => s.score >= 50 && s.score < 70).length, color:"#d4a82a" },
      { label:"<50",    value: scored.filter(s => s.score < 50).length, color:"#f87171" },
    ];

    return { approved, pending, revision, avgScore, byDay, branchPerf, leaderboard, catData, scoreDist };
  }, [tasks, submissions]);

  const doneT = tasks.filter(t => t.is_done ?? t.done).length;
  const pct   = tasks.length ? Math.round((doneT / tasks.length) * 100) : 0;

  return (
    <div>
      <div style={{ ...S.h1, marginBottom:2 }} className="fu">
        Analytics <span style={S.accent}>Dashboard</span>
      </div>
      <div style={{ ...S.muted, marginBottom:18, fontSize:12 }}>
        {company?.name ?? "Company"} · Live data
      </div>

      {/* Top KPIs */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8, marginBottom:14 }} className="fu2">
        {[
          { n:submissions.length, l:"Submissions",  c:C.accentColor },
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

      {/* Submissions per day */}
      <div style={S.card} className="fu3">
        <div style={S.h3}>Submissions This Week</div>
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

      {/* Branch performance bars */}
      {stats.branchPerf.length > 0 && (
        <div style={S.card}>
          <div style={S.h3}>Branch Approval Rate</div>
          {stats.branchPerf.slice(0, 6).map((b, i) => (
            <div key={b.label} style={{ marginBottom:10 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
                <span style={{ fontSize:12, fontWeight:600 }}>
                  {i===0?"🥇 ":i===1?"🥈 ":i===2?"🥉 ":""}{b.label}
                </span>
                <span style={{ fontSize:12, fontWeight:700, color:b.value>=80?C.accentColor:b.value>=60?C.textColor:C.mutedColor }}>
                  {b.value}%
                </span>
              </div>
              <div style={{ height:5, borderRadius:3, background:C.surfaceHigh }}>
                <div style={{
                  height:"100%", borderRadius:3, transition:"width .5s",
                  background: b.value>=80?C.accentColor:b.value>=60?"#4ade80":"#d4a82a",
                  width:`${b.value}%`,
                }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* VM Leaderboard */}
      <div style={S.card}>
        <div style={S.h3}>🏆 VM Leaderboard</div>
        {stats.leaderboard.length === 0 && (
          <div style={S.muted}>No scored submissions yet.</div>
        )}
        {stats.leaderboard.map((v, i) => (
          <div key={v.name} style={{
            display:"flex", alignItems:"center", gap:10,
            padding:"9px 0", borderBottom:`1px solid ${C.accentColor}0a`,
          }}>
            <span style={{
              fontFamily:"'Cormorant Garamond',serif", fontSize:18, fontWeight:700,
              color: i===0?C.accentColor:C.mutedColor, width:24, flexShrink:0,
            }}>
              {i+1}
            </span>
            <div style={{ ...S.avatar(32), flexShrink:0 }}>
              {v.name.split(" ").map(x => x[0]).join("").slice(0,2)}
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13, fontWeight:600 }}>{v.name}</div>
              <div style={{ ...S.muted, fontSize:11 }}>{v.branch} · {v.count} submissions</div>
            </div>
            <div style={{ textAlign:"right" }}>
              <div style={{
                fontSize:18, fontWeight:700,
                color: i===0?C.accentColor:C.textColor,
              }}>
                {v.avg}
              </div>
              <div style={{ ...S.muted, fontSize:10 }}>avg/100</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
