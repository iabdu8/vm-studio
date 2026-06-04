import { useEffect, useState } from "react";
import { C } from "../../styles/theme.js";
import { getQueueSize } from "../../lib/offlineQueue.js";

export function StatusBar({ isOnline, queueSize, syncing, onSyncNow }) {
  if (isOnline && queueSize === 0) return null; // hide when all good

  return (
    <div style={{
      position: "fixed", top: 58, left: 0, right: 0, zIndex: 150,
      background: isOnline ? "#16a34a" : "#b45309",
      color: "#fff", padding: "7px 16px",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      fontSize: 12, fontWeight: 600, fontFamily: "'DM Sans',sans-serif",
    }}>
      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
        <span>{isOnline ? "🟢" : "🔴"}</span>
        <span>
          {!isOnline
            ? `You're offline — ${queueSize} submission(s) queued`
            : syncing
            ? `Syncing ${queueSize} submission(s)…`
            : `${queueSize} submission(s) pending upload`}
        </span>
      </div>
      {isOnline && queueSize > 0 && !syncing && (
        <button onClick={onSyncNow} style={{
          background:"#fff2", border:"1px solid #fff4", borderRadius:6,
          color:"#fff", padding:"3px 10px", cursor:"pointer", fontSize:11, fontWeight:700,
        }}>
          Sync Now
        </button>
      )}
    </div>
  );
}
