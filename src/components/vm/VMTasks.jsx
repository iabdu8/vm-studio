import { useState, useRef } from "react";
import { S, C } from "../../styles/theme.js";
import { todayStr } from "../../utils.js";
import { ImageUploader } from "../shared/Atoms.jsx";
import { CommentThread } from "../shared/CommentThread.jsx";
import { TasksTable } from "../shared/TasksTable.jsx";
import { Training } from "../manager/Training.jsx";

const BORDER      = `1px solid color-mix(in srgb, var(--clr-text) 16%, transparent)`;
const BORDER_SOFT = `1px solid color-mix(in srgb, var(--clr-text) 9%, transparent)`;

export function VMTasks({ user, categories, branches, tasks, setTasks, onSubmit, onTaskToggle,
  submissions = [], demoHolds = [], onAddDemoHold, onDeleteDemoHold, company, profile }) {

  const [tab,      setTab]      = useState("my");
  const [openTaskId, setOpenTaskId] = useState(null);
  const [catId,    setCatId]    = useState(categories[0]?.id ?? "");
  const [subId,    setSubId]    = useState(categories[0]?.subcategories?.[0]?.id ?? "");
  const [branchId, setBranchId] = useState(user?.branch_id ?? branches[0]?.id ?? "");
  const [before,   setBefore]   = useState([]);
  const [after,    setAfter]    = useState([]);
  const [note,     setNote]     = useState("");
  const [sent,     setSent]     = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [submitTaskId, setSubmitTaskId] = useState(null);

  // Demo Hold state
  const [itemCode,  setItemCode]  = useState("");
  const [location,  setLocation]  = useState("");
  const [demoNote,  setDemoNote]  = useState("");
  const [demoSaved, setDemoSaved] = useState(false);
  const [demoSaving,setDemoSaving]= useState(false);

  const activeCat    = categories.find(c => c.id === catId);
  const activeSubs   = activeCat?.subcategories ?? [];
  const activeSub    = activeSubs.find(s => s.id === subId);
  const activeBranch = branches.find(b => b.id === branchId);

  const myAllTasks = tasks.filter(t =>
    t.assigned_to === "all" || t.assigned_to === user?.id
  );
  const myTasks = tasks.filter(t =>
    t.category_id === catId &&
    (!subId || t.subcategory_id === subId) &&
    (t.assigned_to === "all" || t.assigned_to === user?.id)
  );

  const done  = myAllTasks.filter(t => t.is_done ?? t.done).length;
  const total = myAllTasks.length;

  const changeCat = (id) => {
    setCatId(id);
    setSubId(categories.find(c => c.id === id)?.subcategories?.[0]?.id ?? "");
  };

  const startSubmitFor = (task) => {
    if (task.category_id) { setCatId(task.category_id); setSubId(task.subcategory_id ?? ""); }
    if (task.branch_id) setBranchId(task.branch_id);
    setSubmitTaskId(task.id);
    setTab("submit");
  };

  const handleSubmit = async () => {
    if (!note && !before.length && !after.length) return;
    setSaving(true);
    try {
      await onSubmit({
        task_id:           submitTaskId || null,
        category_id:      catId    || null,
        subcategory_id:   subId    || null,
        branch_id:        branchId || null,
        category_name:    activeCat?.name ?? "",
        subcategory_name: activeSub?.name ?? "",
        branch_name:      activeBranch?.name ?? "",
        before, after, note,
      });
      if (submitTaskId) onTaskToggle(submitTaskId, true);
      setBefore([]); setAfter([]); setNote(""); setSubmitTaskId(null);
      setSent(true); setTimeout(() => setSent(false), 3000);
    } finally { setSaving(false); }
  };

  const handleAddDemo = async () => {
    if (!itemCode.trim()) return;
    setDemoSaving(true);
    await onAddDemoHold({
      item_code: itemCode.trim(),
      note: [location.trim(), demoNote.trim()].filter(Boolean).join(" · "),
    });
    setItemCode(""); setLocation(""); setDemoNote("");
    setDemoSaved(true); setTimeout(() => setDemoSaved(false), 2000);
    setDemoSaving(false);
  };

  const printDemoReport = () => {
    const branch    = profile?.branch?.name ?? "";
    const staffName = profile?.full_name ?? "";
    const date      = new Date().toLocaleDateString("en-GB", { day:"numeric", month:"long", year:"numeric" });
    const time      = new Date().toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" });
    const accent    = "#4F46E5";
    const rows = demoHolds.map((d, i) => `
      <tr style="background:${i%2===0?"#fff":"#f9f9f9"}">
        <td style="padding:10px 14px;border-bottom:1px solid #eee;font-weight:600">${i+1}</td>
        <td style="padding:10px 14px;border-bottom:1px solid #eee;font-weight:700;color:${accent}">${d.item_code}</td>
        <td style="padding:10px 14px;border-bottom:1px solid #eee">${d.note ?? "—"}</td>
        <td style="padding:10px 14px;border-bottom:1px solid #eee;color:#888;font-size:12px">${d.time ?? ""}</td>
      </tr>`).join("");

    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"/>
    <style>
      body { font-family:'DM Sans',sans-serif; color:#1a1a2e; padding:32px; background:#fff; }
      .header { display:flex; justify-content:space-between; padding-bottom:20px; border-bottom:3px solid ${accent}; margin-bottom:28px; }
      .logo-text { font-size:24px; font-weight:700; color:${accent}; }
      table { width:100%; border-collapse:collapse; }
      th { background:${accent}; color:#fff; padding:10px 14px; text-align:left; font-size:11px; font-weight:700; }
      .footer { margin-top:32px; padding-top:16px; border-top:1px solid #e5e7eb; display:flex; justify-content:space-between; font-size:11px; color:#9ca3af; }
      @media print { body { padding:20px; } }
    </style></head><body>
    <div class="header">
      <div><div class="logo-text">Vismo</div><div style="font-size:13px;color:#6b6880;margin-top:4px">${company?.name ?? ""}</div></div>
      <div style="text-align:right"><div style="font-size:11px;font-weight:700;color:${accent};letter-spacing:2px">DEMO HOLD REPORT</div>
      <div style="font-size:12px;color:#6b6880;margin-top:4px">${date} · ${time}</div></div>
    </div>
    <div style="display:flex;gap:32px;margin-bottom:24px">
      <div><div style="font-size:10px;color:#9ca3af;text-transform:uppercase;letter-spacing:1px">Branch</div><div style="font-size:14px;font-weight:600">${branch || "—"}</div></div>
      <div><div style="font-size:10px;color:#9ca3af;text-transform:uppercase;letter-spacing:1px">Prepared by</div><div style="font-size:14px;font-weight:600">${staffName}</div></div>
      <div><div style="font-size:10px;color:#9ca3af;text-transform:uppercase;letter-spacing:1px">Total Items</div><div style="font-size:14px;font-weight:600">${demoHolds.length}</div></div>
    </div>
    <table><thead><tr><th style="width:40px">#</th><th>Item / SKU</th><th>Location · Notes</th><th style="width:80px">Time</th></tr></thead>
    <tbody>${rows}</tbody></table>
    <div class="footer"><span>Vismo · Visual Merchandising</span><span>${company?.name ?? ""} · ${branch}</span></div>
    <script>window.onload=()=>{window.print();window.onafterprint=()=>window.close();}</script>
    </body></html>`;

    const win = window.open("", "_blank", "width=900,height=700");
    win.document.write(html); win.document.close();
  };

  if (categories.length === 0) return (
    <div style={{ ...S.muted, textAlign:"center", padding:40 }}>
      No categories set up yet. Ask your manager to add categories.
    </div>
  );

  return (
    <div>
      <div style={{ ...S.h1, marginBottom:2 }} className="fu">
        My <span style={S.accent}>Tasks</span>
      </div>
      <div style={{ ...S.muted, marginBottom:16, fontSize:12 }}>{todayStr()}</div>

      {/* Tabs */}
      <div style={{ display:"flex", gap:6, marginBottom:14, overflowX:"auto", paddingBottom:2 }}>
        {[["my","📋 My Tasks"],["submit","📤 Submit Work"],["demo","🏷️ Demo Hold"],["training","🎓 Training"]].map(([k,l]) => (
          <button key={k} className="tab-btn" style={S.tab(tab===k)} onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>

      {/* ── MY TASKS ── */}
      {tab === "my" && (
        <div>
          {/* Progress */}
          {myAllTasks.length > 0 && (
            <div style={{ ...S.card, marginBottom:14 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                <div style={S.h3}>Overall Progress</div>
                <span style={{ fontSize:13, fontWeight:700, color: done===total && total>0 ? "#4ade80" : C.accentColor }}>
                  {total ? Math.round((done/total)*100) : 0}%
                </span>
              </div>
              <div style={{ height:5, borderRadius:3, background:C.surfaceHigh }}>
                <div style={{ height:"100%", borderRadius:3, transition:"width .4s",
                  width: total ? `${Math.round((done/total)*100)}%` : "0%",
                  background: done===total && total>0 ? "#4ade80" : C.accentColor }}/>
              </div>
              <div style={{ ...S.muted, fontSize:11, marginTop:6 }}>{done} of {total} tasks completed</div>
            </div>
          )}

          {myAllTasks.length === 0 && (
            <div style={{ ...S.card, textAlign:"center", padding:"32px 20px" }}>
              <div style={{ fontSize:32, marginBottom:12 }}>✅</div>
              <div style={{ ...S.muted }}>No tasks assigned to you yet.</div>
            </div>
          )}

          {myAllTasks.length > 0 && (
            <div style={{ ...S.card, padding:0, overflow:"hidden", border:BORDER }}>
              <div style={{ overflowX:"auto" }}>
                <table style={{ width:"100%", borderCollapse:"collapse", minWidth:680 }}>
                  <thead>
                    <tr>
                      {["Task","Priority","Due","Controller","Status","Actions"].map((h, i, arr) => (
                        <th key={h+i} style={{
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
                    {[...myAllTasks].sort((a, b) => {
                      const da = a.due_date ?? a.created_at ?? "";
                      const db = b.due_date ?? b.created_at ?? "";
                      return da < db ? -1 : da > db ? 1 : 0;
                    }).map((t, i) => {
                      const rowBg = i % 2 === 0 ? "transparent" : C.surfaceHigh;
                      const cellStyle = { padding:"14px 16px", borderBottom:BORDER_SOFT, borderRight:BORDER_SOFT, background:rowBg };
                      const isDone = t.is_done ?? t.done ?? false;
                      const revision = submissions.find(s =>
                        s.status === "revision" && s.submitted_by === user?.id && s.note &&
                        (s.task_id ? s.task_id === t.id : s.category_name === t.category?.name)
                      );
                      return (
                        <>
                          <tr key={t.id}>
                            <td style={{ ...cellStyle, maxWidth:240 }}>
                              <div style={{ fontSize:15, fontWeight:700,
                                color:isDone?C.mutedColor:C.textColor,
                                textDecoration:isDone?"line-through":"none" }}>
                                {t.title ?? t.text}
                              </div>
                              {(t.category?.name || t.subcategory?.name) && (
                                <div style={{ fontSize:12, color:C.accentColor, marginTop:3, fontWeight:600 }}>
                                  {t.category?.name ?? "—"}{t.subcategory?.name ? ` · ${t.subcategory.name}` : ""}
                                </div>
                              )}
                              {revision && (
                                <div style={{ marginTop:6, padding:"6px 10px", borderRadius:8,
                                  background:"#f8717114", border:"1px solid #f8717133" }}>
                                  <div style={{ fontSize:11, fontWeight:700, color:"#f87171" }}>↩ Revision Requested</div>
                                  <div style={{ fontSize:12, marginTop:2, lineHeight:1.4 }}>{revision.note}</div>
                                </div>
                              )}
                            </td>
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
                              <span style={S.chip(isDone?"approved":"pending")}>{isDone?"Done":"Open"}</span>
                            </td>
                            <td style={{ ...cellStyle, borderRight:"none", whiteSpace:"nowrap" }}>
                              <button onClick={() => startSubmitFor(t)}
                                style={{ background:"none", border:"none", color:C.accentColor, cursor:"pointer",
                                  fontSize:15, padding:0, marginRight:14 }}>
                                📤
                              </button>
                              <button onClick={() => setOpenTaskId(openTaskId === t.id ? null : t.id)}
                                style={{ background:"none", border:"none", color:C.accentColor, cursor:"pointer",
                                  fontSize:15, padding:0 }}>
                                💬
                              </button>
                            </td>
                          </tr>
                          {openTaskId === t.id && (
                            <tr key={t.id+"-c"}>
                              <td colSpan={6} style={{ padding:"0 16px 14px", background:rowBg, borderBottom:BORDER_SOFT }}>
                                <CommentThread taskId={t.id} profile={profile} />
                              </td>
                            </tr>
                          )}
                        </>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── SUBMIT WORK ── */}
      {tab === "submit" && (
        <div>
          {submitTaskId && (
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
              padding:"10px 14px", background:C.accentColor+"14", border:`1px solid ${C.accentColor}33`,
              borderRadius:10, marginBottom:14, fontSize:12 }}>
              <span>📌 Submitting for: <strong>{myAllTasks.find(t => t.id === submitTaskId)?.title ?? "selected task"}</strong></span>
              <button onClick={() => setSubmitTaskId(null)}
                style={{ background:"none", border:"none", color:C.mutedColor, cursor:"pointer", fontSize:11 }}>✕ Clear</button>
            </div>
          )}
          <div style={{ display:"flex", gap:6, marginBottom:14, overflowX:"auto", paddingBottom:2 }}>
            {categories.map(c => (
              <button key={c.id} className="tab-btn" style={S.tab(catId===c.id)} onClick={() => changeCat(c.id)}>
                {c.name}
              </button>
            ))}
          </div>

          {activeSubs.length > 0 && (
            <div style={S.card}>
              <div style={S.h3}>Section</div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:7 }}>
                {activeSubs.map(s => (
                  <button key={s.id} className="pill-btn" onClick={() => setSubId(s.id)} style={{
                    padding:"6px 13px", borderRadius:20, cursor:"pointer", fontSize:12, fontWeight:600,
                    background:subId===s.id?C.accentColor+"28":"transparent",
                    color:subId===s.id?C.accentColor:C.mutedColor,
                    border:subId===s.id?`1px solid ${C.accentColor}55`:`1px solid ${C.mutedColor}22`,
                  }}>{s.name}</button>
                ))}
              </div>
            </div>
          )}

          {myTasks.length > 0 && (
            <div style={S.card}>
              <div style={S.h3}>Instructions for this section</div>
              {myTasks.map(t => (
                <div key={t.id} style={{ display:"flex", gap:10, alignItems:"flex-start", marginBottom:9 }}>
                  <input type="checkbox" checked={t.is_done ?? t.done ?? false}
                    style={{ marginTop:3, accentColor:C.accentColor }}
                    onChange={() => onTaskToggle(t.id, !(t.is_done ?? t.done))}/>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13,
                      color:(t.is_done||t.done)?C.mutedColor:C.textColor,
                      textDecoration:(t.is_done||t.done)?"line-through":"none" }}>
                      {t.title ?? t.text}
                    </div>
                    <div style={{ display:"flex", gap:6, marginTop:4 }}>
                      <span style={S.chip(t.priority)}>{t.priority}</span>
                      <span style={{ ...S.muted, fontSize:11 }}>Due: {t.due_label ?? t.dueDate}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={S.card}>
            <div style={{ ...S.h2, marginBottom:14 }}>
              {activeCat?.name ?? "—"}
              {activeSub ? ` · ${activeSub.name}` : ""}
              {activeBranch ? <span style={{ ...S.muted, fontSize:13 }}> · {activeBranch.name}</span> : null}
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 }}>
              <ImageUploader label="Before" files={before} onChange={setBefore}/>
              <ImageUploader label="After"  files={after}  onChange={setAfter}/>
            </div>
            <div style={S.lbl}>Notes / Feedback</div>
            <textarea style={{ ...S.inp, resize:"vertical", minHeight:76 }}
              placeholder="Describe what was done, any issues…"
              value={note} onChange={e => setNote(e.target.value)}/>
            {sent && <div style={{ color:"#4ade80", fontSize:13, marginBottom:8 }}>✓ Submitted!</div>}
            <button className="btnP" style={{ ...S.btnP, width:"100%" }}
              onClick={handleSubmit} disabled={saving}>
              {saving ? "Submitting…" : "Submit Implementation →"}
            </button>
          </div>
        </div>
      )}

      {/* ── DEMO HOLD ── */}
      {tab === "demo" && (
        <div>
          <div style={S.card}>
            <div style={S.h3}>Add Item</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              <div>
                <div style={S.lbl}>Item / SKU Code *</div>
                <input style={S.inp} placeholder="e.g. 123456"
                  value={itemCode} onChange={e => setItemCode(e.target.value)}
                  onKeyDown={e => e.key==="Enter" && handleAddDemo()}/>
              </div>
              <div>
                <div style={S.lbl}>Location</div>
                <input style={S.inp} placeholder="e.g. Window Display A"
                  value={location} onChange={e => setLocation(e.target.value)}/>
              </div>
            </div>
            <div style={S.lbl}>Notes (optional)</div>
            <input style={S.inp} placeholder="e.g. Mannequin outfit"
              value={demoNote} onChange={e => setDemoNote(e.target.value)}
              onKeyDown={e => e.key==="Enter" && handleAddDemo()}/>
            {demoSaved && <div style={{ color:"#4ade80", fontSize:12, marginBottom:8 }}>✓ Added!</div>}
            <button className="btnP" style={{ ...S.btnP, width:"100%" }}
              onClick={handleAddDemo} disabled={demoSaving}>
              {demoSaving ? "Adding…" : "＋ Add to Hold"}
            </button>
          </div>

          {demoHolds.length > 0 && (
            <div style={S.card}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
                <div style={S.h3}>On Hold ({demoHolds.length} items)</div>
                <button className="btnP" style={{ ...S.btnP, fontSize:12, padding:"7px 14px" }}
                  onClick={printDemoReport}>🖨️ Print</button>
              </div>
              {demoHolds.map((d, i) => (
                <div key={d.id ?? i} style={{ display:"flex", alignItems:"center", gap:12,
                  padding:"10px 0", borderBottom:`1px solid ${C.accentColor}0a` }}>
                  <div style={{ fontSize:16, fontWeight:700, color:C.accentColor,
                    width:24, flexShrink:0, textAlign:"center" }}>{i+1}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:14, fontWeight:700 }}>{d.item_code}</div>
                    {d.note && <div style={{ ...S.muted, fontSize:12, marginTop:2 }}>{d.note}</div>}
                  </div>
                  <div style={{ ...S.muted, fontSize:11, flexShrink:0 }}>{d.time ?? ""}</div>
                  {onDeleteDemoHold && (
                    <button onClick={() => onDeleteDemoHold(d.id)}
                      style={{ background:"none", border:"none", color:C.mutedColor,
                        cursor:"pointer", fontSize:14 }}>✕</button>
                  )}
                </div>
              ))}
            </div>
          )}

          {demoHolds.length === 0 && (
            <div style={{ ...S.muted, textAlign:"center", padding:30 }}>No items on hold yet.</div>
          )}
        </div>
      )}

      {/* ── TRAINING (view only) ── */}
      {tab === "training" && <Training company={company} profile={profile} readOnly />}
    </div>
  );
}