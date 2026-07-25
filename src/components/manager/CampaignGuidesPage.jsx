import { S } from "../../styles/theme.js";
import { CampaignPanel } from "./CampaignPanel.jsx";
import { GuidelinesManager } from "../shared/GuidelinesManager.jsx";

export function CampaignGuidesPage({ company, guidelines, onUploadGuideline, onDeleteGuideline,
  campaign, onSaveCampaign, campaignProgress, onSetBranchStatus, campaignAck, onAcknowledgeCampaign }) {
  return (
    <div>
      <div style={{ ...S.h1, marginBottom:2 }} className="fu">
        Campaign <span style={S.accent}>&amp; Guides</span>
      </div>
      <div style={{ ...S.muted, marginBottom:16, fontSize:12 }}>
        Sign off on the active campaign · publish team guidelines
      </div>

      <CampaignPanel campaign={campaign} onSaveCampaign={onSaveCampaign} campaignProgress={campaignProgress}
        onSetBranchStatus={onSetBranchStatus} campaignAck={campaignAck} onAcknowledgeCampaign={onAcknowledgeCampaign} />

      <div style={{ ...S.h3, marginTop:20, marginBottom:10 }}>Guidelines</div>
      <GuidelinesManager company={company} guidelines={guidelines}
        onUploadGuideline={onUploadGuideline} onDeleteGuideline={onDeleteGuideline} />
    </div>
  );
}
