import { useState, useEffect } from "react";
import { S, C } from "../../styles/theme.js";
import { supabase } from "../../lib/supabase.js";
import { WeeklyPlan } from "./WeeklyPlan.jsx";
import { CommentThread } from "../shared/CommentThread.jsx";

// ============================================================
//  VM CONTROLLER — assigns work via the Weekly Plan (which
//  auto-creates the linked task), own branch only.
// ============================================================
export function StoreManagerAssign({ tasks, categories, branches, profile, company, onDeleteTask, onTasksChanged }) {
  const [tab,        setTab]        = useState("plan");
  const [staff,      setStaff]      = useState([]);
  const [openTaskId, setOpenTaskId] = useState(null);

  const myBranch = branches.find(b => b.id === profile.branch_id);

  useEffect(() => {
    if (!company?.id || !profile?.branch_id) return;
    supabase.from("profiles").select("id, full_name")
      .eq("company_id", company.id).eq("branch_id", profile.branch_id)
      .eq("role", "vm")
      .then(({ data }) => setStaff(data ?? []));
  }, [company?.id, profile?.branch_id]);

  const myTasks = tasks.filter(t => t.branch_id === profile.branch_id);

  return (
    <div>
      <div style={{ ...S.h1, marginBottom:2 }} className="fu">
        Branch <span style={S.accent}>Tasks</span>
      </div>
      {myBranch && <div style={{ ...S.muted, fontSize:12, marginBottom:14 }}>📍 {myBranch.name}</div>}

      <div style={{ display:"flex", gap:6, marginBottom:14, flexWrap:"wrap" }}>
        {[["plan","📅 Weekly Plan"],["all","All Tasks"]].map(([k,l]) => (
          <button key={k} className="tab-btn" style={S.tab(tab===k)} onClick={()=>setTab(k)}>{l}</button>
        ))}
      </div>

      {tab === "plan" && myBranch && (
        <WeeklyPlan company={company} categories={categories} branches={[myBranch]} profile={profile} onTasksChanged={onTasksChanged} />
      )}

      {tab === "all" && (
        <div>
          <div style={{ ...S.muted, fontSize:12, marginBottom:14 }}>
            Read-only view — add or edit work from the Weekly Plan tab.
          </div>
          {myTasks.length === 0 && <div style={{ ...S.muted, textAlign:"center", padding:30 }}>No tasks yet.</div>}
          {myTasks.map(t => (
            <div key={t.id} style={{ ...S.card, marginBottom:10 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:11, color:C.accentColor, fontWeight:600, marginBottom:4 }}>
                    {t.category?.name ?? "—"} · {t.subcategory?.name ?? "—"}
                  </div>
                  <div style={{ fontSize:13, color:(t.is_done||t.done)?C.mutedColor:C.textColor,
                    textDecoration:(t.is_done||t.done)?"line-through":"none" }}>
                    {t.title ?? t.text}
                  </div>
                  <div style={{ display:"flex", gap:6, marginTop:6, flexWrap:"wrap" }}>
                    <span style={S.chip(t.priority)}>{t.priority}</span>
                    <span style={{ ...S.muted, fontSize:11 }}>Due: {t.due_label ?? t.dueDate}</span>
                    {t.assigned_to && t.assigned_to !== "all" && (
                      <span style={{ fontSize:11, color:"#818cf8" }}>
                        👤 {staff.find(s=>s.id===t.assigned_to)?.full_name ?? t.assigned_to}
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ display:"flex", gap:6, flexShrink:0, marginLeft:8 }}>
                  <span style={S.chip((t.is_done||t.done)?"approved":"pending")}>
                    {(t.is_done||t.done)?"Done":"Open"}
                  </span>
                  <button style={{ background:"none", border:"none", color:C.mutedColor, cursor:"pointer", fontSize:15 }}
                    onClick={() => onDeleteTask(t.id)}>✕</button>
                </div>
              </div>
              <button onClick={() => setOpenTaskId(openTaskId === t.id ? null : t.id)}
                style={{ background:"none", border:"none", color:C.accentColor, cursor:"pointer",
                  fontSize:11, fontWeight:600, padding:0, marginTop:8 }}>
                {openTaskId === t.id ? "Hide comments" : "💬 Comments"}
              </button>
              {openTaskId === t.id && <CommentThread taskId={t.id} profile={profile} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
