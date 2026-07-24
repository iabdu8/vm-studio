const base = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" };

export function HomeIcon({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M5.5 9.5V19a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1V9.5" />
      <path d="M9.5 20v-5.5a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1V20" />
    </svg>
  );
}

export function TasksIcon({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
      <rect x="5" y="4" width="14" height="17" rx="2.2" />
      <path d="M9 4V3.5A1.5 1.5 0 0 1 10.5 2h3A1.5 1.5 0 0 1 15 3.5V4" />
      <path d="M8.7 12.3 10.5 14l4.3-4.3" />
    </svg>
  );
}

export function VisitsIcon({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
      <circle cx="6" cy="17.5" r="1.6" />
      <path d="M7.4 16.3 12.5 10a2.6 2.6 0 1 0-4.1-2" />
      <circle cx="17.2" cy="6.6" r="1.8" />
      <path d="M12.5 10h4.3" />
    </svg>
  );
}

export function GuidesIcon({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
      <path d="M12 6.2c-1.4-1.1-3.4-1.7-5.8-1.7-.9 0-1.4.5-1.4 1.3v11.4c0 .8.6 1.2 1.4 1.2 2.2 0 4.3.6 5.8 1.6" />
      <path d="M12 6.2c1.4-1.1 3.4-1.7 5.8-1.7.9 0 1.4.5 1.4 1.3v11.4c0 .8-.6 1.2-1.4 1.2-2.2 0-4.3.6-5.8 1.6z" />
      <path d="M12 6.2v12" />
    </svg>
  );
}

export function ChatIcon({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
      <path d="M4 12a8 7 0 1 1 3.2 5.6L4 19l1-3.2A6.9 6.9 0 0 1 4 12Z" />
      <circle cx="9" cy="12" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="15" cy="12" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function OverviewIcon({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
      <rect x="4" y="13" width="4" height="7" rx="1" />
      <rect x="10" y="9" width="4" height="11" rx="1" />
      <rect x="16" y="4" width="4" height="16" rx="1" />
    </svg>
  );
}

export function RequestsIcon({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
      <path d="M4 6.5A1.5 1.5 0 0 1 5.5 5h13A1.5 1.5 0 0 1 20 6.5V17a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6.5Z" />
      <path d="m4.3 6.4 7.7 6 7.7-6" />
    </svg>
  );
}

export function AssignIcon({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
      <rect x="5" y="4" width="14" height="17" rx="2.2" />
      <path d="M9 4V3.5A1.5 1.5 0 0 1 10.5 2h3A1.5 1.5 0 0 1 15 3.5V4" />
      <path d="M8.5 11h7M8.5 15h5" />
    </svg>
  );
}

export function AnalyticsIcon({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
      <path d="M4 19h16" />
      <path d="M5 15.5 9.5 11l3 3 6-6.5" />
      <path d="M14.5 7.5H18.5V11.5" />
    </svg>
  );
}
