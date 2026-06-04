import { useState } from "react";
import { S, C } from "../../styles/theme.js";
import { todayStr } from "../../utils.js";
import { supabase } from "../../lib/supabase.js";

export function MgrOverview({ tasks, submissions, log, company, campaign, onSaveCampaign }) {
  const [editing,   setEditing]   = useState(false);
  const [campName,  setCampName]  = useState(campaign?.name  ?? "");
  const [campFrom,  setCampFrom]  = useState(campaign?.date_from ?? "");
  const [campTo,    setCampTo]    = useState(campaign?.date_to   ?? "");
  const [saving,    setSaving]    = useState(false);

  const pending  = submissions.filter(s => s.status === "pending").length;
  const approved = submissions.filter(s => s.status === "approved").length;
  const doneT    = tasks.filter(t => t.is_done ?? t.done).length;
  const pct      = tasks.length ? Math.round((doneT / tasks.length) * 100) : 0;

  const branchMap = {};
  submissions.forEach(s => {
    const name = s.branch?.name ?? s.branch ?? "Unknown";
    if (!branchMap[name]) branchMap[name] = { approved:0, total:0 };
    if (s.status === "approved") branchMap[name].approved++;
    branchMap[name].total++;
  });
  const branchPerf = Object.entries(branchMap)
    .map(([branch, b]) => ({ branch, score: b.total ? Math.round((b.approved/b.total)*100) : 0 }))
    .sort((a,b) => b.score - a.score);

  const saveCampaign = async () => {
    if (!campName.trim()) return;
    setSaving(true);
    await onSaveCampaign({ name: campName, date_from: campFrom, date_to: campTo });
    setSaving(false);
    setEditing(false);
  };

  return (
    <div>
      <div style={{ ...S.h1, marginBottom:2 }} className="fu">
        Operations <span style={S.accent}>Overview</span>
      </div>
      <div style={{ ...S.muted, marginBottom:16, fontSize:12 }}>
        {todayStr()} · {company?.name ?? "All branches"}
      </div>

      {/* Current Campaign */}
      <div style={{ ...S.card, border:`1px solid ${C.accentColor}33`, marginBottom:16 }} className="fu2">
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom: editing?12:0 }}>
          <div>
            <div style={S.h3}>Current Campaign</div>
            {!editing && campaign?.name && (
              <>
                <div style={{ ...S.dFont, fontSize:20, fontWeight:700, color:C.accentColor }}>
                  {campaign.name}
                </div>
                {(campaign.date_from || campaign.date_to) && (
                  <div style={{ ...S.muted, fontSize:12, marginTop:4 }}>
                    {campaign.date_from} {campaign.date_from && campaign.date_to ? "→" : ""} {campaign.date_to}
                  </div>
                )}
              </>
            )}
            {!editing && !campaign?.name && (
              <div style={{ ...S.muted, fontSize:13 }}>No active campaign — tap Edit to add one</div>
            )}
          </div>
          <button className="btnG" style={{ ...S.btnG, fontSize:12, padding:"6px 12px", flexShrink:0 }}
            onClick={() => { setEditing(!editing); setCampName(campaign?.name??""); setCampFrom(campaign?.date_from??""); setCampTo(campaign?.date_to??""); }}>
            {editing ? "Cancel" : "Edit"}
          </button>
        </div>

        {editing && (
          <div>
            <div style={S.lbl}>Campaign Name</div>
            <input style={S.inp} placeholder="e.g. Love Where You Live"
              value={campName} onChange={e => setCampName(e.target.value)}/>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              <div>
                <div style={S.lbl}>From</div>
                <input style={S.inp} type="date" value={campFrom} onChange={e => setCampFrom(e.target.value)}/>
              </div>
              <div>
                <div style={S.lbl}>To</div>
                <input style={S.inp} type="date" value={campTo} onChange={e => setCampTo(e.target.value)}/>
              </div>
            </div>
            <button className="btnP" style={{ ...S.btnP, width:"100%" }}
              onClick={saveCampaign} disabled={saving}>
              {saving ? "Saving…" : "Save Campaign →"}
            </button>
          </div>
        )}
      </div>

      {/* KPI grid */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:14 }}>
        {[
          { n:pending,   l:"Pending Review", sub:"awaiting approval", c:"#d4a82a" },
          { n:approved,  l:"Approved",       sub:"this period",       c:"#4ade80" },
          { n:tasks.filter(t=>!(t.is_done??t.done)).length, l:"Open Tasks", sub:"across branches", c:"#f87171" },
          { n:`${pct}%`, l:"Completion", sub:`${doneT}/${tasks.length} done`, c:C.accentColor },
        ].map(k => (
          <div key={k.l} style={{ ...S.card, marginBottom:0 }}>
            <div style={{ ...S.dFont, fontSize:28, fontWeight:700, color:k.c, lineHeight:1 }}>{k.n}</div>
            <div style={{ fontSize:13, fontWeight:600, marginTop:4 }}>{k.l}</div>
            <div style={{ ...S.muted, fontSize:11 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Branch performance */}
      <div style={S.card}>
        <div style={S.h3}>Branch Performance · Approval Rate</div>
        {branchPerf.length === 0 && <div style={S.muted}>No submissions yet.</div>}
        {branchPerf.map((b,i) => (
          <div key={b.branch} style={{ marginBottom:12 }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
              <span style={{ fontSize:12, fontWeight:600 }}>
                {i===0?"🥇 ":i===1?"🥈 ":i===2?"🥉 ":""}{b.branch}
              </span>
              <span style={{ fontSize:12, fontWeight:700,
                color: b.score>=80?C.accentColor:b.score>=60?C.textColor:C.mutedColor }}>
                {b.score}%
              </span>
            </div>
            <div style={{ height:4, borderRadius:2, background:C.surfaceHigh }}>
              <div style={{ height:"100%", borderRadius:2, width:`${b.score}%`, transition:"width .5s",
                background: b.score>=80?C.accentColor:b.score>=60?"#4ade80":"#d4a82a" }}/>
            </div>
          </div>
        ))}
      </div>

      {/* Activity log */}
      <div style={S.card}>
        <div style={S.h3}>Activity Log</div>
        {log.length === 0 && <div style={S.muted}>No activity yet.</div>}
        {log.slice(0,8).map(l => (
          <div key={l.id} style={{ display:"flex", gap:10, alignItems:"flex-start",
            padding:"8px 0", borderBottom:`1px solid ${C.accentColor}0a` }}>
            <span style={S.chip(l.role??l.user?.role)}>{l.role==="manager"||l.user?.role==="manager"?"MGR":"VM"}</span>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:12, fontWeight:600 }}>{l.user?.full_name ?? l.user}</div>
              <div style={{ ...S.muted, fontSize:12 }}>{l.action} · {l.detail}</div>
            </div>
            <span style={{ ...S.muted, fontSize:11, flexShrink:0 }}>
              {l.created_at ? new Date(l.created_at).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}) : l.time}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}