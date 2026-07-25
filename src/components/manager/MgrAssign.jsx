import { Training } from "./Training.jsx";
import { useState, useEffect } from "react";
import { S, C } from "../../styles/theme.js";
import { WeeklyPlan } from "./WeeklyPlan.jsx";
import { supabase } from "../../lib/supabase.js";

export function MgrAssign({ tasks, categories, branches,
  onDeleteTask, profile, company }) {

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

      {/* All Tasks */}
      {tab === "all" && (
        <div>
          {tasks.length === 0 && <div style={{ ...S.muted, textAlign:"center", padding:30 }}>No tasks yet.</div>}
          {tasks.map(t => (
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
                    {t.branch_id && branches?.find(b=>b.id===t.branch_id) && (
                      <span style={{ ...S.muted, fontSize:11 }}>
                        📍 {branches.find(b=>b.id===t.branch_id)?.name}
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
            </div>
          ))}
        </div>
      )}

      {/* Training */}
      {tab === "training" && <Training company={company} profile={profile} readOnly/>}
    </div>
  );
}