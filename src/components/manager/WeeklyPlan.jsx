import { useState, useEffect } from "react";
import { S, C } from "../../styles/theme.js";
import { supabase } from "../../lib/supabase.js";

// ============================================================
//  WEEKLY STORE PLAN — Grid View
//  Staff × Days matrix
// ============================================================

const STATUS_COLORS = {
  pending:     { bg:"#6b688018", color:"#6b6880", label:"—" },
  in_progress: { bg:"#d4a82a18", color:"#d4a82a", label:"●" },
  done:        { bg:"#4ade8018", color:"#4ade80", label:"✓" },
};

const getWeekDates = (weekStartStr) => {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStartStr);
    d.setDate(d.getDate() + i);
    return {
      index: i,
      short: d.toLocaleDateString("en-GB", { weekday:"short" }),
      date:  d.toLocaleDateString("en-GB", { day:"numeric", month:"short" }),
    };
  });
};

const getWeekStart = (offset = 0) => {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) + offset * 7;
  d.setDate(diff);
  return d.toISOString().slice(0, 10);
};

export function WeeklyPlan({ company, categories, branches, profile }) {
  const [activePlan,     setActivePlan]     = useState(null);
  const [items,          setItems]          = useState([]);
  const [staff,          setStaff]          = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(branches[0]?.id ?? "");
  const [creating,       setCreating]       = useState(false);
  const [loading,        setLoading]        = useState(false);

  // Add item modal
  const [showAdd,    setShowAdd]    = useState(false);
  const [addStaff,   setAddStaff]   = useState("");
  const [addDay,     setAddDay]     = useState(0);
  const [addTitle,   setAddTitle]   = useState("");
  const [addCat,     setAddCat]     = useState("");
  const [saving,     setSaving]     = useState(false);

  const weekStart = getWeekStart(0);
  const weekDates = getWeekDates(weekStart);

  useEffect(() => {
    if (!company) return;
    // Load VM staff
    supabase.from("profiles")
      .select("id, full_name")
      .eq("company_id", company.id)
      .in("role", ["vm", "store_manager"])
      .then(({ data }) => setStaff(data ?? []));
  }, [company?.id]);

  useEffect(() => {
    if (!selectedBranch || !company) return;
    loadPlan();
  }, [selectedBranch, company?.id]);

  const loadPlan = async () => {
    setLoading(true);
    const { data: plan } = await supabase
      .from("weekly_plans")
      .select("*")
      .eq("company_id", company.id)
      .eq("branch_id", selectedBranch)
      .eq("week_start", weekStart)
      .single();

    if (plan) {
      setActivePlan(plan);
      await loadItems(plan.id);
    } else {
      setActivePlan(null);
      setItems([]);
    }
    setLoading(false);
  };

  const loadItems = async (plan_id) => {
    const { data } = await supabase
      .from("weekly_plan_items")
      .select("*, category:categories(name, icon), assigned_staff:assigned_staff_id(id, full_name)")
      .eq("plan_id", plan_id)
      .order("sort_order");
    setItems(data ?? []);
  };

  const createPlan = async () => {
    setCreating(true);
    const { data } = await supabase
      .from("weekly_plans")
      .insert({ company_id: company.id, branch_id: selectedBranch,
        created_by: profile.id, week_start: weekStart })
      .select().single();
    if (data) { setActivePlan(data); setItems([]); }
    setCreating(false);
  };

  const copyLastWeek = async () => {
    const lastWeekStart = getWeekStart(-1);
    const { data: lastPlan } = await supabase
      .from("weekly_plans").select("id")
      .eq("company_id", company.id).eq("branch_id", selectedBranch)
      .eq("week_start", lastWeekStart).single();
    if (!lastPlan) { alert("No plan found for last week."); return; }
    const { data: lastItems } = await supabase
      .from("weekly_plan_items").select("*").eq("plan_id", lastPlan.id);
    if (!lastItems?.length) { alert("Last week's plan is empty."); return; }
    setCreating(true);
    const { data: newPlan } = await supabase
      .from("weekly_plans")
      .insert({ company_id: company.id, branch_id: selectedBranch,
        created_by: profile.id, week_start: weekStart })
      .select().single();
    if (newPlan) {
      await supabase.from("weekly_plan_items").insert(
        lastItems.map(i => ({ ...i, id: undefined, plan_id: newPlan.id, status: "pending" }))
      );
      setActivePlan(newPlan);
      await loadItems(newPlan.id);
    }
    setCreating(false);
  };

  const addItem = async () => {
    if (!addTitle.trim() || !addStaff || !activePlan) return;
    setSaving(true);
    const { data } = await supabase
      .from("weekly_plan_items")
      .insert({
        plan_id:           activePlan.id,
        title:             addTitle,
        category_id:       addCat || null,
        day_of_week:       addDay,
        assigned_staff_id: addStaff,
        sort_order:        items.length,
      })
      .select("*, category:categories(name, icon), assigned_staff:assigned_staff_id(id, full_name)")
      .single();
    if (data) setItems(p => [...p, data]);
    setAddTitle(""); setShowAdd(false);
    setSaving(false);
  };

  const toggleStatus = async (item) => {
    const next = item.status === "pending" ? "in_progress"
      : item.status === "in_progress" ? "done" : "pending";
    await supabase.from("weekly_plan_items").update({ status: next }).eq("id", item.id);
    setItems(p => p.map(i => i.id === item.id ? { ...i, status: next } : i));
  };

  const deleteItem = async (id) => {
    await supabase.from("weekly_plan_items").delete().eq("id", id);
    setItems(p => p.filter(i => i.id !== id));
  };

  // ── Build staff × days grid ──────────────────────────────
  // Only staff who have items in this plan
  const staffWithItems = staff.filter(s =>
    items.some(i => i.assigned_staff_id === s.id || i.assigned_staff?.id === s.id)
  );

  const getCell = (staffId, dayIndex) =>
    items.filter(i =>
      (i.assigned_staff_id === staffId || i.assigned_staff?.id === staffId)
      && i.day_of_week === dayIndex
    );

  const done = items.filter(i => i.status === "done").length;
  const pct  = items.length ? Math.round((done / items.length) * 100) : 0;

  return (
    <div>
      <div style={{ ...S.h1, marginBottom:2 }} className="fu">
        Weekly <span style={S.accent}>Store Plan</span>
      </div>
      <div style={{ ...S.muted, marginBottom:16, fontSize:12 }}>
        {weekDates[0].date} — {weekDates[6].date} · {branches.find(b=>b.id===selectedBranch)?.name ?? ""}
      </div>

      {/* Branch selector */}
      {branches.length > 1 && (
        <div style={{ display:"flex", flexWrap:"wrap", gap:7, marginBottom:14 }}>
          {branches.map(b => (
            <button key={b.id} className="pill-btn" onClick={() => setSelectedBranch(b.id)} style={{
              padding:"6px 13px", borderRadius:20, cursor:"pointer", fontSize:12, fontWeight:600,
              background: selectedBranch===b.id ? C.accentColor+"28" : "transparent",
              color:      selectedBranch===b.id ? C.accentColor : C.mutedColor,
              border:     selectedBranch===b.id ? `1px solid ${C.accentColor}55` : `1px solid ${C.mutedColor}22`,
            }}>{b.name}</button>
          ))}
        </div>
      )}

      {/* No plan */}
      {!activePlan && !loading && (
        <div style={{ ...S.card, textAlign:"center", padding:"32px 20px" }}>
          <div style={{ fontSize:32, marginBottom:12 }}>📋</div>
          <div style={{ ...S.dFont, fontSize:18, fontWeight:600, marginBottom:8 }}>No plan for this week</div>
          <div style={{ ...S.muted, marginBottom:20 }}>Create a new plan or copy last week's</div>
          <div style={{ display:"flex", gap:10, justifyContent:"center" }}>
            <button className="btnP" style={S.btnP} onClick={createPlan} disabled={creating}>
              {creating ? "Creating…" : "＋ New Plan"}
            </button>
            <button className="btnG" style={S.btnG} onClick={copyLastWeek} disabled={creating}>
              📋 Copy Last Week
            </button>
          </div>
        </div>
      )}

      {activePlan && (
        <>
          {/* Progress + Add button */}
          <div style={{ ...S.card, display:"flex", alignItems:"center", gap:16 }}>
            <div style={{ flex:1 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                <div style={S.h3}>Week Progress</div>
                <span style={{ fontSize:13, fontWeight:700, color:pct>=70?"#4ade80":C.accentColor }}>{pct}%</span>
              </div>
              <div style={{ height:5, borderRadius:3, background:C.surfaceHigh }}>
                <div style={{ height:"100%", borderRadius:3, width:`${pct}%`,
                  background:pct>=70?"#4ade80":C.accentColor, transition:"width .4s" }}/>
              </div>
              <div style={{ ...S.muted, fontSize:11, marginTop:6 }}>
                ✅ {done} done · 📋 {items.length} total
              </div>
            </div>
            <button className="btnP" style={{ ...S.btnP, flexShrink:0 }}
              onClick={() => setShowAdd(!showAdd)}>
              {showAdd ? "Cancel" : "＋ Add Activity"}
            </button>
          </div>

          {/* Add item form */}
          {showAdd && (
            <div style={S.card}>
              <div style={S.h3}>New Activity</div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                <div>
                  <div style={S.lbl}>Staff Member</div>
                  <select style={S.sel} value={addStaff}
                    onChange={e => setAddStaff(e.target.value)}>
                    <option value="">— select staff —</option>
                    {staff.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
                  </select>
                </div>
                <div>
                  <div style={S.lbl}>Day</div>
                  <select style={S.sel} value={addDay}
                    onChange={e => setAddDay(+e.target.value)}>
                    {weekDates.map(d => (
                      <option key={d.index} value={d.index}>{d.short} · {d.date}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                <div>
                  <div style={S.lbl}>Category</div>
                  <select style={S.sel} value={addCat}
                    onChange={e => setAddCat(e.target.value)}>
                    <option value="">— optional —</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                  </select>
                </div>
                <div>
                  <div style={S.lbl}>Activity</div>
                  <input style={{ ...S.inp, marginTop:5, marginBottom:0 }}
                    placeholder="e.g. Update mannequins"
                    value={addTitle}
                    onChange={e => setAddTitle(e.target.value)}
                    onKeyDown={e => e.key==="Enter" && addItem()} />
                </div>
              </div>
              <button className="btnP" style={{ ...S.btnP, width:"100%", marginTop:8 }}
                onClick={addItem} disabled={saving}>
                {saving ? "Saving…" : "Add →"}
              </button>
            </div>
          )}

          {/* ── GRID ── */}
          {staffWithItems.length === 0 && (
            <div style={{ ...S.muted, textAlign:"center", padding:20 }}>
              No activities yet — tap "＋ Add Activity" to start.
            </div>
          )}

          {staffWithItems.length > 0 && (
            <div style={{ overflowX:"auto", marginBottom:14 }}>
              <table style={{ width:"100%", borderCollapse:"collapse", minWidth:600 }}>
                <thead>
                  <tr>
                    {/* Staff column header */}
                    <th style={{
                      padding:"10px 14px", textAlign:"left", fontSize:11, fontWeight:700,
                      color:C.mutedColor, letterSpacing:1, textTransform:"uppercase",
                      background:C.surfaceColor, borderBottom:`2px solid ${C.accentColor}22`,
                      position:"sticky", left:0, zIndex:2, minWidth:110,
                    }}>Staff</th>
                    {/* Day headers */}
                    {weekDates.map(d => (
                      <th key={d.index} style={{
                        padding:"10px 8px", textAlign:"center", fontSize:11, fontWeight:700,
                        background:C.surfaceColor, borderBottom:`2px solid ${C.accentColor}22`,
                        color:C.mutedColor, letterSpacing:.5, minWidth:90,
                      }}>
                        <div style={{ color:C.accentColor }}>{d.short}</div>
                        <div style={{ fontSize:10, fontWeight:400, marginTop:2 }}>{d.date}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {staffWithItems.map((s, si) => (
                    <tr key={s.id} style={{ background: si%2===0 ? C.surfaceColor : C.surfaceHigh+"66" }}>
                      {/* Staff name */}
                      <td style={{
                        padding:"10px 14px", fontSize:12, fontWeight:600, color:C.textColor,
                        background: si%2===0 ? C.surfaceColor : C.surfaceHigh+"66",
                        borderBottom:`1px solid ${C.accentColor}0a`,
                        position:"sticky", left:0, zIndex:1,
                      }}>
                        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                          <div style={{ ...S.avatar(26) }}>
                            {s.full_name.split(" ").map(x=>x[0]).join("").slice(0,2)}
                          </div>
                          <span style={{ fontSize:12 }}>{s.full_name.split(" ")[0]}</span>
                        </div>
                      </td>
                      {/* Day cells */}
                      {weekDates.map(d => {
                        const cellItems = getCell(s.id, d.index);
                        return (
                          <td key={d.index} style={{
                            padding:"6px 8px", verticalAlign:"top",
                            borderBottom:`1px solid ${C.accentColor}0a`,
                            borderLeft:`1px solid ${C.accentColor}08`,
                            minWidth:90,
                          }}>
                            {cellItems.length === 0
                              ? <div style={{ color:C.mutedColor+"33", fontSize:18, textAlign:"center" }}>—</div>
                              : cellItems.map(item => {
                                const meta = STATUS_COLORS[item.status] ?? STATUS_COLORS.pending;
                                return (
                                  <div key={item.id} style={{
                                    background: meta.bg, borderRadius:8, padding:"5px 8px",
                                    marginBottom:4, cursor:"pointer", transition:"all .2s",
                                  }}>
                                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:4 }}>
                                      <div style={{ fontSize:11, color: item.status==="done" ? C.mutedColor : C.textColor,
                                        textDecoration: item.status==="done" ? "line-through" : "none",
                                        lineHeight:1.3, flex:1 }}>
                                        {item.category?.icon && <span style={{ marginRight:3 }}>{item.category.icon}</span>}
                                        {item.title}
                                      </div>
                                      <div style={{ display:"flex", gap:3, flexShrink:0 }}>
                                        <button onClick={() => toggleStatus(item)}
                                          style={{ background:meta.color, border:"none", borderRadius:"50%",
                                            width:16, height:16, cursor:"pointer", fontSize:9,
                                            color:"#0a0a0f", display:"flex", alignItems:"center", justifyContent:"center" }}>
                                          {meta.label}
                                        </button>
                                        <button onClick={() => deleteItem(item.id)}
                                          style={{ background:"none", border:"none", color:C.mutedColor,
                                            cursor:"pointer", fontSize:11, padding:0, lineHeight:1 }}>✕</button>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })
                            }
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}