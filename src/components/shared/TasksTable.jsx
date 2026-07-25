import { S, C } from "../../styles/theme.js";

const BORDER      = `1px solid color-mix(in srgb, var(--clr-text) 16%, transparent)`;
const BORDER_SOFT = `1px solid color-mix(in srgb, var(--clr-text) 9%, transparent)`;

// Shared "All Tasks" table — everyone can view, only the VM Controller can edit (canDelete=true).
export function TasksTable({ tasks, branches = [], showBranchColumn = false, canDelete = false, onDeleteTask }) {
  if (tasks.length === 0) {
    return <div style={{ ...S.muted, textAlign:"center", padding:30 }}>No tasks yet.</div>;
  }

  // Chronological order — earliest scheduled date first (falls back to created_at for legacy rows with no due_date).
  const sorted = [...tasks].sort((a, b) => {
    const da = a.due_date ?? a.created_at ?? "";
    const db = b.due_date ?? b.created_at ?? "";
    return da < db ? -1 : da > db ? 1 : 0;
  });

  const headers = ["Task", ...(showBranchColumn ? ["Branch"] : []), "Priority", "Due", "Controller", "Status", ...(canDelete ? ["Actions"] : [])];

  return (
    <div style={{ ...S.card, padding:0, overflow:"hidden", border:BORDER }}>
      <div style={{ overflowX:"auto" }}>
        <table style={{ width:"100%", borderCollapse:"collapse", minWidth: showBranchColumn ? 720 : 680 }}>
          <thead>
            <tr>
              {headers.map((h, i, arr) => (
                <th key={h} style={{
                  padding:"14px 16px", textAlign:"left", fontSize:13, fontWeight:800,
                  color:C.accentColor, letterSpacing:.5, textTransform:"uppercase",
                  background:C.surfaceHigh, borderBottom:BORDER,
                  borderRight: i < arr.length-1 ? BORDER : "none",
                  whiteSpace:"nowrap",
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((t, i) => {
              const rowBg = i % 2 === 0 ? "transparent" : C.surfaceHigh;
              const cellStyle = { padding:"14px 16px", borderBottom:BORDER_SOFT, borderRight:BORDER_SOFT, background:rowBg };
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
                    {t.due_date
                      ? new Date(t.due_date).toLocaleDateString("en-GB", { weekday:"short", day:"numeric", month:"short" })
                      : t.due_label ?? t.dueDate ?? "—"}
                  </td>
                  <td style={{ ...cellStyle, fontSize:14, fontWeight:600, whiteSpace:"nowrap" }}>
                    {t.controller?.full_name ?? "—"}
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
