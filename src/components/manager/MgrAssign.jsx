import { Training } from "./Training.jsx";
import { useState } from "react";
import { S } from "../../styles/theme.js";
import { WeeklyPlan } from "./WeeklyPlan.jsx";

export function MgrAssign({ categories, branches, profile, company }) {

  const [tab, setTab] = useState("plan");

  const managerBranch = profile?.branch_id
    ? branches.find(b => b.id === profile.branch_id) : null;

  return (
    <div>
      <div style={{ ...S.h1, marginBottom:2 }} className="fu">
        Plan <span style={S.accent}>&amp; Assign</span>
      </div>
      {managerBranch && <div style={{ ...S.muted, fontSize:12, marginBottom:14 }}>📍 {managerBranch.name}</div>}

      {/* Tabs */}
      <div style={{ display:"flex", gap:6, marginBottom:14, flexWrap:"wrap" }}>
        {[["plan","📅 Weekly Plan"],["training","🎓 Training"]].map(([k,l]) => (
          <button key={k} className="tab-btn" style={S.tab(tab===k)} onClick={()=>setTab(k)}>{l}</button>
        ))}
      </div>

      {/* Weekly Plan */}
      {tab === "plan" && <WeeklyPlan company={company} categories={categories} branches={branches} profile={profile} readOnly/>}

      {/* Training */}
      {tab === "training" && <Training company={company} profile={profile} readOnly/>}
    </div>
  );
}
