import { useMemo, useState } from "react";
import { S, C } from "../../styles/theme.js";
import { printHTML } from "../../lib/printReport.js";

// ============================================================
//  ANALYTICS DASHBOARD — kept deliberately simple: plain numbers
//  and horizontal bars instead of charts, so it reads at a glance.
// ============================================================

const monthLabel = (d) => d.toLocaleDateString("en-GB", { month:"long", year:"numeric" });
const inSameMonth = (dateStr, ref) => {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth();
};

// ── Simple labeled bar row (used for status split) ──────────────
function StatBar({ label, value, total, color }) {
  const pct = total ? Math.round((value / total) * 100) : 0;
  return (
    <div style={{ marginBottom:12 }}>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
        <span style={{ fontSize:13, fontWeight:600 }}>{label}</span>
        <span style={{ fontSize:13, fontWeight:700, color }}>{value} <span style={{ color:C.mutedColor, fontWeight:400 }}>({pct}%)</span></span>
      </div>
      <div style={{ height:6, borderRadius:3, background:C.surfaceHigh }}>
        <div style={{ height:"100%", borderRadius:3, width:`${pct}%`, background:color, transition:"width .4s" }}/>
      </div>
    </div>
  );
}

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
export function AnalyticsDashboard({ tasks, submissions, company, regions = [] }) {
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

    // Branch → VM nested breakdown, scoped to the selected month
    const branchMap = {};
    monthSubs.forEach(s => {
      const bId   = s.branch_id ?? s.branch?.name ?? "unknown";
      const bName = s.branch?.name ?? s.branch_name ?? "Unknown";
      if (!branchMap[bId]) branchMap[bId] = { id:bId, name:bName, total:0, approved:0, scoreSum:0, scoreCount:0, vms:{} };
      const b = branchMap[bId];
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
      id: b.id,
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

    // Group branches by region (VM Manager's assigned branches)
    const managerNameByBranch = {};
    regions.forEach(r => { managerNameByBranch[r.branch_id] = r.manager_name; });
    const regionMap = {};
    branchList.forEach(b => {
      const region = managerNameByBranch[b.id] ?? "Unassigned";
      if (!regionMap[region]) regionMap[region] = [];
      regionMap[region].push(b);
    });
    const regionList = Object.entries(regionMap)
      .map(([region, branchesInRegion]) => ({
        region,
        branches: [...branchesInRegion].sort(rankCompare),
        best: [...branchesInRegion].sort(rankCompare)[0],
      }))
      .sort((a, b) => a.region === "Unassigned" ? 1 : b.region === "Unassigned" ? -1 : a.region.localeCompare(b.region));

    const approvalRate = monthSubs.length ? Math.round((approved.length / monthSubs.length) * 100) : 0;

    return { monthSubs, approved, pending, revision, avgScore, approvalRate, branchList, bestBranch, regionList };
  }, [submissions, refDate, regions]);

  const monthTasks = tasks.filter(t => inSameMonth(t.created_at, refDate));
  const doneT = monthTasks.filter(t => t.is_done ?? t.done).length;
  const pct   = monthTasks.length ? Math.round((doneT / monthTasks.length) * 100) : 0;

  const handlePrint = () => {
    const accent = "#4F46E5";
    const rows = stats.regionList.length
      ? stats.regionList.flatMap(r => r.branches.map(b => ({ ...b, region: r.region })))
      : stats.branchList.map(b => ({ ...b, region: "—" }));
    const rowsHtml = rows.map((b, i) => `
      <tr style="background:${i%2===0?"#fff":"#f9f9f9"}">
        <td style="padding:9px 12px;border-bottom:1px solid #eee;font-weight:600">${b.name}</td>
        <td style="padding:9px 12px;border-bottom:1px solid #eee;color:#6b6880">${b.region}</td>
        <td style="padding:9px 12px;border-bottom:1px solid #eee;text-align:center">${b.total}</td>
        <td style="padding:9px 12px;border-bottom:1px solid #eee;text-align:center">${b.approvalRate}%</td>
        <td style="padding:9px 12px;border-bottom:1px solid #eee;text-align:center;font-weight:700;color:${accent}">${b.avgScore ?? "—"}</td>
      </tr>`).join("");

    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"/>
    <style>
      body { font-family:'DM Sans',sans-serif; color:#1a1a2e; padding:32px; background:#fff; }
      .header { display:flex; justify-content:space-between; padding-bottom:20px; border-bottom:3px solid ${accent}; margin-bottom:24px; }
      .logo-text { font-size:24px; font-weight:700; color:${accent}; }
      table { width:100%; border-collapse:collapse; margin-top:8px; }
      th { background:${accent}; color:#fff; padding:9px 12px; text-align:left; font-size:11px; font-weight:700; text-transform:uppercase; }
      .kpis { display:flex; gap:16px; margin-bottom:24px; }
      .kpi { flex:1; text-align:center; padding:14px 8px; background:#f9f9f9; border-radius:8px; }
      .kpi .n { font-size:22px; font-weight:700; color:${accent}; }
      .kpi .l { font-size:10px; color:#9ca3af; text-transform:uppercase; margin-top:4px; }
      .section-title { font-size:13px; font-weight:700; letter-spacing:1px; text-transform:uppercase;
        color:#6b6880; margin:24px 0 10px; padding-bottom:6px; border-bottom:1px solid #e5e7eb; }
      .footer { margin-top:32px; padding-top:16px; border-top:1px solid #e5e7eb;
        display:flex; justify-content:space-between; font-size:11px; color:#9ca3af; }
      @media print { body { padding:20px; } }
    </style></head><body>
    <div class="header">
      <div><div class="logo-text">Vismo</div><div style="font-size:13px;color:#6b6880;margin-top:4px">${company?.name ?? ""}</div></div>
      <div style="text-align:right"><div style="font-size:11px;font-weight:700;color:${accent};letter-spacing:2px">ANALYTICS REPORT</div>
      <div style="font-size:12px;color:#6b6880;margin-top:4px">${monthLabel(refDate)}</div></div>
    </div>
    ${stats.bestBranch ? `<div style="padding:14px 18px;background:${accent}11;border:1px solid ${accent}33;border-radius:10px;margin-bottom:24px">
      <div style="font-size:10px;font-weight:700;color:${accent};text-transform:uppercase;letter-spacing:1px">🏆 Best Branch — ${monthLabel(refDate)}</div>
      <div style="font-size:18px;font-weight:700;margin-top:2px">${stats.bestBranch.name}</div>
    </div>` : ""}
    <div class="kpis">
      <div class="kpi"><div class="n">${stats.monthSubs.length}</div><div class="l">Submissions</div></div>
      <div class="kpi"><div class="n">${stats.approved.length}</div><div class="l">Approved</div></div>
      <div class="kpi"><div class="n">${stats.approvalRate}%</div><div class="l">Approval Rate</div></div>
      <div class="kpi"><div class="n">${stats.avgScore}</div><div class="l">Avg Score</div></div>
      <div class="kpi"><div class="n">${pct}%</div><div class="l">Task Done</div></div>
    </div>
    <div class="section-title">Submission Status</div>
    <table><thead><tr><th>Status</th><th style="text-align:center">Count</th><th style="text-align:center">%</th></tr></thead>
    <tbody>
      <tr style="background:#fff"><td style="padding:9px 12px;border-bottom:1px solid #eee">✓ Approved</td><td style="padding:9px 12px;border-bottom:1px solid #eee;text-align:center">${stats.approved.length}</td><td style="padding:9px 12px;border-bottom:1px solid #eee;text-align:center">${stats.monthSubs.length?Math.round(stats.approved.length/stats.monthSubs.length*100):0}%</td></tr>
      <tr style="background:#f9f9f9"><td style="padding:9px 12px;border-bottom:1px solid #eee">⏳ Pending</td><td style="padding:9px 12px;border-bottom:1px solid #eee;text-align:center">${stats.pending.length}</td><td style="padding:9px 12px;border-bottom:1px solid #eee;text-align:center">${stats.monthSubs.length?Math.round(stats.pending.length/stats.monthSubs.length*100):0}%</td></tr>
      <tr style="background:#fff"><td style="padding:9px 12px;border-bottom:1px solid #eee">↩ Revision</td><td style="padding:9px 12px;border-bottom:1px solid #eee;text-align:center">${stats.revision.length}</td><td style="padding:9px 12px;border-bottom:1px solid #eee;text-align:center">${stats.monthSubs.length?Math.round(stats.revision.length/stats.monthSubs.length*100):0}%</td></tr>
    </tbody></table>
    <div class="section-title">Branch Performance</div>
    <table><thead><tr><th>Branch</th><th>Region</th><th style="text-align:center">Submissions</th><th style="text-align:center">Approval Rate</th><th style="text-align:center">Avg Score</th></tr></thead>
    <tbody>${rowsHtml}</tbody></table>
    <div class="footer"><span>Vismo · Visual Merchandising Operations</span><span>${company?.name ?? ""} · ${monthLabel(refDate)}</span></div>
    <script>window.onload=()=>{window.print();window.onafterprint=()=>window.close();}</script>
    </body></html>`;
    printHTML(html);
  };

  return (
    <div>
      <div style={{ ...S.h1, marginBottom:2 }} className="fu">
        Analytics <span style={S.accent}>Dashboard</span>
      </div>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16, flexWrap:"wrap", gap:8 }} className="fu">
        <div style={{ ...S.muted, fontSize:12 }}>{company?.name ?? "Company"}</div>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <button onClick={() => setMonthOffset(m => m - 1)}
              style={{ background:"none", border:"none", color:C.accentColor, cursor:"pointer", fontSize:16, padding:"0 4px" }}>‹</button>
            <span style={{ fontSize:12, fontWeight:700, minWidth:110, textAlign:"center" }}>{monthLabel(refDate)}</span>
            <button onClick={() => setMonthOffset(m => Math.min(0, m + 1))} disabled={monthOffset === 0}
              style={{ background:"none", border:"none", color: monthOffset===0 ? C.mutedColor : C.accentColor,
                cursor: monthOffset===0 ? "default" : "pointer", fontSize:16, padding:"0 4px" }}>›</button>
          </div>
          <button className="btnP" style={{ ...S.btnP, fontSize:12, padding:"7px 14px" }} onClick={handlePrint}>
            🖨️ Print
          </button>
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
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8, marginBottom:8 }} className="fu2">
        {[
          { n:stats.monthSubs.length, l:"Submissions",   c:C.accentColor },
          { n:stats.approved.length,  l:"Approved",      c:"#4ade80" },
          { n:`${stats.approvalRate}%`, l:"Approval Rate", c:"#4ade80" },
        ].map(k => (
          <div key={k.l} style={{ ...S.card, marginBottom:0, textAlign:"center", padding:"14px 8px" }}>
            <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:24, fontWeight:700, color:k.c, lineHeight:1 }}>{k.n}</div>
            <div style={{ fontSize:10, fontWeight:600, color:C.mutedColor, marginTop:3, textTransform:"uppercase", letterSpacing:.5 }}>{k.l}</div>
          </div>
        ))}
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:8, marginBottom:14 }} className="fu2">
        {[
          { n:`${stats.avgScore}`, l:"Avg Score", c:"#818cf8" },
          { n:`${pct}%`,           l:"Task Done", c:"#d4a82a" },
        ].map(k => (
          <div key={k.l} style={{ ...S.card, marginBottom:0, textAlign:"center", padding:"14px 8px" }}>
            <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:24, fontWeight:700, color:k.c, lineHeight:1 }}>{k.n}</div>
            <div style={{ fontSize:10, fontWeight:600, color:C.mutedColor, marginTop:3, textTransform:"uppercase", letterSpacing:.5 }}>{k.l}</div>
          </div>
        ))}
      </div>

      {/* Submission status — simple bars, no chart */}
      <div style={{ ...S.card }} className="fu3">
        <div style={S.h3}>Submission Status</div>
        <StatBar label="✓ Approved" value={stats.approved.length} total={stats.monthSubs.length} color="#4ade80"/>
        <StatBar label="⏳ Pending"  value={stats.pending.length}  total={stats.monthSubs.length} color="#d4a82a"/>
        <StatBar label="↩ Revision" value={stats.revision.length} total={stats.monthSubs.length} color="#f87171"/>
      </div>

      {/* Branch performance — grouped by region (VM Manager) when regions exist, expandable to VM ratings */}
      <div style={{ ...S.h3, marginTop:16, marginBottom:10 }}>Branch Performance</div>
      {stats.branchList.length === 0 && (
        <div style={{ ...S.muted, textAlign:"center", padding:20 }}>No data for {monthLabel(refDate)}.</div>
      )}

      {regions.length === 0 && stats.branchList.map((b, i) => (
        <BranchCard key={b.id} branch={b} rank={i} defaultOpen={i === 0} />
      ))}

      {regions.length > 0 && stats.regionList.map(r => (
        <div key={r.region} style={{ marginBottom:18 }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
            <div style={{ fontSize:12, fontWeight:700, color:C.accentColor, textTransform:"uppercase", letterSpacing:.5 }}>
              📍 {r.region === "Unassigned" ? "Unassigned Branches" : r.region}
            </div>
            {r.best && r.best.total > 0 && (
              <div style={{ fontSize:11, color:C.mutedColor }}>
                🏅 Best: <span style={{ fontWeight:700, color:C.textColor }}>{r.best.name}</span>
              </div>
            )}
          </div>
          {r.branches.map((b, i) => (
            <BranchCard key={b.id} branch={b} rank={i} defaultOpen={i === 0} />
          ))}
        </div>
      ))}
    </div>
  );
}
