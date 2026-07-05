// ============================================================
//  PDF EXPORT
//  Generates a real PDF report using the browser's print API
//  No external libraries needed — works on all devices
// ============================================================

/**
 * Generate and download a weekly VM report as PDF
 * @param {object} data - { company, tasks, submissions, branches, weekLabel }
 */
export function exportWeeklyReport(data) {
  const { company, tasks, submissions, branches, weekLabel } = data;

  const approved  = submissions.filter(s => s.status === "approved");
  const pending   = submissions.filter(s => s.status === "pending");
  const revision  = submissions.filter(s => s.status === "revision");
  const doneT     = tasks.filter(t => t.is_done ?? t.done);
  const pct       = tasks.length ? Math.round((doneT.length / tasks.length) * 100) : 0;

  // Score stats
  const scored    = submissions.filter(s => s.score != null);
  const avgScore  = scored.length
    ? Math.round(scored.reduce((a, s) => a + s.score, 0) / scored.length)
    : "—";

  // Branch breakdown
  const branchMap = {};
  submissions.forEach(s => {
    const name = s.branch?.name ?? s.branch ?? "Unknown";
    if (!branchMap[name]) branchMap[name] = { approved:0, pending:0, revision:0, total:0 };
    branchMap[name][s.status]++;
    branchMap[name].total++;
  });

  const ac = company?.accent_color ?? "#c8a96e";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<style>
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700&display=swap');
  * { box-sizing:border-box; margin:0; padding:0; }
  body { font-family:'DM Sans',sans-serif; color:#1a1a2e; background:#fff; padding:32px; }
  .header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:28px; padding-bottom:18px; border-bottom:3px solid ${ac}; }
  .logo-box { display:flex; align-items:center; gap:12px; }
  .logo-dot { width:40px; height:40px; border-radius:10px; background:${ac}; }
  .app-name { font-size:22px; font-weight:700; color:#1a1a2e; }
  .report-meta { text-align:right; }
  .report-title { font-size:14px; font-weight:700; color:${ac}; letter-spacing:1px; text-transform:uppercase; }
  .report-week { font-size:12px; color:#6b6880; margin-top:2px; }
  .company-name { font-size:16px; font-weight:600; color:#1a1a2e; }
  .kpi-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin-bottom:24px; }
  .kpi { border:1px solid #e5e7eb; border-radius:10px; padding:14px 12px; text-align:center; }
  .kpi-value { font-size:28px; font-weight:700; color:${ac}; line-height:1; }
  .kpi-label { font-size:11px; color:#6b6880; font-weight:600; letter-spacing:.5px; text-transform:uppercase; margin-top:4px; }
  .section-title { font-size:13px; font-weight:700; color:#1a1a2e; letter-spacing:1px; text-transform:uppercase; margin-bottom:10px; padding-bottom:6px; border-bottom:1px solid #e5e7eb; }
  .section { margin-bottom:22px; }
  table { width:100%; border-collapse:collapse; font-size:12px; }
  th { background:#f9fafb; padding:8px 10px; text-align:left; font-weight:600; color:#6b6880; font-size:11px; text-transform:uppercase; letter-spacing:.5px; border-bottom:1px solid #e5e7eb; }
  td { padding:8px 10px; border-bottom:1px solid #f3f4f6; vertical-align:top; }
  tr:last-child td { border-bottom:none; }
  .badge { display:inline-block; padding:2px 8px; border-radius:12px; font-size:10px; font-weight:700; }
  .badge-approved { background:#dcfce7; color:#16a34a; }
  .badge-pending  { background:#fef9c3; color:#ca8a04; }
  .badge-revision { background:#fee2e2; color:#dc2626; }
  .progress-bar { height:6px; border-radius:3px; background:#e5e7eb; overflow:hidden; margin-top:4px; }
  .progress-fill { height:100%; border-radius:3px; background:${ac}; }
  .footer { margin-top:32px; padding-top:14px; border-top:1px solid #e5e7eb; display:flex; justify-content:space-between; font-size:10px; color:#9ca3af; }
  @media print {
    body { padding:20px; }
    .no-print { display:none; }
  }
</style>
</head>
<body>

<!-- Header -->
<div class="header">
  <div class="logo-box">
    <div class="logo-dot"></div>
    <div>
      <div class="app-name">Vismo</div>
      <div class="company-name">${company?.name ?? "Company Report"}</div>
    </div>
  </div>
  <div class="report-meta">
    <div class="report-title">Weekly VM Report</div>
    <div class="report-week">${weekLabel ?? new Date().toLocaleDateString("en-GB", { day:"numeric", month:"long", year:"numeric" })}</div>
    <div class="report-week">Generated ${new Date().toLocaleString()}</div>
  </div>
</div>

<!-- KPIs -->
<div class="kpi-grid">
  <div class="kpi"><div class="kpi-value">${submissions.length}</div><div class="kpi-label">Submissions</div></div>
  <div class="kpi"><div class="kpi-value">${approved.length}</div><div class="kpi-label">Approved</div></div>
  <div class="kpi"><div class="kpi-value">${pct}%</div><div class="kpi-label">Task Completion</div></div>
  <div class="kpi"><div class="kpi-value">${avgScore}</div><div class="kpi-label">Avg Score</div></div>
</div>

<!-- Branch breakdown -->
<div class="section">
  <div class="section-title">Branch Performance</div>
  <table>
    <thead>
      <tr>
        <th>Branch</th>
        <th>Total</th>
        <th>Approved</th>
        <th>Pending</th>
        <th>Revision</th>
        <th>Completion</th>
      </tr>
    </thead>
    <tbody>
      ${Object.entries(branchMap).map(([name, b]) => {
        const branchPct = b.total ? Math.round((b.approved / b.total) * 100) : 0;
        return `<tr>
          <td><strong>${name}</strong></td>
          <td>${b.total}</td>
          <td><span class="badge badge-approved">${b.approved}</span></td>
          <td><span class="badge badge-pending">${b.pending}</span></td>
          <td><span class="badge badge-revision">${b.revision}</span></td>
          <td>
            <div>${branchPct}%</div>
            <div class="progress-bar"><div class="progress-fill" style="width:${branchPct}%"></div></div>
          </td>
        </tr>`;
      }).join("")}
    </tbody>
  </table>
</div>

<!-- Submissions detail -->
<div class="section">
  <div class="section-title">Submission Details</div>
  <table>
    <thead>
      <tr>
        <th>VM</th>
        <th>Branch</th>
        <th>Category</th>
        <th>Section</th>
        <th>Status</th>
        <th>Score</th>
        <th>Note</th>
      </tr>
    </thead>
    <tbody>
      ${submissions.map(s => `<tr>
        <td><strong>${s.submitter?.full_name ?? s.vm ?? "—"}</strong></td>
        <td>${s.branch?.name ?? s.branch ?? "—"}</td>
        <td>${s.category?.name ?? "—"}</td>
        <td>${s.subcategory?.name ?? "—"}</td>
        <td><span class="badge badge-${s.status}">${s.status}</span></td>
        <td>${s.score != null ? s.score + "/100" : "—"}</td>
        <td style="max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${s.note ?? "—"}</td>
      </tr>`).join("")}
    </tbody>
  </table>
</div>

<!-- Tasks summary -->
<div class="section">
  <div class="section-title">Tasks Summary</div>
  <table>
    <thead>
      <tr><th>Category</th><th>Task</th><th>Priority</th><th>Due</th><th>Status</th></tr>
    </thead>
    <tbody>
      ${tasks.map(t => `<tr>
        <td>${t.category?.name ?? "—"}</td>
        <td>${t.title ?? t.text ?? "—"}</td>
        <td><span class="badge ${t.priority==="high"?"badge-revision":t.priority==="medium"?"badge-pending":"badge-approved"}">${t.priority}</span></td>
        <td>${t.due_label ?? t.dueDate ?? "—"}</td>
        <td><span class="badge ${(t.is_done||t.done)?"badge-approved":"badge-pending"}">${(t.is_done||t.done)?"Done":"Open"}</span></td>
      </tr>`).join("")}
    </tbody>
  </table>
</div>

<!-- Footer -->
<div class="footer">
  <span>Vismo · Visual Merchandising Operations Platform</span>
  <span>Confidential · ${company?.name ?? ""}</span>
</div>

</body>
</html>`;

  // Open print dialog
  const win = window.open("", "_blank", "width=900,height=700");
  win.document.write(html);
  win.document.close();
  win.onload = () => {
    setTimeout(() => {
      win.print();
      // Close after print dialog
      win.onafterprint = () => win.close();
    }, 500);
  };
}
