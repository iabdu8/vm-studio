import { useRef, useState } from "react";
import { S, C } from "../../styles/theme.js";
import { supabase } from "../../lib/supabase.js";
import { uploadCampaignImage } from "../../services/enterprise.service.js";
import { CampaignFileBox } from "../shared/CampaignFileBox.jsx";
import { printCampaignChecklist } from "../../lib/checklistReports.js";

const STATUS_META = {
  not_started: { label: "Not Started", color: "#6b6880" },
  in_progress: { label: "In Progress", color: "#d4a82a" },
  completed:   { label: "Completed",   color: "#4ade80" },
};
const NEXT_STATUS = { not_started: "in_progress", in_progress: "completed", completed: "not_started" };

function getDaysLeft(dateTo) {
  if (!dateTo) return null;
  const today = new Date().toISOString().slice(0, 10);
  return Math.round((new Date(dateTo) - new Date(today)) / 86400000);
}

function getTimeProgress(dateFrom, dateTo) {
  if (!dateFrom || !dateTo) return null;
  const today = Date.now();
  const from = new Date(dateFrom).getTime();
  const to = new Date(dateTo).getTime();
  if (to <= from) return null;
  return Math.max(0, Math.min(100, Math.round(((today - from) / (to - from)) * 100)));
}

export function CampaignPanel({ campaign, onSaveCampaign, onDeleteCampaign, campaignProgress = [], onSetBranchStatus, campaignAck, onAcknowledgeCampaign, canUploadFile = false, uploaderId, onFileUploaded, company }) {
  const [editing,  setEditing]  = useState(false);
  const [campName, setCampName] = useState("");
  const [campFrom, setCampFrom] = useState("");
  const [campTo,   setCampTo]   = useState("");
  const [saving,   setSaving]   = useState(false);
  const [ackSaving, setAckSaving] = useState(false);
  const [showDetails, setShowDetails] = useState(true);
  const [imgUploading, setImgUploading] = useState(false);
  const [localCampaign, setLocalCampaign] = useState(campaign);
  const imgRef = useRef();

  const c = localCampaign?.id === campaign?.id ? localCampaign : campaign;

  const cpCompleted  = campaignProgress.filter(b => b.status === "completed").length;
  const cpInProgress = campaignProgress.filter(b => b.status === "in_progress").length;
  const cpNotStarted = campaignProgress.filter(b => b.status === "not_started").length;
  const cpTotal      = campaignProgress.length;
  const cpRate       = cpTotal ? Math.round((cpCompleted / cpTotal) * 100) : getTimeProgress(c?.date_from, c?.date_to) ?? 0;
  const daysLeft      = getDaysLeft(c?.date_to);

  const saveCampaign = async () => {
    if (!campName.trim()) return;
    setSaving(true);
    await onSaveCampaign({ name: campName, date_from: campFrom, date_to: campTo });
    setSaving(false);
    setEditing(false);
  };

  const doAcknowledge = async () => {
    if (!c?.id) return;
    setAckSaving(true);
    try { await onAcknowledgeCampaign?.(c.id); } finally { setAckSaving(false); }
  };

  const imageUrl = c?.image_path
    ? supabase.storage.from("vm-guidelines").getPublicUrl(c.image_path).data.publicUrl
    : null;

  const uploadImage = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !c?.id) return;
    setImgUploading(true);
    try { setLocalCampaign(await uploadCampaignImage(c.id, file)); }
    finally { setImgUploading(false); }
  };

  return (
    <div style={{ ...S.card, border: `1px solid ${C.accentColor}33` }} className="fu2">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: editing ? 12 : 0, gap: 12 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start", flex: 1, minWidth: 0 }}>
          {!editing && c?.name && (
            <div style={{ position: "relative", flexShrink: 0 }}>
              {imageUrl ? (
                <img loading="lazy" src={imageUrl} alt={c.name} style={{
                  width: 56, height: 56, borderRadius: 12, objectFit: "cover",
                  border: `1px solid ${C.accentColor}33`,
                }} />
              ) : (
                <div style={{
                  width: 56, height: 56, borderRadius: 12, background: C.surfaceHigh,
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22,
                }}>📣</div>
              )}
              {onSaveCampaign && (
                <button onClick={() => imgRef.current?.click()} disabled={imgUploading}
                  title="Change cover image"
                  style={{
                    position: "absolute", bottom: -4, right: -4, width: 20, height: 20, borderRadius: "50%",
                    background: C.accentColor, color: "#fff", border: "2px solid var(--clr-surface)",
                    fontSize: 10, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0,
                  }}>{imgUploading ? "…" : "✎"}</button>
              )}
              {onSaveCampaign && (
                <input ref={imgRef} type="file" accept="image/*" style={{ display: "none" }} onChange={uploadImage} />
              )}
            </div>
          )}
          <div style={{ minWidth: 0 }}>
            <div style={S.h3}>Current Campaign</div>
            {!editing && c?.name && (
              <>
                <div style={{ ...S.dFont, fontSize: 20, fontWeight: 700, color: C.accentColor }}>
                  {c.name}
                </div>
                {(c.date_from || c.date_to) && (
                  <div style={{ ...S.muted, fontSize: 12, marginTop: 4 }}>
                    {c.date_from} {c.date_from && c.date_to ? "→" : ""} {c.date_to}
                  </div>
                )}
                {daysLeft != null && (
                  <div style={{
                    display: "inline-block", marginTop: 6, fontSize: 11, fontWeight: 700,
                    padding: "3px 10px", borderRadius: 12,
                    background: (daysLeft < 0 ? "#f87171" : daysLeft <= 3 ? "#d4a82a" : "#4ade80") + "22",
                    color: daysLeft < 0 ? "#f87171" : daysLeft <= 3 ? "#d4a82a" : "#4ade80",
                  }}>
                    {daysLeft < 0 ? "Ended" : daysLeft === 0 ? "Ends today" : `${daysLeft} day${daysLeft===1?"":"s"} left`}
                  </div>
                )}
              </>
            )}
            {!editing && !c?.name && (
              <div style={{ ...S.muted, fontSize: 13 }}>No active campaign — tap Edit to add one</div>
            )}
          </div>
        </div>
        {onSaveCampaign && (
          <div style={{ display:"flex", gap:6, flexShrink:0 }}>
            <button className="btnG" style={{ ...S.btnG, fontSize: 12, padding: "6px 12px" }}
              onClick={() => {
                setEditing(!editing);
                setCampName(c?.name ?? "");
                setCampFrom(c?.date_from ?? "");
                setCampTo(c?.date_to ?? "");
              }}>
              {editing ? "Cancel" : "Edit"}
            </button>
            {!editing && c?.name && onDeleteCampaign && (
              <button onClick={onDeleteCampaign} title="End campaign"
                style={{ background:"none", border:"none", color:"#f87171", cursor:"pointer", fontSize:16, padding:"4px" }}>
                🗑️
              </button>
            )}
          </div>
        )}
      </div>

      {editing && (
        <div>
          <div style={S.lbl}>Campaign Name</div>
          <input style={S.inp} placeholder="e.g. Love Where You Live"
            value={campName} onChange={e => setCampName(e.target.value)} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <div style={S.lbl}>From</div>
              <input style={S.inp} type="date" value={campFrom} onChange={e => setCampFrom(e.target.value)} />
            </div>
            <div>
              <div style={S.lbl}>To</div>
              <input style={S.inp} type="date" value={campTo} onChange={e => setCampTo(e.target.value)} />
            </div>
          </div>
          <button className="btnP" style={{ ...S.btnP, width: "100%" }}
            onClick={saveCampaign} disabled={saving}>
            {saving ? "Saving…" : "Save Campaign →"}
          </button>
        </div>
      )}

      {/* ── Progress (branch completion if tracked, else time elapsed) + Details toggle ── */}
      {!editing && c?.name && (
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${C.accentColor}14` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div style={S.h3}>Progress</div>
            <span style={{ fontSize: 16, fontWeight: 700, color: cpRate >= 70 ? "#4ade80" : C.accentColor }}>
              {cpRate}%
            </span>
          </div>
          <div style={{ height: 6, borderRadius: 3, background: C.surfaceHigh, marginBottom: 12 }}>
            <div style={{ height: "100%", borderRadius: 3, background: cpRate >= 70 ? "#4ade80" : C.accentColor,
              width: `${cpRate}%`, transition: "width .5s" }} />
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <button className="btnG" style={{ ...S.btnG, fontSize: 12, padding: "6px 12px" }}
              onClick={() => setShowDetails(p => !p)}>
              {showDetails ? "Hide Details" : "Details →"}
            </button>
            {cpTotal > 0 && (
              <button className="btnG" style={{ ...S.btnG, fontSize: 12, padding: "6px 12px" }}
                onClick={() => printCampaignChecklist({ campaign: c, campaignProgress, company })}>
                🖨️ Print Checklist
              </button>
            )}
          </div>
        </div>
      )}

      {showDetails && (
        <>
          {/* ── Per-branch breakdown ── */}
          {!editing && c?.name && cpTotal > 0 && (
            <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${C.accentColor}14` }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
                {[
                  { n: cpCompleted,  l: "Completed",   c: "#4ade80" },
                  { n: cpInProgress, l: "In Progress", c: "#d4a82a" },
                  { n: cpNotStarted, l: "Not Started", c: "#6b6880" },
                ].map(k => (
                  <div key={k.l} style={{ textAlign: "center", padding: "8px 4px",
                    background: C.surfaceHigh, borderRadius: 8 }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: k.c, lineHeight: 1 }}>{k.n}</div>
                    <div style={{ fontSize: 10, color: C.mutedColor, marginTop: 3 }}>{k.l}</div>
                  </div>
                ))}
              </div>

              {/* Per-branch status — tap to cycle */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {campaignProgress.map(cb => {
                  const meta = STATUS_META[cb.status] ?? STATUS_META.not_started;
                  return (
                    <button key={cb.branch_id}
                      onClick={() => onSetBranchStatus?.(cb.branch_id, NEXT_STATUS[cb.status] ?? "in_progress")}
                      title="Tap to change status"
                      style={{
                        padding: "5px 11px", borderRadius: 16, cursor: "pointer",
                        fontSize: 11, fontWeight: 600,
                        background: meta.color + "1c", color: meta.color,
                        border: `1px solid ${meta.color}44`, transition: "all .2s",
                      }}>
                      {cb.branch?.name ?? "—"} · {meta.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Head VM acknowledgment — visible, non-blocking sign-off */}
          {!editing && c?.name && onAcknowledgeCampaign && (
            <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${C.accentColor}14`,
              display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              {campaignAck ? (
                <div style={{ fontSize: 12, color: "#4ade80" }}>
                  ✓ Acknowledged by {campaignAck.acknowledger?.full_name ?? "Head VM"}
                </div>
              ) : (
                <div style={{ ...S.muted, fontSize: 12 }}>Not yet acknowledged</div>
              )}
              <button className="btnG" style={{ ...S.btnG, fontSize: 12, padding: "6px 12px" }}
                onClick={doAcknowledge} disabled={ackSaving}>
                {ackSaving ? "Saving…" : campaignAck ? "Re-acknowledge" : "✓ Acknowledge"}
              </button>
            </div>
          )}

          {!editing && c?.name && (
            <CampaignFileBox campaign={c} canUpload={canUploadFile} uploaderId={uploaderId} onUploaded={onFileUploaded} />
          )}
        </>
      )}
    </div>
  );
}
