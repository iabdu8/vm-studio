import { S } from "../../styles/theme.js";
import { HomeIcon, TasksIcon, VisitsIcon, GuidesIcon, ChatIcon, OverviewIcon, AssignIcon, CalendarIcon, RequestsIcon } from "./Icons.jsx";
import { t } from "../../lib/i18n.js";

export function VMNav({ page, setPage }) {
  const items = [
    ["home",       HomeIcon,     t("nav.home", "Home")],
    ["tasks",      TasksIcon,    t("nav.tasks", "Tasks")],
    ["demo",       AssignIcon,   "Demo Hold"],
    ["visits",     VisitsIcon,   t("nav.visits", "Visits")],
    ["guidelines", GuidesIcon,   "Guides"],
    ["chat",       ChatIcon,     t("nav.chat", "Chat")],
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

export function MgrNav({ page, setPage, isSuperAdmin }) {
  const items = [
    ["overview",  OverviewIcon,  "Overview"],
    ["assign",    AssignIcon,    t("nav.tasks", "Tasks")],
    ["campaign",  GuidesIcon,    t("nav.campaign", "Campaign")],
    ["training",  RequestsIcon,  t("nav.training", "Training")],
    ["visits",    VisitsIcon,    t("nav.visits", "Visits")],
    ["chat",      ChatIcon,      t("nav.chat", "Chat")],
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
