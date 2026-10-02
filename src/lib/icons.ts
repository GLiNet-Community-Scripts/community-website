/*
 * Stroke glyphs for app tiles (24×24 viewBox, drawn for stroke-width 1.8,
 * round caps). Referenced from apps.yaml via `icon`; the content loader
 * validates names against this map, so a typo fails the build.
 */
export const ICONS: Record<string, string> = {
  router:
    '<rect x="3.5" y="13" width="17" height="6.5" rx="2"/><path d="M7.5 13V9"/><path d="M16.5 13V9"/><path d="M7.2 16.25h.1"/><path d="M10.2 16.25h.1"/>',
  shield:
    '<path d="M12 3l7 2.8v5.4c0 4.6-3 7.7-7 9.3-4-1.6-7-4.7-7-9.3V5.8L12 3z"/><path d="M9 11.8l2.1 2.1 4-4.3"/>',
  lock:
    '<path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/><rect x="5.5" y="10.5" width="13" height="9" rx="2"/><path d="M12 14v2"/>',
  chip:
    '<rect x="7" y="7" width="10" height="10" rx="1.5"/><rect x="10.25" y="10.25" width="3.5" height="3.5"/><path d="M9.5 7V4.5"/><path d="M14.5 7V4.5"/><path d="M9.5 19.5V17"/><path d="M14.5 19.5V17"/><path d="M7 9.5H4.5"/><path d="M7 14.5H4.5"/><path d="M19.5 9.5H17"/><path d="M19.5 14.5H17"/>',
  signal:
    '<path d="M12 12h.01"/><path d="M8.5 15.5a5 5 0 0 1 0-7"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M5.7 18.3a9 9 0 0 1 0-12.6"/><path d="M18.3 5.7a9 9 0 0 1 0 12.6"/>',
  route:
    '<circle cx="6" cy="18.5" r="2.5"/><circle cx="18" cy="5.5" r="2.5"/><path d="M8.5 18.5H17a3.25 3.25 0 0 0 0-6.5H7a3.25 3.25 0 0 1 0-6.5h8.5"/>',
  wave:
    '<path d="M3 9.5c2-2.4 4-2.4 6 0s4 2.4 6 0 4-2.4 6 0"/><path d="M3 15.5c2-2.4 4-2.4 6 0s4 2.4 6 0 4-2.4 6 0"/>',
  radar:
    '<circle cx="12" cy="12" r="8.5"/><path d="M12 12l5.5-5.5"/><path d="M12 12h.01"/><path d="M15.5 14.5h.01"/><path d="M12 7.5a4.5 4.5 0 0 1 4.5 4.5"/>',
  book:
    '<path d="M12 6.5C10.5 5 8.5 4.5 3.5 4.5v14c5 0 7 .5 8.5 2 1.5-1.5 3.5-2 8.5-2v-14c-5 0-7 .5-8.5 2z"/><path d="M12 6.5v14"/>',
  terminal:
    '<rect x="3" y="4.5" width="18" height="15" rx="2.5"/><path d="M7 9.5l3 2.5-3 2.5"/><path d="M12.5 15h4.5"/>',
  message:
    '<path d="M4 5h16a1.5 1.5 0 0 1 1.5 1.5v9A1.5 1.5 0 0 1 20 17h-9.5L6 20.5V17H4a1.5 1.5 0 0 1-1.5-1.5v-9A1.5 1.5 0 0 1 4 5z"/><path d="M7 9.5h10"/><path d="M7 13h6"/>',
  antenna:
    '<circle cx="12" cy="9" r="1.6"/><path d="M12 10.6V21"/><path d="M8.3 5.3a5.2 5.2 0 0 0 0 7.4"/><path d="M15.7 5.3a5.2 5.2 0 0 1 0 7.4"/><path d="M5.4 2.7a9 9 0 0 0 0 12.6"/><path d="M18.6 2.7a9 9 0 0 1 0 12.6"/>',
  usb:
    '<rect x="8" y="10" width="8" height="11" rx="1.5"/><path d="M9.5 10V3h5v7"/><path d="M11 5.5h.01"/><path d="M13 5.5h.01"/>',
  toggle:
    '<rect x="2.5" y="7" width="19" height="10" rx="5"/><circle cx="16.5" cy="12" r="2.8"/>',
  gauge:
    '<path d="M4.2 17.5a9 9 0 1 1 15.6 0"/><path d="M12 14l4-4.5"/><circle cx="12" cy="14" r="1.3"/>',
  clock:
    '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  phone:
    '<rect x="6.5" y="2.5" width="11" height="19" rx="2.5"/><path d="M10.5 18.5h3"/><path d="M9.5 9.5a3.5 3.5 0 0 1 5 0"/><path d="M11 11.4a1.4 1.4 0 0 1 2 0"/>',
  backup:
    '<path d="M4 12a8 8 0 1 0 2.4-5.7"/><path d="M4 4v4.5h4.5"/><path d="M12 8v4l2.8 1.8"/>',
  dashboard:
    '<rect x="3.5" y="3.5" width="7" height="9" rx="1.5"/><rect x="13.5" y="3.5" width="7" height="5" rx="1.5"/><rect x="13.5" y="11.5" width="7" height="9" rx="1.5"/><rect x="3.5" y="15.5" width="7" height="5" rx="1.5"/>',
  satellite:
    '<path d="M4.5 10.5l9 9a6.4 6.4 0 0 0-9-9z"/><path d="M9 15l3.5-3.5"/><circle cx="13.5" cy="10.5" r="1.1"/><path d="M15.5 5.5a3.5 3.5 0 0 1 3 3"/><path d="M15.5 2.5a6.5 6.5 0 0 1 6 6"/>',
  monitor:
    '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8.5 20h7"/><path d="M12 16v4"/>',
  chat:
    '<rect x="4.5" y="7.5" width="15" height="11" rx="3"/><path d="M12 7.5v-3"/><path d="M12 4.5h.01"/><path d="M9.2 12.5h.01"/><path d="M14.8 12.5h.01"/><path d="M9.5 15.5h5"/><path d="M2.5 12v2.5"/><path d="M21.5 12v2.5"/>',
  desktop:
    '<rect x="4.5" y="5" width="15" height="10" rx="1.5"/><path d="M2.5 19h19"/><path d="M4.5 15l-2 4"/><path d="M19.5 15l2 4"/>',
  puzzle:
    '<path d="M9 6V4.5a2 2 0 0 1 4 0V6h4.5a1 1 0 0 1 1 1v4H17a2 2 0 0 0 0 4h1.5v4a1 1 0 0 1-1 1H13v-1.5a2 2 0 0 0-4 0V20H5.5a1 1 0 0 1-1-1v-4H6a2 2 0 0 0 0-4H4.5V7a1 1 0 0 1 1-1z"/>',
  layers:
    '<path d="M12 3.5l9 4.5-9 4.5-9-4.5z"/><path d="M3 12l9 4.5 9-4.5"/><path d="M3 16l9 4.5 9-4.5"/>',
  vlan:
    '<rect x="9.5" y="3" width="5" height="4.5" rx="1"/><rect x="2.5" y="16.5" width="5" height="4.5" rx="1"/><rect x="9.5" y="16.5" width="5" height="4.5" rx="1"/><rect x="16.5" y="16.5" width="5" height="4.5" rx="1"/><path d="M12 7.5v9"/><path d="M5 16.5v-4.5h14v4.5"/>',
  speed:
    '<path d="M3.5 16.5a8.5 8.5 0 1 1 17 0"/><path d="M12 16.5l4.5-5.5"/><path d="M3.5 16.5h2"/><path d="M18.5 16.5h2"/>',
  key:
    '<circle cx="8" cy="15" r="4"/><path d="M10.8 12.2L20 3"/><path d="M16.5 6.5l2.5 2.5"/><path d="M14 9l2 2"/>',
  tailscale:
    '<circle cx="5.5" cy="6" r="2"/><circle cx="18.5" cy="6" r="2"/><circle cx="12" cy="18" r="2"/><path d="M7.5 6h9"/><path d="M6.6 7.7l4.4 8.6"/><path d="M17.4 7.7L13 16.3"/>',
  globe:
    '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17"/><path d="M12 3.5c2.5 2.6 3.5 5.5 3.5 8.5s-1 5.9-3.5 8.5c-2.5-2.6-3.5-5.5-3.5-8.5s1-5.9 3.5-8.5z"/>',
  bug:
    '<rect x="7.5" y="7.5" width="9" height="12" rx="4.5"/><path d="M9.5 7.5a2.5 2.5 0 0 1 5 0"/><path d="M12 11v8.5"/><path d="M7.5 12H4"/><path d="M20 12h-3.5"/><path d="M7.8 16.5l-3 1.5"/><path d="M16.2 16.5l3 1.5"/><path d="M8 9.5L5 8"/><path d="M16 9.5l3-1.5"/>',
};

export const ICON_NAMES = Object.keys(ICONS) as [string, ...string[]];
