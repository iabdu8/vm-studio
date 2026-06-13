import { useState, useEffect } from "react";
import { S, C } from "../../styles/theme.js";
import { supabase } from "../../lib/supabase.js";
import { ReportView } from "../shared/ReportView.jsx";

export function VMVisits({ profile }) {
  const [visits,  setVisits]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeReport, setActiveReport] = useState(null);

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

  const openReport = (v) => {
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

  if (loading) return <div style={{ ...S.muted, textAlign:"center", padding:40 }}>Loading…</div>;

  return (
    <div>
      {activeReport && <ReportView report={activeReport} onClose={() => setActiveReport(null)}/>}

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
        const photoCount   = (v.findings ?? []).filter(f => f.finding === "Photo").length;
        const findingCount = (v.findings ?? []).filter(f => f.finding !== "Photo").length;
        return (
          <div key={v.id} style={{ ...S.card, cursor:"pointer" }} onClick={() => openReport(v)}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
              <div>
                <div style={{ fontWeight:700, fontSize:14 }}>
                  Visit by {v.visitor?.full_name ?? "—"}
                </div>
                <div style={{ ...S.muted, fontSize:12, marginTop:2 }}>{v.visit_date}</div>
                <div style={{ display:"flex", gap:10, marginTop:6 }}>
                  {photoCount > 0 && <span style={{ fontSize:11, color:C.accentColor }}>📷 {photoCount} photos</span>}
                  {findingCount > 0 && <span style={{ fontSize:11, color:C.mutedColor }}>🔍 {findingCount} findings</span>}
                  {v.notes && <span style={{ fontSize:11, color:C.mutedColor }}>📝 Has notes</span>}
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
    </div>
  );
}