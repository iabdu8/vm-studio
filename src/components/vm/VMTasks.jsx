import { useState, useRef } from "react";
import { S, C } from "../../styles/theme.js";
import { todayStr } from "../../utils.js";
import { ImageUploader } from "../shared/Atoms.jsx";

export function VMTasks({ user, categories, branches, tasks, setTasks, onSubmit, onTaskToggle,
  submissions = [], demoHolds = [], onAddDemoHold, onDeleteDemoHold, company, profile }) {

  const [tab,      setTab]      = useState("my");
  const [catId,    setCatId]    = useState(categories[0]?.id ?? "");
  const [subId,    setSubId]    = useState(categories[0]?.subcategories?.[0]?.id ?? "");
  const [branchId, setBranchId] = useState(user?.branch_id ?? branches[0]?.id ?? "");
  const [before,   setBefore]   = useState([]);
  const [after,    setAfter]    = useState([]);
  const [note,     setNote]     = useState("");
  const [sent,     setSent]     = useState(false);
  const [saving,   setSaving]   = useState(false);

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

  const handleSubmit = async () => {
    if (!note && !before.length && !after.length) return;
    setSaving(true);
    try {
      await onSubmit({
        category_id:      catId    || null,
        subcategory_id:   subId    || null,
        branch_id:        branchId || null,
        category_name:    activeCat?.name ?? "",
        subcategory_name: activeSub?.name ?? "",
        branch_name:      activeBranch?.name ?? "",
        before, after, note,
      });
      setBefore([]); setAfter([]); setNote("");
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
        {[["my","📋 My Tasks"],["submit","📤 Submit Work"],["demo","🏷️ Demo Hold"]].map(([k,l]) => (
          <button key={k} className="tab-btn" style={S.tab(tab===k)} onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>

      {/* ── MY TASKS ── */}
      {tab === "my" && (
        <div>
          {/* Revision notes */}
          {(() => {
            const revisions = submissions.filter(s =>
              s.status === "revision" && s.submitted_by === user?.id && s.note
            );
            if (!revisions.length) return null;
            return (
              <div style={{ ...S.card, borderLeft:"4px solid #f87171", background:"#f8717108" }}>
                <div style={{ ...S.h3, color:"#f87171", marginBottom:10 }}>↩ Revision Requested</div>
                {revisions.map((s, i) => (
                  <div key={i} style={{ padding:"10px 0", borderBottom: i < revisions.length-1 ? "1px solid #f8717122" : "none" }}>
                    <div style={{ fontSize:12, color:"#f87171", fontWeight:600, marginBottom:4 }}>
                      {s.category_name ?? ""}{s.subcategory_name ? " · " + s.subcategory_name : ""}
                    </div>
                    <div style={{ fontSize:13, lineHeight:1.5 }}>{s.note}</div>
                    <div style={{ fontSize:11, color:"#9ca3af", marginTop:4 }}>
                      {s.reviewed_at ? new Date(s.reviewed_at).toLocaleDateString("en-GB", { day:"numeric", month:"short", hour:"2-digit", minute:"2-digit" }) : ""}
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}

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

          {categories.map(cat => {
            const catTasks = myAllTasks.filter(t => t.category_id === cat.id);
            if (!catTasks.length) return null;
            return (
              <div key={cat.id} style={S.card}>
                <div style={{ ...S.h3, marginBottom:10 }}>{cat.icon} {cat.name}</div>
                {catTasks.map(t => (
                  <div key={t.id} style={{ display:"flex", gap:10, alignItems:"flex-start",
                    padding:"9px 0", borderBottom:`1px solid ${C.accentColor}0a` }}>
                    <input type="checkbox" checked={t.is_done ?? t.done ?? false}
                      style={{ marginTop:3, accentColor:C.accentColor }}
                      onChange={() => onTaskToggle(t.id, !(t.is_done ?? t.done))}/>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13,
                        color:(t.is_done||t.done)?C.mutedColor:C.textColor,
                        textDecoration:(t.is_done||t.done)?"line-through":"none" }}>
                        {t.title ?? t.text}
                      </div>
                      <div style={{ display:"flex", gap:6, marginTop:4, flexWrap:"wrap" }}>
                        <span style={S.chip(t.priority)}>{t.priority}</span>
                        <span style={{ ...S.muted, fontSize:11 }}>Due: {t.due_label ?? t.dueDate}</span>
                        {t.assigned_to !== "all" && (
                          <span style={{ fontSize:11, color:"#818cf8" }}>👤 Assigned to you</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            );
          })}

          {(() => {
            const uncatTasks = myAllTasks.filter(t => !t.category_id);
            if (!uncatTasks.length) return null;
            return (
              <div style={S.card}>
                <div style={S.h3}>General</div>
                {uncatTasks.map(t => (
                  <div key={t.id} style={{ display:"flex", gap:10, alignItems:"flex-start",
                    padding:"9px 0", borderBottom:`1px solid ${C.accentColor}0a` }}>
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
                        <span style={{ ...S.muted, fontSize:11 }}>Due: {t.due_label}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      )}

      {/* ── SUBMIT WORK ── */}
      {tab === "submit" && (
        <div>
          {branches.length > 1 && (
            <div style={S.card}>
              <div style={S.h3}>Branch</div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:7 }}>
                {branches.map(b => (
                  <button key={b.id} className="pill-btn" onClick={() => setBranchId(b.id)} style={{
                    padding:"6px 13px", borderRadius:20, cursor:"pointer", fontSize:12, fontWeight:600,
                    background:branchId===b.id?C.accentColor+"28":"transparent",
                    color:branchId===b.id?C.accentColor:C.mutedColor,
                    border:branchId===b.id?`1px solid ${C.accentColor}55`:`1px solid ${C.mutedColor}22`,
                  }}>{b.name}</button>
                ))}
              </div>
            </div>
          )}

          <div style={{ display:"flex", gap:6, marginBottom:14, overflowX:"auto", paddingBottom:2 }}>
            {categories.map(c => (
              <button key={c.id} className="tab-btn" style={S.tab(catId===c.id)} onClick={() => changeCat(c.id)}>
                {c.icon} {c.name}
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
              {activeCat?.icon} {activeCat?.name ?? "—"}
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
    </div>
  );
}