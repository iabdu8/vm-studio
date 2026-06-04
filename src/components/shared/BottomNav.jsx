import { S } from "../../styles/theme.js";

export function VMNav({ page, setPage }) {
  const items = [
    ["home",       "🏠", "Home"],
    ["tasks",      "✅", "Tasks"],
    ["guidelines", "📖", "Guides"],
    ["chat",       "💬", "Chat"],
  ];
  return (
    <nav style={S.bottomNav}>
      {items.map(([key, icon, lbl]) => (
        <button key={key} className="tab-btn" style={S.navBtn(page === key)} onClick={() => setPage(key)}>
          <span style={{ fontSize:20 }}>{icon}</span>
          <span>{lbl}</span>
        </button>
      ))}
    </nav>
  );
}

export function MgrNav({ page, setPage, isSuperAdmin }) {
  const items = [
    ["overview",   "📊", "Overview"],
    ["requests",   "📥", "Requests"],
    ["assign",     "📋", "Assign"],
    ["analytics",  "📈", "Analytics"],
    ["chat",       "💬", "Chat"],
  ];
  return (
    <nav style={S.bottomNav}>
      {items.map(([key, icon, lbl]) => (
        <button key={key} className="tab-btn" style={S.navBtn(page === key)} onClick={() => setPage(key)}>
          <span style={{ fontSize:18 }}>{icon}</span>
          <span>{lbl}</span>
        </button>
      ))}
    </nav>
  );
}
