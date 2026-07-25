import { S } from "../../styles/theme.js";
import { CampaignPanel } from "./CampaignPanel.jsx";
import { CommentThread } from "../shared/CommentThread.jsx";
import { GuidelinesManager } from "../shared/GuidelinesManager.jsx";

// VM Controller: uploads the campaign file for the branch, comments,
// and publishes guidelines — no edit/acknowledge power (Head VM's job).
export function StoreManagerCampaignGuides({ campaign, campaignProgress, profile, company, guidelines,
  onUploadGuideline, onDeleteGuideline, onCampaignFileUploaded }) {
  return (
    <div>
      <div style={{ ...S.h1, marginBottom:2 }} className="fu">
        Campaign <span style={S.accent}>&amp; Guides</span>
      </div>
      <div style={{ ...S.muted, marginBottom:16, fontSize:12 }}>
        Upload the campaign file for your branch · publish guidelines
      </div>

      {campaign?.name ? (
        <>
          <CampaignPanel campaign={campaign} campaignProgress={campaignProgress}
            canUploadFile uploaderId={profile?.id} onFileUploaded={onCampaignFileUploaded} />
          {profile && <CommentThread campaignId={campaign.id} profile={profile} />}
        </>
      ) : (
        <div style={{ ...S.card, textAlign:"center", padding:"32px 20px", marginBottom:16 }}>
          <div style={{ ...S.muted }}>No active campaign yet.</div>
        </div>
      )}

      <div style={{ ...S.h3, marginTop:20, marginBottom:10 }}>Guidelines</div>
      <GuidelinesManager company={company} guidelines={guidelines}
        onUploadGuideline={onUploadGuideline} onDeleteGuideline={onDeleteGuideline} />
    </div>
  );
}
