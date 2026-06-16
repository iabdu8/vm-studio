import { useState, useEffect, useCallback } from "react";
import { C } from "../../styles/theme.js";

// ── TOAST SYSTEM ──────────────────────────────────────────────
let _addToast = null;

export function toast(message, type = "error") {
  _addToast?.({ message, type, id: Date.now() });
}

export function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((t) => {
    setToasts(p => [...p, t]);
    setTimeout(() => setToasts(p => p.filter(x => x.id !== t.id)), 4000);
  }, []);

  useEffect(() => { _addToast = addToast; return () => { _addToast = null; }; }, [addToast]);

  if (!toasts.length) return null;

  return (
    <div style={{ position:"fixed", bottom:80, left:"50%", transform:"translateX(-50%)",
      zIndex:1000, display:"flex", flexDirection:"column", gap:8, alignItems:"center" }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          padding:"12px 20px", borderRadius:10, fontSize:13, fontWeight:600,
          maxWidth:320, textAlign:"center", animation:"fadeUp .3s ease",
          background: t.type === "error" ? "#f87171" : t.type === "success" ? "#4ade80" : "#818cf8",
          color: t.type === "success" ? "#0a0a0f" : "#fff",
          boxShadow:"0 4px 20px #00000044",
        }}>
          {t.type === "error" ? "⚠️ " : t.type === "success" ? "✓ " : "ℹ️ "}{t.message}
        </div>
      ))}
    </div>
  );
}