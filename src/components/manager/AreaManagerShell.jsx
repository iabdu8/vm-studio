import { useState } from "react";
import { S, C } from "../../styles/theme.js";
import { todayStr } from "../../utils.js";
import { CommentThread } from "../shared/CommentThread.jsx";
import { CampaignPanel } from "./CampaignPanel.jsx";
import { GuidelinesManager } from "../shared/GuidelinesManager.jsx";
import { TasksTable } from "../shared/TasksTable.jsx";

// ============================================================
//  AREA MANAGER SHELL (VM Manager)
//  يشوف فروعه المعيّنة له فقط — يتابع الكامبين — يعلّق (بدون اعتماد)
// ============================================================

export function AreaManagerOverview({ profile, tasks, submissions, branches, managerBranches = [] }) {
  const [branchFilter, setBranchFilter] = useState("all");

  // فقط الفروع المعيّنة له من السوبر ادمن
  const myBranches = branches.filter(b => managerBranches.includes(b.id));

  const filteredTasks       = branchFilter === "all" ? tasks       : tasks.filter(t => t.branch_id === branchFilter);
  const filteredSubmissions = branchFilter === "all" ? submissions : submissions.filter(s => s.branch_id === branchFilter);

  const pending  = filteredSubmissions.filter(s => s.status === "pending").length;
  const approved = filteredSubmissions.filter(s => s.status === "approved").length;

  // Branch performance
  const branchMap = {};
  filteredSubmissions.forEach(s => {
    const name = s.branch?.name ?? "Unknown";
    if (!branchMap[name]) branchMap[name] = { approved:0, total:0 };
    if (s.status === "approved") branchMap[name].approved++;
    branchMap[name].total++;
  });
  const branchPerf = Object.entries(branchMap)
    .map(([branch, b]) => ({ branch, score: b.total ? Math.round((b.approved/b.total)*100):0 }))
    .sort((a,b) => b.score - a.score);

  return (
    <div>
      <div style={{ ...S.h1, marginBottom:2 }} className="fu">
        Area <span style={S.accent}>Overview</span>
      </div>
      <div style={{ ...S.muted, marginBottom:16, fontSize:12 }}>
        {myBranches.length} branch(es) · {todayStr()}
      </div>

      {/* Branch selector — scroll through each of his branches */}
      {myBranches.length > 0 && (
        <div style={{ display:"flex", flexWrap:"nowrap", gap:7, marginBottom:16, overflowX:"auto", WebkitOverflowScrolling:"touch", paddingBottom:2 }}>
          <button onClick={() => setBranchFilter("all")} style={{
            padding:"6px 13px", borderRadius:20, cursor:"pointer", fontSize:12, fontWeight:600, flexShrink:0,
            background: branchFilter==="all" ? C.accentColor+"28" : "transparent",
            color:      branchFilter==="all" ? C.accentColor : C.mutedColor,
            border:     branchFilter==="all" ? `1px solid ${C.accentColor}55` : `1px solid ${C.mutedColor}22`,
          }}>All Branches</button>
          {myBranches.map(b => (
            <button key={b.id} onClick={() => setBranchFilter(b.id)} style={{
              padding:"6px 13px", borderRadius:20, cursor:"pointer", fontSize:12, fontWeight:600, flexShrink:0,
              background: branchFilter===b.id ? C.accentColor+"28" : "transparent",
              color:      branchFilter===b.id ? C.accentColor : C.mutedColor,
              border:     branchFilter===b.id ? `1px solid ${C.accentColor}55` : `1px solid ${C.mutedColor}22`,
            }}>📍 {b.name}</button>
          ))}
        </div>
      )}

      {/* KPIs */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:14 }}>
        {[
          { n:pending,            l:"Pending Review", sub:"awaiting approval", c:"#d4a82a" },
          { n:approved,           l:"Approved",       sub:"this period",       c:"#4ade80" },
          { n:myBranches.length,  l:"My Branches",    sub:"assigned to me",    c:"#818cf8" },
          { n:filteredTasks.filter(t=>!(t.is_done??t.done)).length, l:"Open Tasks", sub:"", c:"#f87171" },
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
        {branchPerf.map((b, i) => (
          <div key={b.branch} style={{ marginBottom:12 }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
              <span style={{ fontSize:12, fontWeight:600 }}>
                {i===0?"🥇 ":i===1?"🥈 ":i===2?"🥉 ":""}{b.branch}
              </span>
              <span style={{ fontSize:12, fontWeight:700,
                color:b.score>=80?C.accentColor:b.score>=60?C.textColor:C.mutedColor }}>
                {b.score}%
              </span>
            </div>
            <div style={{ height:4, borderRadius:2, background:C.surfaceHigh }}>
              <div style={{ height:"100%", borderRadius:2, width:`${b.score}%`, transition:"width .5s",
                background:b.score>=80?C.accentColor:b.score>=60?"#4ade80":"#d4a82a" }}/>
            </div>
          </div>
        ))}
      </div>

      {/* Tasks — always visible, view-only (only the VM Controller edits) */}
      <div style={{ marginTop:14 }}>
        <div style={{ ...S.h3, marginBottom:10 }}>
          Tasks ({filteredTasks.length}){branchFilter !== "all" && ` · 📍 ${myBranches.find(b => b.id === branchFilter)?.name ?? ""}`}
        </div>
        <TasksTable tasks={filteredTasks} branches={myBranches} showBranchColumn={branchFilter === "all"} profile={profile} />
      </div>

      {/* Branch Activity (submissions) — only when a specific branch is selected */}
      {branchFilter !== "all" && (
        <div style={{ marginTop:14 }}>
          <div style={{ ...S.h3, marginTop:10, marginBottom:8, fontSize:11 }}>Submissions ({filteredSubmissions.length})</div>
          {filteredSubmissions.length === 0 && <div style={{ ...S.muted, fontSize:12 }}>No submissions yet.</div>}
          {filteredSubmissions.map(s => (
            <div key={s.id} style={S.card}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
                <div>
                  <div style={{ fontWeight:700, fontSize:14 }}>{s.submitter?.full_name ?? "VM"}</div>
                  <div style={{ ...S.muted, fontSize:12 }}>
                    {s.category?.icon} {s.category?.name} · {s.subcategory?.name}
                  </div>
                </div>
                <span style={S.chip(s.status)}>{s.status}</span>
              </div>
              {s.photos?.length > 0 && (
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                  {[["Before", s.photos.filter(p=>p.photo_type==="before")],
                    ["After",  s.photos.filter(p=>p.photo_type==="after")]].map(([lbl, imgs]) => (
                    <div key={lbl}>
                      <div style={S.h3}>{lbl}</div>
                      <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
                        {imgs.map((p, i) => (
                          <img key={i} loading="lazy" src={p.url} alt=""
                            style={{ width:56, height:56, objectFit:"cover", borderRadius:6 }}/>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// View + comment only — no approve/reject power for VM Manager
export function AreaManagerRequests({ submissions, profile }) {
  const [openId, setOpenId] = useState(null);

  return (
    <div>
      <div style={{ ...S.h1, marginBottom:2 }} className="fu">
        Branch <span style={S.accent}>Submissions</span>
      </div>
      <div style={{ ...S.muted, marginBottom:16, fontSize:12 }}>
        View-only — leave feedback via comments
      </div>

      {submissions.length === 0 && (
        <div style={{ ...S.muted, textAlign:"center", padding:40 }}>No submissions yet.</div>
      )}

      {submissions.map(s => (
        <div key={s.id} style={S.card}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
            <div>
              <div style={{ fontWeight:700, fontSize:14 }}>{s.submitter?.full_name ?? "VM"}</div>
              <div style={{ ...S.muted, fontSize:12 }}>
                {s.branch?.name ?? "—"} · {s.category?.icon} {s.category?.name} · {s.subcategory?.name}
              </div>
            </div>
            <span style={S.chip(s.status)}>{s.status}</span>
          </div>

          {s.photos?.length > 0 && (
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:10 }}>
              {[["Before", s.photos.filter(p=>p.photo_type==="before")],
                ["After",  s.photos.filter(p=>p.photo_type==="after")]].map(([lbl, imgs]) => (
                <div key={lbl}>
                  <div style={S.h3}>{lbl}</div>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
                    {imgs.map((p, i) => (
                      <img key={i} loading="lazy" src={p.url} alt=""
                        style={{ width:56, height:56, objectFit:"cover", borderRadius:6 }}/>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {s.task_id && (
            <button onClick={() => setOpenId(openId === s.id ? null : s.id)}
              style={{ background:"none", border:"none", color:C.accentColor, cursor:"pointer",
                fontSize:11, fontWeight:600, padding:0 }}>
              {openId === s.id ? "Hide comments" : "💬 Comments"}
            </button>
          )}
          {openId === s.id && s.task_id && <CommentThread taskId={s.task_id} profile={profile} />}
        </div>
      ))}
    </div>
  );
}

// Campaign (view + comment, no edit/acknowledge) + Guidelines (VM Manager can publish)
export function AreaManagerCampaignGuides({ campaign, campaignProgress, branches, managerBranches = [], profile, guidelines, company, onUploadGuideline, onDeleteGuideline }) {
  const myBranches = branches.filter(b => managerBranches.includes(b.id));
  const myProgress = campaignProgress.filter(cp => myBranches.some(b => b.id === cp.branch_id));

  return (
    <div>
      <div style={{ ...S.h1, marginBottom:2 }} className="fu">
        Campaign <span style={S.accent}>&amp; Guides</span>
      </div>
      <div style={{ ...S.muted, marginBottom:16, fontSize:12 }}>
        View the active campaign and team guidelines
      </div>

      {campaign?.name && (
        <>
          <CampaignPanel campaign={campaign} campaignProgress={myProgress} />
          {profile && <CommentThread campaignId={campaign.id} profile={profile} />}
        </>
      )}
      {!campaign?.name && (
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
