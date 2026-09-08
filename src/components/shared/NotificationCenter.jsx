import { useState, useEffect } from "react";
import { S, C } from "../../styles/theme.js";
import { supabase } from "../../lib/supabase.js";
import { getLocale, t } from "../../lib/i18n.js";

// ============================================================
//  NOTIFICATION CENTER
// ============================================================

const TYPE_META = {
  task_created:     { icon:"📋", labelKey:"notifications.types.task_created" },
  campaign_created: { icon:"📣", labelKey:"notifications.types.campaign_created" },
  submission_new:   { icon:"📤", labelKey:"notifications.types.submission_new" },
  submission_approved: { icon:"✅", labelKey:"notifications.types.submission_approved" },
  submission_revision: { icon:"↩️", labelKey:"notifications.types.submission_revision" },
  visit_created:    { icon:"🚶", labelKey:"notifications.types.visit_created" },
  guideline_new:    { icon:"📖", labelKey:"notifications.types.guideline_new" },
  default:          { icon:"🔔", labelKey:"notifications.types.default" },
};

export function NotificationBell({ userId, onClick, count }) {
  return (
    <button onClick={onClick} style={{
      position:"relative", background:"none",
      border:"1px solid color-mix(in srgb,var(--clr-accent) 33%,transparent)",
      borderRadius:8, cursor:"pointer", fontSize:16, padding:"4px 8px",
      color:C.accentColor, transition:"all .2s",
    }}>
      🔔
      {count > 0 && (
        <span style={{
          position:"absolute", top:-6, right:-6,
          background:"#f87171", color:"#fff",
          fontSize:9, fontWeight:700, minWidth:16, height:16,
          borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center",
          padding:"0 4px",
        }}>{count > 99 ? "99+" : count}</span>
      )}
    </button>
  );
}

export function NotificationPanel({ userId, companyId, onClose }) {
  const [notifs,  setNotifs]  = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    loadNotifs();

    // Real-time subscription
    const sub = supabase
      .channel(`notifs-${userId}`)
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "notifications",
        filter: `user_id=eq.${userId}`,
      }, payload => {
        setNotifs(p => [payload.new, ...p]);
      })
      .subscribe();

    return () => sub.unsubscribe();
  }, [userId]);

  const loadNotifs = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(30);
    setNotifs(data ?? []);
    setLoading(false);
  };

  const markAllRead = async () => {
    await supabase.from("notifications")
      .update({ is_read: true })
      .eq("user_id", userId).eq("is_read", false);
    setNotifs(p => p.map(n => ({ ...n, is_read: true })));
  };

  const markRead = async (id) => {
    await supabase.from("notifications")
      .update({ is_read: true }).eq("id", id);
    setNotifs(p => p.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const unread = notifs.filter(n => !n.is_read).length;

  return (
    <div style={{
      position:"fixed", top:0, insetInlineEnd:0, bottom:0, width:"min(340px, 92vw)",
      background:"var(--clr-surface)", borderInlineStart:"1px solid color-mix(in srgb,var(--clr-accent) 18%,transparent)",
      zIndex:500, display:"flex", flexDirection:"column",
      boxShadow:"0 0 32px #00000033",
    }}>
      {/* Header */}
      <div style={{ padding:"18px 20px", borderBottom:"1px solid color-mix(in srgb,var(--clr-accent) 12%,transparent)",
        display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div>
          <div style={{ fontWeight:700, fontSize:16 }}>{t("notifications.title", "Notifications")}</div>
          {unread > 0 && (
            <div style={{ fontSize:12, color:C.accentColor, marginTop:2 }}>{unread} {t("notifications.unread", "unread")}</div>
          )}
        </div>
        <div style={{ display:"flex", gap:8 }}>
          {unread > 0 && (
            <button className="btnG" style={{ ...S.btnG, fontSize:11, padding:"5px 10px" }}
              onClick={markAllRead}>{t("notifications.markAllRead", "Mark all read")}</button>
          )}
          <button onClick={onClose} style={{ background:"none", border:"none",
            color:C.mutedColor, cursor:"pointer", fontSize:20, lineHeight:1 }}>✕</button>
        </div>
      </div>

      {/* List */}
      <div style={{ flex:1, overflowY:"auto" }}>
        {loading && <div style={{ ...S.muted, textAlign:"center", padding:30 }}>{t("common.loading", "Loading...")}</div>}
        {!loading && notifs.length === 0 && (
          <div style={{ textAlign:"center", padding:"40px 20px" }}>
            <div style={{ fontSize:36, marginBottom:12 }}>🔔</div>
            <div style={{ ...S.muted }}>{t("notifications.empty", "No notifications yet")}</div>
          </div>
        )}
        {notifs.map(n => {
          const meta = TYPE_META[n.type] ?? TYPE_META.default;
          return (
            <div key={n.id}
              onClick={() => !n.is_read && markRead(n.id)}
              style={{
                padding:"14px 20px", cursor: n.is_read ? "default" : "pointer",
                background: n.is_read ? "transparent" : "color-mix(in srgb,var(--clr-accent) 5%,transparent)",
                borderBottom:"1px solid color-mix(in srgb,var(--clr-accent) 8%,transparent)",
                transition:"background .2s",
              }}>
              <div style={{ display:"flex", gap:12, alignItems:"flex-start" }}>
                <div style={{ fontSize:20, flexShrink:0, marginTop:2 }}>{meta.icon}</div>
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
                    <span style={{ fontSize:11, fontWeight:700, color:C.accentColor,
                      letterSpacing:.5, textTransform:"uppercase" }}>{t(meta.labelKey, "Notification")}</span>
                    {!n.is_read && (
                      <span style={{ width:8, height:8, borderRadius:"50%",
                        background:C.accentColor, flexShrink:0, marginTop:2 }}/>
                    )}
                  </div>
                  <div style={{ fontSize:13, fontWeight:600, marginBottom:3 }}>{n.title}</div>
                  {n.body && <div style={{ ...S.muted, fontSize:12, lineHeight:1.4 }}>{n.body}</div>}
                  <div style={{ fontSize:11, color:C.mutedColor, marginTop:4 }}>
                    {n.created_at ? new Date(n.created_at).toLocaleString(getLocale(), {
                      day:"numeric", month:"short", hour:"2-digit", minute:"2-digit"
                    }) : ""}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
