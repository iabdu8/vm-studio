import { useState } from "react";
import { S, C } from "../../styles/theme.js";
import { todayStr } from "../../utils.js";

const STATUS_META = {
  not_started: { label: "Not Started", color: "#6b6880" },
  in_progress: { label: "In Progress", color: "#d4a82a" },
  completed:   { label: "Completed",   color: "#4ade80" },
};
const NEXT_STATUS = { not_started: "in_progress", in_progress: "completed", completed: "not_started" };

export function MgrOverview({
  tasks, submissions, log, company,
  campaign, onSaveCampaign,
  campaignProgress = [], onSetBranchStatus,
  branches = [],
  promotions = [], onCreatePromotion, onDeletePromotion,
}) {
  const [editing,  setEditing]  = useState(false);
  const [campName, setCampName] = useState("");
  const [campFrom, setCampFrom] = useState("");
  const [campTo,   setCampTo]   = useState("");
  const [saving,   setSaving]   = useState(false);

  // Promotion form
  const [showPromoForm, setShowPromoForm] = useState(false);
  const [pName,  setPName]  = useState("");
  const [pDesc,  setPDesc]  = useState("");
  const [pFrom,  setPFrom]  = useState("");
  const [pTo,    setPTo]    = useState("");
  const [pBranches, setPBranches] = useState([]);
  const [pLinkCampaign, setPLinkCampaign] = useState(false);
  const [pSaving, setPSaving] = useState(false);

  const pending  = submissions.filter(s => s.status === "pending").length;
  const approved = submissions.filter(s => s.status === "approved").length;
  const doneT    = tasks.filter(t => t.is_done ?? t.done).length;
  const pct      = tasks.length ? Math.round((doneT / tasks.length) * 100) : 0;

  // ── Campaign progress stats ──
  const cpCompleted  = campaignProgress.filter(b => b.status === "completed").length;
  const cpInProgress = campaignProgress.filter(b => b.status === "in_progress").length;
  const cpNotStarted = campaignProgress.filter(b => b.status === "not_started").length;
  const cpTotal      = campaignProgress.length;
  const cpRate       = cpTotal ? Math.round((cpCompleted / cpTotal) * 100) : 0;

  // ── Branch performance from submissions ──
  const branchMap = {};
  submissions.forEach(s => {
    const name = s.branch?.name ?? s.branch ?? "Unknown";
    if (!branchMap[name]) branchMap[name] = { approved: 0, total: 0 };
    if (s.status === "approved") branchMap[name].approved++;
    branchMap[name].total++;
  });
  const branchPerf = Object.entries(branchMap)
    .map(([branch, b]) => ({ branch, score: b.total ? Math.round((b.approved / b.total) * 100) : 0 }))
    .sort((a, b) => b.score - a.score);

  const saveCampaign = async () => {
    if (!campName.trim()) return;
    setSaving(true);
    await onSaveCampaign({ name: campName, date_from: campFrom, date_to: campTo });
    setSaving(false);
    setEditing(false);
  };

  const savePromotion = async () => {
    if (!pName.trim() || !pFrom || !pTo) return;
    setPSaving(true);
    await onCreatePromotion(
      { name: pName, description: pDesc, date_from: pFrom, date_to: pTo,
        campaign_id: pLinkCampaign && campaign?.id ? campaign.id : null },
      pBranches
    );
    setPName(""); setPDesc(""); setPFrom(""); setPTo("");
    setPBranches([]); setPLinkCampaign(false);
    setShowPromoForm(false);
    setPSaving(false);
  };

  const togglePromoBranch = (id) =>
    setPBranches(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  return (
    <div>
      <div style={{ ...S.h1, marginBottom: 2 }} className="fu">
        Operations <span style={S.accent}>Overview</span>
      </div>
      <div style={{ ...S.muted, marginBottom: 16, fontSize: 12 }}>
        {todayStr()} · {company?.name ?? "All branches"}
      </div>

      {/* ════ CURRENT CAMPAIGN ════ */}
      <div style={{ ...S.card, border: `1px solid ${C.accentColor}33`, marginBottom: 16 }} className="fu2">
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
          <button className="btnG" style={{ ...S.btnG, fontSize: 12, padding: "6px 12px", flexShrink: 0 }}
            onClick={() => {
              setEditing(!editing);
              setCampName(campaign?.name ?? "");
              setCampFrom(campaign?.date_from ?? "");
              setCampTo(campaign?.date_to ?? "");
            }}>
            {editing ? "Cancel" : "Edit"}
          </button>
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
      </div>

      {/* ════ CURRENT PROMOTIONS ════ */}
      <div style={{ ...S.card, marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: promotions.length || showPromoForm ? 12 : 0 }}>
          <div style={S.h3}>Current Promotions ({promotions.length})</div>
          <button className="btnG" style={{ ...S.btnG, fontSize: 12, padding: "6px 12px" }}
            onClick={() => setShowPromoForm(!showPromoForm)}>
            {showPromoForm ? "Cancel" : "＋ Add"}
          </button>
        </div>

        {showPromoForm && (
          <div style={{ marginBottom: 14, paddingBottom: 14, borderBottom: `1px solid ${C.accentColor}14` }}>
            <div style={S.lbl}>Promotion Name</div>
            <input style={S.inp} placeholder="e.g. Buy 2 Get 1 Free"
              value={pName} onChange={e => setPName(e.target.value)} />
            <div style={S.lbl}>Description</div>
            <textarea style={{ ...S.inp, minHeight: 56, resize: "vertical" }}
              placeholder="Details for the team…"
              value={pDesc} onChange={e => setPDesc(e.target.value)} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <div style={S.lbl}>Start</div>
                <input style={S.inp} type="date" value={pFrom} onChange={e => setPFrom(e.target.value)} />
              </div>
              <div>
                <div style={S.lbl}>End</div>
                <input style={S.inp} type="date" value={pTo} onChange={e => setPTo(e.target.value)} />
              </div>
            </div>

            <div style={S.lbl}>Target Branches (empty = all)</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, margin: "6px 0 12px" }}>
              {branches.map(b => (
                <button key={b.id} className="pill-btn" onClick={() => togglePromoBranch(b.id)} style={{
                  padding: "5px 11px", borderRadius: 16, cursor: "pointer", fontSize: 11, fontWeight: 600,
                  background: pBranches.includes(b.id) ? C.accentColor + "28" : "transparent",
                  color:      pBranches.includes(b.id) ? C.accentColor : C.mutedColor,
                  border:     pBranches.includes(b.id) ? `1px solid ${C.accentColor}55` : `1px solid ${C.mutedColor}22`,
                }}>{b.name}</button>
              ))}
            </div>

            {campaign?.name && (
              <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12,
                fontSize: 12, color: C.mutedColor, cursor: "pointer" }}>
                <input type="checkbox" checked={pLinkCampaign}
                  onChange={e => setPLinkCampaign(e.target.checked)}
                  style={{ accentColor: C.accentColor }} />
                Link to campaign: <strong style={{ color: C.accentColor }}>{campaign.name}</strong>
              </label>
            )}

            <button className="btnP" style={{ ...S.btnP, width: "100%" }}
              onClick={savePromotion} disabled={pSaving}>
              {pSaving ? "Saving…" : "Publish Promotion →"}
            </button>
          </div>
        )}

        {promotions.length === 0 && !showPromoForm && (
          <div style={{ ...S.muted, fontSize: 13, marginTop: 8 }}>No active promotions.</div>
        )}

        {promotions.map(p => {
          const targetNames = (p.target_branches ?? [])
            .map(tb => branches.find(b => b.id === tb.branch_id)?.name)
            .filter(Boolean);
          return (
            <div key={p.id} style={{ padding: "10px 0", borderBottom: `1px solid ${C.accentColor}0a` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.accentColor }}>🏷️ {p.name}</div>
                  {p.description && (
                    <div style={{ fontSize: 12, color: C.textColor, opacity: .85, marginTop: 3 }}>{p.description}</div>
                  )}
                  <div style={{ ...S.muted, fontSize: 11, marginTop: 4 }}>
                    {p.date_from} → {p.date_to}
                    {p.campaign?.name && <> · 📣 {p.campaign.name}</>}
                    {targetNames.length > 0
                      ? <> · 📍 {targetNames.join(", ")}</>
                      : <> · 📍 All branches</>}
                  </div>
                </div>
                <button onClick={() => onDeletePromotion?.(p.id)}
                  style={{ background: "none", border: "none", color: C.mutedColor, cursor: "pointer", fontSize: 14, flexShrink: 0 }}>
                  ✕
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ════ KPI GRID ════ */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
        {[
          { n: pending,  l: "Pending Review", sub: "awaiting approval", c: "#d4a82a" },
          { n: approved, l: "Approved",       sub: "this period",       c: "#4ade80" },
          { n: tasks.filter(t => !(t.is_done ?? t.done)).length, l: "Open Tasks", sub: "across branches", c: "#f87171" },
          { n: `${pct}%`, l: "Completion", sub: `${doneT}/${tasks.length} done`, c: C.accentColor },
        ].map(k => (
          <div key={k.l} style={{ ...S.card, marginBottom: 0 }}>
            <div style={{ ...S.dFont, fontSize: 28, fontWeight: 700, color: k.c, lineHeight: 1 }}>{k.n}</div>
            <div style={{ fontSize: 13, fontWeight: 600, marginTop: 4 }}>{k.l}</div>
            <div style={{ ...S.muted, fontSize: 11 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* ════ BRANCH PERFORMANCE ════ */}
      <div style={S.card}>
        <div style={S.h3}>Branch Performance · Approval Rate</div>
        {branchPerf.length === 0 && <div style={S.muted}>No submissions yet.</div>}
        {branchPerf.map((b, i) => (
          <div key={b.branch} style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: 12, fontWeight: 600 }}>
                {i === 0 ? "🥇 " : i === 1 ? "🥈 " : i === 2 ? "🥉 " : ""}{b.branch}
              </span>
              <span style={{ fontSize: 12, fontWeight: 700,
                color: b.score >= 80 ? C.accentColor : b.score >= 60 ? C.textColor : C.mutedColor }}>
                {b.score}%
              </span>
            </div>
            <div style={{ height: 4, borderRadius: 2, background: C.surfaceHigh }}>
              <div style={{ height: "100%", borderRadius: 2, width: `${b.score}%`, transition: "width .5s",
                background: b.score >= 80 ? C.accentColor : b.score >= 60 ? "#4ade80" : "#d4a82a" }} />
            </div>
          </div>
        ))}
      </div>

      {/* ════ ACTIVITY LOG ════ */}
      <div style={S.card}>
        <div style={S.h3}>Activity Log</div>
        {log.length === 0 && <div style={S.muted}>No activity yet.</div>}
        {log.slice(0, 8).map(l => (
          <div key={l.id} style={{ display: "flex", gap: 10, alignItems: "flex-start",
            padding: "8px 0", borderBottom: `1px solid ${C.accentColor}0a` }}>
            <span style={S.chip(l.role ?? l.user?.role)}>
              {l.role === "manager" || l.user?.role === "manager" ? "MGR" : "VM"}
            </span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 600 }}>{l.user?.full_name ?? l.user}</div>
              <div style={{ ...S.muted, fontSize: 12 }}>{l.action} · {l.detail}</div>
            </div>
            <span style={{ ...S.muted, fontSize: 11, flexShrink: 0 }}>
              {l.created_at ? new Date(l.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : l.time}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}