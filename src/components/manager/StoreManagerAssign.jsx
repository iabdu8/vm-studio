import { useState, useEffect } from "react";
import { S } from "../../styles/theme.js";
import { supabase } from "../../lib/supabase.js";
import { WeeklyPlan } from "./WeeklyPlan.jsx";
import { TasksTable } from "../shared/TasksTable.jsx";
import { Training } from "./Training.jsx";

// ============================================================
//  VM CONTROLLER — assigns work via the Weekly Plan (which
//  auto-creates the linked task), own branch only.
// ============================================================
export function StoreManagerAssign({ tasks, categories, branches, profile, company, onDeleteTask, onTasksChanged }) {
  const [tab,   setTab]   = useState("plan");
  const [staff, setStaff] = useState([]);

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
        {[["plan","📅 Weekly Plan"],["all","All Tasks"],["training","🎓 Training"]].map(([k,l]) => (
          <button key={k} className="tab-btn" style={S.tab(tab===k)} onClick={()=>setTab(k)}>{l}</button>
        ))}
      </div>

      {tab === "plan" && myBranch && (
        <WeeklyPlan company={company} categories={categories} branches={[myBranch]} profile={profile} onTasksChanged={onTasksChanged} />
      )}

      {tab === "all" && (
        <div>
          <div style={{ ...S.muted, fontSize:12, marginBottom:14 }}>
            Add or edit work from the Weekly Plan tab — this is a full view of your branch's tasks.
          </div>
          <TasksTable tasks={myTasks} staff={staff} profile={profile} canDelete onDeleteTask={onDeleteTask} />
        </div>
      )}

      {tab === "training" && <Training company={company} profile={profile} readOnly/>}
    </div>
  );
}
