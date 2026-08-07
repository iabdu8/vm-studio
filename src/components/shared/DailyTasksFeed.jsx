import { useState } from "react";
import { S, C } from "../../styles/theme.js";
import { PhotoLightbox } from "./PhotoLightbox.jsx";
import { CommentThread } from "./CommentThread.jsx";

// Tasks grouped day-by-day, each one under the VM who actually did it
// (from their submission) — with before/after photos and a comment thread.
// Not a table — the Weekly Plan tab already covers that view.
export function DailyTasksFeed({ tasks, submissions = [], branches = [], profile }) {
  const [lightbox, setLightbox] = useState(null);
  const [openId,   setOpenId]   = useState(null);

  if (tasks.length === 0) {
    return <div style={{ ...S.muted, textAlign:"center", padding:30 }}>No tasks yet.</div>;
  }

  const latestSubFor = (task) => {
    const withPhotos = submissions.filter(s => s.photos?.length);
    const exact = withPhotos.filter(s => s.task_id === task.id);
    const pool = exact.length ? exact : withPhotos.filter(s =>
      !s.task_id &&
      s.branch_id === task.branch_id &&
      s.category_id === task.category_id &&
      (task.assigned_to === "all" || s.submitted_by === task.assigned_to)
    );
    return pool.sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""))[0];
  };

  const orderPhotos = (photos) => [...photos].sort((a, b) => {
    if (a.photo_type !== b.photo_type) return a.photo_type === "before" ? -1 : 1;
    return (a.created_at ?? "").localeCompare(b.created_at ?? "");
  });

  // Group by day (due date, falling back to creation date)
  const dayGroups = {};
  tasks.forEach(t => {
    const key = t.due_date ?? (t.created_at ?? "").slice(0, 10) ?? "Unscheduled";
    (dayGroups[key] ??= []).push(t);
  });
  const days = Object.keys(dayGroups).sort((a, b) => b.localeCompare(a));

  return (
    <div>
      {lightbox && (
        <PhotoLightbox photos={lightbox.photos} index={lightbox.index}
          onClose={() => setLightbox(null)} onIndexChange={i => setLightbox(p => ({ ...p, index:i }))}/>
      )}
      {days.map(day => {
        const dayTasks = dayGroups[day];
        const dateObj = day === "Unscheduled" ? null : new Date(day);
        return (
          <div key={day} style={{ marginBottom:20 }}>
            <div style={{ fontSize:12, fontWeight:700, color:C.accentColor, textTransform:"uppercase",
              letterSpacing:.5, marginBottom:8 }}>
              {dateObj ? dateObj.toLocaleDateString("en-GB", { weekday:"long", day:"numeric", month:"long" }) : "Unscheduled"}
            </div>
            {dayTasks.map(t => {
              const sub = latestSubFor(t);
              const photos = orderPhotos(sub?.photos ?? []).map(p => ({
                ...p, label: p.photo_type === "before" ? "Before" : "After",
              }));
              const vmName = sub?.submitter?.full_name
                ?? (t.assigned_to === "all" ? "All Staff" : "Unassigned");
              const isDone = t.is_done ?? t.done;
              return (
                <div key={t.id} style={{ ...S.card, marginBottom:10 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <div style={{ ...S.avatar(24), flexShrink:0, fontSize:10 }}>
                          {vmName.split(" ").map(x => x[0]).join("").slice(0,2)}
                        </div>
                        <div style={{ fontSize:12, fontWeight:600, color:C.mutedColor }}>{vmName}</div>
                      </div>
                      <div style={{ fontSize:15, fontWeight:700, marginTop:6,
                        color: isDone ? C.mutedColor : C.textColor,
                        textDecoration: isDone ? "line-through" : "none" }}>
                        {t.title ?? t.text}
                      </div>
                      {(t.category?.name || t.subcategory?.name) && (
                        <div style={{ fontSize:12, color:C.accentColor, marginTop:2, fontWeight:600 }}>
                          {t.category?.name ?? "—"}{t.subcategory?.name ? ` · ${t.subcategory.name}` : ""}
                          {branches?.find(b=>b.id===t.branch_id)?.name && ` · 📍 ${branches.find(b=>b.id===t.branch_id).name}`}
                        </div>
                      )}
                    </div>
                    <div style={{ display:"flex", flexDirection:"column", gap:4, alignItems:"flex-end", flexShrink:0 }}>
                      <span style={S.chip(t.priority)}>{t.priority}</span>
                      <span style={S.chip(isDone?"approved":"pending")}>{isDone?"Done":"Open"}</span>
                    </div>
                  </div>

                  {photos.length > 0 && (
                    <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:8 }}>
                      {photos.map((p, idx) => (
                        <img key={idx} loading="lazy" src={p.url} alt=""
                          onClick={() => setLightbox({ photos, index: idx })}
                          style={{ width:64, height:64, objectFit:"cover", borderRadius:8, cursor:"pointer",
                            border:`1px solid ${C.accentColor}33` }}/>
                      ))}
                    </div>
                  )}

                  <button onClick={() => setOpenId(openId === t.id ? null : t.id)}
                    style={{ background:"none", border:"none", color:C.accentColor, cursor:"pointer",
                      fontSize:11, fontWeight:600, padding:0 }}>
                    {openId === t.id ? "Hide comments" : "💬 Comments"}
                  </button>
                  {openId === t.id && <CommentThread taskId={t.id} profile={profile} />}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
