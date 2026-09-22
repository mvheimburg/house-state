import { html, svg, type SVGTemplateResult } from "lit";

const paths: Record<string, SVGTemplateResult> = {
  home: svg`<path d="M3 10.5 12 3l9 7.5"></path><path d="M5 9.5V21h14V9.5"></path>`,
  away: svg`<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><path d="M16 17l5-5-5-5"></path><path d="M21 12H9"></path>`,
  vacation: svg`<rect x="3" y="7" width="18" height="13" rx="2"></rect><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>`,
  day: svg`<circle cx="12" cy="12" r="4"></circle><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"></path>`,
  night: svg`<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"></path>`,
  tv: svg`<rect x="2" y="6" width="20" height="13" rx="2"></rect><path d="M8 2l4 4 4-4"></path>`,
  eating: svg`<path d="M7 2v8a2 2 0 0 0 4 0V2M9 10v12"></path><path d="M17 2c-1.7 1.5-2.5 3.5-2.5 6s1 3.5 2.5 3.5V22"></path>`,
  overlay: svg`<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"></path>`,
  apply: svg`<path d="M21 12a9 9 0 1 1-2.64-6.36"></path><path d="M21 3v6h-6"></path>`,
  spinner: svg`<path d="M21 12a9 9 0 1 1-6.2-8.56"></path>`,
  warning: svg`<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"></path><path d="M12 9v4M12 17h.01"></path>`,
  water: svg`<path d="M12 2.7s6 6.4 6 11.3a6 6 0 0 1-12 0c0-4.9 6-11.3 6-11.3z"></path>`,
  key: svg`<circle cx="7.5" cy="15.5" r="4.5"></circle><path d="M10.7 12.3 21 2M16 7l3 3"></path>`,
  chevron: svg`<path d="m6 9 6 6 6-6"></path>`,
  cog: svg`<circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>`,
  menu: svg`<path d="M4 6h16M4 12h16M4 18h16"></path>`,
  plus: svg`<path d="M12 5v14M5 12h14"></path>`,
  trash: svg`<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"></path><path d="M10 11v6M14 11v6"></path>`,
  check: svg`<path d="M20 6 9 17l-5-5"></path>`,
  close: svg`<path d="M18 6 6 18M6 6l12 12"></path>`,
  star: svg`<path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5-4.8-4.6 6.6-.9z"></path>`,
  flag: svg`<path d="M5 21V4M5 4h11l-2 4 2 4H5"></path>`,
  state: svg`<circle cx="12" cy="12" r="8"></circle><circle cx="12" cy="12" r="3"></circle>`,
  calendar: svg`<rect x="3" y="5" width="18" height="16" rx="2"></rect><path d="M16 3v4M8 3v4M3 10h18"></path>`,
  people: svg`<circle cx="9" cy="8" r="3.5"></circle><path d="M2.5 20a6.5 6.5 0 0 1 13 0"></path><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6.5 6.5 0 0 1 3.5 6"></path>`,
  guest: svg`<circle cx="12" cy="8" r="4"></circle><path d="M4 21a8 8 0 0 1 16 0"></path>`,
  tree: svg`<path d="M5 4v14a2 2 0 0 0 2 2h3M5 9h5"></path><rect x="12" y="6" width="8" height="6" rx="2"></rect><rect x="12" y="16" width="8" height="6" rx="2"></rect>`,
  advanced: svg`<path d="M4 7h10M18 7h2M4 17h4M12 17h8"></path><circle cx="16" cy="7" r="2"></circle><circle cx="10" cy="17" r="2"></circle>`,
  info: svg`<circle cx="12" cy="12" r="9"></circle><path d="M12 11v5M12 8h.01"></path>`,
};

const STARTER = new Set([
  "home",
  "away",
  "vacation",
  "day",
  "night",
  "tv",
  "eating",
]);
/** Starter IDs keep their card icons; every other state gets a neutral mark. */
export const stateIcon = (id: string) => (STARTER.has(id) ? id : "state");

// No whitespace inside <svg>: it would leak into a button's textContent.
// prettier-ignore
export const icon = (name: string, extra = "") =>
  paths[name]
    ? html`<svg class="i ${extra}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]}</svg>`
    : null;
