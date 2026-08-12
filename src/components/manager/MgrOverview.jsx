import { useState, useEffect } from "react";
import { S, C } from "../../styles/theme.js";
import { todayStr } from "../../utils.js";
import { PromotionCard } from "../shared/PromotionCard.jsx";
import { CampaignBanner } from "../shared/CampaignBanner.jsx";
import { getBestBranchesOfMonth, setBestBranchOfMonth } from "../../services/enterprise.service.js";
import { InfoBanner } from "../shared/InfoBanner.jsx";

// One editable "Best Branch" card scoped to a single region.
function BestBranchCard({ region, displayName, branchesInRegion, pick, onSave }) {
  const [editing, setEditing] = useState(false);
  const [branchId, setBranchId] = useState("");
  const [note,     setNote]     = useState("");
  const [saving,   setSaving]   = useState(false);

  const startEdit = () => {
    setBranchId(pick?.branch_id ?? "");
    setNote(pick?.note ?? "");
    setEditing(true);
  };

  const save = async () => {
    if (!branchId) return;
    setSaving(true);
    try { await onSave(region, branchId, note); setEditing(false); }
    finally { setSaving(false); }
  };

  return (
    <div style={{ ...S.card, background:`linear-gradient(135deg,${C.accentColor}22,transparent)`,
      border:`1px solid ${C.accentColor}44`, marginBottom:10 }} className="fu2">
      {editing ? (
        <div>
          <div style={S.h3}>🏆 {displayName}</div>
          <div style={S.lbl}>Branch</div>
          <select style={S.sel} value={branchId} onChange={e => setBranchId(e.target.value)}>
            <option value="">— Select a branch —</option>
            {branchesInRegion.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          <div style={S.lbl}>Note (optional)</div>
          <input style={S.inp} placeholder="e.g. Highest approval rate this month"
            value={note} onChange={e => setNote(e.target.value)}/>
          <div style={{ display:"flex", gap:8 }}>
            <button className="btnP" style={{ ...S.btnP, flex:1 }} onClick={save} disabled={saving || !branchId}>
              {saving ? "Saving…" : "Save →"}
            </button>
            <button className="btnG" style={S.btnG} onClick={() => setEditing(false)}>Cancel</button>
          </div>
        </div>
      ) : (
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ fontSize:28 }}>🏆</div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:10, fontWeight:700, color:C.accentColor, letterSpacing:1, textTransform:"uppercase" }}>
              {region || "Best Branch"} — {new Date().toLocaleDateString("en-GB",{month:"long",year:"numeric"})}
            </div>
            {pick?.branch?.name ? (
              <>
                <div style={{ ...S.dFont, fontSize:18, fontWeight:700 }}>{pick.branch.name}</div>
                {pick.note && <div style={{ ...S.muted, fontSize:12, marginTop:2 }}>{pick.note}</div>}
                {pick.setter?.full_name && (
                  <div style={{ ...S.muted, fontSize:11, marginTop:2 }}>Set by {pick.setter.full_name}</div>
                )}
              </>
            ) : (
              <div style={{ ...S.muted, fontSize:13, marginTop:2 }}>Not set yet this month.</div>
            )}
          </div>
          <button className="btnG" style={{ ...S.btnG, fontSize:12, padding:"6px 12px", flexShrink:0 }}
            onClick={startEdit}>✎ Edit</button>
        </div>
      )}
    </div>
  );
}

