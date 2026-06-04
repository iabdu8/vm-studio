import { useState, useRef, useEffect } from "react";
import { S, C } from "../../styles/theme.js";
import { Avatar } from "./Atoms.jsx";
import { uid, nowTime } from "../../utils.js";

// ── Single chat room ──
function ChatRoom({ user, messages, setMessages, placeholder = "Type a message…" }) {
  const [text, setText] = useState("");
  const bottomRef = useRef();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior:"smooth" });
  }, [messages]);

  const send = () => {
    if (!text.trim()) return;
    setMessages([...messages, {
      id: uid(), from: user.name, avatar: user.avatar,
      role: user.role, text, time: nowTime(),
    }]);
    setText("");
  };

  return (
    <div style={{ ...S.card, display:"flex", flexDirection:"column", height:400, marginBottom:0 }}>
      <div style={{ flex:1, overflowY:"auto", display:"flex", flexDirection:"column", gap:10, padding:"4px 0" }}>
        {messages.length === 0 && (
          <div style={{ ...S.muted, textAlign:"center", marginTop:46, fontSize:13 }}>
            No messages yet.
          </div>
        )}
        {messages.map(m => {
          const mine = m.from === user.name;
          return (
            <div key={m.id} style={{ alignSelf: mine ? "flex-end" : "flex-start", maxWidth:"78%" }}>
              {!mine && (
                <div style={{ display:"flex", gap:6, alignItems:"center", marginBottom:4 }}>
                  <Avatar initials={m.avatar} size={20} />
                  <span style={{ fontSize:11, color:C.mutedColor }}>
                    {m.from} · <span style={S.chip(m.role)}>{m.role === "manager" ? "MGR" : "VM"}</span>
                  </span>
                </div>
              )}
              <div style={S.bubble(mine)}>{m.text}</div>
              <div style={{ fontSize:10, color:C.mutedColor, textAlign: mine ? "right" : "left", marginTop:2 }}>
                {m.time}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      <div style={{ display:"flex", gap:8, marginTop:10 }}>
        <input
          style={{ ...S.inp, marginTop:0, marginBottom:0, flex:1 }}
          placeholder={placeholder}
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === "Enter" && send()}
        />
        <button className="btnP" style={{ ...S.btnP, flexShrink:0 }} onClick={send}>
          Send
        </button>
      </div>
    </div>
  );
}

// ── Main Chat page — VM sees one room, manager sees two ──
export function Chat({ user, teamMessages, setTeamMessages, mgrMessages, setMgrMessages }) {
  const [room, setRoom] = useState("team");
  const isManager = user.role === "manager";

  return (
    <div>
      <div style={{ ...S.h1, marginBottom:2 }} className="fu">
        {isManager
          ? <>Channels <span style={S.accent}>& Rooms</span></>
          : <>Team <span style={S.accent}>Chat</span></>}
      </div>

      {/* Room tabs — managers only */}
      {isManager ? (
        <div style={{ display:"flex", gap:6, marginBottom:14 }}>
          <button className="tab-btn" style={S.tab(room === "team")} onClick={() => setRoom("team")}>
            💬 Team Channel
          </button>
          <button
            className="tab-btn"
            style={{
              ...S.tab(room === "managers"),
              color: room === "managers" ? "#a855f7" : C.mutedColor,
              background: room === "managers" ? "#a855f718" : "transparent",
              borderColor: room === "managers" ? "#a855f744" : "#a855f722",
              border: `1px solid ${room === "managers" ? "#a855f744" : "#a855f722"}`,
            }}
            onClick={() => setRoom("managers")}>
            🔒 Managers Only
          </button>
        </div>
      ) : (
        <div style={{ ...S.muted, marginBottom:14, fontSize:12 }}>All branches · live channel</div>
      )}

      {/* Team room */}
      {room === "team" && (
        <ChatRoom
          user={user}
          messages={teamMessages}
          setMessages={setTeamMessages}
          placeholder="Message the whole team…"
        />
      )}

      {/* Managers-only room */}
      {room === "managers" && isManager && (
        <div>
          <div style={{
            display:"flex", alignItems:"center", gap:8, marginBottom:12,
            padding:"10px 14px", background:"#a855f711",
            border:"1px solid #a855f733", borderRadius:10,
          }}>
            <span style={{ fontSize:16 }}>🔒</span>
            <div>
              <div style={{ fontSize:12, fontWeight:700, color:"#a855f7" }}>Managers Only Room</div>
              <div style={{ fontSize:11, color:C.mutedColor }}>Not visible to VMs</div>
            </div>
          </div>
          <ChatRoom
            user={user}
            messages={mgrMessages}
            setMessages={setMgrMessages}
            placeholder="Private managers message…"
          />
        </div>
      )}
    </div>
  );
}
