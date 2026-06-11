import { useState, useEffect } from "react";
import { S, C } from "../../styles/theme.js";
import { supabase } from "../../lib/supabase.js";

// ============================================================
//  VM VISITS VIEW — Shows store visits for VM's branch (read only)
// ============================================================

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

      {visits.map(v => (
        <div key={v.id} style={S.card}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
            <div>
              <div style={{ fontWeight:700, fontSize:14 }}>
                Visit by {v.visitor?.full_name ?? "—"}
              </div>
              <div style={{ ...S.muted, fontSize:12, marginTop:2 }}>{v.visit_date}</div>
            </div>
            <span style={{
              fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:12,
              background: v.status==="closed" ? "#4ade8018" : "#d4a82a18",
              color: v.status==="closed" ? "#4ade80" : "#d4a82a",
            }}>
              {v.status}
            </span>
          </div>

          {v.notes && (
            <div style={{ fontSize:13, padding:"8px 12px", background:C.surfaceHigh,
              borderRadius:8, marginBottom:10, lineHeight:1.5 }}>
              {v.notes}
            </div>
          )}

          {v.findings?.filter(f => f.finding !== "Photo").length > 0 && (
            <div>
              <div style={S.h3}>Findings</div>
              {v.findings.filter(f => f.finding !== "Photo").map((f, i) => (
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
      ))}
    </div>
  );
}