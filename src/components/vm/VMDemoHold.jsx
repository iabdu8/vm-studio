import { useState } from "react";
import { S, C } from "../../styles/theme.js";

// ============================================================
//  DEMO HOLD — VM adds items, prints report when ready
// ============================================================

export function VMDemoHold({ demoHolds, onAddDemoHold, onDeleteDemoHold, company, profile }) {
  const [itemCode, setItemCode] = useState("");
  const [location, setLocation] = useState("");
  const [note,     setNote]     = useState("");
  const [saving,   setSaving]   = useState(false);
  const [added,    setAdded]    = useState(false);

  const handleAdd = async () => {
    if (!itemCode.trim()) return;
    setSaving(true);
    await onAddDemoHold({
      item_code: itemCode.trim(),
      note:      [location.trim(), note.trim()].filter(Boolean).join(" · "),
    });
    setItemCode(""); setLocation(""); setNote("");
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
    setSaving(false);
  };

  const printReport = () => {
    const branch    = profile?.branch?.name ?? "";
    const staffName = profile?.full_name ?? "";
    const date      = new Date().toLocaleDateString("en-GB", { day:"numeric", month:"long", year:"numeric" });
    const time      = new Date().toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" });
    const accent    = company?.accent_color ?? "#c8a96e";
    const logo      = company?.logo_url ?? "";

    const rows = demoHolds.map((d, i) => `
      <tr style="background:${i%2===0?"#fff":"#f9f9f9"}">
        <td style="padding:10px 14px;border-bottom:1px solid #eee;font-weight:600">${i+1}</td>
        <td style="padding:10px 14px;border-bottom:1px solid #eee;font-weight:700;color:${accent}">${d.item_code}</td>
        <td style="padding:10px 14px;border-bottom:1px solid #eee">${d.note ?? "—"}</td>
        <td style="padding:10px 14px;border-bottom:1px solid #eee;color:#888;font-size:12px">${d.time ?? ""}</td>
      </tr>
    `).join("");

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<style>
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700&display=swap');
  * { box-sizing:border-box; margin:0; padding:0; }
  body { font-family:'DM Sans',sans-serif; color:#1a1a2e; padding:32px; background:#fff; }
  .header { display:flex; justify-content:space-between; align-items:flex-start;
    padding-bottom:20px; border-bottom:3px solid ${accent}; margin-bottom:28px; }
  .logo { height:44px; object-fit:contain; }
  .logo-text { font-size:24px; font-weight:700; color:${accent}; font-family:serif; }
  .report-title { font-size:11px; font-weight:700; color:${accent}; letter-spacing:2px;
    text-transform:uppercase; text-align:right; }
  .report-meta { font-size:12px; color:#6b6880; margin-top:4px; text-align:right; }
  .info-row { display:flex; gap:32px; margin-bottom:24px; }
  .info-item { }
  .info-label { font-size:10px; font-weight:700; color:#9ca3af; letter-spacing:1px;
    text-transform:uppercase; margin-bottom:3px; }
  .info-value { font-size:14px; font-weight:600; color:#1a1a2e; }
  table { width:100%; border-collapse:collapse; }
  th { background:${accent}; color:#fff; padding:10px 14px; text-align:left;
    font-size:11px; font-weight:700; letter-spacing:.5px; text-transform:uppercase; }
  .count-badge { display:inline-block; background:${accent}22; color:${accent};
    padding:4px 12px; border-radius:20px; font-size:13px; font-weight:700; margin-bottom:16px; }
  .footer { margin-top:32px; padding-top:16px; border-top:1px solid #e5e7eb;
    display:flex; justify-content:space-between; font-size:11px; color:#9ca3af; }
  @media print { body { padding:20px; } }
</style>
</head>
<body>

<div class="header">
  <div>
    ${logo ? `<img src="${logo}" class="logo" alt="${company?.name}"/>` : `<div class="logo-text">${company?.name ?? "Vismo"}</div>`}
    <div style="font-size:13px;color:#6b6880;margin-top:6px">${company?.name ?? ""}</div>
  </div>
  <div>
    <div class="report-title">Demo Hold Report</div>
    <div class="report-meta">${date} · ${time}</div>
  </div>
</div>

<div class="info-row">
  <div class="info-item">
    <div class="info-label">Branch</div>
    <div class="info-value">${branch || "—"}</div>
  </div>
  <div class="info-item">
    <div class="info-label">Prepared by</div>
    <div class="info-value">${staffName}</div>
  </div>
  <div class="info-item">
    <div class="info-label">Total Items</div>
    <div class="info-value">${demoHolds.length}</div>
  </div>
</div>

<div class="count-badge">${demoHolds.length} item(s) on demo hold</div>

<table>
  <thead>
    <tr>
      <th style="width:40px">#</th>
      <th>Item / SKU Code</th>
      <th>Location · Notes</th>
      <th style="width:80px">Time</th>
    </tr>
  </thead>
  <tbody>${rows}</tbody>
</table>

<div class="footer">
  <span>Vismo · Visual Merchandising Operations</span>
  <span>${company?.name ?? ""} · ${branch}</span>
</div>

<script>window.onload = () => { window.print(); window.onafterprint = () => window.close(); }</script>
</body>
</html>`;

    const win = window.open("", "_blank", "width=900,height=700");
    win.document.write(html);
    win.document.close();
  };

  return (
    <div>
      <div style={{ ...S.h1, marginBottom:2 }} className="fu">
        Demo <span style={S.accent}>Hold</span>
      </div>
      <div style={{ ...S.muted, marginBottom:16, fontSize:12 }}>
        {profile?.branch?.name ?? ""} · Add items currently on display
      </div>

      {/* Add form */}
      <div style={S.card}>
        <div style={S.h3}>Add Item</div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
          <div>
            <div style={S.lbl}>Item / SKU Code *</div>
            <input style={S.inp} placeholder="e.g. 123456"
              value={itemCode}
              onChange={e => setItemCode(e.target.value)}
              onKeyDown={e => e.key==="Enter" && handleAdd()} />
          </div>
          <div>
            <div style={S.lbl}>Location</div>
            <input style={S.inp} placeholder="e.g. Window Display A"
              value={location}
              onChange={e => setLocation(e.target.value)} />
          </div>
        </div>
        <div style={S.lbl}>Notes (optional)</div>
        <input style={S.inp} placeholder="e.g. Mannequin outfit"
          value={note}
          onChange={e => setNote(e.target.value)}
          onKeyDown={e => e.key==="Enter" && handleAdd()} />

        {added && <div style={{ color:"#4ade80", fontSize:12, marginBottom:8 }}>✓ Added!</div>}
        <button className="btnP" style={{ ...S.btnP, width:"100%" }}
          onClick={handleAdd} disabled={saving}>
          {saving ? "Adding…" : "＋ Add to Hold"}
        </button>
      </div>

      {/* List */}
      {demoHolds.length > 0 && (
        <div style={S.card}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
            <div style={S.h3}>On Hold ({demoHolds.length} items)</div>
            <button className="btnP" style={{ ...S.btnP, fontSize:12, padding:"7px 14px" }}
              onClick={printReport}>
              🖨️ Print Report
            </button>
          </div>

          {demoHolds.map((d, i) => (
            <div key={d.id ?? i} style={{
              display:"flex", alignItems:"center", gap:12,
              padding:"10px 0", borderBottom:`1px solid ${C.accentColor}0a`,
            }}>
              <div style={{ ...S.dFont, fontSize:18, fontWeight:700, color:C.accentColor,
                width:28, flexShrink:0, textAlign:"center" }}>{i+1}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:14, fontWeight:700 }}>{d.item_code}</div>
                {d.note && <div style={{ ...S.muted, fontSize:12, marginTop:2 }}>{d.note}</div>}
              </div>
              <div style={{ ...S.muted, fontSize:11, flexShrink:0 }}>{d.time ?? ""}</div>
              {onDeleteDemoHold && (
                <button onClick={() => onDeleteDemoHold(d.id)}
                  style={{ background:"none", border:"none", color:C.mutedColor,
                    cursor:"pointer", fontSize:14, flexShrink:0 }}>✕</button>
              )}
            </div>
          ))}

          <button className="btnG" style={{ ...S.btnG, width:"100%", marginTop:12, fontSize:12 }}
            onClick={printReport}>
            🖨️ Print Demo Hold Report
          </button>
        </div>
      )}

      {demoHolds.length === 0 && (
        <div style={{ ...S.muted, textAlign:"center", padding:30 }}>
          No items on hold yet.
        </div>
      )}
    </div>
  );
}