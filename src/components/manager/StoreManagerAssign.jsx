import { useState } from "react";
import { S } from "../../styles/theme.js";
import { WeeklyPlan } from "./WeeklyPlan.jsx";
import { Training } from "./Training.jsx";

// ============================================================
//  VM CONTROLLER — assigns work via the Weekly Plan (which
//  auto-creates the linked task), own branch only.
// ============================================================
export function StoreManagerAssign({ categories, branches, profile, company, onTasksChanged }) {
  const [tab, setTab] = useState("plan");

  const myBranch = branches.find(b => b.id === profile.branch_id);

  return (
    <div>
      <div style={{ ...S.h1, marginBottom:2 }} className="fu">
        Branch <span style={S.accent}>Tasks</span>
      </div>
      {myBranch && <div style={{ ...S.muted, fontSize:12, marginBottom:14 }}>📍 {myBranch.name}</div>}

      <div style={{ display:"flex", gap:6, marginBottom:14, flexWrap:"wrap" }}>
        {[["plan","📅 Weekly Plan"],["training","🎓 Training"]].map(([k,l]) => (
          <button key={k} className="tab-btn" style={S.tab(tab===k)} onClick={()=>setTab(k)}>{l}</button>
        ))}
      </div>

      {tab === "plan" && myBranch && (
        <WeeklyPlan company={company} categories={categories} branches={[myBranch]} profile={profile} onTasksChanged={onTasksChanged} />
      )}

      {tab === "training" && <Training company={company} profile={profile} readOnly/>}
    </div>
  );
}
