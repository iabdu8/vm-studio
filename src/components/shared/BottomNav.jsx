import { S } from "../../styles/theme.js";

export function VMNav({ page, setPage }) {
  const items = [
    ["home",       "🏠", "Home"],
    ["tasks",      "✅", "Tasks"],
    ["visits",     "🚶", "Visits"],
    ["guidelines", "📖", "Guides"],
    ["chat",       "💬", "Chat"],
  ];
  return (
    <nav style={{ ...S.bottomNav, overflowX:"auto" }}>
      {items.map(([key, icon, lbl]) => (
        <button key={key} className="tab-btn" style={{ ...S.navBtn(page === key), minWidth:50 }}
          onClick={() => setPage(key)}>
          <span style={{ fontSize:18 }}>{icon}</span>
          <span style={{ fontSize:9 }}>{lbl}</span>
        </button>
      ))}
    </nav>
  );
}

export function MgrNav({ page, setPage, isSuperAdmin }) {
  const items = [
    ["overview",  "📊", "Overview"],
    ["requests",  "📥", "Requests"],
    ["assign",    "📋", "Plan & Assign"],
    ["visits",    "🚶", "Visits"],
    ["analytics", "📈", "Analytics"],
    ["chat",      "💬", "Chat"],
  ];
  return (
    <nav style={{ ...S.bottomNav, overflowX:"auto" }}>
      {items.map(([key, icon, lbl]) => (
        <button key={key} className="tab-btn" style={{ ...S.navBtn(page === key), minWidth:50 }}
          onClick={() => setPage(key)}>
          <span style={{ fontSize:18 }}>{icon}</span>
          <span style={{ fontSize:9, whiteSpace:"nowrap" }}>{lbl}</span>
        </button>
      ))}
    </nav>
  );
}