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
          {tasks.length === 0 ? (
            <div style={{ ...S.muted, textAlign:"center", padding:30 }}>No tasks yet.</div>
          ) : (
            <div style={{ ...S.card, padding:0, overflow:"hidden" }}>
              <div style={{ overflowX:"auto" }}>
                <table style={{ width:"100%", borderCollapse:"collapse", minWidth:720 }}>
                  <thead>
                    <tr>
                      {["Task","Branch","Priority","Due","Assigned To","Status","Actions"].map(h => (
                        <th key={h} style={{
                          padding:"12px 16px", textAlign:"left", fontSize:11, fontWeight:700,
                          color:C.mutedColor, letterSpacing:1, textTransform:"uppercase",
                          background:C.surfaceHigh, borderBottom:`1px solid ${C.accentColor}18`,
                          whiteSpace:"nowrap",
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.map(t => {
                      const assignee = t.assigned_to === "all" ? "All Staff"
                        : staff.find(s => s.id === t.assigned_to)?.full_name ?? "—";
                      return (
                        <tr key={t.id}>
                          <td style={{ padding:"12px 16px", borderBottom:`1px solid ${C.accentColor}0a`, maxWidth:240 }}>
                            <div style={{ fontSize:13, fontWeight:600,
                              color:(t.is_done||t.done)?C.mutedColor:C.textColor,
                              textDecoration:(t.is_done||t.done)?"line-through":"none" }}>
                              {t.title ?? t.text}
                            </div>
                            {(t.category?.name || t.subcategory?.name) && (
                              <div style={{ fontSize:11, color:C.accentColor, marginTop:2 }}>
                                {t.category?.name ?? "—"}{t.subcategory?.name ? ` · ${t.subcategory.name}` : ""}
                              </div>
                            )}
                          </td>
                          <td style={{ padding:"12px 16px", fontSize:12, color:C.mutedColor, borderBottom:`1px solid ${C.accentColor}0a`, whiteSpace:"nowrap" }}>
                            {branches?.find(b=>b.id===t.branch_id)?.name ?? "—"}
                          </td>
                          <td style={{ padding:"12px 16px", borderBottom:`1px solid ${C.accentColor}0a` }}>
                            <span style={S.chip(t.priority)}>{t.priority}</span>
                          </td>
                          <td style={{ padding:"12px 16px", fontSize:12, color:C.mutedColor, borderBottom:`1px solid ${C.accentColor}0a`, whiteSpace:"nowrap" }}>
                            {t.due_label ?? t.dueDate ?? "—"}
                          </td>
                          <td style={{ padding:"12px 16px", fontSize:12, borderBottom:`1px solid ${C.accentColor}0a`, whiteSpace:"nowrap" }}>
                            {assignee}
                          </td>
                          <td style={{ padding:"12px 16px", borderBottom:`1px solid ${C.accentColor}0a` }}>
                            <span style={S.chip((t.is_done||t.done)?"approved":"pending")}>
                              {(t.is_done||t.done)?"Done":"Open"}
                            </span>
                          </td>
                          <td style={{ padding:"12px 16px", borderBottom:`1px solid ${C.accentColor}0a` }}>
                            <button style={{ background:"none", border:"none", color:C.mutedColor, cursor:"pointer", fontSize:15 }}
                              onClick={() => onDeleteTask(t.id)}>✕</button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Training */}
      {tab === "training" && <Training company={company} profile={profile} readOnly/>}
    </div>
  );
}