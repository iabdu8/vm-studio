import { useState, useRef, useEffect } from "react";
import { S, C } from "../../styles/theme.js";
import { Avatar } from "./Atoms.jsx";
import { supabase } from "../../lib/supabase.js";
import { uploadChatAttachment, deleteMessage } from "../../services/data.service.js";
import { PhotoLightbox } from "./PhotoLightbox.jsx";
import { InfoBanner } from "./InfoBanner.jsx";

// ── Single chat room ──────────────────────────────────────────
function ChatRoom({ user, room, companyId, onSend }) {
  const [messages, setMessages] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [text,     setText]     = useState("");
  const [uploading, setUploading] = useState(false);
  const [lightbox, setLightbox] = useState(null); // { photos, index }
  const bottomRef = useRef();
  const fileRef = useRef();
  const senderCache = useRef({});   // profile lookup, avoids a query per incoming message
  const seenIds = useRef(new Set()); // dedupe optimistic send vs. realtime echo

  const addMessage = (msg) => {
    if (seenIds.current.has(msg.id)) return;
    seenIds.current.add(msg.id);
    setMessages(p => [...p, msg]);
  };

  const removeMessage = (id) => {
    seenIds.current.delete(id);
    setMessages(p => p.filter(m => m.id !== id));
  };

  const handleDelete = async (id) => {
    removeMessage(id); // optimistic
    try { await deleteMessage(id); }
    catch (e) { process.env?.NODE_ENV !== "production" && console.error(e); }
  };

  useEffect(() => {
    if (!companyId) return;
    supabase.from("profiles").select("id, full_name, role").eq("company_id", companyId)
      .then(({ data }) => {
        const map = {};
        (data ?? []).forEach(p => { map[p.id] = p; });
        senderCache.current = map;
      });
  }, [companyId]);

  useEffect(() => {
    if (!companyId || !room) return;
    setLoading(true);
    seenIds.current = new Set();
    supabase.from("chat_messages")
      .select("*, sender:profiles(full_name, role)")
      .eq("company_id", companyId)
      .eq("room", room)
      .order("created_at")
      .limit(60)
      .then(({ data }) => {
        (data ?? []).forEach(m => seenIds.current.add(m.id));
        setMessages(data ?? []);
        setLoading(false);
      });

    const sub = supabase.channel(`chat-${companyId}-${room}`)
      .on("postgres_changes", {
        event:"INSERT", schema:"public", table:"chat_messages",
        filter:`company_id=eq.${companyId}`,
      }, payload => {
        if (payload.new.room !== room) return;
        // Sender is already cached from the room-member fetch above — no extra round trip.
        addMessage({ ...payload.new, sender: senderCache.current[payload.new.sender_id] });
      })
      .on("postgres_changes", {
        event:"DELETE", schema:"public", table:"chat_messages",
        filter:`company_id=eq.${companyId}`,
      }, payload => removeMessage(payload.old.id))
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
    const sent = await onSend(room, msg);
    if (sent) addMessage(sent); // show instantly, don't wait on the realtime round trip
  };

  const pickFile = () => fileRef.current?.click();

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      const attachment = await uploadChatAttachment(companyId, room, file);
      const caption = text.trim() || (attachment.type === "image" ? "📷 Photo" : `📎 ${attachment.name}`);
      setText("");
      const sent = await onSend(room, caption, attachment);
      if (sent) addMessage(sent);
    } finally { setUploading(false); }
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
              {m.attachment_url && m.attachment_type === "image" ? (
                <div style={{ borderRadius:12, overflow:"hidden", cursor:"pointer", marginBottom:4 }}
                  onClick={() => setLightbox({ photos:[{ url:m.attachment_url, comment:m.body }], index:0 })}>
                  <img loading="lazy" src={m.attachment_url} alt="" style={{ maxWidth:220, maxHeight:220, display:"block", objectFit:"cover" }}/>
                </div>
              ) : m.attachment_url ? (
                <a href={m.attachment_url} target="_blank" rel="noopener noreferrer" style={{
                  display:"flex", alignItems:"center", gap:8, padding:"8px 12px", marginBottom:4,
                  background:C.surfaceHigh, borderRadius:10, textDecoration:"none", color:C.textColor, fontSize:12 }}>
                  <span style={{ fontSize:16 }}>📎</span>
                  <span style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{m.attachment_name ?? "File"}</span>
                </a>
              ) : null}
              {!(m.attachment_type === "image" && (m.body === "📷 Photo")) && (
                <div style={S.bubble(mine)}>{m.body}</div>
              )}
              <div style={{ display:"flex", gap:6, justifyContent: mine ? "flex-end" : "flex-start",
                alignItems:"center", marginTop:2 }}>
                <div style={{ fontSize:10, color:C.mutedColor }}>
                  {m.created_at ? new Date(m.created_at).toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" }) : ""}
                </div>
                {mine && (
                  <button onClick={() => handleDelete(m.id)} title="Delete message"
                    style={{ background:"none", border:"none", color:C.mutedColor, cursor:"pointer",
                      fontSize:10, padding:0, lineHeight:1 }}>
                    🗑️
                  </button>
                )}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef}/>
      </div>
      <div style={{ display:"flex", gap:8, marginTop:10 }}>
        <button className="btnG" style={{ ...S.btnG, flexShrink:0, padding:"9px 12px" }}
          onClick={pickFile} disabled={uploading} title="Attach photo or file">
          {uploading ? "…" : "📎"}
        </button>
        <input ref={fileRef} type="file" accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
          style={{ display:"none" }} onChange={handleFile}/>
        <input
          style={{ ...S.inp, marginTop:0, marginBottom:0, flex:1 }}
          placeholder="Type a message…"
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === "Enter" && send()}
        />
        <button className="btnP" style={{ ...S.btnP, flexShrink:0 }} onClick={send}>Send</button>
      </div>

      {lightbox && (
        <PhotoLightbox photos={lightbox.photos} index={lightbox.index}
          onClose={() => setLightbox(null)} onIndexChange={i => setLightbox(p => ({ ...p, index:i }))}/>
      )}
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

      <InfoBanner>
        {rooms.length > (isManager ? 2 : 1)
          ? "Your branch room is just your team. Team is everyone in the company. Managers is private to Head VM/Manager/Controller roles."
          : "Team is everyone in the company. You can delete your own messages anytime."}
      </InfoBanner>

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