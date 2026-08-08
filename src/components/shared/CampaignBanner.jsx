import { S, C } from "../../styles/theme.js";

// Compact read-only "Current Campaign" summary — shown on every role's
// home/overview page so everyone sees what's active, not just the Campaign tab.
export function CampaignBanner({ campaign }) {
  if (!campaign?.name) return null;
  return (
    <div style={{ ...S.card, border:`1px solid ${C.accentColor}33`, marginBottom:16 }} className="fu2">
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div>
          <div style={S.h3}>📣 Current Campaign</div>
          <div style={{ ...S.dFont, fontSize:20, fontWeight:700, color:C.accentColor }}>
            {campaign.name}
          </div>
          {(campaign.date_from || campaign.date_to) && (
            <div style={{ ...S.muted, fontSize:12, marginTop:3 }}>
              {campaign.date_from} {campaign.date_from && campaign.date_to ? "→" : ""} {campaign.date_to}
            </div>
          )}
        </div>
        <div style={{ fontSize:28, opacity:.3 }}>◈</div>
      </div>
    </div>
  );
}
