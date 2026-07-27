import { S, C } from "../../styles/theme.js";
import { supabase } from "../../lib/supabase.js";

// Lists every branch's uploaded campaign PPT/PDF — own branch first, so
// staff can also browse other branches' execution for ideas.
export function CampaignBranchFiles({ campaignProgress = [], myBranchId }) {
  const withFiles = campaignProgress.filter(b => b.file_path);

  if (!withFiles.length) {
    return <div style={{ ...S.muted, textAlign:"center", padding:20, fontSize:12 }}>No campaign files uploaded yet.</div>;
  }

  const sorted = [...withFiles].sort((a, b) =>
    (a.branch_id === myBranchId ? -1 : 0) - (b.branch_id === myBranchId ? -1 : 0)
  );

  return (
    <div>
      {sorted.map(b => {
        const url = supabase.storage.from("vm-guidelines").getPublicUrl(b.file_path).data.publicUrl;
        const mine = b.branch_id === myBranchId;
        return (
          <a key={b.branch_id} href={url} target="_blank" rel="noopener noreferrer" style={{
            display:"flex", alignItems:"center", gap:10, padding:"10px 14px", marginBottom:8,
            background: mine ? C.accentColor+"14" : C.surfaceHigh, borderRadius:10,
            textDecoration:"none", color:C.textColor,
            border: mine ? `1px solid ${C.accentColor}44` : "1px solid transparent",
          }}>
            <span style={{ fontSize:20 }}>{b.file_type === "pdf" ? "📄" : "📊"}</span>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13, fontWeight:700 }}>
                {b.branch?.name ?? "—"}{mine && <span style={{ color:C.accentColor }}> · Your Branch</span>}
              </div>
              {b.uploader?.full_name && (
                <div style={{ fontSize:11, color:C.mutedColor }}>Uploaded by {b.uploader.full_name}</div>
              )}
            </div>
            <span style={{ fontSize:12, color:C.accentColor, fontWeight:700 }}>Open →</span>
          </a>
        );
      })}
    </div>
  );
}
