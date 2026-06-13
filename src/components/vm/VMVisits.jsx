import { useState, useEffect } from "react";
import { S, C } from "../../styles/theme.js";
import { supabase } from "../../lib/supabase.js";
import { printHTML } from "../../lib/printReport.js";

export function VMVisits({ profile }) {
  const [visits,  setVisits]  = useState([]);
  const [loading, setLoading] = useState(true);

  const branchId   = profile?.branch_id ?? null;
  const branchName = profile?.branch?.name ?? "";

  useEffect(() => {
    if (!branchId || !profile?.company_id) { setLoading(false); return; }
    supabase
      .from("store_visits")
      .select("*, visitor:visitor_id(full_name), findings:visit_findings(*)")
      .eq("company_id", profile.company_id)
      .eq("branch_id", branchId)
      .order("visit_date", { ascending: false })
      .limit(10)
      .then(({ data }) => { setVisits(data ?? []); setLoading(false); });
  }, [branchId]);

  const printVisit = (v) => {
    const photoFindings = (v.findings ?? []).filter(f => f.finding === "Photo" && f.image_url);
    const textFindings  = (v.findings ?? []).filter(f => f.finding !== "Photo");
    const html = `<!DOCTYPE html><html><head>
    <style>
      body { font-family:'DM Sans',sans-serif; padding:32px; color:#1a1a2e; }
      h1 { font-size:24px; color:#c8a96e; margin-bottom:4px; }
      .meta { color:#9ca3af; font-size:13px; margin-bottom:20px; }
      .note { background:#f9f9f9; border-left:4px solid #c8a96e; padding:12px 16px;
        margin-bottom:24px; border-radius:0 8px 8px 0; font-size:14px; }
      .photo-block { page-break-inside:avoid; margin-bottom:20px;
        border:1px solid #e5e7eb; border-radius:8px; overflow:hidden; }
      .photo-block img { width:100%; max-height:280px; object-fit:cover; display:block; }
      .caption { padding:10px 14px; font-size:13px; }
      .finding { padding:10px 0; border-bottom:1px solid #e5e7eb; }
      h2 { font-size:16px; margin:24px 0 12px; }
      @media print { body { padding:16px; } }
    </style></head><body>
    <h1>Store Visit Report</h1>
    <div class="meta">📍 ${branchName} · ${v.visit_date} · By ${v.visitor?.full_name ?? "—"}</div>
    ${v.notes ? `<div class="note">${v.notes}</div>` : ""}
    ${photoFindings.length ? `<h2>Photos</h2>` + photoFindings.map(f => `
      <div class="photo-block">
        <img src="${f.image_url}"/>
        <div class="caption">${f.recommendation || "—"}</div>
      </div>`).join("") : ""}
    ${textFindings.length ? `<h2>Findings</h2>` + textFindings.map(f => `
      <div class="finding">
        <strong>🔍 ${f.finding}</strong>
        ${f.recommendation ? `<div style="color:#6b6880;margin-top:4px">💡 ${f.recommendation}</div>` : ""}
      </div>`).join("") : ""}
    </body></html>`;
    printHTML(html);
  };

  if (loading) return <div style={{ ...S.muted, textAlign:"center", padding:40 }}>Loading…</div>;

  return (
    <div>
      <div style={{ ...S.h1, marginBottom:2 }} className="fu">
        Store <span style={S.accent}>Visits</span>
      </div>
      <div style={{ ...S.muted, marginBottom:16, fontSize:12 }}>
        {branchName} · Recent visits & findings
      </div>

      {visits.length === 0 && (
        <div style={{ ...S.card, textAlign:"center", padding:"32px 20px" }}>
          <div style={{ fontSize:32, marginBottom:12 }}>🚶</div>
          <div style={{ ...S.muted }}>No visits recorded for your branch yet.</div>
        </div>
      )}

      {visits.map(v => {
        const photoFindings = (v.findings ?? []).filter(f => f.finding === "Photo" && f.image_url);
        const textFindings  = (v.findings ?? []).filter(f => f.finding !== "Photo");
        return (
          <div key={v.id} style={S.card}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:10 }}>
              <div>
                <div style={{ fontWeight:700, fontSize:14 }}>
                  Visit by {v.visitor?.full_name ?? "—"}
                </div>
                <div style={{ ...S.muted, fontSize:12, marginTop:2 }}>{v.visit_date}</div>
              </div>
              <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                <span style={{
                  fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:12,
                  background: v.status==="closed" ? "#4ade8018" : "#d4a82a18",
                  color: v.status==="closed" ? "#4ade80" : "#d4a82a",
                }}>{v.status}</span>
                <button className="btnG" style={{ ...S.btnG, fontSize:11, padding:"4px 10px" }}
                  onClick={() => printVisit(v)}>🖨️ Print</button>
              </div>
            </div>

            {v.notes && (
              <div style={{ fontSize:13, padding:"8px 12px", background:C.surfaceHigh,
                borderRadius:8, marginBottom:10, lineHeight:1.5 }}>
                {v.notes}
              </div>
            )}

            {/* Photos */}
            {photoFindings.length > 0 && (
              <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:10 }}>
                {photoFindings.map((f, i) => (
                  <div key={i} style={{ position:"relative" }}>
                    <img src={f.image_url} alt=""
                      style={{ width:90, height:90, objectFit:"cover", borderRadius:8,
                        border:`1px solid ${C.accentColor}22` }}/>
                    {f.recommendation && (
                      <div style={{ position:"absolute", bottom:0, left:0, right:0,
                        background:"#000b", color:"#fff", fontSize:9, padding:"2px 4px",
                        borderRadius:"0 0 8px 8px", textAlign:"center",
                        overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                        {f.recommendation}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Text findings */}
            {textFindings.length > 0 && (
              <div>
                <div style={S.h3}>Findings</div>
                {textFindings.map((f, i) => (
                  <div key={i} style={{ padding:"7px 0", borderBottom:`1px solid ${C.accentColor}0a` }}>
                    <div style={{ fontSize:13, fontWeight:600 }}>🔍 {f.finding}</div>
                    {f.recommendation && (
                      <div style={{ ...S.muted, fontSize:12, marginTop:2 }}>
                        💡 {f.recommendation}
                      </div>
                    )}
                    {f.task_id && (
                      <div style={{ fontSize:11, color:"#4ade80", marginTop:3 }}>
                        ✓ Converted to task
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}