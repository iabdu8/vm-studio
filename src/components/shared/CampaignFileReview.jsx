import { useState } from "react";
import { S, C } from "../../styles/theme.js";
import { supabase } from "../../lib/supabase.js";

const STATUS_META = {
  pending:           { label:"Awaiting Review", color:"#d4a82a" },
  approved:          { label:"Approved",        color:"#4ade80" },
  changes_requested: { label:"Changes Requested", color:"#f87171" },
};

// Head VM / VM Manager: approve or request changes on each branch's
// uploaded campaign file (PPT/PDF).
export function CampaignFileReview({ campaignProgress = [], onReview }) {
  const [noteFor, setNoteFor] = useState(null); // branch_id currently writing a "changes requested" note
  const [note,    setNote]    = useState("");
  const [saving,  setSaving]  = useState(null);

  const withFiles = campaignProgress.filter(b => b.file_path);
  if (!withFiles.length) {
    return <div style={{ ...S.muted, textAlign:"center", padding:20, fontSize:12 }}>No campaign files uploaded yet.</div>;
  }

  const approve = async (branch_id) => {
    setSaving(branch_id);
    try { await onReview(branch_id, "approved", ""); }
    finally { setSaving(null); }
  };

  const requestChanges = async (branch_id) => {
    if (!note.trim()) return;
    setSaving(branch_id);
    try { await onReview(branch_id, "changes_requested", note.trim()); setNoteFor(null); setNote(""); }
    finally { setSaving(null); }
  };

  return (
    <div>
      {withFiles.map(b => {
        const meta = STATUS_META[b.file_status] ?? STATUS_META.pending;
        const url = supabase.storage.from("vm-guidelines").getPublicUrl(b.file_path).data.publicUrl;
        return (
          <div key={b.branch_id} style={{ padding:"12px 0", borderBottom:`1px solid ${C.accentColor}0a` }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:10, marginBottom:8 }}>
              <a href={url} target="_blank" rel="noopener noreferrer" style={{
                display:"flex", alignItems:"center", gap:10, textDecoration:"none", color:C.textColor, flex:1, minWidth:0 }}>
                <span style={{ fontSize:20, flexShrink:0 }}>{b.file_type === "pdf" ? "📄" : "📊"}</span>
                <div style={{ minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight:700 }}>{b.branch?.name ?? "—"}</div>
                  {b.uploader?.full_name && (
                    <div style={{ fontSize:11, color:C.mutedColor }}>Uploaded by {b.uploader.full_name}</div>
                  )}
                </div>
              </a>
              <span style={{ padding:"3px 10px", borderRadius:12, fontSize:11, fontWeight:700, flexShrink:0,
                background:meta.color+"1c", color:meta.color, border:`1px solid ${meta.color}44` }}>
                {meta.label}
              </span>
            </div>

            {b.file_review_note && b.file_status === "changes_requested" && (
              <div style={{ fontSize:12, marginBottom:8, padding:"8px 10px", borderRadius:8,
                background:"#f8717114", border:"1px solid #f8717133" }}>
                💬 {b.file_review_note}
                {b.reviewer?.full_name && <span style={{ color:C.mutedColor }}> — {b.reviewer.full_name}</span>}
              </div>
            )}
            {b.file_status === "approved" && b.reviewer?.full_name && (
              <div style={{ fontSize:11, color:"#4ade80", marginBottom:8 }}>✓ Approved by {b.reviewer.full_name}</div>
            )}

            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              <button className="btnP" style={{ ...S.btnP, fontSize:12, padding:"6px 14px" }}
                onClick={() => approve(b.branch_id)} disabled={saving === b.branch_id}>
                {saving === b.branch_id ? "…" : "✓ Approve"}
              </button>
              <button className="btnG" style={{ ...S.btnG, fontSize:12, padding:"6px 14px", color:"#f87171", borderColor:"#f8717133" }}
                onClick={() => { setNoteFor(noteFor === b.branch_id ? null : b.branch_id); setNote(""); }}>
                ↩ Request Changes
              </button>
            </div>

            {noteFor === b.branch_id && (
              <div style={{ marginTop:8 }}>
                <textarea style={{ ...S.inp, minHeight:64, resize:"vertical", marginBottom:6 }}
                  placeholder="What needs to change?" value={note} onChange={e => setNote(e.target.value)} autoFocus/>
                <button className="btnP" style={{ ...S.btnP, background:"#f87171", color:"#fff", fontSize:12, padding:"7px 16px" }}
                  onClick={() => requestChanges(b.branch_id)} disabled={saving === b.branch_id || !note.trim()}>
                  {saving === b.branch_id ? "Sending…" : "Send →"}
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
