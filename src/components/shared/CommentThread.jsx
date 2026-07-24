import { useState, useEffect } from "react";
import { S, C } from "../../styles/theme.js";
import { Avatar } from "./Atoms.jsx";
import { getTaskComments, addTaskComment } from "../../services/data.service.js";

const ROLE_LABEL = {
  manager:       "Head VM",
  area_manager:  "VM Manager",
  store_manager: "VM Controller",
  vm:            "VM",
  super_admin:   "Admin",
};

export function CommentThread({ taskId, profile, canComment = true }) {
  const [comments, setComments] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [body,     setBody]     = useState("");
  const [sending,  setSending]  = useState(false);

  useEffect(() => { load(); }, [taskId]);

  const load = async () => {
    setLoading(true);
    try { setComments(await getTaskComments(taskId)); }
    finally { setLoading(false); }
  };

  const send = async () => {
    if (!body.trim()) return;
    setSending(true);
    try {
      const c = await addTaskComment(taskId, profile.id, body.trim());
      setComments(p => [...p, c]);
      setBody("");
    } finally { setSending(false); }
  };

  return (
    <div style={{ marginTop:10, paddingTop:10, borderTop:`1px solid ${C.accentColor}14` }}>
      <div style={{ fontSize:11, fontWeight:700, color:C.mutedColor, marginBottom:8, textTransform:"uppercase", letterSpacing:.5 }}>
        💬 Comments {comments.length > 0 && `(${comments.length})`}
      </div>

      {loading ? (
        <div style={{ ...S.muted, fontSize:12 }}>Loading…</div>
      ) : comments.length === 0 ? (
        <div style={{ ...S.muted, fontSize:12, marginBottom:8 }}>No comments yet.</div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:10 }}>
          {comments.map(c => (
            <div key={c.id} style={{ display:"flex", gap:8 }}>
              <Avatar initials={c.author?.avatar_initials ?? "?"} size={26} />
              <div style={{ flex:1 }}>
                <div style={{ fontSize:12, fontWeight:600 }}>
                  {c.author?.full_name ?? "Unknown"}
                  <span style={{ fontSize:10, fontWeight:500, color:C.accentColor, marginLeft:6 }}>
                    {ROLE_LABEL[c.author?.role] ?? c.author?.role}
                  </span>
                </div>
                <div style={{ fontSize:13, color:C.textColor, marginTop:2 }}>{c.body}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {canComment && (
        <div style={{ display:"flex", gap:8 }}>
          <input style={{ ...S.inp, marginBottom:0, flex:1 }} placeholder="Write a comment…"
            value={body} onChange={e => setBody(e.target.value)}
            onKeyDown={e => e.key === "Enter" && send()} />
          <button className="btnP" style={{ ...S.btnP, padding:"10px 16px" }}
            onClick={send} disabled={sending || !body.trim()}>Send</button>
        </div>
      )}
    </div>
  );
}
