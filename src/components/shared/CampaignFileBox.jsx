import { useRef, useState } from "react";
import { S, C } from "../../styles/theme.js";
import { supabase } from "../../lib/supabase.js";
import { uploadCampaignFile } from "../../services/enterprise.service.js";

// Shows the campaign's attached PPT/PDF. VM Controller can upload/replace it.
export function CampaignFileBox({ campaign, canUpload = false, uploaderId, onUploaded }) {
  const [uploading, setUploading] = useState(false);
  const ref = useRef();

  if (!campaign?.id) return null;

  const fileUrl = campaign.file_path
    ? supabase.storage.from("vm-guidelines").getPublicUrl(campaign.file_path).data.publicUrl
    : null;

  const pick = () => ref.current?.click();

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    try { onUploaded?.(await uploadCampaignFile(campaign.id, uploaderId, file)); }
    finally { setUploading(false); }
  };

  return (
    <div style={{ marginTop:12, paddingTop:12, borderTop:`1px solid ${C.accentColor}14` }}>
      <div style={{ ...S.h3, marginBottom:8 }}>Campaign File</div>
      {fileUrl ? (
        <a href={fileUrl} target="_blank" rel="noopener noreferrer" style={{
          display:"flex", alignItems:"center", gap:10, padding:"10px 14px",
          background:C.surfaceHigh, borderRadius:10, textDecoration:"none", color:C.textColor }}>
          <span style={{ fontSize:20 }}>{campaign.file_type === "pdf" ? "📄" : "📊"}</span>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:13, fontWeight:600 }}>{campaign.file_type === "pdf" ? "PDF" : "PowerPoint"} attachment</div>
            {campaign.uploader?.full_name && (
              <div style={{ fontSize:11, color:C.mutedColor }}>Uploaded by {campaign.uploader.full_name}</div>
            )}
          </div>
          <span style={{ fontSize:12, color:C.accentColor, fontWeight:700 }}>Open →</span>
        </a>
      ) : (
        <div style={{ ...S.muted, fontSize:12 }}>No file attached yet.</div>
      )}
      {canUpload && (
        <>
          <button className="btnG" style={{ ...S.btnG, fontSize:12, marginTop:8 }} onClick={pick} disabled={uploading}>
            {uploading ? "Uploading…" : fileUrl ? "🔄 Replace File" : "＋ Upload PDF / PPT"}
          </button>
          <input ref={ref} type="file" accept=".pdf,.ppt,.pptx" style={{ display:"none" }} onChange={handleFile} />
        </>
      )}
    </div>
  );
}
