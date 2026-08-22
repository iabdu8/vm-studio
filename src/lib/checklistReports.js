import { printHTML } from "./printReport.js";

// ============================================================
//  CHECKLIST-STYLE REPORTS — shared branded shell + 3 builders
//  (Weekly Plan, Campaign, Floor Walk), matching one visual style:
//  bold title, colored badge, KPI strip, colored status table.
// ============================================================

const esc = (s) => (s ?? "").toString()
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function shell({ eyebrow, title, badge, meta, kpis = [], bodyHtml, footerNote, accent = "#1a1420" }) {
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"/>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700;800&display=swap');
    * { box-sizing:border-box; margin:0; padding:0; }
    body { font-family:'DM Sans',sans-serif; color:#1a1a2e; background:#fff; padding:28px; }
    .top { display:flex; justify-content:space-between; align-items:flex-start; gap:16px; margin-bottom:18px; }
    .eyebrow { font-size:11px; font-weight:700; color:${accent}; letter-spacing:2px; text-transform:uppercase; margin-bottom:4px; }
    h1 { font-size:26px; font-weight:800; letter-spacing:-.5px; margin-bottom:10px; }
    .badge { display:inline-block; background:${accent}; color:#fff; font-weight:800; font-size:13px;
      letter-spacing:1px; text-transform:uppercase; padding:8px 18px; border-radius:8px; }
    .meta-box { border:1px solid #e5e7eb; border-radius:10px; padding:12px 16px; min-width:220px; font-size:12px; color:#6b6880; }
    .meta-box strong { color:#1a1a2e; }
    .kpis { display:grid; grid-template-columns:repeat(${kpis.length || 1},1fr); gap:10px; margin-bottom:20px; }
    .kpi { border:1px solid #e5e7eb; border-radius:10px; padding:12px; text-align:center; }
    .kpi-n { font-size:22px; font-weight:800; }
    .kpi-l { font-size:10px; font-weight:700; letter-spacing:.5px; text-transform:uppercase; color:#6b6880; margin-top:2px; }
    .section { font-size:13px; font-weight:800; letter-spacing:.5px; text-transform:uppercase; color:#1a1a2e;
      display:flex; align-items:center; gap:8px; margin:22px 0 10px; }
    table { width:100%; border-collapse:collapse; font-size:12px; margin-bottom:6px; }
    th { background:#f9fafb; padding:8px 10px; text-align:left; font-weight:700; color:#6b6880;
      font-size:10px; text-transform:uppercase; letter-spacing:.5px; border-bottom:1px solid #e5e7eb; }
    td { padding:8px 10px; border-bottom:1px solid #f3f4f6; vertical-align:top; }
    .pill { display:inline-block; padding:3px 10px; border-radius:12px; font-size:10px; font-weight:800; }
    .pill-done { background:#dcfce7; color:#16a34a; }
    .pill-pending { background:#fef9c3; color:#ca8a04; }
    .pill-cancelled { background:#f3f4f6; color:#6b7280; }
    .box { border:1px solid #e5e7eb; border-radius:10px; padding:14px 16px; margin-bottom:16px; font-size:13px; line-height:1.6; }
    .footer { margin-top:26px; padding-top:12px; border-top:1px solid #e5e7eb; font-size:10px; color:#9ca3af;
      display:flex; justify-content:space-between; }
    .photo-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:16px; }
    .photo-block { border:1px solid #e5e7eb; border-radius:10px; overflow:hidden; }
    .photo-block img { width:100%; height:150px; object-fit:cover; display:block; }
    .photo-caption { padding:8px 10px; font-size:11px; color:#6b6880; background:#f9fafb; }
    @media print { body { padding:16px; } }
  </style></head><body>

  <div class="top">
    <div>
      <div class="eyebrow">${esc(eyebrow)}</div>
      <h1>${esc(title)}</h1>
      ${badge ? `<span class="badge">${esc(badge)}</span>` : ""}
    </div>
    <div class="meta-box">${meta}</div>
  </div>

  ${kpis.length ? `<div class="kpis">${kpis.map(k => `
    <div class="kpi"><div class="kpi-n" style="color:${k.color ?? accent}">${esc(k.n)}</div><div class="kpi-l">${esc(k.l)}</div></div>
  `).join("")}</div>` : ""}

  ${bodyHtml}

  <div class="footer">
    <span>Vismo · Visual Merchandising Operations</span>
    <span>${esc(footerNote ?? "")}</span>
  </div>
  </body></html>`;
  printHTML(html);
}

// ── FLOOR WALK CHECKLIST ──────────────────────────────────────
export function printFloorWalkChecklist(fw, company) {
  const accent = company?.accent_color ?? "#1a1420";
  const date = fw.date ? new Date(fw.date) : new Date();
  const dayName = date.toLocaleDateString("en-GB", { weekday: "long" });
  const checklist = fw.checklist ?? [];
  const extraPoints = (fw.note ?? "").split("\n").map(l => l.trim()).filter(Boolean);
  const photos = fw.photos ?? [];
  const doneCount = checklist.filter(it => it.status === "done").length;

  const PILL = {
    done: `<span class="pill pill-done">✓ Done</span>`,
    pending: `<span class="pill pill-pending">Pending</span>`,
  };

  const bodyHtml = `
    ${checklist.length ? `
    <div class="section">📋 Floor Walk Checklist</div>
    <table>
      <thead><tr><th style="width:32px">#</th><th>Check Point</th><th style="width:110px">Status</th></tr></thead>
      <tbody>
        ${checklist.map((it, i) => `<tr><td>${i + 1}</td><td>${esc(it.label)}</td><td>${PILL[it.status] ?? PILL.pending}</td></tr>`).join("")}
      </tbody>
    </table>` : `<div class="box">No checklist recorded for this floor walk.</div>`}

    ${extraPoints.length ? `
    <div class="section">📝 Additional Notes</div>
    <div class="box">${extraPoints.map(esc).join("<br/>")}</div>` : ""}

    ${photos.length ? `
    <div class="section">📷 Photos Taken (${photos.length})</div>
    <div class="photo-grid">
      ${photos.map(p => `<div class="photo-block">
        <img src="${esc(p.url ?? p)}"/>
        ${p.comment ? `<div class="photo-caption">${esc(p.comment)}</div>` : ""}
      </div>`).join("")}
    </div>` : `<div class="box">No photos attached.</div>`}
  `;

  shell({
    eyebrow: company?.name ?? "Vismo",
    title: "Floor Walk Checklist",
    badge: dayName,
    accent,
    meta: `📅 <strong>${esc(date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }))}</strong><br/>By ${esc(fw.manager ?? "—")}`,
    kpis: [
      { n: `${doneCount}/${checklist.length || 9}`, l: "Checked" },
      { n: photos.length, l: "Photos", color: "#4F46E5" },
    ],
    bodyHtml,
    footerNote: `${fw.manager ?? ""} · ${date.toLocaleDateString("en-GB")}`,
  });
}

// ── WEEKLY PLAN CHECKLIST (one day) ───────────────────────────
export function printWeeklyPlanChecklist({ branchName, dayLabel, dayDate, staffGroups, company }) {
  const accent = company?.accent_color ?? "#1a1420";
  const total = staffGroups.reduce((a, g) => a + g.items.length, 0);
  const done = staffGroups.reduce((a, g) => a + g.items.filter(i => i.status === "done").length, 0);

  const bodyHtml = staffGroups.map(g => `
    <div class="section">👤 ${esc(g.name)}${g.category ? ` — ${esc(g.category)}` : ""}</div>
    <table>
      <thead><tr><th style="width:32px">#</th><th>Task</th><th style="width:110px">Status</th></tr></thead>
      <tbody>
        ${g.items.length ? g.items.map((it, i) => `<tr>
          <td>${i + 1}</td><td>${esc(it.title)}</td>
          <td><span class="pill ${it.status === "done" ? "pill-done" : "pill-pending"}">${it.status === "done" ? "✓ Done" : "Pending"}</span></td>
        </tr>`).join("") : `<tr><td colspan="3" style="color:#9ca3af">No tasks scheduled</td></tr>`}
      </tbody>
    </table>
  `).join("");

  shell({
    eyebrow: company?.name ?? "Vismo",
    title: "Weekly Plan Checklist",
    badge: dayLabel,
    accent,
    meta: `📍 <strong>${esc(branchName)}</strong><br/>📅 ${esc(dayDate)}`,
    kpis: [
      { n: total, l: "Total Tasks" },
      { n: done, l: "Done", color: "#16a34a" },
      { n: total - done, l: "Pending", color: "#ca8a04" },
    ],
    bodyHtml,
    footerNote: `${branchName} · ${dayDate}`,
  });
}

// ── CAMPAIGN CHECKLIST ────────────────────────────────────────
export function printCampaignChecklist({ campaign, campaignProgress = [], company }) {
  const accent = company?.accent_color ?? "#1a1420";
  const completed = campaignProgress.filter(b => b.status === "completed").length;
  const inProgress = campaignProgress.filter(b => b.status === "in_progress").length;
  const notStarted = campaignProgress.filter(b => b.status === "not_started").length;
  const total = campaignProgress.length;

  const STATUS_PILL = {
    completed: `<span class="pill pill-done">✓ Done</span>`,
    in_progress: `<span class="pill pill-pending">In Progress</span>`,
    not_started: `<span class="pill pill-cancelled">Not Started</span>`,
  };

  const bodyHtml = `
    <div class="section">🏪 Branch Implementation Status</div>
    <table>
      <thead><tr><th style="width:32px">#</th><th>Branch</th><th style="width:130px">Status</th><th>Note</th></tr></thead>
      <tbody>
        ${campaignProgress.length ? campaignProgress.map((b, i) => `<tr>
          <td>${i + 1}</td><td>${esc(b.branch?.name ?? "—")}</td>
          <td>${STATUS_PILL[b.status] ?? STATUS_PILL.not_started}</td>
          <td>${esc(b.note ?? "—")}</td>
        </tr>`).join("") : `<tr><td colspan="4" style="color:#9ca3af">No branches tracked yet</td></tr>`}
      </tbody>
    </table>
  `;

  shell({
    eyebrow: company?.name ?? "Vismo",
    title: campaign?.name ?? "Campaign Checklist",
    badge: "Implementation Report",
    accent,
    meta: `📅 <strong>${esc(campaign?.date_from ?? "—")}</strong> → ${esc(campaign?.date_to ?? "—")}`,
    kpis: [
      { n: `${total ? Math.round((completed / total) * 100) : 0}%`, l: "Completed", color: "#16a34a" },
      { n: completed, l: "Branches Done" },
      { n: inProgress, l: "In Progress", color: "#ca8a04" },
      { n: notStarted, l: "Not Started", color: "#6b7280" },
    ],
    bodyHtml,
    footerNote: campaign?.name ?? "",
  });
}
