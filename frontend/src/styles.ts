import { css } from "lit";

/** Same visual language as the House State card, on Home Assistant tokens. */
export const styles = css`
  :host {
    display: block;
    min-height: 100%;
    box-sizing: border-box;
    color: var(--primary-text-color);
    background: var(--primary-background-color);
    font-family: var(
      --ha-font-family-body,
      var(--paper-font-body1_-_font-family, inherit)
    );
    -webkit-font-smoothing: antialiased;
    --hs-text: var(--primary-text-color, #1b1b1a);
    --hs-muted: var(--secondary-text-color, #5b5a55);
    --hs-home: var(--success-color, #2e7d32);
    --hs-away: var(--warning-color, #f59e0b);
    --hs-neutral: var(--primary-color, #03a9f4);
    --hs-error: var(--error-color, #c62828);
    --hs-surface: var(--ha-card-background, var(--card-background-color, #fff));
    --hs-pill: var(--secondary-background-color, #f3f2ee);
    --hs-line: var(--divider-color, rgba(0, 0, 0, 0.12));
    --hs-radius: var(--ha-card-border-radius, 16px);
    --hs-bar: var(
      --app-header-background-color,
      var(--primary-background-color)
    );
    --hs-bar-text: var(--app-header-text-color, var(--primary-text-color));
    --accent: var(--hs-neutral);
  }
  * {
    box-sizing: border-box;
  }
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
  }
  #state-editor,
  #overlay-editor {
    scroll-margin-top: 150px;
  }
  [hidden] {
    display: none !important;
  }
  .i {
    width: 22px;
    height: 22px;
    flex-shrink: 0;
  }
  .i.s {
    width: 18px;
    height: 18px;
  }
  .i.xs {
    width: 15px;
    height: 15px;
  }
  .spin {
    animation: spin 1s linear infinite;
  }
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .spin {
      animation: none;
    }
  }
  .mono {
    font-family: var(
      --ha-font-family-code,
      ui-monospace,
      SFMono-Regular,
      Menlo,
      monospace
    );
    font-size: 0.92em;
  }
  .muted {
    color: var(--hs-muted);
  }

  /* ------------------------------------------------------------ top bar */
  .bar {
    position: sticky;
    top: 0;
    z-index: 4;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 12px;
    min-height: 64px;
    padding: 8px max(16px, env(safe-area-inset-right)) 8px
      max(16px, env(safe-area-inset-left));
    color: var(--hs-bar-text);
    background: var(--hs-bar);
    border-bottom: 1px solid var(--hs-line);
  }
  .bar-title {
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 0;
    flex: 1 1 240px;
  }
  .titles {
    min-width: 0;
  }
  h1 {
    margin: 0;
    font-size: 20px;
    font-weight: 700;
    line-height: 1.2;
  }
  .subtitle {
    font-size: 13px;
    color: var(--hs-muted);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .entry-select {
    min-height: 40px;
    max-width: 220px;
  }
  .actions {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-left: auto;
  }
  .status {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    font-weight: 600;
    color: var(--hs-muted);
    white-space: nowrap;
  }
  .status.dirty {
    color: color-mix(in srgb, var(--hs-away) 70%, var(--hs-text));
  }
  .status .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: currentColor;
  }
  :host([narrow]) .actions {
    width: 100%;
    margin-left: 0;
  }
  :host([narrow]) .actions .status {
    flex: 1;
    white-space: normal;
  }

  /* ------------------------------------------------------------ buttons */
  button {
    font: inherit;
    color: inherit;
  }
  .btn {
    min-height: 44px;
    border: 0;
    border-radius: 22px;
    padding: 0 18px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    font-weight: 600;
    color: var(--hs-text);
    background: var(--hs-pill);
    cursor: pointer;
    text-decoration: none;
    white-space: nowrap;
  }
  .btn.primary {
    color: var(--text-primary-color, #fff);
    background: var(--primary-color, #03a9f4);
  }
  .btn.danger {
    color: var(--hs-error);
    background: color-mix(in srgb, var(--hs-error) 12%, var(--hs-pill));
  }
  .btn.danger.solid {
    color: #fff;
    background: color-mix(in srgb, var(--hs-error) 88%, #000);
  }
  .btn.ghost {
    background: transparent;
    box-shadow: inset 0 0 0 1px var(--hs-line);
  }
  .btn:disabled {
    opacity: 0.45;
    cursor: default;
  }
  .btn:focus-visible,
  .icon-btn:focus-visible,
  .pill:focus-visible,
  .node:focus-visible,
  .item:focus-visible,
  .tab:focus-visible,
  .acc-head:focus-visible {
    outline: 2px solid var(--primary-color, #03a9f4);
    outline-offset: 2px;
  }
  .icon-btn {
    flex: 0 0 44px;
    width: 44px;
    height: 44px;
    border: 0;
    border-radius: 50%;
    display: grid;
    place-items: center;
    color: var(--hs-muted);
    background: var(--hs-pill);
    cursor: pointer;
  }

  /* ------------------------------------------------------------ banners */
  .banner {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    margin: 0 0 16px;
    padding: 12px 14px;
    border-radius: var(--hs-radius);
    background: color-mix(in srgb, var(--accent) 14%, var(--hs-surface));
    --accent: var(--hs-neutral);
  }
  .banner.success {
    --accent: var(--hs-home);
  }
  .banner.error {
    --accent: var(--hs-error);
  }
  .banner.warn {
    --accent: var(--hs-away);
  }
  .banner .text {
    flex: 1;
    min-width: 0;
    align-self: center;
    overflow-wrap: anywhere;
  }
  .banner strong {
    display: block;
  }
  .banner .detail {
    font-size: 14px;
    color: var(--hs-text);
  }
  .banner > .i {
    margin-top: 2px;
    color: color-mix(in srgb, var(--accent) 75%, var(--hs-text));
  }

  /* ------------------------------------------------------------ page */
  main {
    max-width: 1280px;
    margin: 0 auto;
    padding: 16px 24px 48px;
  }
  :host([narrow]) main {
    padding: 12px 16px 48px;
  }
  main[inert] {
    opacity: 0.6;
  }
  .tabs {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 16px;
  }
  .tab {
    min-height: 44px;
    border: 0;
    border-radius: 22px;
    padding: 0 16px 0 12px;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-weight: 600;
    color: var(--hs-muted);
    background: transparent;
    cursor: pointer;
  }
  .tab:hover {
    background: var(--hs-pill);
  }
  .tab[aria-selected="true"] {
    color: color-mix(in srgb, var(--primary-color) 70%, var(--hs-text));
    background: color-mix(in srgb, var(--primary-color) 16%, var(--hs-surface));
  }
  .count {
    min-width: 20px;
    height: 20px;
    padding: 0 6px;
    border-radius: 10px;
    display: inline-grid;
    place-items: center;
    font-size: 12px;
    font-weight: 700;
    color: #fff;
    background: color-mix(in srgb, var(--hs-error) 88%, #000);
  }

  /* Accordion on narrow screens */
  .accordion {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .acc {
    border-radius: var(--hs-radius);
    background: var(--hs-surface);
    box-shadow: var(--ha-card-box-shadow, none);
    border: 1px solid var(--hs-line);
    overflow: hidden;
  }
  .acc-head {
    width: 100%;
    min-height: 64px;
    border: 0;
    padding: 10px 14px;
    display: flex;
    align-items: center;
    gap: 12px;
    text-align: left;
    background: transparent;
    cursor: pointer;
  }
  .acc-text {
    flex: 1;
    min-width: 0;
  }
  .acc-title {
    display: block;
    font-weight: 700;
  }
  .acc-hint {
    display: block;
    font-size: 13px;
    color: var(--hs-muted);
  }
  .chev {
    color: var(--hs-muted);
    transition: transform 0.15s;
  }
  .acc.open .chev {
    transform: rotate(180deg);
  }
  .acc-body {
    padding: 0 12px 14px;
  }
  .acc-body .card {
    border: 0;
    box-shadow: none;
    padding: 4px 4px 8px;
    background: transparent;
  }
  .acc-body .card + .card {
    border-top: 1px solid var(--hs-line);
    border-radius: 0;
    padding-top: 16px;
  }

  /* ------------------------------------------------------------ cards */
  .card {
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 14px;
    padding: 16px;
    border-radius: var(--hs-radius);
    background: var(--hs-surface);
    border: 1px solid var(--hs-line);
    box-shadow: var(--ha-card-box-shadow, none);
  }
  .card-head {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .card-head .grow {
    flex: 1;
    min-width: 0;
  }
  h2 {
    margin: 0;
    font-size: 17px;
    font-weight: 700;
  }
  h3 {
    margin: 4px 0 0;
    font-size: 15px;
    font-weight: 700;
  }
  .lead {
    margin: 0;
    font-size: 14px;
    line-height: 1.45;
    color: var(--hs-muted);
  }
  .split {
    display: grid;
    grid-template-columns: minmax(0, 7fr) minmax(340px, 5fr);
    gap: 16px;
    align-items: start;
  }
  .column {
    display: flex;
    flex-direction: column;
    gap: 16px;
    min-width: 0;
  }
  .sticky {
    position: sticky;
    top: 80px;
  }
  .stack {
    display: flex;
    flex-direction: column;
    gap: 16px;
    max-width: 760px;
  }
  :host([narrow]) .split {
    grid-template-columns: minmax(0, 1fr);
  }
  :host([narrow]) .sticky {
    position: static;
  }
  .circ {
    flex: 0 0 44px;
    width: 44px;
    height: 44px;
    border-radius: 50%;
    display: grid;
    place-items: center;
    color: color-mix(in srgb, var(--accent) 75%, var(--hs-text));
    background: color-mix(in srgb, var(--accent) 20%, transparent);
  }
  .circ.sm {
    flex-basis: 36px;
    width: 36px;
    height: 36px;
  }
  .tone-home {
    --accent: var(--hs-home);
  }
  .tone-away {
    --accent: var(--hs-away);
  }
  .tone-overlay {
    --accent: var(--hs-away);
  }
  .tone-neutral {
    --accent: var(--hs-neutral);
  }
  .empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    padding: 28px 12px;
    text-align: center;
    color: var(--hs-muted);
  }
  .center-page {
    max-width: 520px;
    margin: 12vh auto 0;
  }

  /* ------------------------------------------------------------ tree */
  .tree {
    display: flex;
    flex-direction: column;
    gap: 2px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .node,
  .item {
    width: 100%;
    min-height: 56px;
    border: 0;
    border-radius: 14px;
    padding: 6px 10px;
    display: flex;
    align-items: center;
    gap: 10px;
    text-align: left;
    background: transparent;
    cursor: pointer;
  }
  .node:hover,
  .item:hover {
    background: color-mix(in srgb, var(--hs-text) 4%, transparent);
  }
  .node[aria-current="true"],
  .item[aria-current="true"] {
    background: color-mix(in srgb, var(--primary-color) 13%, var(--hs-surface));
    box-shadow: inset 0 0 0 2px
      color-mix(in srgb, var(--primary-color) 55%, transparent);
  }
  .indent {
    flex: 0 0 auto;
    align-self: stretch;
    display: flex;
  }
  .guide {
    width: 22px;
    border-left: 2px solid var(--hs-line);
    margin-left: 17px;
  }
  .guide + .guide {
    margin-left: 0;
  }
  :host([narrow]) .guide {
    width: 12px;
    margin-left: 8px;
  }
  .node-main {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .node-name {
    display: flex;
    align-items: baseline;
    flex-wrap: wrap;
    gap: 2px 8px;
    font-weight: 700;
    overflow-wrap: anywhere;
  }
  .node-id {
    font-weight: 400;
    color: var(--hs-muted);
    font-size: 12px;
  }
  .node-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 10px;
    font-size: 13px;
    color: var(--hs-muted);
  }
  .node-meta > span {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    min-width: 0;
    overflow-wrap: anywhere;
  }
  .badges {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 4px;
    max-width: 50%;
  }
  :host([narrow]) .badges {
    max-width: 40%;
  }
  .badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    min-height: 22px;
    padding: 1px 9px;
    border-radius: 11px;
    font-size: 12px;
    font-weight: 600;
    white-space: nowrap;
    color: color-mix(in srgb, var(--accent) 72%, var(--hs-text));
    background: color-mix(in srgb, var(--accent) 16%, transparent);
  }
  .badge.outline {
    background: transparent;
    box-shadow: inset 0 0 0 1px
      color-mix(in srgb, var(--accent) 45%, transparent);
  }
  .badge.error {
    --accent: var(--hs-error);
  }
  .badge.role {
    --accent: var(--hs-neutral);
  }
  .badge.start {
    --accent: var(--hs-neutral);
    color: var(--text-primary-color, #fff);
    background: color-mix(in srgb, var(--primary-color) 85%, #000);
  }
  .occ {
    width: 9px;
    height: 9px;
    border-radius: 50%;
    background: var(--accent);
  }
  .occ.inherited {
    background: transparent;
    box-shadow: inset 0 0 0 2px var(--accent);
  }
  .toolbar-row {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  /* ------------------------------------------------------------ forms */
  .fields {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  .grid2 {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 12px;
  }
  .field {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0;
  }
  .label {
    font-size: 13px;
    font-weight: 600;
    color: var(--hs-muted);
  }
  .hint {
    font-size: 13px;
    line-height: 1.4;
    color: var(--hs-muted);
  }
  .error-text {
    display: inline-flex;
    align-items: flex-start;
    gap: 6px;
    font-size: 13px;
    font-weight: 600;
    color: var(--hs-error);
  }
  .error-text .i {
    margin-top: 1px;
  }
  input[type="text"],
  input[type="number"],
  input[type="time"],
  select {
    width: 100%;
    min-height: 44px;
    border: 1px solid var(--hs-line);
    border-radius: 12px;
    padding: 0 12px;
    font: inherit;
    color: var(--hs-text);
    background: var(--hs-pill);
    color-scheme: light dark;
  }
  input[readonly] {
    color: var(--hs-muted);
    background: transparent;
  }
  input:focus-visible,
  select:focus-visible {
    outline: 2px solid var(--primary-color, #03a9f4);
    outline-offset: 0;
    border-color: transparent;
  }
  [aria-invalid="true"] {
    border-color: var(--hs-error) !important;
  }
  .with-unit {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .with-unit input {
    flex: 1;
    min-width: 0;
  }
  .unit {
    font-size: 14px;
    color: var(--hs-muted);
    min-width: 22px;
  }
  .duration {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .duration .with-unit {
    flex: 1 1 110px;
  }
  .compact {
    flex: 1 1 120px;
  }
  .row-fields {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    align-items: flex-start;
  }
  .segment {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .pill {
    flex: 1 1 auto;
    min-width: 0;
    min-height: 44px;
    border: 0;
    border-radius: 22px;
    padding: 0 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    font-weight: 600;
    color: var(--hs-text);
    background: var(--hs-pill);
    cursor: pointer;
    overflow-wrap: anywhere;
  }
  .pill.active {
    color: color-mix(in srgb, var(--primary-color) 70%, var(--hs-text));
    background: color-mix(in srgb, var(--primary-color) 20%, var(--hs-pill));
  }
  .pills-multi .pill {
    flex: 0 1 auto;
  }
  .toggle-row {
    display: flex;
    align-items: center;
    gap: 14px;
    min-height: 52px;
    cursor: pointer;
  }
  .toggle-text {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .toggle-label {
    font-weight: 600;
  }
  .switch {
    appearance: none;
    flex: 0 0 auto;
    position: relative;
    width: 48px;
    height: 28px;
    margin: 8px 0;
    border-radius: 14px;
    background: color-mix(in srgb, var(--hs-text) 22%, transparent);
    cursor: pointer;
    transition: background 0.15s;
  }
  .switch::after {
    content: "";
    position: absolute;
    top: 3px;
    left: 3px;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: #fff;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
    transition: transform 0.15s;
  }
  .switch:checked {
    background: var(--primary-color, #03a9f4);
  }
  .switch:checked::after {
    transform: translateX(20px);
  }
  .switch:focus-visible {
    outline: 2px solid var(--primary-color, #03a9f4);
    outline-offset: 2px;
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .chip {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    min-height: 36px;
    padding: 0 4px 0 12px;
    border-radius: 18px;
    background: var(--hs-pill);
    overflow-wrap: anywhere;
  }
  .chip-x {
    width: 32px;
    height: 32px;
    border: 0;
    border-radius: 50%;
    display: grid;
    place-items: center;
    background: transparent;
    color: var(--hs-muted);
    cursor: pointer;
  }
  .add-row {
    display: flex;
    gap: 8px;
  }
  .note {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 10px 12px;
    border-radius: 12px;
    font-size: 14px;
    line-height: 1.4;
    background: color-mix(in srgb, var(--accent) 12%, transparent);
    --accent: var(--hs-away);
  }
  .note.info {
    --accent: var(--hs-neutral);
  }
  .note > .i {
    color: color-mix(in srgb, var(--accent) 75%, var(--hs-text));
  }
  .preview {
    padding: 10px 12px;
    border-radius: 12px;
    font-weight: 600;
    background: var(--hs-pill);
  }
  .divider {
    height: 1px;
    background: var(--hs-line);
    margin: 2px 0;
  }
  .editor-foot {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    justify-content: space-between;
    padding-top: 4px;
  }
  ha-selector {
    display: block;
  }

  /* ------------------------------------------------------------ dialogs */
  .scrim {
    position: fixed;
    inset: 0;
    z-index: 10;
    display: grid;
    place-items: center;
    padding: 16px;
    background: rgba(0, 0, 0, 0.5);
  }
  .dialog {
    width: min(540px, 100%);
    max-height: calc(100vh - 32px);
    overflow: auto;
    display: flex;
    flex-direction: column;
    gap: 14px;
    padding: 20px;
    border-radius: 24px;
    background: var(--hs-surface);
    color: var(--hs-text);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.35);
  }
  :host([narrow]) .scrim {
    place-items: end stretch;
    padding: 0;
  }
  :host([narrow]) .dialog {
    width: 100%;
    border-radius: 24px 24px 0 0;
    padding-bottom: max(20px, env(safe-area-inset-bottom));
  }
  .dialog-head {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .dialog-head h2 {
    font-size: 20px;
  }
  .effects {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .effects li {
    display: flex;
    gap: 10px;
    align-items: flex-start;
    line-height: 1.4;
  }
  .effects li .i {
    margin-top: 1px;
    color: var(--hs-muted);
  }
  .dialog-actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 8px;
  }
`;
