import { Training } from "./Training.jsx";
import { useState, useEffect } from "react";
import { S } from "../../styles/theme.js";
import { WeeklyPlan } from "./WeeklyPlan.jsx";
import { TasksTable } from "../shared/TasksTable.jsx";
import { supabase } from "../../lib/supabase.js";

export function MgrAssign({ tasks, categories, branches,
  profile, company }) {

  const [tab,        setTab]        = useState("plan");
  const [staff,      setStaff]      = useState([]);

  const managerBranch = profile?.branch_id
    ? branches.find(b => b.id === profile.branch_id) : null;

  useEffect(() => {
    if (!company?.id) return;
    supabase.from("profiles").select("id, full_name")
      .eq("company_id", company.id).in("role", ["vm","store_manager"])
      .then(({ data }) => setStaff(data ?? []));
  }, [company?.id]);

  return (
    <div>
      <div style={{ ...S.h1, marginBottom:2 }} className="fu">
        Plan <span style={S.accent}>&amp; Assign</span>
      </div>
      {managerBranch && <div style={{ ...S.muted, fontSize:12, marginBottom:14 }}>📍 {managerBranch.name}</div>}

      {/* Tabs */}
      <div style={{ display:"flex", gap:6, marginBottom:14, flexWrap:"wrap" }}>
        {[["plan","📅 Weekly Plan"],["all","All Tasks"],["training","🎓 Training"]].map(([k,l]) => (
          <button key={k} className="tab-btn" style={S.tab(tab===k)} onClick={()=>setTab(k)}>{l}</button>
        ))}
      </div>

      {/* Weekly Plan */}
      {tab === "plan" && <WeeklyPlan company={company} categories={categories} branches={branches} profile={profile} readOnly/>}

      {/* All Tasks — view only, only the VM Controller can edit */}
      {tab === "all" && (
        <div>
          <div style={{ ...S.muted, fontSize:12, marginBottom:14 }}>
            View-only — tasks are created and managed by the VM Controller of each branch.
          </div>
          <TasksTable tasks={tasks} staff={staff} branches={branches} showBranchColumn profile={profile} />
        </div>
      )}

      {/* Training */}
      {tab === "training" && <Training company={company} profile={profile} readOnly/>}
    </div>
  );
}
