import { useRef, useState } from "react";
import { S, C } from "../../styles/theme.js";
import { supabase } from "../../lib/supabase.js";
import { CampaignPanel } from "./CampaignPanel.jsx";
import { CommentThread } from "../shared/CommentThread.jsx";
import { GuidelinesManager } from "../shared/GuidelinesManager.jsx";

// VM Controller: uploads the campaign file for their own branch, comments,
// and publishes guidelines — no edit/acknowledge power (Head VM's job).
export function StoreManagerCampaignGuides({ campaign, campaignProgress = [], profile, company, guidelines,
  onUploadGuideline, onDeleteGuideline, onUploadBranchFile }) {
  const [uploading, setUploading] = useState(false);
  const ref = useRef();

  const myRow = campaignProgress.find(b => b.branch_id === profile?.branch_id);
  const fileUrl = myRow?.file_path
    ? supabase.storage.from("vm-guidelines").getPublicUrl(myRow.file_path).data.publicUrl
    : null;

  const pick = () => ref.current?.click();
  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !campaign?.id) return;
    setUploading(true);
    try { await onUploadBranchFile(profile.branch_id, file); }
    finally { setUploading(false); }
  };

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
          <CampaignPanel campaign={campaign} campaignProgress={campaignProgress} />

          <div style={S.card}>
            <div style={{ ...S.h3, marginBottom:8 }}>Campaign File — Your Branch</div>
            {fileUrl ? (
              <a href={fileUrl} target="_blank" rel="noopener noreferrer" style={{
                display:"flex", alignItems:"center", gap:10, padding:"10px 14px",
                background:C.surfaceHigh, borderRadius:10, textDecoration:"none", color:C.textColor }}>
                <span style={{ fontSize:20 }}>{myRow?.file_type === "pdf" ? "📄" : "📊"}</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:600 }}>{myRow?.file_type === "pdf" ? "PDF" : "PowerPoint"} attachment</div>
                  {myRow?.uploader?.full_name && (
                    <div style={{ fontSize:11, color:C.mutedColor }}>Uploaded by {myRow.uploader.full_name}</div>
                  )}
                </div>
                <span style={{ fontSize:12, color:C.accentColor, fontWeight:700 }}>Open →</span>
              </a>
            ) : (
              <div style={{ ...S.muted, fontSize:12 }}>No file attached yet.</div>
            )}
            <button className="btnG" style={{ ...S.btnG, fontSize:12, marginTop:8 }} onClick={pick} disabled={uploading}>
              {uploading ? "Uploading…" : fileUrl ? "🔄 Replace File" : "＋ Upload PDF / PPT"}
            </button>
            <input ref={ref} type="file" accept=".pdf,.ppt,.pptx" style={{ display:"none" }} onChange={handleFile} />
          </div>

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
