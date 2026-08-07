import { useState, useEffect } from "react";
import { S, C } from "../../styles/theme.js";
import { getBestBranchesOfMonth } from "../../services/enterprise.service.js";

// Read-only "Best Branch of the Month" — visible to every role. Head VM sets
// it (per region) from Overview; everyone else just sees the announcement.
export function BestBranchOfMonth({ company }) {
  const [picks,   setPicks]   = useState([]);
  const [loading, setLoading] = useState(true);
  const monthKey = new Date().toISOString().slice(0, 7);

  useEffect(() => {
    if (!company?.id) return;
    getBestBranchesOfMonth(company.id, monthKey)
      .then(setPicks)
      .finally(() => setLoading(false));
  }, [company?.id, monthKey]);

  const withPick = picks.filter(p => p.branch?.name);
  if (loading || withPick.length === 0) return null;

  return (
    <div style={{ ...S.card, background:`linear-gradient(135deg,${C.accentColor}22,transparent)`,
      border:`1px solid ${C.accentColor}44`, marginBottom:16 }} className="fu2">
      <div style={{ fontSize:10, fontWeight:700, color:C.accentColor, letterSpacing:1, textTransform:"uppercase", marginBottom:8 }}>
        🏆 Best Branch — {new Date().toLocaleDateString("en-GB",{month:"long",year:"numeric"})}
      </div>
      {withPick.map(p => (
        <div key={p.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
          padding:"6px 0", borderBottom: `1px solid ${C.accentColor}0a` }}>
          <div>
            <div style={{ fontSize:15, fontWeight:700 }}>{p.branch.name}</div>
            {p.note && <div style={{ ...S.muted, fontSize:11, marginTop:1 }}>{p.note}</div>}
          </div>
          {p.region && (
            <span style={{ fontSize:11, fontWeight:600, color:C.mutedColor }}>{p.region}</span>
          )}
        </div>
      ))}
    </div>
  );
}
