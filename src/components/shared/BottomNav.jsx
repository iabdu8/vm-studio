import { S } from "../../styles/theme.js";
import { HomeIcon, TasksIcon, VisitsIcon, GuidesIcon, ChatIcon, OverviewIcon, RequestsIcon, AssignIcon, AnalyticsIcon } from "./Icons.jsx";

export function VMNav({ page, setPage }) {
  const items = [
    ["home",       HomeIcon,   "Home"],
    ["tasks",      TasksIcon,  "Tasks"],
    ["visits",     VisitsIcon, "Visits"],
    ["guidelines", GuidesIcon, "Guides"],
    ["chat",       ChatIcon,   "Chat"],
  ];
  return (
    <nav style={{ ...S.bottomNav, overflowX:"auto" }}>
      {items.map(([key, Icon, lbl]) => (
        <button key={key} className="tab-btn" style={{ ...S.navBtn(page === key), minWidth:50 }}
          onClick={() => setPage(key)}>
          <Icon size={22} />
          <span>{lbl}</span>
        </button>
      ))}
    </nav>
  );
}

export function MgrNav({ page, setPage, isSuperAdmin }) {
  const items = [
    ["overview",  OverviewIcon,  "Overview"],
    ["requests",  RequestsIcon,  "Requests"],
    ["assign",    AssignIcon,    "Plan"],
    ["visits",    VisitsIcon,    "Visits"],
    ["analytics", AnalyticsIcon, "Analytics"],
    ["chat",      ChatIcon,      "Chat"],
  ];
  return (
    <nav style={{ ...S.bottomNav, overflowX:"auto" }}>
      {items.map(([key, Icon, lbl]) => (
        <button key={key} className="tab-btn" style={{ ...S.navBtn(page === key), minWidth:50 }}
          onClick={() => setPage(key)}>
          <Icon size={22} />
          <span style={{ whiteSpace:"nowrap" }}>{lbl}</span>
        </button>
      ))}
    </nav>
  );
}
