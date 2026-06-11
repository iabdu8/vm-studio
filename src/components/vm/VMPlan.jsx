import { useState, useEffect } from "react";
import { S, C } from "../../styles/theme.js";
import { supabase } from "../../lib/supabase.js";

const STATUS_COLORS = {
  pending:     { bg:"#6b688018", color:"#6b6880", label:"Pending" },
  in_progress: { bg:"#d4a82a18", color:"#d4a82a", label:"In Progress" },
  done:        { bg:"#4ade8018", color:"#4ade80", label:"Done" },
};

const getWeekStart = () => {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().slice(0, 10);
};

const getDayDate = (weekStartStr, dayIndex) => {
  const d = new Date(weekStartStr);
  d.setDate(d.getDate() + dayIndex);
  return d.toLocaleDateString("en-GB", { weekday:"long", day:"numeric", month:"short" });
};

export function VMPlan({ profile }) {
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [plan,    setPlan]    = useState(null);

  const weekStart  = getWeekStart();
  const branchId   = profile?.branch_id ?? null;
  const branchName = profile?.branch?.name ?? "";

  useEffect(() => {
    if (!branchId || !profile?.company_id) { setLoading(false); return; }
    loadPlan();
  }, [branchId]);

  const loadPlan = async () => {
    setLoading(true);
    const { data: p } = await supabase
      .from("weekly_plans")
      .select("*")
      .eq("company_id", profile.company_id)
      .eq("branch_id", branchId)
      .eq("week_start", weekStart)
      .single();

    if (p) {
      setPlan(p);
      const { data } = await supabase
        .from("weekly_plan_items")
        .select("*, category:categories(name,icon), assigned_staff:assigned_staff_id(id,full_name)")
        .eq("plan_id", p.id)
        .order("day_of_week").order("sort_order");
      setItems(data ?? []);
    }
    setLoading(false);
  };

  const myItems = items.filter(i =>
    !i.assigned_staff_id || i.assigned_staff_id === profile.id
  );

  const done = myItems.filter(i => i.status === "done").length;
  const pct  = myItems.length ? Math.round((done / myItems.length) * 100) : 0;

  if (loading) return <div style={{ ...S.muted, textAlign:"center", padding:40 }}>Loading…</div>;

  if (!plan) return (
    <div>
      <div style={{ ...S.h1, marginBottom:2 }} className="fu">
        My <span style={S.accent}>Weekly Plan</span>
      </div>
      <div style={{ ...S.muted, marginBottom:16, fontSize:12 }}>{branchName}</div>
      <div style={{ ...S.card, textAlign:"center", padding:"32px 20px" }}>
        <div style={{ fontSize:32, marginBottom:12 }}>📋</div>
        <div style={{ ...S.muted }}>No plan published for this week yet.</div>
        <div style={{ ...S.muted, fontSize:12, marginTop:6 }}>Check back later.</div>
      </div>
    </div>
  );

  return (
    <div>
      <div style={{ ...S.h1, marginBottom:2 }} className="fu">
        My <span style={S.accent}>Weekly Plan</span>
      </div>
      <div style={{ ...S.muted, marginBottom:16, fontSize:12 }}>{branchName}</div>

      {/* Progress */}
      <div style={S.card}>
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
          <div style={S.h3}>My Progress This Week</div>
          <span style={{ fontSize:14, fontWeight:700, color:pct>=70?"#4ade80":C.accentColor }}>{pct}%</span>
        </div>
        <div style={{ height:5, borderRadius:3, background:C.surfaceHigh }}>
          <div style={{ height:"100%", borderRadius:3, width:`${pct}%`,
            background:pct>=70?"#4ade80":C.accentColor, transition:"width .4s" }}/>
        </div>
        <div style={{ ...S.muted, fontSize:11, marginTop:6 }}>
          ✅ {done} done · 📋 {myItems.length} total
        </div>
      </div>

      {/* Days */}
      {Array.from({ length:7 }, (_, i) => {
        const dayItems = myItems.filter(it => it.day_of_week === i);
        if (!dayItems.length) return null;
        return (
          <div key={i} style={S.card}>
            <div style={{ fontSize:13, fontWeight:700, color:C.accentColor, marginBottom:10 }}>
              {getDayDate(weekStart, i)}
            </div>
            {dayItems.map(item => {
              const meta = STATUS_COLORS[item.status] ?? STATUS_COLORS.pending;
              return (
                <div key={item.id} style={{
                  display:"flex", alignItems:"center", gap:12,
                  padding:"10px 0", borderBottom:`1px solid ${C.accentColor}0a`,
                }}>
                  <div style={{
                    width:10, height:10, borderRadius:"50%",
                    background:meta.color, flexShrink:0,
                  }}/>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13,
                      color: item.status==="done" ? C.mutedColor : C.textColor,
                      textDecoration: item.status==="done" ? "line-through" : "none",
                      marginBottom:3 }}>
                      {item.title}
                    </div>
                    <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                      {item.category?.name && (
                        <span style={{ fontSize:11, color:C.accentColor }}>
                          {item.category.name}
                        </span>
                      )}
                      {item.assigned_staff?.full_name && (
                        <span style={{ fontSize:11, color:"#818cf8" }}>
                          👤 {item.assigned_staff.full_name}
                        </span>
                      )}
                    </div>
                  </div>
                  <span style={{
                    fontSize:10, fontWeight:700, padding:"3px 9px", borderRadius:10,
                    background:meta.bg, color:meta.color, flexShrink:0,
                  }}>
                    {meta.label}
                  </span>
                </div>
              );
            })}
          </div>
        );
      })}

      {myItems.length === 0 && (
        <div style={{ ...S.muted, textAlign:"center", padding:20 }}>
          No activities assigned to you this week.
        </div>
      )}
    </div>
  );
}