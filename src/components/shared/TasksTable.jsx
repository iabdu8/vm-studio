import { useState } from "react";
import { S, C } from "../../styles/theme.js";
import { CommentThread } from "./CommentThread.jsx";

// Shared "All Tasks" table — everyone can view, only the VM Controller can edit (canDelete=true).
export function TasksTable({ tasks, staff = [], branches = [], showBranchColumn = false, profile, canDelete = false, onDeleteTask }) {
  const [openTaskId, setOpenTaskId] = useState(null);

  if (tasks.length === 0) {
    return <div style={{ ...S.muted, textAlign:"center", padding:30 }}>No tasks yet.</div>;
  }

  const headers = ["Task", ...(showBranchColumn ? ["Branch"] : []), "Priority", "Due", "Assigned To", "Status", ...(canDelete ? ["Actions"] : [])];

  return (
    <div style={{ ...S.card, padding:0, overflow:"hidden", border:`1px solid ${C.accentColor}33` }}>
      <div style={{ overflowX:"auto" }}>
        <table style={{ width:"100%", borderCollapse:"collapse", minWidth: showBranchColumn ? 720 : 680 }}>
          <thead>
            <tr>
              {headers.map((h, i, arr) => (
                <th key={h} style={{
                  padding:"14px 16px", textAlign:"left", fontSize:13, fontWeight:800,
                  color:C.accentColor, letterSpacing:.5, textTransform:"uppercase",
                  background:C.surfaceHigh, borderBottom:`2px solid ${C.accentColor}44`,
                  borderRight: i < arr.length-1 ? `1px solid ${C.accentColor}22` : "none",
                  whiteSpace:"nowrap",
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tasks.map((t, i) => {
              const assignee = t.assigned_to === "all" ? "All Staff"
                : staff.find(s => s.id === t.assigned_to)?.full_name ?? "—";
              const rowBg = i % 2 === 0 ? "transparent" : C.surfaceHigh + "55";
              const cellStyle = { padding:"14px 16px", borderBottom:`1px solid ${C.accentColor}22`, borderRight:`1px solid ${C.accentColor}14`, background:rowBg };
              return (
                <tr key={t.id}>
                  <td style={{ ...cellStyle, maxWidth:240 }}>
                    <div style={{ fontSize:15, fontWeight:700,
                      color:(t.is_done||t.done)?C.mutedColor:C.textColor,
                      textDecoration:(t.is_done||t.done)?"line-through":"none" }}>
                      {t.title ?? t.text}
                    </div>
                    {(t.category?.name || t.subcategory?.name) && (
                      <div style={{ fontSize:12, color:C.accentColor, marginTop:3, fontWeight:600 }}>
                        {t.category?.name ?? "—"}{t.subcategory?.name ? ` · ${t.subcategory.name}` : ""}
                      </div>
                    )}
                    <button onClick={() => setOpenTaskId(openTaskId === t.id ? null : t.id)}
                      style={{ background:"none", border:"none", color:C.accentColor, cursor:"pointer",
                        fontSize:12, fontWeight:700, padding:0, marginTop:7 }}>
                      {openTaskId === t.id ? "Hide comments" : "💬 Comments"}
                    </button>
                    {openTaskId === t.id && profile && <CommentThread taskId={t.id} profile={profile} />}
                  </td>
                  {showBranchColumn && (
                    <td style={{ ...cellStyle, fontSize:14, color:C.mutedColor, fontWeight:600, whiteSpace:"nowrap" }}>
                      {branches?.find(b=>b.id===t.branch_id)?.name ?? "—"}
                    </td>
                  )}
                  <td style={cellStyle}>
                    <span style={S.chip(t.priority)}>{t.priority}</span>
                  </td>
                  <td style={{ ...cellStyle, fontSize:14, color:C.mutedColor, fontWeight:600, whiteSpace:"nowrap" }}>
                    {t.due_label ?? t.dueDate ?? "—"}
                  </td>
                  <td style={{ ...cellStyle, fontSize:14, fontWeight:600, whiteSpace:"nowrap" }}>
                    {assignee}
                  </td>
                  <td style={{ ...cellStyle, borderRight: canDelete ? cellStyle.borderRight : "none" }}>
                    <span style={S.chip((t.is_done||t.done)?"approved":"pending")}>
                      {(t.is_done||t.done)?"Done":"Open"}
                    </span>
                  </td>
                  {canDelete && (
                    <td style={{ ...cellStyle, borderRight:"none" }}>
                      <button style={{ background:"none", border:"none", color:C.mutedColor, cursor:"pointer", fontSize:17 }}
                        onClick={() => onDeleteTask(t.id)}>✕</button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
