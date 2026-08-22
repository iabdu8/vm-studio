import { useState } from "react";
import { S, C } from "../../styles/theme.js";
import { supabase } from "../../lib/supabase.js";
import { CampaignPanel } from "./CampaignPanel.jsx";
import { CommentThread } from "../shared/CommentThread.jsx";
import { GuidelinesGrid } from "../shared/Guidelines.jsx";
import { FilePreview } from "../shared/FilePreview.jsx";
import { InfoBanner } from "../shared/InfoBanner.jsx";

// VM Controller: view-only, same as VM — no campaign file upload, no
// guideline publishing (Head VM's job). Can still comment.
export function StoreManagerCampaignGuides({ campaign, campaignProgress = [], profile, guidelines, company }) {
  const [preview, setPreview] = useState(false);

  const myRow = campaignProgress.find(b => b.branch_id === profile?.branch_id);
  const fileUrl = myRow?.file_path
    ? supabase.storage.from("vm-guidelines").getPublicUrl(myRow.file_path).data.publicUrl
    : null;

  return (
    <div>
      <div style={{ ...S.h1, marginBottom:2 }} className="fu">
        Campaign <span style={S.accent}>&amp; Guides</span>
      </div>
      <div style={{ ...S.muted, marginBottom:16, fontSize:12 }}>
        Review the current campaign and guidelines
      </div>

      <InfoBanner>Set by Head VM — view + comment only. Your branch's campaign file (if attached) is below, and guidelines are published company-wide.</InfoBanner>

      {campaign?.name ? (
        <>
          <CampaignPanel campaign={campaign} campaignProgress={campaignProgress} company={company} />

          <div style={S.card}>
            <div style={{ ...S.h3, marginBottom:8 }}>Campaign File — Your Branch</div>
            {fileUrl ? (
              <button onClick={() => setPreview(true)} style={{
                display:"flex", alignItems:"center", gap:10, padding:"10px 14px", width:"100%",
                background:C.surfaceHigh, borderRadius:10, border:"none", cursor:"pointer",
                textAlign:"left", color:C.textColor, fontFamily:"'DM Sans',sans-serif" }}>
                <span style={{ fontSize:20 }}>{myRow?.file_type === "pdf" ? "📄" : "📊"}</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:600 }}>{myRow?.file_type === "pdf" ? "PDF" : "PowerPoint"} attachment</div>
                  {myRow?.uploader?.full_name && (
                    <div style={{ fontSize:11, color:C.mutedColor }}>Uploaded by {myRow.uploader.full_name}</div>
                  )}
                </div>
                <span style={{ fontSize:12, color:C.accentColor, fontWeight:700 }}>👁️ Preview</span>
              </button>
            ) : (
              <div style={{ ...S.muted, fontSize:12 }}>No file attached yet.</div>
            )}
          </div>

          {preview && fileUrl && (
            <FilePreview url={fileUrl} title="Campaign File — Your Branch" fileType={myRow?.file_type} onClose={() => setPreview(false)}/>
          )}

          {profile && <CommentThread campaignId={campaign.id} profile={profile} />}
        </>
      ) : (
        <div style={{ ...S.card, textAlign:"center", padding:"32px 20px", marginBottom:16 }}>
          <div style={{ ...S.muted }}>No active campaign yet.</div>
        </div>
      )}

      <div style={{ ...S.h3, marginTop:20, marginBottom:10 }}>Guidelines</div>
      <GuidelinesGrid guidelines={guidelines} />
    </div>
  );
}
