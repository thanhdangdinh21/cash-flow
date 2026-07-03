/* Inline Lucide icons (ISC licensed, lucide.dev) — ported from the design bundle.
   Stroke 2, round caps. */
import type { CSSProperties, ReactNode } from "react";

export interface IconProps {
  size?: number;
  stroke?: number;
  className?: string;
  style?: CSSProperties;
}

function Icon({ children, size = 24, stroke = 2, className = "", style }: IconProps & { children: ReactNode }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
    >
      {children}
    </svg>
  );
}

export type IconComponent = (p: IconProps) => JSX.Element;

export const I: Record<string, IconComponent> = {
  home: (p) => <Icon {...p}><path d="M3 9.5 12 3l9 6.5"/><path d="M5 9v11h14V9"/><path d="M9 20v-6h6v6"/></Icon>,
  receipt: (p) => <Icon {...p}><path d="M5 3v18l2-1.4 2 1.4 2-1.4 2 1.4 2-1.4 2 1.4V3l-2 1.4L14 3l-2 1.4L10 3 8 4.4 5 3Z"/><path d="M8 8h8"/><path d="M8 12h8"/></Icon>,
  plus: (p) => <Icon {...p}><path d="M12 5v14M5 12h14"/></Icon>,
  pie: (p) => <Icon {...p}><path d="M12 3a9 9 0 1 0 9 9h-9V3Z"/><path d="M14 3.5A9 9 0 0 1 20.5 10H14V3.5Z"/></Icon>,
  user: (p) => <Icon {...p}><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/></Icon>,
  search: (p) => <Icon {...p}><circle cx="11" cy="11" r="7"/><path d="m20 20-3.2-3.2"/></Icon>,
  bell: (p) => <Icon {...p}><path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></Icon>,
  arrowUp: (p) => <Icon {...p}><path d="M7 17 17 7"/><path d="M8 7h9v9"/></Icon>,
  arrowDown: (p) => <Icon {...p}><path d="M17 7 7 17"/><path d="M16 17H7V8"/></Icon>,
  chevR: (p) => <Icon {...p}><path d="m9 6 6 6-6 6"/></Icon>,
  chevL: (p) => <Icon {...p}><path d="m15 6-6 6 6 6"/></Icon>,
  chevD: (p) => <Icon {...p}><path d="m6 9 6 6 6-6"/></Icon>,
  settings: (p) => <Icon {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"/></Icon>,
  cart: (p) => <Icon {...p}><circle cx="9" cy="20" r="1.4"/><circle cx="18" cy="20" r="1.4"/><path d="M2 3h2.2l2.3 12.5a1.5 1.5 0 0 0 1.5 1.2h8.5a1.5 1.5 0 0 0 1.5-1.2L21 7H6"/></Icon>,
  coffee: (p) => <Icon {...p}><path d="M5 9h12v4a5 5 0 0 1-5 5H10a5 5 0 0 1-5-5V9Z"/><path d="M17 10h2.5a2.5 2.5 0 0 1 0 5H17"/><path d="M8 3v2M12 3v2"/></Icon>,
  home2: (p) => <Icon {...p}><path d="M3 10 12 3l9 7"/><path d="M5 9v11h14V9"/></Icon>,
  car: (p) => <Icon {...p}><path d="M5 13 6.5 8.5A2 2 0 0 1 8.4 7h7.2a2 2 0 0 1 1.9 1.5L19 13"/><path d="M4 13h16v4H4z"/><circle cx="7.5" cy="17.5" r="1.3"/><circle cx="16.5" cy="17.5" r="1.3"/></Icon>,
  film: (p) => <Icon {...p}><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M3 15h18M8 4v16M16 4v16"/></Icon>,
  zap: (p) => <Icon {...p}><path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z"/></Icon>,
  target: (p) => <Icon {...p}><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.4"/></Icon>,
  wallet: (p) => <Icon {...p}><path d="M3 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v1H5a2 2 0 0 1-2-2Z"/><path d="M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9H6"/><circle cx="16.5" cy="13" r="1.3"/></Icon>,
  check: (p) => <Icon {...p}><path d="m5 12 5 5 9-11"/></Icon>,
  x: (p) => <Icon {...p}><path d="M6 6 18 18M18 6 6 18"/></Icon>,
  trendUp: (p) => <Icon {...p}><path d="m3 17 6-6 4 4 8-8"/><path d="M15 7h6v6"/></Icon>,
  arrowLeft: (p) => <Icon {...p}><path d="M19 12H5"/><path d="m12 5-7 7 7 7"/></Icon>,
  sliders: (p) => <Icon {...p}><path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M18 18h2"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="16" cy="18" r="2"/></Icon>,
  gift: (p) => <Icon {...p}><path d="M4 11h16v9H4z"/><path d="M2 7h20v4H2z"/><path d="M12 7v13"/><path d="M12 7S10.5 3 8.5 3 6 5 8 7m4 0s1.5-4 3.5-4S18 5 16 7"/></Icon>,
  card: (p) => <Icon {...p}><rect x="2" y="5" width="20" height="14" rx="3"/><path d="M2 10h20"/></Icon>,
  users: (p) => <Icon {...p}><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.4 2.9-5.5 6.5-5.5s6.5 2.1 6.5 5.5"/><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8"/><path d="M17.7 14.8c2.3.6 3.8 2.3 3.8 5.2"/></Icon>,
  paperclip: (p) => <Icon {...p}><path d="m21 11.5-8.5 8.5a6 6 0 0 1-8.5-8.5l8.5-8.5a4 4 0 1 1 5.7 5.7l-8.5 8.5a2 2 0 0 1-2.8-2.8L15 6.3"/></Icon>,
  calendar: (p) => <Icon {...p}><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18"/></Icon>,
  repeat: (p) => <Icon {...p}><path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/></Icon>,
  mail: (p) => <Icon {...p}><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/></Icon>,
  lock: (p) => <Icon {...p}><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></Icon>,
  edit: (p) => <Icon {...p}><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></Icon>,
  trash: (p) => <Icon {...p}><path d="M3 6h18"/><path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M10 11v6M14 11v6"/></Icon>,
  minus: (p) => <Icon {...p}><path d="M5 12h14"/></Icon>,
  swap: (p) => <Icon {...p}><path d="M7 4v13"/><path d="m3 8 4-4 4 4"/><path d="M17 20V7"/><path d="m13 16 4 4 4-4"/></Icon>,
  camera: (p) => <Icon {...p}><path d="M4 8h2.5L9 5h6l2.5 3H20a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z"/><circle cx="12" cy="13" r="3.5"/></Icon>,
  globe: (p) => <Icon {...p}><circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a14.5 14.5 0 0 1 0 18 14.5 14.5 0 0 1 0-18Z"/></Icon>,
  moon: (p) => <Icon {...p}><path d="M21 13.5A8.5 8.5 0 1 1 10.5 3a7 7 0 0 0 10.5 10.5Z"/></Icon>,
  sun: (p) => <Icon {...p}><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></Icon>,
  logout: (p) => <Icon {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/></Icon>,
  folder: (p) => <Icon {...p}><path d="M3 7a2 2 0 0 1 2-2h4l2 3h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/></Icon>,
  fileText: (p) => <Icon {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/><path d="M9 13h6M9 17h6"/></Icon>,
  sparkle: (p) => <Icon {...p}><path d="M12 3v0c.6 4.2 3.8 7.4 8 8v0c-4.2.6-7.4 3.8-8 8v0c-.6-4.2-3.8-7.4-8-8v0c4.2-.6 7.4-3.8 8-8Z"/></Icon>,
  handCoins: (p) => <Icon {...p}><circle cx="15" cy="6" r="3"/><circle cx="8" cy="8" r="2.4"/><path d="M3 14h3l3.5 2h5a1.5 1.5 0 0 1 0 3H10"/><path d="M3 21h3l3 -1.2 6.5.2c1.6 0 3-.6 4-1.8L21 16"/></Icon>,
  eye: (p) => <Icon {...p}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></Icon>,
  flag: (p) => <Icon {...p}><path d="M5 21V4"/><path d="M5 4c4-2.5 7 2.5 14 0v9c-7 2.5-10-2.5-14 0"/></Icon>,
};
