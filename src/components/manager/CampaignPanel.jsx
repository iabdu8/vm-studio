import { useState } from "react";
import { S, C } from "../../styles/theme.js";
import { CampaignFileBox } from "../shared/CampaignFileBox.jsx";

const STATUS_META = {
  not_started: { label: "Not Started", color: "#6b6880" },
  in_progress: { label: "In Progress", color: "#d4a82a" },
  completed:   { label: "Completed",   color: "#4ade80" },
};
const NEXT_STATUS = { not_started: "in_progress", in_progress: "completed", completed: "not_started" };

export function CampaignPanel({ campaign, onSaveCampaign, campaignProgress = [], onSetBranchStatus, campaignAck, onAcknowledgeCampaign }) {
  const [editing,  setEditing]  = useState(false);
  const [campName, setCampName] = useState("");
  const [campFrom, setCampFrom] = useState("");
  const [campTo,   setCampTo]   = useState("");
  const [saving,   setSaving]   = useState(false);
  const [ackSaving, setAckSaving] = useState(false);

  const cpCompleted  = campaignProgress.filter(b => b.status === "completed").length;
  const cpInProgress = campaignProgress.filter(b => b.status === "in_progress").length;
  const cpNotStarted = campaignProgress.filter(b => b.status === "not_started").length;
  const cpTotal      = campaignProgress.length;
  const cpRate       = cpTotal ? Math.round((cpCompleted / cpTotal) * 100) : 0;

  const saveCampaign = async () => {
    if (!campName.trim()) return;
    setSaving(true);
    await onSaveCampaign({ name: campName, date_from: campFrom, date_to: campTo });
    setSaving(false);
    setEditing(false);
  };

  const doAcknowledge = async () => {
    if (!campaign?.id) return;
    setAckSaving(true);
    try { await onAcknowledgeCampaign?.(campaign.id); } finally { setAckSaving(false); }
  };

  return (
    <div style={{ ...S.card, border: `1px solid ${C.accentColor}33` }} className="fu2">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: editing ? 12 : 0 }}>
        <div>
          <div style={S.h3}>Current Campaign</div>
          {!editing && campaign?.name && (
            <>
              <div style={{ ...S.dFont, fontSize: 20, fontWeight: 700, color: C.accentColor }}>
                {campaign.name}
              </div>
              {(campaign.date_from || campaign.date_to) && (
                <div style={{ ...S.muted, fontSize: 12, marginTop: 4 }}>
                  {campaign.date_from} {campaign.date_from && campaign.date_to ? "→" : ""} {campaign.date_to}
                </div>
              )}
            </>
          )}
          {!editing && !campaign?.name && (
            <div style={{ ...S.muted, fontSize: 13 }}>No active campaign — tap Edit to add one</div>
          )}
        </div>
        {onSaveCampaign && (
          <button className="btnG" style={{ ...S.btnG, fontSize: 12, padding: "6px 12px", flexShrink: 0 }}
            onClick={() => {
              setEditing(!editing);
              setCampName(campaign?.name ?? "");
              setCampFrom(campaign?.date_from ?? "");
              setCampTo(campaign?.date_to ?? "");
            }}>
            {editing ? "Cancel" : "Edit"}
          </button>
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

      {/* ── Campaign Progress ── */}
      {!editing && campaign?.name && cpTotal > 0 && (
        <div style={{ marginTop: 16, paddingTop: 14, borderTop: `1px solid ${C.accentColor}14` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div style={S.h3}>Campaign Progress</div>
            <span style={{ fontSize: 16, fontWeight: 700, color: cpRate >= 70 ? "#4ade80" : C.accentColor }}>
              {cpRate}%
            </span>
          </div>
          <div style={{ height: 6, borderRadius: 3, background: C.surfaceHigh, marginBottom: 12 }}>
            <div style={{ height: "100%", borderRadius: 3, background: cpRate >= 70 ? "#4ade80" : C.accentColor,
              width: `${cpRate}%`, transition: "width .5s" }} />
          </div>

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
      {!editing && campaign?.name && onAcknowledgeCampaign && (
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

      {!editing && campaign?.name && <CampaignFileBox campaign={campaign} />}
    </div>
  );
}
