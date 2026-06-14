import { useState, useEffect } from "react";
import { S, C } from "../../styles/theme.js";
import { supabase } from "../../lib/supabase.js";
import { ReportView } from "../shared/ReportView.jsx";

export function VMVisits({ profile, floorWalks = [] }) {
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
                      {findingCount > 0 && <span style={{ fontSize:11, color:C.mutedColor }}>🔍 {findingCount} findings</span>}
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
          {floorWalks.map((fw, i) => (
            <div key={i} style={{ ...S.card, cursor:"pointer" }} onClick={() => openFloorWalkReport(fw)}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                <div>
                  <div style={{ fontWeight:700, fontSize:14 }}>📋 Floor Walk</div>
                  <div style={{ ...S.muted, fontSize:12, marginTop:2 }}>
                    By {fw.manager} · {fw.date ?? ""}
                  </div>
                  {fw.note && (
                    <div style={{ fontSize:13, marginTop:6, color:C.textColor, lineHeight:1.4,
                      maxWidth:240, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                      {fw.note}
                    </div>
                  )}
                  {fw.photos?.length > 0 && (
                    <div style={{ fontSize:11, color:C.accentColor, marginTop:4 }}>
                      📷 {fw.photos.length} photos
                    </div>
                  )}
                </div>
                <span style={{ fontSize:11, color:C.accentColor }}>Tap to view →</span>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}