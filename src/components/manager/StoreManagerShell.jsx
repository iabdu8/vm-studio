import { S, C } from "../../styles/theme.js";
import { todayStr } from "../../utils.js";
import { PromotionCard } from "../shared/PromotionCard.jsx";
import { BestBranchOfMonth } from "../shared/BestBranchOfMonth.jsx";
import { CampaignBanner } from "../shared/CampaignBanner.jsx";
import { InfoBanner } from "../shared/InfoBanner.jsx";

// ============================================================
//  STORE MANAGER SHELL
//  يشوف فرعه فقط — يعطي ملاحظات — يتابع التنفيذ
// ============================================================

export function StoreManagerHome({ profile, tasks, submissions, campaign, promotions, floorWalks, company }) {
  const branch = profile?.branch?.name ?? "My Branch";

  const pending   = submissions.filter(s => s.status === "pending").length;
  const approved  = submissions.filter(s => s.status === "approved").length;
  const doneT     = tasks.filter(t => t.is_done ?? t.done).length;
  const pct       = tasks.length ? Math.round((doneT / tasks.length) * 100) : 0;
  const today     = new Date().toISOString().slice(0, 10);
  const openTasks = tasks.filter(t => !(t.is_done ?? t.done));
  const overdue   = openTasks.filter(t => (t.due_date ?? t.dueDate)?.slice(0, 10) < today).length;

  return (
    <div>
      <div style={{ ...S.h1, marginBottom:2 }} className="fu">
        لوحة <span style={S.accent}>المتجر</span>
      </div>
      <div style={{ ...S.muted, marginBottom:16, fontSize:12 }}>
        {branch} · {todayStr()}
      </div>

      <InfoBanner>تابع تنفيذ الفرع من هنا: المهام المفتوحة أولًا، ثم مراجعة الصور، ثم الحملات والعروض النشطة.</InfoBanner>

      <BestBranchOfMonth company={company} />

      <CampaignBanner campaign={campaign} />

      {/* Promotions */}
      {promotions?.length > 0 && (
        <div style={{ ...S.card, marginBottom:14 }}>
          <div style={S.h3}>Active Promotions ({promotions.length})</div>
          {promotions.map(p => <PromotionCard key={p.id} promotion={p} />)}
        </div>
      )}

      {/* KPIs */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:14 }}>
        {[
          { n:overdue,  l:"متأخرة",     sub:"تحتاج متابعة", c:"#f87171" },
          { n:pending,  l:"بانتظارك",   sub:"صور تحتاج مراجعة", c:"#d4a82a" },
          { n:doneT,    l:"مكتملة",     sub:`من ${tasks.length} مهمة`, c:C.accentColor },
          { n:`${pct}%`,l:"نسبة الإنجاز", sub:"تقدم الفرع", c:"#0ea5a4" },
        ].map(k => (
          <div key={k.l} style={{ ...S.card, marginBottom:0 }}>
            <div style={{ ...S.dFont, fontSize:28, fontWeight:700, color:k.c, lineHeight:1 }}>{k.n}</div>
            <div style={{ fontSize:13, fontWeight:600, marginTop:4 }}>{k.l}</div>
            <div style={{ ...S.muted, fontSize:11 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Floor Walk */}
      {floorWalks?.length > 0 && (
        <div style={S.card}>
          <div style={S.h3}>Latest Floor Walk</div>
          {floorWalks.slice(0,1).map((fw, i) => (
            <div key={i}>
              {fw.note && <div style={{ fontSize:13, lineHeight:1.5 }}>{fw.note}</div>}
              {fw.photos?.length > 0 && (
                <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginTop:8 }}>
                  {fw.photos.map((p, j) => (
                    <img key={j} loading="lazy" src={p.url ?? p} alt=""
                      style={{ width:72, height:72, objectFit:"cover", borderRadius:8,
                        border:`1px solid ${C.accentColor}22` }}/>
                  ))}
                </div>
              )}
              <div style={{ ...S.muted, fontSize:11, marginTop:6 }}>
                By {fw.manager} · {fw.date}
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}

