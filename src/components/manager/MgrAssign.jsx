import { useState } from "react";
import { S } from "../../styles/theme.js";
import { WeeklyPlan } from "./WeeklyPlan.jsx";
import { DailyTasksFeed } from "../shared/DailyTasksFeed.jsx";
import { MgrRequests } from "./MgrRequests.jsx";

export function MgrAssign({ tasks, submissions, categories, branches, profile, company }) {

  const [tab, setTab] = useState("tasks");

  const managerBranch = profile?.branch_id
    ? branches.find(b => b.id === profile.branch_id) : null;

  return (
    <div>
      <div style={{ ...S.h1, marginBottom:2 }} className="fu">
        Task <span style={S.accent}>&amp; Plan</span>
      </div>
      {managerBranch && <div style={{ ...S.muted, fontSize:12, marginBottom:14 }}>📍 {managerBranch.name}</div>}

      {/* Tabs */}
      <div style={{ display:"flex", gap:6, marginBottom:14, flexWrap:"wrap" }}>
        {[["tasks","📋 Tasks"],["requests","📥 Requests"],["plan","📅 Weekly Plan"]].map(([k,l]) => (
          <button key={k} className="tab-btn" style={S.tab(tab===k)} onClick={()=>setTab(k)}>{l}</button>
        ))}
      </div>

      {/* Tasks — day by day, under the VM who did them, with photos + comments */}
      {tab === "tasks" && (
        <DailyTasksFeed tasks={tasks ?? []} submissions={submissions ?? []} branches={branches} profile={profile} />
      )}

      {/* Requests — view + comment only, approval stays with the VM Controller */}
      {tab === "requests" && (
        <MgrRequests submissions={submissions ?? []} profile={profile} readOnly />
      )}

      {/* Weekly Plan */}
      {tab === "plan" && <WeeklyPlan company={company} categories={categories} branches={branches} profile={profile} readOnly/>}
    </div>
  );
}
