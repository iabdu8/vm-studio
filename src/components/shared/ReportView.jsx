import { S, C } from "../../styles/theme.js";
import { printHTML } from "../../lib/printReport.js";

// ============================================================
//  REPORT VIEW — عرض تقرير جميل داخل التطبيق
// ============================================================

export function ReportView({ report, onClose }) {
  if (!report) return null;

  const { type, title, branch, date, by, notes, photos, findings } = report;

  const photoItems  = photos ?? [];
  const textItems   = findings ?? [];

  const handlePrint = () => {
    const html = `<!DOCTYPE html><html><head>
    <meta charset="UTF-8"/>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700&display=swap');
      * { box-sizing:border-box; margin:0; padding:0; }
      body { font-family:'DM Sans',sans-serif; padding:32px; color:#1a1a2e; background:#fff; }
      .header { border-bottom:3px solid #c8a96e; padding-bottom:16px; margin-bottom:24px; }
      .type { font-size:11px; font-weight:700; color:#c8a96e; letter-spacing:2px;
        text-transform:uppercase; margin-bottom:6px; }
      h1 { font-size:22px; font-weight:700; color:#1a1a2e; margin-bottom:4px; }
      .meta { font-size:12px; color:#9ca3af; }
      .note { background:#f9f9f9; border-left:4px solid #c8a96e; padding:12px 16px;
        margin:20px 0; border-radius:0 8px 8px 0; font-size:14px; line-height:1.6; }
      .section-title { font-size:13px; font-weight:700; letter-spacing:1px;
        text-transform:uppercase; color:#6b6880; margin:24px 0 14px;
        padding-bottom:6px; border-bottom:1px solid #e5e7eb; }
      .photo-grid { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
      .photo-block { page-break-inside:avoid; border:1px solid #e5e7eb; border-radius:10px; overflow:hidden; }
      .photo-block img { width:100%; height:200px; object-fit:cover; display:block; }
      .photo-caption { padding:10px 14px; font-size:13px; color:#1a1a2e; background:#f9fafb; }
      .finding { padding:12px 0; border-bottom:1px solid #f3f4f6; }
      .finding-title { font-size:14px; font-weight:600; color:#1a1a2e; }
      .finding-rec { font-size:13px; color:#6b6880; margin-top:4px; }
      .footer { margin-top:32px; padding-top:14px; border-top:1px solid #e5e7eb;
        font-size:11px; color:#9ca3af; display:flex; justify-content:space-between; }
      @media print { .photo-grid { grid-template-columns:1fr 1fr; } }
    </style></head><body>
    <div class="header">
      <div class="type">${type}</div>
      <h1>${title}</h1>
      <div class="meta">📍 ${branch} · ${date} · By ${by}</div>
    </div>
    ${notes ? `<div class="note">${notes}</div>` : ""}
    ${photoItems.length ? `
      <div class="section-title">Photos (${photoItems.length})</div>
      <div class="photo-grid">
        ${photoItems.map(p => `
          <div class="photo-block">
            <img src="${p.image_url ?? p.url}"/>
            <div class="photo-caption">${p.recommendation || p.comment || "—"}</div>
          </div>`).join("")}
      </div>` : ""}
    ${textItems.length ? `
      <div class="section-title">Findings (${textItems.length})</div>
      ${textItems.map(f => `
        <div class="finding">
          <div class="finding-title">🔍 ${f.finding ?? f.title}</div>
          ${f.recommendation ? `<div class="finding-rec">💡 ${f.recommendation}</div>` : ""}
        </div>`).join("")}` : ""}
    <div class="footer">
      <span>VM-Studio · Visual Merchandising Operations</span>
      <span>${branch} · ${date}</span>
    </div>
    </body></html>`;
    printHTML(html);
  };

  return (
    <div style={{
      position:"fixed", inset:0, background:"#00000077", zIndex:600,
      display:"flex", alignItems:"flex-start", justifyContent:"center",
      overflowY:"auto", padding:"20px 16px",
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        background:"var(--clr-surface)", borderRadius:20, width:"100%", maxWidth:700,
        border:`1px solid ${C.accentColor}22`, overflow:"hidden",
      }}>
        {/* Header */}
        <div style={{
          background:`linear-gradient(135deg,${C.accentColor}22,transparent)`,
          padding:"24px 24px 20px", borderBottom:`1px solid ${C.accentColor}14`,
        }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
            <div>
              <div style={{ fontSize:10, fontWeight:700, color:C.accentColor,
                letterSpacing:2, textTransform:"uppercase", marginBottom:6 }}>{type}</div>
              <div style={{ ...S.dFont, fontSize:22, fontWeight:700, marginBottom:6 }}>{title}</div>
              <div style={{ ...S.muted, fontSize:12 }}>
                📍 {branch} · {date} · By {by}
              </div>
            </div>
            <div style={{ display:"flex", gap:8 }}>
              <button className="btnP" style={{ ...S.btnP, fontSize:12, padding:"7px 14px" }}
                onClick={handlePrint}>🖨️ Print</button>
              <button onClick={onClose} style={{ background:"none", border:"none",
                color:C.mutedColor, cursor:"pointer", fontSize:22, lineHeight:1 }}>✕</button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding:"20px 24px" }}>
          {/* Notes */}
          {notes && (
            <div style={{ padding:"12px 16px", background:C.surfaceHigh,
              borderLeft:`4px solid ${C.accentColor}`, borderRadius:"0 8px 8px 0",
              fontSize:13, lineHeight:1.6, marginBottom:20 }}>
              {notes}
            </div>
          )}

          {/* Photos */}
          {photoItems.length > 0 && (
            <div style={{ marginBottom:20 }}>
              <div style={S.h3}>Photos ({photoItems.length})</div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                {photoItems.map((p, i) => (
                  <div key={i} style={{ border:`1px solid ${C.accentColor}14`,
                    borderRadius:10, overflow:"hidden" }}>
                    <img src={p.image_url ?? p.url} alt=""
                      style={{ width:"100%", height:160, objectFit:"cover", display:"block" }}/>
                    <div style={{ padding:"8px 12px", fontSize:12,
                      background:C.surfaceHigh, color:C.mutedColor }}>
                      {p.recommendation || p.comment || "—"}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Findings */}
          {textItems.length > 0 && (
            <div>
              <div style={S.h3}>Findings ({textItems.length})</div>
              {textItems.map((f, i) => (
                <div key={i} style={{ padding:"12px 0",
                  borderBottom:`1px solid ${C.accentColor}0a` }}>
                  <div style={{ fontSize:13, fontWeight:600 }}>🔍 {f.finding ?? f.title}</div>
                  {f.recommendation && (
                    <div style={{ ...S.muted, fontSize:12, marginTop:4 }}>
                      💡 {f.recommendation}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {!notes && !photoItems.length && !textItems.length && (
            <div style={{ ...S.muted, textAlign:"center", padding:30 }}>No content in this report.</div>
          )}
        </div>
      </div>
    </div>
  );
}