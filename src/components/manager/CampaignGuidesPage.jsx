import { S } from "../../styles/theme.js";
import { CampaignPanel } from "./CampaignPanel.jsx";
import { CampaignFileReview } from "../shared/CampaignFileReview.jsx";
import { GuidelinesManager } from "../shared/GuidelinesManager.jsx";
import { CommentThread } from "../shared/CommentThread.jsx";

export function CampaignGuidesPage({ company, guidelines, onUploadGuideline, onDeleteGuideline,
  campaign, onSaveCampaign, onDeleteCampaign, campaignProgress, onSetBranchStatus, campaignAck, onAcknowledgeCampaign, onReviewBranchFile, profile }) {
  return (
    <div>
      <div style={{ ...S.h1, marginBottom:2 }} className="fu">
        Campaign <span style={S.accent}>&amp; Guides</span>
      </div>
      <div style={{ ...S.muted, marginBottom:16, fontSize:12 }}>
        Sign off on the active campaign · publish team guidelines
      </div>

      <CampaignPanel campaign={campaign} onSaveCampaign={onSaveCampaign} onDeleteCampaign={onDeleteCampaign} campaignProgress={campaignProgress}
        onSetBranchStatus={onSetBranchStatus} campaignAck={campaignAck} onAcknowledgeCampaign={onAcknowledgeCampaign} />

      {campaign?.name && onReviewBranchFile && (
        <div style={S.card}>
          <div style={{ ...S.h3, marginBottom:6 }}>Campaign Files — Review</div>
          <CampaignFileReview campaignProgress={campaignProgress} onReview={onReviewBranchFile} />
        </div>
      )}

      {campaign?.name && profile && <CommentThread campaignId={campaign.id} profile={profile} />}

      <div style={{ ...S.h3, marginTop:20, marginBottom:10 }}>Guidelines</div>
      <GuidelinesManager company={company} guidelines={guidelines}
        onUploadGuideline={onUploadGuideline} onDeleteGuideline={onDeleteGuideline} />
    </div>
  );
}
