import { useState, useRef } from "react";
import { S, C } from "../../styles/theme.js";
import { ImageUploader } from "../shared/Atoms.jsx";
import { GuidelinesGrid } from "../shared/Guidelines.jsx";

function FloorWalkUpload({ onAdd }) {
  const [note,   setNote]   = useState("");
  const [photos, setPhotos] = useState([]);
  const [saving, setSaving] = useState(false);
  const [done,   setDone]   = useState(false);

  const submit = async () => {
    if (!note.trim() && !photos.length) return;
    setSaving(true);
    await onAdd({ note, photos });
    setNote(""); setPhotos([]); setDone(true);
    setTimeout(() => setDone(false), 3000);
    setSaving(false);
  };

  return (
    <div style={S.card}>
      <div style={S.h3}>Add Floor Walk</div>
      <div style={S.lbl}>Instructions / Notes</div>
      <textarea style={{ ...S.inp, minHeight:80, resize:"vertical" }}
        placeholder="Write floor walk instructions for the team…"
        value={note} onChange={e => setNote(e.target.value)}/>
      <ImageUploader label="Reference Photos" max={20} files={photos} onChange={setPhotos}/>
      {done && <div style={{ color:"#4ade80", fontSize:12, marginBottom:8 }}>✓ Floor walk added!</div>}
      <button className="btnP" style={{ ...S.btnP, width:"100%" }}
        onClick={submit} disabled={saving}>
        {saving ? "Saving…" : "Publish Floor Walk →"}
      </button>
    </div>
  );
}

