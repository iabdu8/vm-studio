import { useState, useEffect } from "react";
import { S, C } from "../../styles/theme.js";
import { supabase } from "../../lib/supabase.js";
import { ReportView } from "../shared/ReportView.jsx";
import { InfoBanner } from "../shared/InfoBanner.jsx";
import { printFloorWalkChecklist } from "../../lib/checklistReports.js";
import { ChecklistCard, ChecklistTable, StatusPill } from "../shared/ChecklistCard.jsx";

export function VMVisits({ profile, floorWalks = [], company }) {
  const [visits,  setVisits]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeReport, setActiveReport] = useState(null);
  const [tab, setTab] = useState("visits");

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

  const openVisitReport = (v) => {
    setActiveReport({
      type: "Store Visit Report",
      title: `Visit — ${branchName}`,
      branch: branchName,
      date: v.visit_date,
      by: v.visitor?.full_name ?? "—",
      notes: v.notes,
      photos: (v.findings ?? []).filter(f => f.finding === "Photo" && f.image_url),
      findings: (v.findings ?? []).filter(f => f.finding !== "Photo"),
    });
  };

  const openFloorWalkReport = (fw) => {
    setActiveReport({
      type: "Floor Walk Report",
      title: `Floor Walk — ${branchName}`,
      branch: branchName,
      date: fw.date ?? "",
      by: fw.manager ?? "—",
      notes: fw.note,
      photos: (fw.photos ?? []).map(p => ({
        image_url: p.url ?? p,
        recommendation: p.comment ?? "",
      })),
      findings: [],
    });
  };

  if (loading) return <div style={{ ...S.muted, textAlign:"center", padding:40 }}>Loading…</div>;

  return (
    <div>
      {activeReport && <ReportView report={activeReport} onClose={() => setActiveReport(null)}/>}

      <div style={{ ...S.h1, marginBottom:2 }} className="fu">
        Visits <span style={S.accent}>&amp; Floor Walks</span>
      </div>
      <div style={{ ...S.muted, marginBottom:16, fontSize:12 }}>{branchName}</div>

      <InfoBanner>Read-only reports from your VM Manager (Store Visits) and Head VM (Floor Walks) — tap any card to see photos and notes.</InfoBanner>

      {/* Tabs */}
      <div style={{ display:"flex", gap:6, marginBottom:14 }}>
        {[["visits","🚶 Store Visits"],["floor","📋 Floor Walks"]].map(([k,l]) => (
          <button key={k} className="tab-btn" style={S.tab(tab===k)} onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>

      {/* Store Visits */}
      {tab === "visits" && (
        <>
          {visits.length === 0 && (
            <div style={{ ...S.card, textAlign:"center", padding:"32px 20px" }}>
              <div style={{ fontSize:32, marginBottom:12 }}>🚶</div>
              <div style={{ ...S.muted }}>No visits recorded for your branch yet.</div>
            </div>
          )}
          {visits.map(v => {
            const photoCount   = (v.findings ?? []).filter(f => f.finding === "Photo").length;
            const findingCount = (v.findings ?? []).filter(f => f.finding !== "Photo").length;
            return (
              <div key={v.id} style={{ ...S.card, cursor:"pointer" }} onClick={() => openVisitReport(v)}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                  <div>
                    <div style={{ fontWeight:700, fontSize:14 }}>
                      Visit by {v.visitor?.full_name ?? "—"}
                    </div>
                    <div style={{ ...S.muted, fontSize:12, marginTop:2 }}>{v.visit_date}</div>
                    <div style={{ display:"flex", gap:10, marginTop:6 }}>
                      {photoCount > 0 && <span style={{ fontSize:11, color:C.accentColor }}>📷 {photoCount} photos</span>}
                      {findingCount > 0 && <span style={{ fontSize:11, color:C.mutedColor }}>🔍 {findingCount} observations</span>}
                    </div>
                  </div>
                  <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:6 }}>
                    <span style={{
                      fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:12,
                      background: v.status==="closed" ? "#4ade8018" : "#d4a82a18",
                      color: v.status==="closed" ? "#4ade80" : "#d4a82a",
                    }}>{v.status}</span>
                    <span style={{ fontSize:11, color:C.accentColor }}>Tap to view →</span>
                  </div>
                </div>
              </div>
            );
          })}
        </>
      )}

      {/* Floor Walks */}
      {tab === "floor" && (
        <>
          {floorWalks.length === 0 && (
            <div style={{ ...S.card, textAlign:"center", padding:"32px 20px" }}>
              <div style={{ fontSize:32, marginBottom:12 }}>📋</div>
              <div style={{ ...S.muted }}>No floor walks published yet.</div>
            </div>
          )}
          {floorWalks.map((fw, i) => {
            const checklist = fw.checklist ?? [];
            const doneCount = checklist.filter(it => it.status === "done").length;
            const extraPoints = (fw.note ?? "").split("\n").map(l => l.trim()).filter(Boolean);
            const photoCount = fw.photos?.length ?? 0;
            const dayName = fw.date ? new Date(fw.date).toLocaleDateString("en-GB", { weekday:"long" }) : "";
            return (
            <ChecklistCard key={i}
              title="📋 Floor Walk" badge={dayName} badgeColor={C.accentColor}
              meta={`By ${fw.manager ?? "—"} · ${fw.date ?? ""}`}
              kpis={[
                { n: `${doneCount}/${checklist.length || 9}`, l:"Checked" },
                { n: photoCount, l:"Photos" },
              ]}
            >
              {checklist.length > 0 && (
                <ChecklistTable columns={["#","Check Point","Status"]}>
                  {checklist.map((it, idx) => (
                    <tr key={idx}>
                      <td style={{ padding:"8px 12px", borderBottom:`1px solid color-mix(in srgb, var(--clr-text) 8%, transparent)` }}>{idx+1}</td>
                      <td style={{ padding:"8px 12px", borderBottom:`1px solid color-mix(in srgb, var(--clr-text) 8%, transparent)` }}>{it.label}</td>
                      <td style={{ padding:"8px 12px", borderBottom:`1px solid color-mix(in srgb, var(--clr-text) 8%, transparent)` }}><StatusPill status={it.status}/></td>
                    </tr>
                  ))}
                </ChecklistTable>
              )}
              {extraPoints.length > 0 && (
                <div style={{ marginTop:10, fontSize:12, color:C.mutedColor, lineHeight:1.6 }}>
                  <strong style={{ color:C.textColor }}>Notes:</strong> {extraPoints.join(" · ")}
                </div>
              )}
              <div style={{ display:"flex", gap:14, marginTop:12 }}>
                <button onClick={() => openFloorWalkReport(fw)}
                  style={{ background:"none", border:"none", color:C.accentColor, cursor:"pointer", fontSize:11, fontWeight:600, padding:0 }}>
                  📷 View Photos
                </button>
                <button onClick={() => printFloorWalkChecklist(fw, company)}
                  style={{ background:"none", border:"none", color:C.accentColor, cursor:"pointer",
                    fontSize:11, fontWeight:600, padding:0 }}>
                  🖨️ Print Checklist
                </button>
              </div>
            </ChecklistCard>
            );
          })}
        </>
      )}
    </div>
  );
}