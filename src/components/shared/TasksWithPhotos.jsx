import { useState } from "react";
import { S, C } from "../../styles/theme.js";
import { PhotoLightbox } from "./PhotoLightbox.jsx";

const BORDER      = `1px solid color-mix(in srgb, var(--clr-text) 16%, transparent)`;
const BORDER_SOFT = `1px solid color-mix(in srgb, var(--clr-text) 9%, transparent)`;

// Same table as TasksTable, plus a Photos column pulling the latest linked
// submission's before/after shots — click any thumbnail for the full lightbox.
export function TasksWithPhotos({ tasks, submissions = [], branches = [], showBranchColumn = false }) {
  const [lightbox, setLightbox] = useState(null); // { photos, index }

  if (tasks.length === 0) {
    return <div style={{ ...S.muted, textAlign:"center", padding:30 }}>No tasks yet.</div>;
  }

  const sorted = [...tasks].sort((a, b) => {
    const da = a.due_date ?? a.created_at ?? "";
    const db = b.due_date ?? b.created_at ?? "";
    return da < db ? -1 : da > db ? 1 : 0;
  });

  const latestSubFor = (taskId) => submissions
    .filter(s => s.task_id === taskId && s.photos?.length)
    .sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""))[0];

  const headers = ["Task", ...(showBranchColumn ? ["Branch"] : []), "Priority", "Due", "Controller", "Status", "Photos"];

  return (
    <>
      {lightbox && (
        <PhotoLightbox photos={lightbox.photos} index={lightbox.index}
          onClose={() => setLightbox(null)} onIndexChange={i => setLightbox(p => ({ ...p, index:i }))}/>
      )}
      <div style={{ ...S.card, padding:0, overflow:"hidden", border:BORDER }}>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", minWidth: showBranchColumn ? 780 : 740 }}>
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
                const sub = latestSubFor(t.id);
                const photos = (sub?.photos ?? []).map(p => ({
                  ...p, label: p.photo_type === "before" ? "Before" : "After",
                }));
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
                    <td style={cellStyle}>
                      <span style={S.chip((t.is_done||t.done)?"approved":"pending")}>
                        {(t.is_done||t.done)?"Done":"Open"}
                      </span>
                    </td>
                    <td style={{ ...cellStyle, borderRight:"none" }}>
                      {photos.length > 0 ? (
                        <div style={{ display:"flex", gap:4 }}>
                          {photos.slice(0, 3).map((p, idx) => (
                            <img key={idx} loading="lazy" src={p.url} alt=""
                              onClick={() => setLightbox({ photos, index: idx })}
                              style={{ width:36, height:36, objectFit:"cover", borderRadius:6, cursor:"pointer",
                                border:`1px solid ${C.accentColor}33` }}/>
                          ))}
                          {photos.length > 3 && (
                            <div onClick={() => setLightbox({ photos, index:3 })}
                              style={{ width:36, height:36, borderRadius:6, background:C.surfaceHigh, cursor:"pointer",
                                display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, color:C.mutedColor }}>
                              +{photos.length - 3}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span style={{ fontSize:12, color:C.mutedColor }}>—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