export function MgrAssign({ tasks, categories, guidelines, floorWalks, onCreateTask, onDeleteTask, onUploadGuideline, onAddFloorWalk }) {
  const [tab,      setTab]      = useState("add");
  const [catId,    setCatId]    = useState(categories[0]?.id ?? "");
  const [subId,    setSubId]    = useState(categories[0]?.subcategories?.[0]?.id ?? "");
  const [text,     setText]     = useState("");
  const [priority, setPriority] = useState("medium");
  const [dueDate,  setDueDate]  = useState("Today");
  const [gTitle,   setGTitle]   = useState("");
  const [gCat,     setGCat]     = useState("General");
  const [gFile,    setGFile]    = useState(null);
  const [saving,   setSaving]   = useState(false);
  const gFileRef = useRef();

  const activeCat  = categories.find(c => c.id === catId);
  const activeSubs = activeCat?.subcategories ?? [];

  const changeCat = (id) => {
    setCatId(id);
    const cat = categories.find(c => c.id === id);
    setSubId(cat?.subcategories?.[0]?.id ?? "");
  };

  const addTask = async () => {
    if (!text.trim()) return;
    setSaving(true);
    try {
      await onCreateTask({ category_id: catId||null, subcategory_id: subId||null,
        title: text, priority, due_label: dueDate, assigned_to: "all" });
      setText("");
    } finally { setSaving(false); }
  };

  const uploadGuide = async () => {
    if (!gTitle.trim()) return;
    setSaving(true);
    try {
      await onUploadGuideline(gTitle, gCat, gFile);
      setGTitle(""); setGFile(null);
    } finally { setSaving(false); }
  };

  return (
    <div>
      <div style={{ ...S.h1, marginBottom:2 }} className="fu">
        Task <span style={S.accent}>Assignment</span>
      </div>

      <div style={{ display:"flex", gap:6, marginBottom:14, flexWrap:"wrap" }}>
        {[["add","＋ New Task"],["all","All Tasks"],["floor","🚶 Floor Walk"],["guides","📖 Guidelines"]].map(([k,l]) => (
          <button key={k} className="tab-btn" style={S.tab(tab===k)} onClick={()=>setTab(k)}>{l}</button>
        ))}
      </div>

      {/* New Task */}
      {tab === "add" && (
        <div style={S.card}>
          <div style={S.h3}>Category</div>
          <div style={{ display:"flex", gap:6, marginBottom:14, flexWrap:"wrap" }}>
            {categories.map(c => (
              <button key={c.id} className="pill-btn" onClick={() => changeCat(c.id)} style={{
                padding:"7px 13px", borderRadius:20, cursor:"pointer", fontSize:12, fontWeight:600,
                background: catId===c.id ? C.accentColor+"28" : "transparent",
                color:      catId===c.id ? C.accentColor : C.mutedColor,
                border:     catId===c.id ? `1px solid ${C.accentColor}55` : `1px solid ${C.mutedColor}22`,
                transition:"all .2s",
              }}>{c.icon} {c.name}</button>
            ))}
          </div>
          {activeSubs.length > 0 && (
            <>
              <div style={S.lbl}>Section</div>
              <select style={S.sel} value={subId} onChange={e => setSubId(e.target.value)}>
                {activeSubs.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </>
          )}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <div>
              <div style={S.lbl}>Priority</div>
              <select style={S.sel} value={priority} onChange={e => setPriority(e.target.value)}>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div>
              <div style={S.lbl}>Due</div>
              <select style={S.sel} value={dueDate} onChange={e => setDueDate(e.target.value)}>
                <option>Today</option>
                <option>Tomorrow</option>
                <option>This week</option>
                <option>Next week</option>
              </select>
            </div>
          </div>
          <div style={S.lbl}>Task Description</div>
          <textarea style={{ ...S.inp, minHeight:76, resize:"vertical" }}
            placeholder="Describe the task clearly…"
            value={text} onChange={e => setText(e.target.value)}/>
          <button className="btnP" style={{ ...S.btnP, width:"100%" }}
            onClick={addTask} disabled={saving}>
            {saving ? "Saving…" : "Assign to All Branches →"}
          </button>
        </div>
      )}

      {/* All Tasks */}
      {tab === "all" && (
        <div>
          {tasks.length === 0 && <div style={{ ...S.muted, textAlign:"center", padding:30 }}>No tasks yet.</div>}
          {tasks.map(t => (
            <div key={t.id} style={{ ...S.card, marginBottom:10 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:11, color:C.accentColor, fontWeight:600, marginBottom:4 }}>
                    {t.category?.icon} {t.category?.name ?? "—"} · {t.subcategory?.name ?? "—"}
                  </div>
                  <div style={{ fontSize:13, color:(t.is_done||t.done)?C.mutedColor:C.textColor,
                    textDecoration:(t.is_done||t.done)?"line-through":"none" }}>
                    {t.title ?? t.text}
                  </div>
                  <div style={{ display:"flex", gap:6, marginTop:6 }}>
                    <span style={S.chip(t.priority)}>{t.priority}</span>
                    <span style={{ ...S.muted, fontSize:11 }}>Due: {t.due_label ?? t.dueDate}</span>
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

      {/* Floor Walk */}
      {tab === "floor" && (
        <div>
          <FloorWalkUpload onAdd={onAddFloorWalk}/>
          {/* Previous floor walks */}
          {floorWalks?.length > 0 && (
            <div style={S.card}>
              <div style={S.h3}>Previous Floor Walks ({floorWalks.length})</div>
              {floorWalks.map((fw, i) => (
                <div key={i} style={{ padding:"10px 0", borderBottom:`1px solid ${C.accentColor}0a` }}>
                  {fw.note && <div style={{ fontSize:13, marginBottom:6 }}>{fw.note}</div>}
                  {fw.photos?.length > 0 && (
                    <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                      {fw.photos.map((p, j) => (
                        <img key={j} src={p.url ?? p} alt=""
                          style={{ width:60, height:60, objectFit:"cover", borderRadius:6,
                            border:`1px solid ${C.accentColor}22` }}/>
                      ))}
                    </div>
                  )}
                  <div style={{ ...S.muted, fontSize:11, marginTop:4 }}>{fw.date ?? ""}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Guidelines */}
      {tab === "guides" && (
        <div>
          <div style={S.card}>
            <div style={S.h3}>Upload New Guideline</div>
            <div style={S.lbl}>Title</div>
            <input style={S.inp} placeholder="Guideline title"
              value={gTitle} onChange={e => setGTitle(e.target.value)}/>
            <div style={S.lbl}>Category</div>
            <select style={S.sel} value={gCat} onChange={e => setGCat(e.target.value)}>
              {["General","Brand","Display","Seasonal"].map(c => <option key={c}>{c}</option>)}
            </select>
            <div style={S.lbl}>File (PDF or Image)</div>
            <div style={{ ...S.uploadZ, marginBottom:12 }} onClick={() => gFileRef.current.click()}>
              {gFile ? `✓ ${gFile.name}` : "＋ Tap to select file"}
              <input ref={gFileRef} type="file" accept=".pdf,image/*"
                style={{ display:"none" }} onChange={e => setGFile(e.target.files[0] ?? null)}/>
            </div>
            <button className="btnP" style={{ ...S.btnP, width:"100%" }}
              onClick={uploadGuide} disabled={saving}>
              {saving ? "Uploading…" : "Publish to Team →"}
            </button>
          </div>
          <div style={{ ...S.h3, marginTop:4, marginBottom:10 }}>Published ({guidelines.length})</div>
          <GuidelinesGrid guidelines={guidelines}/>
        </div>
      )}
    </div>
  );
}