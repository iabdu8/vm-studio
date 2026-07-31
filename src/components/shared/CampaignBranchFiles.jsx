import { useState } from "react";
import { S, C } from "../../styles/theme.js";
import { supabase } from "../../lib/supabase.js";
import { FilePreview } from "./FilePreview.jsx";

// Lists every branch's uploaded campaign PPT/PDF — own branch first, so
// staff can also browse other branches' execution for ideas.
export function CampaignBranchFiles({ campaignProgress = [], myBranchId }) {
  const [preview, setPreview] = useState(null);
  const withFiles = campaignProgress.filter(b => b.file_path);

  if (!withFiles.length) {
    return <div style={{ ...S.muted, textAlign:"center", padding:20, fontSize:12 }}>No campaign files uploaded yet.</div>;
  }

  const sorted = [...withFiles].sort((a, b) =>
    (a.branch_id === myBranchId ? -1 : 0) - (b.branch_id === myBranchId ? -1 : 0)
  );

  return (
    <>
      {preview && <FilePreview url={preview.url} title={preview.title} fileType={preview.fileType} onClose={() => setPreview(null)}/>}
      <div>
        {sorted.map(b => {
          const url = supabase.storage.from("vm-guidelines").getPublicUrl(b.file_path).data.publicUrl;
          const mine = b.branch_id === myBranchId;
          return (
            <button key={b.branch_id}
              onClick={() => setPreview({ url, title: b.branch?.name ?? "Campaign File", fileType: b.file_type })}
              style={{
                display:"flex", alignItems:"center", gap:10, padding:"10px 14px", marginBottom:8, width:"100%",
                background: mine ? C.accentColor+"14" : C.surfaceHigh, borderRadius:10,
                border: mine ? `1px solid ${C.accentColor}44` : "1px solid transparent",
                cursor:"pointer", textAlign:"left", fontFamily:"'DM Sans',sans-serif",
              }}>
              <span style={{ fontSize:20 }}>{b.file_type === "pdf" ? "📄" : "📊"}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:700, color:C.textColor }}>
                  {b.branch?.name ?? "—"}{mine && <span style={{ color:C.accentColor }}> · Your Branch</span>}
                </div>
                {b.uploader?.full_name && (
                  <div style={{ fontSize:11, color:C.mutedColor }}>Uploaded by {b.uploader.full_name}</div>
                )}
              </div>
              <span style={{ fontSize:12, color:C.accentColor, fontWeight:700 }}>👁️ Preview</span>
            </button>
          );
        })}
      </div>
    </>
  );
}
