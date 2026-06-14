import { useState, useRef, useEffect } from "react";
import { S, C } from "../../styles/theme.js";
import { Avatar } from "./Atoms.jsx";
import { supabase } from "../../lib/supabase.js";

// ── Single chat room ──────────────────────────────────────────
function ChatRoom({ user, room, companyId, onSend }) {
  const [messages, setMessages] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [text,     setText]     = useState("");
  const bottomRef = useRef();

  useEffect(() => {
    if (!companyId || !room) return;
    setLoading(true);
    supabase.from("chat_messages")
      .select("*, sender:profiles(full_name, role)")
      .eq("company_id", companyId)
      .eq("room", room)
      .order("created_at")
      .limit(100)
      .then(({ data }) => { setMessages(data ?? []); setLoading(false); });

    const sub = supabase.channel(`chat-${companyId}-${room}`)
      .on("postgres_changes", {
        event:"INSERT", schema:"public", table:"chat_messages",
        filter:`company_id=eq.${companyId}`,
      }, payload => {
        if (payload.new.room === room) {
          // fetch sender info
          supabase.from("chat_messages")
            .select("*, sender:profiles(full_name, role)")
            .eq("id", payload.new.id)
            .single()
            .then(({ data }) => {
              if (data) setMessages(p => [...p, data]);
            });
        }
      })
      .subscribe();

    return () => sub.unsubscribe();
  }, [companyId, room]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior:"smooth" });
  }, [messages]);

  const send = async () => {
    if (!text.trim()) return;
    const msg = text.trim();
    setText("");
    await onSend(room, msg);
  };

  return (
    <div style={{ ...S.card, display:"flex", flexDirection:"column", height:420, marginBottom:0 }}>
      <div style={{ flex:1, overflowY:"auto", display:"flex", flexDirection:"column", gap:10, padding:"4px 0" }}>
        {loading && <div style={{ ...S.muted, textAlign:"center", marginTop:40 }}>Loading…</div>}
        {!loading && messages.length === 0 && (
          <div style={{ ...S.muted, textAlign:"center", marginTop:46, fontSize:13 }}>
            No messages yet. Start the conversation!
          </div>
        )}
        {messages.map(m => {
          const mine = m.sender_id === user?.id;
          const name = m.sender?.full_name ?? "—";
          const role = m.sender?.role ?? "vm";
          const initials = name.split(" ").map(x=>x[0]).join("").slice(0,2);
          return (
            <div key={m.id} style={{ alignSelf: mine ? "flex-end" : "flex-start", maxWidth:"78%" }}>
              {!mine && (
                <div style={{ display:"flex", gap:6, alignItems:"center", marginBottom:4 }}>
                  <div style={{ ...S.avatar(20), fontSize:9 }}>{initials}</div>
                  <span style={{ fontSize:11, color:C.mutedColor }}>{name}</span>
                  <span style={S.chip(role)}>{role === "manager" ? "MGR" : role === "area_manager" ? "AM" : role === "store_manager" ? "SM" : "VM"}</span>
                </div>
              )}
              <div style={S.bubble(mine)}>{m.body}</div>
              <div style={{ fontSize:10, color:C.mutedColor, textAlign: mine ? "right" : "left", marginTop:2 }}>
                {m.created_at ? new Date(m.created_at).toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" }) : ""}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef}/>
      </div>
      <div style={{ display:"flex", gap:8, marginTop:10 }}>
        <input
          style={{ ...S.inp, marginTop:0, marginBottom:0, flex:1 }}
          placeholder="Type a message…"
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === "Enter" && send()}
        />
        <button className="btnP" style={{ ...S.btnP, flexShrink:0 }} onClick={send}>Send</button>
      </div>
    </div>
  );
}

// ── Main Chat ─────────────────────────────────────────────────
export function Chat({ user, companyId, branches = [], onSend }) {
  const role = user?.role ?? "vm";
  const isManager = ["manager","area_manager","store_manager"].includes(role);
  const branchId = user?.branch_id ?? null;

  // Build available rooms
  const rooms = [];

  // Branch room — only if user has a branch
  if (branchId) {
    const branchName = branches.find(b => b.id === branchId)?.name ?? "Branch";
    rooms.push({ key: `branch-${branchId}`, label: `🏪 ${branchName}`, color: C.accentColor });
  }

  // General team room
  rooms.push({ key: "team", label: "💬 Team", color: C.accentColor });

  // Managers only
  if (isManager) {
    rooms.push({ key: "managers", label: "🔒 Managers", color: "#a855f7" });
  }

  const [activeRoom, setActiveRoom] = useState(rooms[0]?.key ?? "team");

  return (
    <div>
      <div style={{ ...S.h1, marginBottom:2 }} className="fu">
        Team <span style={S.accent}>Chat</span>
      </div>
      <div style={{ ...S.muted, marginBottom:14, fontSize:12 }}>
        Real-time messaging
      </div>

      {/* Room tabs */}
      <div style={{ display:"flex", gap:6, marginBottom:14, overflowX:"auto", paddingBottom:2 }}>
        {rooms.map(r => (
          <button key={r.key} className="tab-btn" onClick={() => setActiveRoom(r.key)}
            style={{
              ...S.tab(activeRoom === r.key),
              ...(activeRoom === r.key && r.color !== C.accentColor ? {
                color: r.color,
                background: r.color + "18",
                borderColor: r.color + "44",
                border: `1px solid ${r.color}44`,
              } : {}),
              whiteSpace:"nowrap",
            }}>
            {r.label}
          </button>
        ))}
      </div>

      {/* Managers room badge */}
      {activeRoom === "managers" && (
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12,
          padding:"10px 14px", background:"#a855f711",
          border:"1px solid #a855f733", borderRadius:10 }}>
          <span style={{ fontSize:16 }}>🔒</span>
          <div>
            <div style={{ fontSize:12, fontWeight:700, color:"#a855f7" }}>Managers Only</div>
            <div style={{ fontSize:11, color:C.mutedColor }}>Not visible to VM staff</div>
          </div>
        </div>
      )}

      <ChatRoom
        key={activeRoom}
        user={user}
        room={activeRoom}
        companyId={companyId}
        onSend={onSend}
      />
    </div>
  );
}