import { useState, useEffect } from "react";
import { S, C } from "../../styles/theme.js";
import { supabase } from "../../lib/supabase.js";

// ============================================================
//  WEEKLY STORE PLAN
//  VM Manager ينشئ خطة أسبوعية حسب الأقسام
// ============================================================

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const STATUS_COLORS = {
  pending:     "#6b6880",
  in_progress: "#d4a82a",
  done:        "#4ade80",
};

export function WeeklyPlan({ company, categories, branches, profile }) {
  const [plans,       setPlans]       = useState([]);
  const [activePlan,  setActivePlan]  = useState(null);
  const [items,       setItems]       = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(branches[0]?.id ?? "");
  const [loading,     setLoading]     = useState(false);
  const [creating,    setCreating]    = useState(false);
  const [newItem,     setNewItem]     = useState({ title:"", category_id:"", day_of_week:0 });
  const [saving,      setSaving]      = useState(false);

  // Current week start (Monday)
  const getWeekStart = (offset = 0) => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1) + offset * 7;
    d.setDate(diff);
    return d.toISOString().slice(0, 10);
  };

  const weekStart = getWeekStart(0);

  // Load plans for selected branch
  useEffect(() => {
    if (!selectedBranch || !company) return;
    loadPlans();
  }, [selectedBranch, company?.id]);

  const loadPlans = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("weekly_plans")
      .select("*")
      .eq("company_id", company.id)
      .eq("branch_id", selectedBranch)
      .order("week_start", { ascending: false })
      .limit(5);
    setPlans(data ?? []);

    // Auto-select current week plan
    const current = (data ?? []).find(p => p.week_start === weekStart);
    if (current) {
      setActivePlan(current);
      loadItems(current.id);
    } else {
      setActivePlan(null);
      setItems([]);
    }
    setLoading(false);
  };

  const loadItems = async (plan_id) => {
    const { data } = await supabase
      .from("weekly_plan_items")
      .select("*, category:categories(name, icon)")
      .eq("plan_id", plan_id)
      .order("day_of_week")
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
    if (data) {
      setActivePlan(data);
      setItems([]);
      await loadPlans();
    }
    setCreating(false);
  };

  // Copy last week's plan
  const copyLastWeek = async () => {
    const lastWeekStart = getWeekStart(-1);
    const { data: lastPlan } = await supabase
      .from("weekly_plans")
      .select("id")
      .eq("company_id", company.id)
      .eq("branch_id", selectedBranch)
      .eq("week_start", lastWeekStart)
      .single();

    if (!lastPlan) { alert("No plan found for last week."); return; }

    const { data: lastItems } = await supabase
      .from("weekly_plan_items")
      .select("*")
      .eq("plan_id", lastPlan.id);

    if (!lastItems?.length) { alert("Last week's plan is empty."); return; }

    setCreating(true);
    // Create this week's plan
    const { data: newPlan } = await supabase
      .from("weekly_plans")
      .insert({ company_id: company.id, branch_id: selectedBranch,
        created_by: profile.id, week_start: weekStart })
      .select().single();

    if (newPlan) {
      // Copy items with status reset to pending
      await supabase.from("weekly_plan_items").insert(
        lastItems.map(i => ({
          plan_id: newPlan.id, category_id: i.category_id,
          title: i.title, day_of_week: i.day_of_week,
          status: "pending", sort_order: i.sort_order,
        }))
      );
      setActivePlan(newPlan);
      await loadItems(newPlan.id);
      await loadPlans();
    }
    setCreating(false);
  };

  const addItem = async () => {
    if (!newItem.title.trim() || !activePlan) return;
    setSaving(true);
    const { data } = await supabase
      .from("weekly_plan_items")
      .insert({ plan_id: activePlan.id, ...newItem,
        sort_order: items.filter(i => i.day_of_week === newItem.day_of_week).length })
      .select("*, category:categories(name, icon)").single();
    if (data) setItems(p => [...p, data]);
    setNewItem({ title:"", category_id: newItem.category_id, day_of_week: newItem.day_of_week });
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

  // Stats
  const done       = items.filter(i => i.status === "done").length;
  const inProgress = items.filter(i => i.status === "in_progress").length;
  const pct        = items.length ? Math.round((done / items.length) * 100) : 0;

  return (
    <div>
      <div style={{ ...S.h1, marginBottom:2 }} className="fu">
        Weekly <span style={S.accent}>Store Plan</span>
      </div>
      <div style={{ ...S.muted, marginBottom:16, fontSize:12 }}>
        Week of {weekStart}
      </div>

      {/* Branch selector */}
      {branches.length > 1 && (
        <div style={S.card}>
          <div style={S.h3}>Branch</div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:7 }}>
            {branches.map(b => (
              <button key={b.id} className="pill-btn" onClick={() => setSelectedBranch(b.id)} style={{
                padding:"6px 13px", borderRadius:20, cursor:"pointer", fontSize:12, fontWeight:600,
                background: selectedBranch===b.id ? C.accentColor+"28" : "transparent",
                color:      selectedBranch===b.id ? C.accentColor : C.mutedColor,
                border:     selectedBranch===b.id ? `1px solid ${C.accentColor}55` : `1px solid ${C.mutedColor}22`,
              }}>{b.name}</button>
            ))}
          </div>
        </div>
      )}

      {/* No plan this week */}
      {!activePlan && !loading && (
        <div style={{ ...S.card, textAlign:"center", padding:"32px 20px" }}>
          <div style={{ fontSize:32, marginBottom:12 }}>📋</div>
          <div style={{ ...S.dFont, fontSize:18, fontWeight:600, marginBottom:8 }}>
            No plan for this week
          </div>
          <div style={{ ...S.muted, marginBottom:20 }}>
            Create a new plan or copy last week's
          </div>
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

      {/* Active plan */}
      {activePlan && (
        <>
          {/* Progress */}
          <div style={S.card}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
              <div style={S.h3}>Week Progress</div>
              <span style={{ fontSize:14, fontWeight:700, color:pct>=70?"#4ade80":C.accentColor }}>
                {pct}%
              </span>
            </div>
            <div style={{ height:5, borderRadius:3, background:C.surfaceHigh, marginBottom:8 }}>
              <div style={{ height:"100%", borderRadius:3, width:`${pct}%`,
                background:pct>=70?"#4ade80":C.accentColor, transition:"width .4s" }}/>
            </div>
            <div style={{ display:"flex", gap:16, fontSize:12, color:C.mutedColor }}>
              <span>✅ Done: {done}</span>
              <span>⏳ In Progress: {inProgress}</span>
              <span>📋 Total: {items.length}</span>
            </div>
          </div>

          {/* Add item form */}
          <div style={S.card}>
            <div style={S.h3}>Add Activity</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              <div>
                <div style={S.lbl}>Day</div>
                <select style={S.sel} value={newItem.day_of_week}
                  onChange={e => setNewItem(p => ({ ...p, day_of_week: +e.target.value }))}>
                  {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
                </select>
              </div>
              <div>
                <div style={S.lbl}>Category</div>
                <select style={S.sel} value={newItem.category_id}
                  onChange={e => setNewItem(p => ({ ...p, category_id: e.target.value }))}>
                  <option value="">— select —</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                </select>
              </div>
            </div>
            <div style={S.lbl}>Activity</div>
            <div style={{ display:"flex", gap:8 }}>
              <input style={{ ...S.inp, flex:1, marginBottom:0, marginTop:0 }}
                placeholder="e.g. Update mannequins in Men's"
                value={newItem.title}
                onChange={e => setNewItem(p => ({ ...p, title: e.target.value }))}
                onKeyDown={e => e.key==="Enter" && addItem()} />
              <button className="btnP" style={{ ...S.btnP, flexShrink:0 }}
                onClick={addItem} disabled={saving}>Add</button>
            </div>
          </div>

          {/* Plan by day */}
          {DAYS.map((day, i) => {
            const dayItems = items.filter(it => it.day_of_week === i);
            if (!dayItems.length) return null;
            return (
              <div key={i} style={S.card}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
                  <div style={{ fontSize:12, fontWeight:700, color:C.accentColor,
                    background:C.accentColor+"18", padding:"3px 10px", borderRadius:12 }}>
                    {day}
                  </div>
                  <div style={{ ...S.muted, fontSize:11 }}>{dayItems.length} activities</div>
                </div>
                {dayItems.map(item => (
                  <div key={item.id} style={{ display:"flex", alignItems:"center", gap:10,
                    padding:"8px 0", borderBottom:`1px solid ${C.accentColor}0a` }}>
                    <button onClick={() => toggleStatus(item)} style={{
                      width:22, height:22, borderRadius:"50%", border:`2px solid ${STATUS_COLORS[item.status]}`,
                      background: item.status==="done" ? STATUS_COLORS[item.status] : "transparent",
                      cursor:"pointer", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center",
                      fontSize:11, color:"#0a0a0f",
                    }}>
                      {item.status==="done" ? "✓" : item.status==="in_progress" ? "●" : ""}
                    </button>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13,
                        color: item.status==="done" ? C.mutedColor : C.textColor,
                        textDecoration: item.status==="done" ? "line-through" : "none" }}>
                        {item.title}
                      </div>
                      {item.category && (
                        <div style={{ fontSize:11, color:C.accentColor, marginTop:2 }}>
                          {item.category.icon} {item.category.name}
                        </div>
                      )}
                    </div>
                    <button onClick={() => deleteItem(item.id)}
                      style={{ background:"none", border:"none", color:C.mutedColor,
                        cursor:"pointer", fontSize:14, flexShrink:0 }}>✕</button>
                  </div>
                ))}
              </div>
            );
          })}

          {items.length === 0 && (
            <div style={{ ...S.muted, textAlign:"center", padding:20 }}>
              No activities yet — add one above.
            </div>
          )}
        </>
      )}
    </div>
  );
}