export function MgrOverview({
  tasks, submissions, log, company,
  campaign,
  branches = [],
  promotions = [], onCreatePromotion, onDeletePromotion,
  profile,
}) {
  const [branchFilter, setBranchFilter] = useState("all");

  // ── Best Branch of the Month, one pick per region (Head VM editable) ──
  const monthKey = new Date().toISOString().slice(0, 7); // 'YYYY-MM'
  const [bbPicks,   setBbPicks]   = useState([]);
  const [bbLoading, setBbLoading] = useState(true);

  useEffect(() => {
    if (!company?.id) return;
    setBbLoading(true);
    getBestBranchesOfMonth(company.id, monthKey)
      .then(setBbPicks)
      .finally(() => setBbLoading(false));
  }, [company?.id, monthKey]);

  const regionGroups = (() => {
    const map = {};
    branches.forEach(b => {
      const region = b.region ?? "";
      (map[region] ??= []).push(b);
    });
    return Object.entries(map)
      .map(([region, list]) => ({ region, branches: list }))
      .sort((a, b) => a.region === "" ? 1 : b.region === "" ? -1 : a.region.localeCompare(b.region));
  })();

  const saveBestBranch = async (region, branchId, note) => {
    const updated = await setBestBranchOfMonth(company.id, monthKey, region, branchId, note, profile.id);
    setBbPicks(p => [...p.filter(x => x.region !== region), updated]);
  };

  const filteredTasks       = branchFilter === "all" ? tasks       : tasks.filter(t => t.branch_id === branchFilter);
  const filteredSubmissions = branchFilter === "all" ? submissions : submissions.filter(s => s.branch_id === branchFilter);

  // Promotion form
  const [showPromoForm, setShowPromoForm] = useState(false);
  const [pName,  setPName]  = useState("");
  const [pDesc,  setPDesc]  = useState("");
  const [pFrom,  setPFrom]  = useState("");
  const [pTo,    setPTo]    = useState("");
  const [pBranches, setPBranches] = useState([]);
  const [pLinkCampaign, setPLinkCampaign] = useState(false);
  const [pSaving, setPSaving] = useState(false);

  const pending  = filteredSubmissions.filter(s => s.status === "pending").length;
  const approved = filteredSubmissions.filter(s => s.status === "approved").length;
  const doneT    = filteredTasks.filter(t => t.is_done ?? t.done).length;
  const pct      = filteredTasks.length ? Math.round((doneT / filteredTasks.length) * 100) : 0;

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
      <div style={{ ...S.muted, marginBottom: 10, fontSize: 12 }}>
        {todayStr()} · {company?.name ?? "All branches"}
      </div>

      <InfoBanner>Company-wide view — every branch, every region. Set Best Branch of the Month per region, create promotions, and switch "Viewing Branch" below to drill into one branch's stats.</InfoBanner>

      {/* ════ BEST BRANCH OF THE MONTH — one per region ════ */}
      {!bbLoading && (
        <div style={{ marginBottom:6 }}>
          {regionGroups.map(g => (
            <BestBranchCard key={g.region} region={g.region} displayName={g.region || "Unassigned"} branchesInRegion={g.branches}
              pick={bbPicks.find(p => p.region === g.region)} onSave={saveBestBranch}/>
          ))}
        </div>
      )}

      {/* ════ BRANCH FILTER ════ */}
      <div style={{ marginBottom: 16 }}>
        <div style={S.lbl}>Viewing Branch</div>
        <select style={{ ...S.sel, marginBottom: 0 }} value={branchFilter} onChange={e => setBranchFilter(e.target.value)}>
          <option value="all">All Branches</option>
          {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
      </div>

      <CampaignBanner campaign={campaign} />

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
          const extraBits = [
            p.description,
            p.campaign?.name && `📣 ${p.campaign.name}`,
            targetNames.length > 0 ? `📍 ${targetNames.join(", ")}` : "📍 All branches",
          ].filter(Boolean).join(" · ");
          return (
            <PromotionCard key={p.id} promotion={p} onDelete={onDeletePromotion} extra={extraBits} />
          );
        })}
      </div>

      {/* ════ KPI GRID ════ */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
        {[
          { n: pending,  l: "Pending Review", sub: "awaiting approval", c: "#d4a82a" },
          { n: approved, l: "Approved",       sub: "this period",       c: "#4ade80" },
          { n: filteredTasks.filter(t => !(t.is_done ?? t.done)).length, l: "Open Tasks", sub: "across branches", c: "#f87171" },
          { n: `${pct}%`, l: "Completion", sub: `${doneT}/${filteredTasks.length} done`, c: C.accentColor },
        ].map(k => (
          <div key={k.l} style={{ ...S.card, marginBottom: 0 }}>
            <div style={{ ...S.dFont, fontSize: 28, fontWeight: 700, color: k.c, lineHeight: 1 }}>{k.n}</div>
            <div style={{ fontSize: 13, fontWeight: 600, marginTop: 4 }}>{k.l}</div>
            <div style={{ ...S.muted, fontSize: 11 }}>{k.sub}</div>
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