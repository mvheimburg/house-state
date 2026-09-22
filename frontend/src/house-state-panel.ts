import {
  LitElement,
  html,
  nothing,
  type PropertyValues,
  type TemplateResult,
} from "lit";
import {
  durationField,
  entityPicker,
  help,
  loadHaSelector,
  numberField,
  segmented,
  selectField,
  textField,
  toggleField,
  type SelectOption,
} from "./fields";
import { icon, stateIcon } from "./icons";
import {
  displayName,
  fill,
  formattingLocale,
  localize,
  type Strings,
} from "./localize";
import {
  activationOf,
  canonical,
  checkConfig,
  childrenOf,
  clone,
  DEFAULT_LIMITS,
  defaultRule,
  deleteState,
  descend,
  descendants,
  flatten,
  ID_PATTERN,
  mmdd,
  minutesToOffset,
  occupancy,
  offsetToMinutes,
  planDeletion,
  RESERVED_OVERLAYS,
  renameState,
  ROLES,
  roleProblem,
  sceneSource,
  setActivation,
  setParent,
  slugify,
  splitMmdd,
  uniqueId,
  WEEKDAYS,
  type Activation,
  type Issue,
} from "./model";
import { styles } from "./styles";
import {
  conditionSummary,
  entityName,
  formatNumber,
  nightSummary,
  ruleSummary,
  type SummaryContext,
} from "./summary";
import type {
  DateRule,
  Entry,
  GetResponse,
  HomeAssistant,
  HouseConfig,
  Overlay,
  Role,
  SaveResponse,
  StateNode,
  ValidateResponse,
} from "./types";

export type Section =
  | "states"
  | "overlays"
  | "presence"
  | "night"
  | "visits"
  | "water"
  | "advanced";
const SECTIONS: { id: Section; icon: string }[] = [
  { id: "states", icon: "tree" },
  { id: "overlays", icon: "overlay" },
  { id: "presence", icon: "people" },
  { id: "night", icon: "night" },
  { id: "visits", icon: "guest" },
  { id: "water", icon: "water" },
  { id: "advanced", icon: "advanced" },
];

type Dialog =
  | { kind: "deleteState"; id: string; replacement: string }
  | { kind: "deleteOverlay"; id: string }
  | { kind: "warnings"; warnings: string[] }
  | { kind: "discard" }
  | { kind: "switchEntry"; entryId: string };

type Banner =
  | { kind: "saved" }
  | { kind: "invalid"; detail: string }
  | { kind: "failed"; detail: string }
  | { kind: "conflict" };

const errorText = (err: unknown): string =>
  (err as { message?: string })?.message || String(err);

export class HouseStatePanel extends LitElement {
  static styles = styles;
  static properties = {
    hass: { attribute: false },
    narrow: { type: Boolean, reflect: true },
    route: { attribute: false },
    panel: { attribute: false },
    loading: { state: true },
    loadError: { state: true },
    entries: { state: true },
    entryId: { state: true },
    saved: { state: true },
    draft: { state: true },
    section: { state: true },
    selectedState: { state: true },
    selectedOverlay: { state: true },
    pendingId: { state: true },
    saving: { state: true },
    banner: { state: true },
    dialog: { state: true },
  };

  hass?: HomeAssistant;
  narrow = false;
  route?: unknown;
  panel?: unknown;

  loading = true;
  loadError?: string;
  entries: Entry[] = [];
  entryId?: string;
  saved?: HouseConfig;
  draft?: HouseConfig;
  revision?: string;
  limits = DEFAULT_LIMITS;
  section: Section | "" = "states";
  selectedState: string | null = null;
  selectedOverlay: string | null = null;
  /** An ID being typed for a new item; committed when valid and unique. */
  pendingId?: string;
  saving = false;
  banner?: Banner;
  dialog?: Dialog;

  private newIds = new Set<string>();
  private idTouched = new Set<string>();
  private requested = false;
  private savedCanonical = "";

  private readonly onBeforeUnload = (event: BeforeUnloadEvent) => {
    if (this.dirty) {
      event.preventDefault();
      event.returnValue = "";
    }
  };

  connectedCallback(): void {
    super.connectedCallback();
    window.addEventListener("beforeunload", this.onBeforeUnload);
    if (!customElements.get("ha-selector")) {
      void loadHaSelector();
      customElements
        .whenDefined("ha-selector")
        .then(() => this.requestUpdate());
    }
  }

  disconnectedCallback(): void {
    window.removeEventListener("beforeunload", this.onBeforeUnload);
    super.disconnectedCallback();
  }

  protected updated(changed: PropertyValues): void {
    if (changed.has("hass") && this.hass && !this.requested) {
      this.requested = true;
      void this.load();
    }
  }

  get t(): Strings {
    return localize(this.hass);
  }

  get locale(): string {
    return formattingLocale(this.hass);
  }

  get dirty(): boolean {
    return !!this.draft && canonical(this.draft) !== this.savedCanonical;
  }

  get issues(): Issue[] {
    return this.draft ? checkConfig(this.draft, this.limits) : [];
  }

  private get summaryContext(): SummaryContext {
    return {
      strings: this.t,
      locale: this.locale,
      states: this.hass?.states,
      tree: this.draft?.state_tree ?? [],
      timeFormat: this.hass?.locale?.time_format,
    };
  }

  // ------------------------------------------------------------ data

  async load(entryId = this.entryId): Promise<void> {
    if (!this.hass) return;
    this.loading = true;
    this.loadError = undefined;
    try {
      const response = await this.hass.callWS<GetResponse>({
        type: "house_state/config/get",
        ...(entryId ? { entry_id: entryId } : {}),
      });
      this.entries = response.entries ?? [];
      this.entryId = response.entry_id;
      this.applySaved(response.config, response.revision);
      if (response.limits) this.limits = response.limits;
    } catch (err) {
      this.loadError = errorText(err);
    } finally {
      this.loading = false;
    }
  }

  private applySaved(
    config: HouseConfig | undefined,
    revision: string | undefined,
  ) {
    this.saved = config ? clone(config) : undefined;
    this.draft = config ? clone(config) : undefined;
    this.savedCanonical = canonical(config);
    this.revision = revision;
    this.newIds.clear();
    this.idTouched.clear();
    this.pendingId = undefined;
    if (!config?.state_tree.some((node) => node.id === this.selectedState))
      this.selectedState = null;
    if (
      !config?.overlays.some((overlay) => overlay.id === this.selectedOverlay)
    )
      this.selectedOverlay = null;
  }

  private edit(next: HouseConfig) {
    this.draft = next;
    if (this.banner?.kind === "saved") this.banner = undefined;
  }

  private change(mutate: (draft: HouseConfig) => void) {
    if (!this.draft) return;
    const next = clone(this.draft);
    mutate(next);
    this.edit(next);
  }

  discard() {
    if (!this.saved) return;
    this.applySaved(this.saved, this.revision);
    this.banner = undefined;
    this.dialog = undefined;
  }

  async save(acknowledge = false): Promise<void> {
    if (!this.hass || !this.draft || !this.entryId || this.saving) return;
    this.saving = true;
    this.banner = undefined;
    this.dialog = undefined;
    const config = clone(this.draft);
    try {
      if (!acknowledge) {
        const check = await this.hass.callWS<ValidateResponse>({
          type: "house_state/config/validate",
          entry_id: this.entryId,
          config,
        });
        if (!check.valid) {
          this.banner = { kind: "invalid", detail: check.error };
          return;
        }
      }
      const result = await this.hass.callWS<SaveResponse>({
        type: "house_state/config/save",
        entry_id: this.entryId,
        config,
        revision: this.revision,
        ...(acknowledge ? { acknowledge_warnings: true } : {}),
      });
      if (result.saved) {
        this.revision = result.revision;
        this.applySaved(config, result.revision);
        this.banner = { kind: "saved" };
        await this.refresh();
      } else if (result.error) {
        this.banner = { kind: "invalid", detail: result.error };
      } else {
        this.dialog = { kind: "warnings", warnings: result.warnings ?? [] };
      }
    } catch (err) {
      this.banner =
        (err as { code?: string })?.code === "conflict"
          ? { kind: "conflict" }
          : { kind: "failed", detail: errorText(err) };
    } finally {
      this.saving = false;
    }
  }

  /** Pick up the stored, normalized configuration after a save. */
  private async refresh() {
    try {
      const response = await this.hass!.callWS<GetResponse>({
        type: "house_state/config/get",
        entry_id: this.entryId,
      });
      if (response.config) {
        this.entries = response.entries ?? this.entries;
        this.applySaved(response.config, response.revision);
      }
    } catch {
      // The save succeeded; the draft already matches what was stored.
    }
  }

  private async reloadAfterConflict() {
    this.banner = undefined;
    await this.load(this.entryId);
  }

  private chooseEntry(entryId: string) {
    if (entryId === this.entryId) return;
    if (this.dirty) this.dialog = { kind: "switchEntry", entryId };
    else void this.switchEntry(entryId);
  }

  private async switchEntry(entryId: string) {
    this.dialog = undefined;
    this.banner = undefined;
    this.selectedState = null;
    this.selectedOverlay = null;
    await this.load(entryId);
  }

  // ------------------------------------------------------------ naming

  stateName(node: StateNode): string {
    return displayName(this.t, node, "starterStates");
  }

  overlayName(overlay: Overlay): string {
    return displayName(this.t, overlay, "starterOverlays");
  }

  private stateLabel(id: string | null | undefined): string {
    const node = this.draft?.state_tree.find((item) => item.id === id);
    return node ? this.stateName(node) : (id ?? "");
  }

  private stateOptions(exclude = new Set<string>()): SelectOption[] {
    return flatten(this.draft!.state_tree)
      .filter(({ node }) => !exclude.has(node.id))
      .map(({ node, depth }) => ({
        value: node.id,
        label: `${"  ".repeat(depth)}${this.stateName(node)} (${node.id})`,
      }));
  }

  private issueText(issue: Issue | undefined): string | undefined {
    if (!issue) return undefined;
    const params = { ...(issue.params ?? {}) };
    if (typeof params.role === "string")
      params.role = this.t.role[params.role as Role];
    return fill(this.t[issue.key], params);
  }

  private issueFor(field: string): string | undefined {
    return this.issueText(this.issues.find((issue) => issue.field === field));
  }

  // ------------------------------------------------------------ states

  selectState(id: string | null) {
    this.selectedState = id;
    this.pendingId = undefined;
    if (id && this.narrow)
      void this.updateComplete.then(() =>
        this.renderRoot
          .querySelector("#state-editor")
          ?.scrollIntoView?.({ block: "start", behavior: "smooth" }),
      );
  }

  addState(parent: string | null) {
    if (!this.draft) return;
    const name = this.t.newState;
    const id = uniqueId(
      slugify(name),
      this.draft.state_tree.map((node) => node.id),
    );
    this.change((draft) =>
      draft.state_tree.push({
        id,
        name,
        parent,
        scene: "",
        default_child: null,
        occupied: null,
      }),
    );
    this.newIds.add(`state:${id}`);
    this.selectState(id);
    void this.focusName("#state-name");
  }

  private async focusName(selector: string) {
    await this.updateComplete;
    const input = this.renderRoot.querySelector<HTMLInputElement>(selector);
    input?.focus();
    input?.select();
  }

  private patchState(id: string, patch: Partial<StateNode>) {
    this.change((draft) => {
      const node = draft.state_tree.find((item) => item.id === id);
      if (node) Object.assign(node, patch);
    });
  }

  renameStateName(id: string, name: string) {
    if (!this.draft) return;
    let next = clone(this.draft);
    next.state_tree.find((node) => node.id === id)!.name = name;
    let current = id;
    if (this.newIds.has(`state:${id}`) && !this.idTouched.has(`state:${id}`)) {
      const others = next.state_tree
        .filter((node) => node.id !== id)
        .map((node) => node.id);
      const candidate = uniqueId(slugify(name || this.t.newState), others);
      if (candidate !== id) {
        next = renameState(next, id, candidate);
        this.newIds.delete(`state:${id}`);
        this.newIds.add(`state:${candidate}`);
        current = candidate;
      }
    }
    this.edit(next);
    this.selectedState = current;
  }

  private idProblem(
    value: string,
    taken: string[],
    reserved: string[] = [],
  ): string | undefined {
    if (!ID_PATTERN.test(value) || value.length > 64) return this.t.idInvalid;
    if (reserved.includes(value)) return this.t.idReserved;
    if (taken.includes(value)) return this.t.idDuplicate;
    return undefined;
  }

  commitStateId(id: string, value: string) {
    const others = this.draft!.state_tree.filter((node) => node.id !== id).map(
      (node) => node.id,
    );
    this.idTouched.add(`state:${id}`);
    if (value === id) {
      this.pendingId = undefined;
      return;
    }
    if (this.idProblem(value, others)) {
      this.pendingId = value;
      return;
    }
    this.edit(renameState(this.draft!, id, value));
    this.newIds.delete(`state:${id}`);
    this.newIds.add(`state:${value}`);
    this.idTouched.add(`state:${value}`);
    this.selectedState = value;
    this.pendingId = undefined;
  }

  requestDeleteState(id: string) {
    const others = this.draft!.state_tree.filter((node) => node.id !== id);
    this.dialog = { kind: "deleteState", id, replacement: others[0]?.id ?? "" };
  }

  confirmDeleteState(id: string, replacement: string) {
    this.edit(deleteState(this.draft!, id, replacement));
    this.newIds.delete(`state:${id}`);
    this.dialog = undefined;
    this.selectState(null);
  }

  // ------------------------------------------------------------ overlays

  addOverlay() {
    if (!this.draft) return;
    const name = this.t.newOverlay;
    const id = uniqueId(slugify(name, "overlay"), [
      ...this.draft.overlays.map((overlay) => overlay.id),
      ...RESERVED_OVERLAYS,
    ]);
    this.change((draft) => draft.overlays.push({ id, name, scene: "" }));
    this.newIds.add(`overlay:${id}`);
    this.selectOverlay(id);
    void this.focusName("#overlay-name");
  }

  selectOverlay(id: string | null) {
    this.selectedOverlay = id;
    this.pendingId = undefined;
    if (id && this.narrow)
      void this.updateComplete.then(() =>
        this.renderRoot
          .querySelector("#overlay-editor")
          ?.scrollIntoView?.({ block: "start", behavior: "smooth" }),
      );
  }

  private replaceOverlay(id: string, next: Overlay) {
    this.change((draft) => {
      const index = draft.overlays.findIndex((overlay) => overlay.id === id);
      if (index >= 0) draft.overlays[index] = next;
    });
  }

  private patchOverlay(
    id: string,
    patch: Partial<Overlay>,
    remove: (keyof Overlay)[] = [],
  ) {
    const overlay = this.draft!.overlays.find((item) => item.id === id);
    if (!overlay) return;
    const next = { ...clone(overlay), ...patch };
    for (const key of remove) delete next[key];
    this.replaceOverlay(id, next);
  }

  renameOverlayName(id: string, name: string) {
    const key = `overlay:${id}`;
    const taken = [
      ...this.draft!.overlays.filter((item) => item.id !== id).map(
        (item) => item.id,
      ),
      ...RESERVED_OVERLAYS,
    ];
    const nextId =
      this.newIds.has(key) && !this.idTouched.has(key)
        ? uniqueId(slugify(name || this.t.newOverlay, "overlay"), taken)
        : id;
    this.patchOverlay(id, { name, id: nextId });
    if (nextId !== id) {
      this.newIds.delete(key);
      this.newIds.add(`overlay:${nextId}`);
      this.selectedOverlay = nextId;
    }
  }

  commitOverlayId(id: string, value: string) {
    const taken = this.draft!.overlays.filter((item) => item.id !== id).map(
      (item) => item.id,
    );
    this.idTouched.add(`overlay:${id}`);
    if (value === id) {
      this.pendingId = undefined;
      return;
    }
    if (this.idProblem(value, taken, RESERVED_OVERLAYS)) {
      this.pendingId = value;
      return;
    }
    this.patchOverlay(id, { id: value });
    this.newIds.delete(`overlay:${id}`);
    this.newIds.add(`overlay:${value}`);
    this.idTouched.add(`overlay:${value}`);
    this.selectedOverlay = value;
    this.pendingId = undefined;
  }

  // ------------------------------------------------------------ render

  protected render(): TemplateResult {
    const t = this.t;
    return html`
      ${this.renderBar()}
      ${
        this.loading && !this.draft
          ? html`<div class="center-page">
              <div class="card empty" role="status">
                ${icon("spinner", "spin")}<span>${t.loading}</span>
              </div>
            </div>`
          : this.loadError && !this.draft
            ? this.renderLoadError()
            : !this.draft
              ? this.renderNotConfigured()
              : html`<main ?inert=${this.saving}>
                  ${this.renderBanner()}
                  ${this.narrow ? this.renderAccordion() : this.renderTabs()}
                </main>`
      }
      ${this.renderDialog()}
    `;
  }

  private renderBar() {
    const t = this.t;
    const entry = this.entries.find((item) => item.entry_id === this.entryId);
    const count = this.issues.length;
    return html`
      <header class="bar">
        <div class="bar-title">
          ${
            this.narrow
              ? html`<button
                  class="icon-btn"
                  aria-label=${t.menu}
                  @click=${this.toggleMenu}
                >
                  ${icon("menu")}
                </button>`
              : nothing
          }
          <div class="titles">
            <h1>${t.title}</h1>
            ${entry && this.entries.length <= 1 ? html`<div class="subtitle">${entry.title}</div>` : nothing}
          </div>
          ${
            this.entries.length > 1
              ? html`<select
                  class="entry-select"
                  aria-label=${t.entry}
                  ?disabled=${this.saving}
                  @change=${(e: Event) => {
                    const select = e.target as HTMLSelectElement;
                    const id = select.value;
                    select.value = this.entryId ?? "";
                    this.chooseEntry(id);
                  }}
                >
                  ${this.entries.map(
                    (item) =>
                      html`<option
                        value=${item.entry_id}
                        ?selected=${item.entry_id === this.entryId}
                      >
                        ${item.title}
                      </option>`,
                  )}
                </select>`
              : nothing
          }
        </div>
        ${
          this.draft
            ? html`<div class="actions">
                <span class="status ${this.dirty ? "dirty" : ""}" role="status">
                  ${
                    this.saving
                      ? html`${icon("spinner", "s spin")}${t.saving}`
                      : this.dirty
                        ? html`<span class="dot"></span>${t.unsaved}${
                              count
                                ? html` · <span class="count">${count}</span>`
                                : nothing
                            }`
                        : t.allSaved
                  }
                </span>
                <button
                  class="btn ghost"
                  data-action="discard"
                  ?disabled=${!this.dirty || this.saving}
                  @click=${() => (this.dialog = { kind: "discard" })}
                >
                  ${t.discard}
                </button>
                <button
                  class="btn primary"
                  data-action="save"
                  ?disabled=${!this.dirty || this.saving}
                  @click=${() => this.save()}
                >
                  ${this.saving ? icon("spinner", "s spin") : icon("check", "s")}${t.save}
                </button>
              </div>`
            : nothing
        }
      </header>
    `;
  }

  private toggleMenu() {
    this.dispatchEvent(
      new Event("hass-toggle-menu", { bubbles: true, composed: true }),
    );
  }

  private renderLoadError() {
    const t = this.t;
    return html`<div class="center-page">
      <div class="card">
        <div class="banner error" role="alert">
          ${icon("warning")}
          <div class="text">
            <strong>${t.loadFailed}</strong
            ><span class="detail">${this.loadError}</span>
          </div>
        </div>
        <div class="dialog-actions">
          <button class="btn primary" @click=${() => this.load()}>
            ${t.retry}
          </button>
        </div>
      </div>
    </div>`;
  }

  private renderNotConfigured() {
    const t = this.t;
    return html`<div class="center-page">
      <div class="card empty">
        <span class="circ tone-neutral">${icon("home")}</span>
        <h2>${t.notConfiguredTitle}</h2>
        <p class="lead">${t.notConfiguredBody}</p>
        <a
          class="btn primary"
          href="/config/integrations/dashboard/add?domain=house_state"
          >${t.addIntegration}</a
        >
      </div>
    </div>`;
  }

  private renderBanner() {
    const t = this.t;
    const banner = this.banner;
    if (!banner) return nothing;
    if (banner.kind === "saved")
      return html`<div class="banner success" role="status">
        ${icon("check")}
        <div class="text">${t.saved}</div>
        <button
          class="icon-btn"
          aria-label=${t.close}
          @click=${() => (this.banner = undefined)}
        >
          ${icon("close", "s")}
        </button>
      </div>`;
    if (banner.kind === "conflict")
      return html`<div class="banner warn" role="alert">
        ${icon("warning")}
        <div class="text">${t.conflict}</div>
        <button
          class="btn"
          data-action="reload"
          @click=${() => this.reloadAfterConflict()}
        >
          ${t.reloadDiscards}
        </button>
      </div>`;
    return html`<div class="banner error" role="alert">
      ${icon("warning")}
      <div class="text">
        <strong
          >${banner.kind === "invalid" ? t.invalidTitle : t.saveFailed}</strong
        >
        <span class="detail" data-detail>${banner.detail}</span>
      </div>
      <button
        class="icon-btn"
        aria-label=${t.close}
        @click=${() => (this.banner = undefined)}
      >
        ${icon("close", "s")}
      </button>
    </div>`;
  }

  private sectionCount(section: Section) {
    return this.issues.filter((issue) => issue.section === section).length;
  }

  private renderTabs() {
    const t = this.t;
    return html`
      <nav class="tabs" role="tablist" aria-label=${t.title}>
        ${SECTIONS.map(({ id, icon: name }) => {
          const count = this.sectionCount(id);
          return html`<button
            class="tab"
            role="tab"
            id=${`tab-${id}`}
            data-section=${id}
            aria-selected=${this.section === id ? "true" : "false"}
            aria-controls="section"
            @click=${() => (this.section = id)}
          >
            ${icon(name, "s")}${t.sections[id]}${count ? html`<span class="count">${count}</span>` : nothing}
          </button>`;
        })}
      </nav>
      <section
        id="section"
        role="tabpanel"
        aria-labelledby=${`tab-${this.section}`}
      >
        ${this.renderSection(this.section)}
      </section>
    `;
  }

  private renderAccordion() {
    const t = this.t;
    return html`<div class="accordion">
      ${SECTIONS.map(({ id, icon: name }) => {
        const open = this.section === id;
        const count = this.sectionCount(id);
        return html`<div class="acc ${open ? "open" : ""}" data-section=${id}>
          <button
            class="acc-head"
            aria-expanded=${open ? "true" : "false"}
            @click=${() => (this.section = open ? "" : id)}
          >
            <span class="circ sm tone-neutral">${icon(name, "s")}</span>
            <span class="acc-text">
              <span class="acc-title">${t.sections[id]}</span>
              <span class="acc-hint">${t.sectionHints[id]}</span>
            </span>
            ${count ? html`<span class="count">${count}</span>` : nothing}
            <span class="chev">${icon("chevron")}</span>
          </button>
          ${open ? html`<div class="acc-body">${this.renderSection(id)}</div>` : nothing}
        </div>`;
      })}
    </div>`;
  }

  private renderSection(section: Section | "") {
    switch (section) {
      case "states":
        return this.renderStates();
      case "overlays":
        return this.renderOverlays();
      case "presence":
        return this.renderPresence();
      case "night":
        return this.renderNight();
      case "visits":
        return this.renderVisits();
      case "water":
        return this.renderWater();
      case "advanced":
        return this.renderAdvanced();
      default:
        return nothing;
    }
  }

  // ------------------------------------------------------------ states view

  private renderStates() {
    const t = this.t;
    const draft = this.draft!;
    const selected = draft.state_tree.find(
      (node) => node.id === this.selectedState,
    );
    return html`<div class="split">
      <div class="column">
        <div class="card">
          <div class="card-head">
            <div class="grow">
              <h2>${t.tree}</h2>
            </div>
            <button
              class="btn"
              data-action="add-root"
              @click=${() => this.addState(null)}
            >
              ${icon("plus", "s")}${t.addTopLevel}
            </button>
          </div>
          <p class="lead">${t.treeHint}</p>
          <ul class="tree" role="list">
            ${flatten(draft.state_tree).map(({ node, depth }) => this.renderNode(node, depth))}
          </ul>
        </div>
      </div>
      <div class="column sticky">
        ${
          selected
            ? this.renderStateEditor(selected)
            : this.narrow
              ? nothing
              : html`<div class="card empty">
                  ${icon("tree")}<span>${t.selectState}</span>
                </div>`
        }
        ${this.renderRoles()}
      </div>
    </div>`;
  }

  private renderNode(node: StateNode, depth: number) {
    const t = this.t;
    const draft = this.draft!;
    const occ = occupancy(draft.state_tree, node.id);
    const parent = draft.state_tree.find((item) => item.id === node.parent);
    const isDefault = parent?.default_child === node.id;
    const roles = ROLES.filter((role) => draft.roles[role] === node.id);
    const scene = sceneSource(draft.state_tree, node.id);
    const index = draft.state_tree.indexOf(node);
    const problem = this.issues.some(
      (issue) =>
        issue.field.startsWith(`state:${index}:`) ||
        (issue.field.startsWith("role:") &&
          roles.includes(issue.field.slice(5) as Role)),
    );
    const sceneText = !scene
      ? t.noScene
      : scene.source === node.id
        ? entityName(this.hass?.states, scene.scene)
        : fill(t.sceneInherits, {
            scene: entityName(this.hass?.states, scene.scene),
            name: this.stateLabel(scene.source),
          });
    return html`<li>
      <button
        class="node"
        data-node=${node.id}
        aria-current=${this.selectedState === node.id ? "true" : "false"}
        @click=${() => this.selectState(node.id)}
      >
        ${depth ? html`<span class="indent">${Array.from({ length: depth }, () => html`<span class="guide"></span>`)}</span>` : nothing}
        <span class="circ sm ${occ.value ? "tone-home" : "tone-away"}"
          >${icon(stateIcon(node.id), "s")}</span
        >
        <span class="node-main">
          <span class="node-name"
            >${this.stateName(node)}<span class="node-id mono"
              >${node.id}</span
            ></span
          >
          <span class="node-meta">
            <span
              class=${occ.value ? "tone-home" : "tone-away"}
              data-occupancy=${occ.inherited ? "inherited" : "explicit"}
            >
              <span class="occ ${occ.inherited ? "inherited" : ""}"></span>
              ${occ.value ? t.someoneHome : t.nobodyHome}${occ.inherited ? html` · ${t.inherited}` : nothing}
            </span>
            <span class=${scene?.source === node.id ? "" : "muted"}
              >${icon("overlay", "xs")}${sceneText}</span
            >
          </span>
        </span>
        <span class="badges">
          ${draft.initial_state === node.id ? html`<span class="badge start" data-badge="initial">${t.initialBadge}</span>` : nothing}
          ${
            isDefault
              ? html`<span
                  class="badge outline tone-neutral"
                  data-badge="default"
                  title=${fill(t.defaultOf, { name: this.stateName(parent!) })}
                >
                  ${icon("star", "xs")}${t.defaultBadge}</span
                >`
              : nothing
          }
          ${roles.map((role) => html`<span class="badge role" data-badge=${`role-${role}`}>${t.role[role]}</span>`)}
          ${problem ? html`<span class="badge error">${icon("warning", "xs")}</span>` : nothing}
        </span>
      </button>
    </li>`;
  }

  private renderStateEditor(node: StateNode) {
    const t = this.t;
    const draft = this.draft!;
    const index = draft.state_tree.indexOf(node);
    const isNew = this.newIds.has(`state:${node.id}`);
    const children = childrenOf(draft.state_tree, node.id);
    const parent = draft.state_tree.find((item) => item.id === node.parent);
    const occ = occupancy(draft.state_tree, node.id);
    const inheritedScene = node.scene
      ? null
      : sceneSource(draft.state_tree, node.id);
    const others = draft.state_tree
      .filter((item) => item.id !== node.id)
      .map((item) => item.id);
    const idError =
      this.pendingId !== undefined
        ? this.idProblem(this.pendingId, others)
        : this.issueFor(`state:${index}:id`);
    const occValue =
      node.occupied === null ? "inherit" : node.occupied ? "home" : "away";
    const inheritHint =
      node.occupied === null
        ? occ.source
          ? `${occ.value ? t.someoneHome : t.nobodyHome} · ${fill(t.inheritsFrom, { name: this.stateLabel(occ.source) })}`
          : t.inheritedDefault
        : undefined;
    return html`<div class="card" id="state-editor" data-editor="state">
      <div class="card-head">
        <span class="circ ${occ.value ? "tone-home" : "tone-away"}"
          >${icon(stateIcon(node.id))}</span
        >
        <div class="grow">
          <div class="label">${t.editState}</div>
          <h2>${this.stateName(node)}</h2>
        </div>
        <button
          class="icon-btn"
          aria-label=${t.close}
          @click=${() => this.selectState(null)}
        >
          ${icon("close", "s")}
        </button>
      </div>
      <div class="fields">
        ${textField({
          id: "state-name",
          label: t.name,
          value: this.stateName(node),
          maxlength: 100,
          error: this.issueFor(`state:${index}:name`),
          onInput: (value) => this.renameStateName(node.id, value),
        })}
        ${
          isNew
            ? textField({
                id: "state-id",
                label: t.id,
                mono: true,
                value: this.pendingId ?? node.id,
                hint: t.idHint,
                error: idError,
                onInput: (value) => {
                  this.pendingId = value;
                  this.idTouched.add(`state:${node.id}`);
                },
                onChange: (value) => this.commitStateId(node.id, value.trim()),
              })
            : textField({
                id: "state-id",
                label: t.id,
                mono: true,
                value: node.id,
                readonly: true,
                hint: t.idFixed,
              })
        }
        ${selectField({
          id: "state-parent",
          label: t.parent,
          value: node.parent ?? "",
          options: [
            { value: "", label: t.topLevel },
            ...this.stateOptions(descendants(draft.state_tree, node.id)),
          ],
          hint:
            parent?.default_child === node.id
              ? fill(t.movesDefault, { name: this.stateName(parent) })
              : undefined,
          onChange: (value) =>
            this.edit(setParent(draft, node.id, value || null)),
        })}
        ${selectField({
          id: "state-default",
          label: t.defaultChild,
          value: node.default_child ?? "",
          options: [
            { value: "", label: t.noDefaultChild },
            ...children.map((child) => ({
              value: child.id,
              label: `${this.stateName(child)} (${child.id})`,
            })),
          ],
          hint: children.length ? undefined : t.noChildren,
          onChange: (value) =>
            this.patchState(node.id, { default_child: value || null }),
        })}
        ${entityPicker({
          hass: this.hass!,
          strings: t,
          name: "state-scene",
          label: t.scene,
          domains: ["scene"],
          value: node.scene,
          hint: node.scene
            ? undefined
            : inheritedScene
              ? fill(t.sceneInherits, {
                  scene: entityName(this.hass?.states, inheritedScene.scene),
                  name: this.stateLabel(inheritedScene.source),
                })
              : t.sceneNone,
          error:
            node.scene && !this.hass?.states?.[node.scene]
              ? t.sceneMissing
              : undefined,
          onChange: (value: string) =>
            this.patchState(node.id, { scene: value || "" }),
        })}
        ${segmented({
          label: t.occupancy,
          name: "occupied",
          value: occValue,
          options: [
            { value: "inherit", label: t.inherit },
            { value: "home", label: t.someoneHome },
            { value: "away", label: t.nobodyHome },
          ],
          hint: inheritHint,
          onChange: (value) =>
            this.patchState(node.id, {
              occupied: value === "inherit" ? null : value === "home",
            }),
        })}
      </div>
      <div class="editor-foot">
        <button
          class="btn"
          data-action="add-child"
          @click=${() => this.addState(node.id)}
        >
          ${icon("plus", "s")}${t.addChild}
        </button>
        <button
          class="btn danger"
          data-action="delete-state"
          @click=${() => this.requestDeleteState(node.id)}
        >
          ${icon("trash", "s")}${t.deleteState}
        </button>
      </div>
    </div>`;
  }

  private renderRoles() {
    const t = this.t;
    const draft = this.draft!;
    const options = this.stateOptions();
    return html`<div class="card" data-card="roles">
      <div class="card-head">
        <span class="circ sm tone-neutral">${icon("flag", "s")}</span>
        <div class="grow"><h2>${t.roles}</h2></div>
      </div>
      <p class="lead">${t.rolesHint}</p>
      <div class="fields">
        ${selectField({
          id: "initial-state",
          label: t.initialState,
          value: draft.initial_state,
          options,
          hint: t.initialHint,
          error: draft.state_tree.some(
            (node) => node.id === draft.initial_state,
          )
            ? undefined
            : fill(t.roleMissing, { role: t.initialState }),
          onChange: (value) =>
            this.change((next) => (next.initial_state = value)),
        })}
        <div class="grid2">
          ${ROLES.map((role) => {
            const target = draft.roles[role];
            const landed =
              target && roleProblem(draft, role) !== "missing"
                ? descend(draft.state_tree, target)
                : null;
            return selectField({
              id: `role-${role}`,
              label: t.role[role],
              value: target ?? "",
              options: [{ value: "", label: t.roleOff }, ...options],
              hint:
                landed && landed !== target
                  ? fill(t.leadsTo, { name: this.stateLabel(landed) })
                  : undefined,
              error: this.issueFor(`role:${role}`),
              onChange: (value) =>
                this.change((next) => (next.roles[role] = value || null)),
            });
          })}
        </div>
      </div>
    </div>`;
  }

  // ------------------------------------------------------------ overlays view

  private renderOverlays() {
    const t = this.t;
    const draft = this.draft!;
    const selected = draft.overlays.find(
      (overlay) => overlay.id === this.selectedOverlay,
    );
    return html`<div class="split">
      <div class="column">
        <div class="card">
          <div class="card-head">
            <div class="grow"><h2>${t.sections.overlays}</h2></div>
            <button
              class="btn"
              data-action="add-overlay"
              @click=${() => this.addOverlay()}
            >
              ${icon("plus", "s")}${t.addOverlay}
            </button>
          </div>
          <p class="lead">${t.overlaysHint}</p>
          ${
            draft.overlays.length
              ? html`<ul class="tree" role="list">
                  ${draft.overlays.map((overlay, index) => this.renderOverlayRow(overlay, index))}
                </ul>`
              : html`<div class="empty">${t.noOverlays}</div>`
          }
        </div>
      </div>
      <div class="column sticky">
        ${
          selected
            ? this.renderOverlayEditor(selected)
            : this.narrow
              ? nothing
              : html`<div class="card empty">
                  ${icon("overlay")}<span>${t.selectOverlay}</span>
                </div>`
        }
      </div>
    </div>`;
  }

  private renderOverlayRow(overlay: Overlay, index: number) {
    const t = this.t;
    const ctx = this.summaryContext;
    const conditions = conditionSummary(overlay, ctx);
    const problem = this.issues.some((issue) =>
      issue.field.startsWith(`overlay:${index}:`),
    );
    return html`<li>
      <button
        class="item"
        data-overlay=${overlay.id}
        aria-current=${this.selectedOverlay === overlay.id ? "true" : "false"}
        @click=${() => this.selectOverlay(overlay.id)}
      >
        <span
          class="circ sm ${activationOf(overlay) === "manual" ? "tone-neutral" : "tone-overlay"}"
          >${icon(activationOf(overlay) === "manual" ? "overlay" : "calendar", "s")}</span
        >
        <span class="node-main">
          <span class="node-name"
            >${this.overlayName(overlay)}<span class="node-id mono"
              >${overlay.id}</span
            ></span
          >
          <span class="node-meta"
            ><span data-summary>${ruleSummary(overlay, ctx)}</span></span
          >
          ${
            conditions.length
              ? html`<span class="node-meta"
                  ><span data-conditions>${conditions.join(" · ")}</span></span
                >`
              : nothing
          }
          <span class="node-meta">
            <span class=${overlay.scene ? "" : "muted"}
              >${icon("overlay", "xs")}${overlay.scene ? entityName(this.hass?.states, overlay.scene) : t.noScene}</span
            >
          </span>
        </span>
        <span class="badges">
          ${
            overlay.priority
              ? html`<span class="badge role"
                  >${fill(t.sumPriority, { priority: formatNumber(overlay.priority, this.locale) })}</span
                >`
              : nothing
          }
          ${problem ? html`<span class="badge error">${icon("warning", "xs")}</span>` : nothing}
        </span>
      </button>
    </li>`;
  }

  private renderOverlayEditor(overlay: Overlay) {
    const t = this.t;
    const draft = this.draft!;
    const index = draft.overlays.indexOf(overlay);
    const at = (field: string) => this.issueFor(`overlay:${index}:${field}`);
    const isNew = this.newIds.has(`overlay:${overlay.id}`);
    const taken = draft.overlays
      .filter((item) => item.id !== overlay.id)
      .map((item) => item.id);
    const idError =
      this.pendingId !== undefined
        ? this.idProblem(this.pendingId, taken, RESERVED_OVERLAYS)
        : at("id");
    const activation = activationOf(overlay);
    const occValue =
      overlay.when_occupied === true
        ? "home"
        : overlay.when_occupied === false
          ? "away"
          : "any";
    const when = new Set(overlay.when_state ?? []);
    return html`<div class="card" id="overlay-editor" data-editor="overlay">
      <div class="card-head">
        <span class="circ tone-overlay">${icon("overlay")}</span>
        <div class="grow">
          <div class="label">${t.editOverlay}</div>
          <h2>${this.overlayName(overlay)}</h2>
        </div>
        <button
          class="icon-btn"
          aria-label=${t.close}
          @click=${() => this.selectOverlay(null)}
        >
          ${icon("close", "s")}
        </button>
      </div>
      <div class="fields">
        ${textField({
          id: "overlay-name",
          label: t.name,
          value: this.overlayName(overlay),
          maxlength: 100,
          error: at("name"),
          onInput: (value) => this.renameOverlayName(overlay.id, value),
        })}
        ${
          isNew
            ? textField({
                id: "overlay-id",
                label: t.id,
                mono: true,
                value: this.pendingId ?? overlay.id,
                hint: t.idHint,
                error: idError,
                onInput: (value) => {
                  this.pendingId = value;
                  this.idTouched.add(`overlay:${overlay.id}`);
                },
                onChange: (value) =>
                  this.commitOverlayId(overlay.id, value.trim()),
              })
            : textField({
                id: "overlay-id",
                label: t.id,
                mono: true,
                value: overlay.id,
                readonly: true,
                hint: t.idFixed,
              })
        }
        <div class="row-fields">
          <div style="flex: 3 1 220px; min-width: 0">
            ${entityPicker({
              hass: this.hass!,
              strings: t,
              name: "overlay-scene",
              label: t.scene,
              domains: ["scene"],
              value: overlay.scene,
              error:
                overlay.scene && !this.hass?.states?.[overlay.scene]
                  ? t.sceneMissing
                  : undefined,
              onChange: (value: string) =>
                this.patchOverlay(overlay.id, { scene: value || "" }),
            })}
          </div>
          ${numberField({
            id: "overlay-priority",
            label: t.priority,
            value: overlay.priority ?? 0,
            min: -100,
            max: 100,
            compact: true,
            hint: t.priorityHint,
            onChange: (value) =>
              this.patchOverlay(overlay.id, {
                priority: Math.max(-100, Math.min(100, Math.round(value))),
              }),
          })}
        </div>
        <div class="divider"></div>
        ${segmented<Activation>({
          label: t.activation,
          name: "activation",
          value: activation,
          options: [
            { value: "manual", label: t.manual },
            { value: "calendar", label: t.calendar },
            { value: "dates", label: t.dates },
          ],
          onChange: (value) =>
            this.replaceOverlay(overlay.id, setActivation(overlay, value)),
        })}
        ${activation === "calendar" ? this.renderCalendarRule(overlay, at) : nothing}
        ${activation === "dates" && overlay.dates ? this.renderDateRule(overlay, overlay.dates, at) : nothing}
        ${
          activation !== "manual"
            ? html`<div class="preview" data-preview>
                ${ruleSummary(overlay, this.summaryContext)}
              </div>`
            : nothing
        }
        <div class="divider"></div>
        <h3>${t.conditions}</h3>
        ${segmented({
          label: t.whenOccupied,
          name: "when_occupied",
          value: occValue,
          options: [
            { value: "any", label: t.any },
            { value: "home", label: t.someoneHome },
            { value: "away", label: t.nobodyHome },
          ],
          onChange: (value) =>
            value === "any"
              ? this.patchOverlay(overlay.id, {}, ["when_occupied"])
              : this.patchOverlay(overlay.id, {
                  when_occupied: value === "home",
                }),
        })}
        <div class="field">
          <span class="label" id="when-state-label">${t.whenState}</span>
          <div
            class="segment pills-multi"
            role="group"
            aria-labelledby="when-state-label"
          >
            ${flatten(draft.state_tree).map(
              ({ node }) =>
                html`<button
                  type="button"
                  class="pill ${when.has(node.id) ? "active" : ""}"
                  data-when=${node.id}
                  aria-pressed=${when.has(node.id) ? "true" : "false"}
                  @click=${() => {
                    const next = when.has(node.id)
                      ? (overlay.when_state ?? []).filter(
                          (id) => id !== node.id,
                        )
                      : [...(overlay.when_state ?? []), node.id];
                    if (next.length)
                      this.patchOverlay(overlay.id, { when_state: next });
                    else this.patchOverlay(overlay.id, {}, ["when_state"]);
                  }}
                >
                  ${when.has(node.id) ? icon("check", "s") : nothing}${this.stateName(node)}
                </button>`,
            )}
          </div>
          ${help(t.whenStateHint)}
        </div>
      </div>
      <div class="editor-foot">
        <span></span>
        <button
          class="btn danger"
          data-action="delete-overlay"
          @click=${() => (this.dialog = { kind: "deleteOverlay", id: overlay.id })}
        >
          ${icon("trash", "s")}${t.deleteOverlay}
        </button>
      </div>
    </div>`;
  }

  private renderCalendarRule(
    overlay: Overlay,
    at: (field: string) => string | undefined,
  ) {
    const t = this.t;
    return html`
      ${entityPicker({
        hass: this.hass!,
        strings: t,
        name: "overlay-calendar",
        label: t.calendarEntity,
        domains: ["calendar"],
        value: overlay.calendar ?? "",
        error: at("calendar"),
        onChange: (value: string) =>
          this.patchOverlay(overlay.id, { calendar: value || "" }),
      })}
      ${textField({
        id: "overlay-match",
        label: t.match,
        mono: true,
        value: overlay.match ?? "",
        hint: t.matchHint,
        error: at("match"),
        onChange: (value) =>
          value
            ? this.patchOverlay(overlay.id, { match: value })
            : this.patchOverlay(overlay.id, {}, ["match"]),
      })}
    `;
  }

  private monthOptions(): SelectOption[] {
    return this.t.months.map((label, i) => ({ value: String(i + 1), label }));
  }

  private dayMonthFields(
    label: string,
    value: string,
    onChange: (value: string) => void,
    error?: string,
    name = "",
  ) {
    const t = this.t;
    const [month, day] = splitMmdd(value);
    return html`<div
      class="field"
      role="group"
      aria-label=${label}
      data-mmdd=${name}
    >
      <span class="label">${label}</span>
      <div class="row-fields">
        ${selectField({
          label: `${label}: ${t.month}`,
          hideLabel: true,
          value: String(month),
          compact: true,
          options: this.monthOptions(),
          onChange: (next) => onChange(mmdd(Number(next), day)),
        })}
        ${numberField({
          label: `${label}: ${t.day}`,
          hideLabel: true,
          value: day,
          min: 1,
          max: 31,
          compact: true,
          onChange: (next) =>
            onChange(mmdd(month, Math.max(1, Math.min(31, Math.round(next))))),
        })}
      </div>
      ${help(undefined, error)}
    </div>`;
  }

  private renderDateRule(
    overlay: Overlay,
    rule: DateRule,
    at: (field: string) => string | undefined,
  ) {
    const t = this.t;
    const setRule = (next: DateRule) =>
      this.patchOverlay(overlay.id, { dates: next });
    const kind = segmented<DateRule["type"]>({
      label: t.dateKind,
      name: "date-kind",
      value: rule.type,
      options: [
        { value: "fixed", label: t.fixed },
        { value: "easter", label: t.easter },
        { value: "nth_weekday", label: t.nthWeekday },
      ],
      onChange: (value) => setRule(defaultRule(value)),
    });
    if (rule.type === "fixed")
      return html`${kind}
        <div class="grid2">
          ${this.dayMonthFields(t.from, rule.from, (from) => setRule({ ...rule, from }), at("from"), "from")}
          ${this.dayMonthFields(t.to, rule.to, (to) => setRule({ ...rule, to }), at("to"), "to")}
        </div>`;
    if (rule.type === "easter")
      return html`${kind}
        <div class="grid2">
          ${numberField({
            id: "easter-from",
            label: t.easterFrom,
            value: rule.from,
            min: -180,
            max: 180,
            onChange: (from) => setRule({ ...rule, from: Math.round(from) }),
          })}
          ${numberField({
            id: "easter-to",
            label: t.easterTo,
            value: rule.to,
            min: -180,
            max: 180,
            onChange: (to) => setRule({ ...rule, to: Math.round(to) }),
          })}
        </div>
        ${help(t.easterHint, at("easter"))}`;
    const anchored = rule.anchor !== undefined;
    const counts = anchored
      ? [1, 2, 3, 4, 5]
      : [1, 2, 3, 4, 5, -1, -2, -3, -4, -5];
    const ordinals = anchored ? t.ordinalAnchor : t.ordinal;
    const merge = (next: Partial<DateRule & { type: "nth_weekday" }>) => {
      const copy: any = { ...rule, ...next };
      return copy as DateRule;
    };
    return html`${kind}
      ${segmented({
        label: t.countFrom,
        name: "anchor-kind",
        value: anchored ? "anchor" : "month",
        options: [
          { value: "month", label: t.inMonth },
          { value: "anchor", label: t.fromDate },
        ],
        onChange: (value) => {
          const next: any = { ...rule, nth: Math.abs(rule.nth) || 1 };
          delete next.month;
          delete next.anchor;
          if (value === "anchor") next.anchor = "12-25";
          else next.month = 1;
          setRule(next);
        },
      })}
      <div class="row-fields">
        ${selectField({
          id: "nth",
          label: t.occurrence,
          value: String(anchored ? Math.abs(rule.nth) : rule.nth),
          compact: true,
          options: counts.map((n) => ({
            value: String(n),
            label: ordinals[String(n)],
          })),
          onChange: (value) => {
            const n = Number(value);
            setRule(merge({ nth: anchored ? (rule.nth < 0 ? -n : n) : n }));
          },
        })}
        ${selectField({
          id: "weekday",
          label: t.weekday,
          value: rule.weekday,
          compact: true,
          options: WEEKDAYS.map((day) => ({
            value: day,
            label: t.weekdays[day],
          })),
          onChange: (value) => setRule(merge({ weekday: value as any })),
        })}
        ${
          anchored
            ? selectField({
                id: "before-after",
                label: t.direction,
                value: rule.nth < 0 ? "before" : "after",
                compact: true,
                options: [
                  { value: "before", label: t.before },
                  { value: "after", label: t.after },
                ],
                onChange: (value) =>
                  setRule(
                    merge({
                      nth: (value === "before" ? -1 : 1) * Math.abs(rule.nth),
                    }),
                  ),
              })
            : selectField({
                id: "month",
                label: t.month,
                value: String(rule.month ?? 1),
                compact: true,
                options: this.monthOptions(),
                onChange: (value) => setRule(merge({ month: Number(value) })),
              })
        }
      </div>
      ${
        anchored
          ? this.dayMonthFields(
              t.anchor,
              rule.anchor!,
              (anchor) => setRule(merge({ anchor })),
              at("anchor"),
              "anchor",
            )
          : nothing
      }
      ${numberField({
        id: "days",
        label: t.lasts,
        value: rule.days,
        min: 1,
        max: 366,
        error: at("days"),
        onChange: (days) => setRule(merge({ days: Math.round(days) })),
      })}`;
  }

  // ------------------------------------------------------------ other sections

  private renderPresence() {
    const t = this.t;
    const draft = this.draft!;
    const set = <K extends keyof HouseConfig>(key: K, value: HouseConfig[K]) =>
      this.change((next) => (next[key] = value));
    return html`<div class="stack">
      <div class="card">
        <div class="card-head">
          <span class="circ sm tone-home">${icon("home", "s")}</span>
          <div class="grow"><h2>${t.sections.presence}</h2></div>
        </div>
        <p class="lead">${t.presenceHint}</p>
        <div class="fields">
          ${entityPicker({
            hass: this.hass!,
            strings: t,
            name: "door_entities",
            label: t.doors,
            domains: ["lock"],
            multiple: true,
            value: draft.door_entities,
            onChange: (value: string[]) => set("door_entities", value),
          })}
          ${entityPicker({
            hass: this.hass!,
            strings: t,
            name: "gate_entities",
            label: t.gates,
            domains: ["cover"],
            multiple: true,
            value: draft.gate_entities,
            onChange: (value: string[]) => set("gate_entities", value),
          })}
          ${entityPicker({
            hass: this.hass!,
            strings: t,
            name: "person_entities",
            label: t.people,
            domains: ["person"],
            multiple: true,
            value: draft.person_entities,
            onChange: (value: string[]) => set("person_entities", value),
          })}
        </div>
      </div>
      <div class="card">
        <div class="fields">
          ${toggleField({
            id: "auto_return",
            label: t.autoReturn,
            hint: t.autoReturnHint,
            checked: draft.auto_return,
            onChange: (value) => set("auto_return", value),
          })}
          ${durationField({
            id: "arrival_delay",
            label: t.arrivalDelay,
            seconds: draft.arrival_delay,
            units: ["s"],
            strings: t,
            hint: t.arrivalDelayHint,
            error: this.issueFor("arrival_delay"),
            onChange: (value) => set("arrival_delay", value),
          })}
          <div class="divider"></div>
          ${toggleField({
            id: "auto_away",
            label: t.autoAway,
            hint: t.autoAwayHint,
            checked: draft.auto_away,
            onChange: (value) => set("auto_away", value),
          })}
          ${durationField({
            id: "auto_away_grace",
            label: t.awayGrace,
            seconds: draft.auto_away_grace,
            units: ["m", "s"],
            strings: t,
            disabled: !draft.auto_away,
            error: this.issueFor("auto_away_grace"),
            onChange: (value) => set("auto_away_grace", value),
          })}
        </div>
      </div>
    </div>`;
  }

  private renderNight() {
    const t = this.t;
    const draft = this.draft!;
    const schedule = draft.night_schedule;
    const set = (next: HouseConfig["night_schedule"]) =>
      this.change((config) => (config.night_schedule = next));
    const minutes =
      schedule.type === "sun" ? Math.abs(offsetToMinutes(schedule.offset)) : 0;
    return html`<div class="stack">
      <div class="card">
        <div class="card-head">
          <span class="circ sm tone-home">${icon("night", "s")}</span>
          <div class="grow"><h2>${t.sections.night}</h2></div>
        </div>
        <p class="lead">${t.nightHint}</p>
        ${
          draft.roles.night
            ? nothing
            : html`<div class="note" role="note">
                ${icon("warning", "s")}<span>${t.nightRoleOff}</span>
              </div>`
        }
        <div class="fields">
          ${segmented({
            label: t.schedule,
            name: "night-type",
            value: schedule.type,
            options: [
              { value: "off", label: t.off },
              { value: "fixed", label: t.fixedTime },
              { value: "sun", label: t.sun },
            ],
            onChange: (value) =>
              set(
                value === "off"
                  ? { type: "off" }
                  : value === "fixed"
                    ? { type: "fixed", time: "22:00:00" }
                    : { type: "sun", event: "sunset", offset: 0 },
              ),
          })}
          ${
            schedule.type === "fixed"
              ? html`<label class="field">
                  <span class="label">${t.time}</span>
                  <input
                    id="night-time"
                    type="time"
                    step="1"
                    aria-invalid=${this.issueFor("night_time") ? "true" : "false"}
                    .value=${schedule.time}
                    @change=${(e: Event) => {
                      const raw = (e.target as HTMLInputElement).value;
                      set({
                        type: "fixed",
                        time: /^\d{2}:\d{2}$/.test(raw) ? `${raw}:00` : raw,
                      });
                    }}
                  />
                  ${help(undefined, this.issueFor("night_time"))}
                </label>`
              : nothing
          }
          ${
            schedule.type === "sun"
              ? html`${segmented({
                    label: t.sunEvent,
                    name: "sun-event",
                    value: schedule.event,
                    options: [
                      { value: "sunset", label: t.sunset },
                      { value: "sunrise", label: t.sunrise },
                    ],
                    onChange: (event) => set({ ...schedule, event }),
                  })}
                  <div class="row-fields">
                    ${numberField({
                      id: "night-offset",
                      label: t.offset,
                      value: minutes,
                      min: 0,
                      max: 1440,
                      step: "any",
                      unit: t.minutes,
                      compact: true,
                      error: this.issueFor("night_offset"),
                      onChange: (value) =>
                        set({
                          ...schedule,
                          offset:
                            (schedule.offset < 0 ? -1 : 1) *
                            minutesToOffset(Math.abs(value)),
                        }),
                    })}
                    ${selectField({
                      id: "night-direction",
                      label: t.direction,
                      value: schedule.offset < 0 ? "before" : "after",
                      compact: true,
                      options: [
                        { value: "before", label: t.before },
                        { value: "after", label: t.after },
                      ],
                      onChange: (value) =>
                        set({
                          ...schedule,
                          offset:
                            (value === "before" ? -1 : 1) *
                            Math.abs(schedule.offset),
                        }),
                    })}
                  </div>`
              : nothing
          }
          <div class="preview" data-preview="night">
            ${nightSummary(schedule, this.summaryContext)}
          </div>
        </div>
      </div>
    </div>`;
  }

  private renderVisits() {
    const t = this.t;
    const draft = this.draft!;
    const set = <K extends keyof HouseConfig>(key: K, value: HouseConfig[K]) =>
      this.change((next) => (next[key] = value));
    const hours = (seconds: number) =>
      formatNumber(seconds / 3600, this.locale, { maximumFractionDigits: 2 });
    const rangeHint = fill(t.outOfRange, {
      min: `${formatNumber(this.limits.min_duration / 60, this.locale)} ${t.minutes}`,
      max: `${hours(this.limits.max_duration)} ${t.hours}`,
    });
    return html`<div class="stack">
      <div class="card">
        <div class="card-head">
          <span class="circ sm tone-neutral">${icon("guest", "s")}</span>
          <div class="grow"><h2>${t.sections.visits}</h2></div>
        </div>
        <p class="lead">${t.visitsHint}</p>
        <div class="fields">
          <div class="grid2">
            ${durationField({
              id: "visit_duration",
              label: t.visitDuration,
              seconds: draft.visit_duration,
              units: ["h", "m"],
              strings: t,
              error: this.issueFor("visit_duration"),
              onChange: (value) => set("visit_duration", value),
            })}
            ${durationField({
              id: "visit_max_duration",
              label: t.visitMax,
              seconds: draft.visit_max_duration,
              units: ["h", "m"],
              strings: t,
              hint: rangeHint,
              error: this.issueFor("visit_max_duration"),
              onChange: (value) => set("visit_max_duration", value),
            })}
          </div>
          ${durationField({
            id: "visit_exit_grace",
            label: t.exitGrace,
            seconds: draft.visit_exit_grace,
            units: ["m", "s"],
            strings: t,
            error: this.issueFor("visit_exit_grace"),
            onChange: (value) => set("visit_exit_grace", value),
          })}
          ${toggleField({
            id: "visit_reapply_scene",
            label: t.reapply,
            hint: t.reapplyHint,
            checked: draft.visit_reapply_scene,
            onChange: (value) => set("visit_reapply_scene", value),
          })}
          ${entityPicker({
            hass: this.hass!,
            strings: t,
            name: "visit_lock_entities",
            label: t.visitLocks,
            domains: ["lock"],
            multiple: true,
            value: draft.visit_lock_entities,
            onChange: (value: string[]) => set("visit_lock_entities", value),
          })}
        </div>
      </div>
    </div>`;
  }

  private renderWater() {
    const t = this.t;
    const draft = this.draft!;
    return html`<div class="stack">
      <div class="card">
        <div class="card-head">
          <span class="circ sm tone-neutral">${icon("water", "s")}</span>
          <div class="grow"><h2>${t.sections.water}</h2></div>
        </div>
        <p class="lead">${t.waterHint}</p>
        ${
          draft.roles.vacation || !draft.water_valves.length
            ? nothing
            : html`<div class="note" role="note">
                ${icon("warning", "s")}<span>${t.waterRoleOff}</span>
              </div>`
        }
        ${entityPicker({
          hass: this.hass!,
          strings: t,
          name: "water_valves",
          label: t.valves,
          domains: ["valve", "switch"],
          multiple: true,
          value: draft.water_valves,
          onChange: (value: string[]) =>
            this.change((next) => (next.water_valves = value)),
        })}
      </div>
    </div>`;
  }

  private renderAdvanced() {
    const t = this.t;
    const draft = this.draft!;
    const set = (key: "state" | "overlay", value: string) =>
      this.change((next) => {
        if (value) next.legacy_mirror[key] = value;
        else delete next.legacy_mirror[key];
      });
    return html`<div class="stack">
      <div class="card">
        <div class="card-head">
          <span class="circ sm tone-neutral">${icon("advanced", "s")}</span>
          <div class="grow"><h2>${t.legacy}</h2></div>
        </div>
        <p class="lead">${t.legacyHint}</p>
        <div class="fields">
          ${entityPicker({
            hass: this.hass!,
            strings: t,
            name: "legacy-state",
            label: t.legacyState,
            domains: ["input_select"],
            value: draft.legacy_mirror.state ?? "",
            onChange: (value: string) => set("state", value),
          })}
          ${entityPicker({
            hass: this.hass!,
            strings: t,
            name: "legacy-overlay",
            label: t.legacyOverlay,
            domains: ["input_select"],
            value: draft.legacy_mirror.overlay ?? "",
            onChange: (value: string) => set("overlay", value),
          })}
        </div>
      </div>
    </div>`;
  }

  // ------------------------------------------------------------ dialogs

  private renderDialog() {
    const dialog = this.dialog;
    if (!dialog) return nothing;
    const t = this.t;
    let body: TemplateResult;
    if (dialog.kind === "deleteState") body = this.renderDeleteState(dialog);
    else if (dialog.kind === "deleteOverlay") {
      const overlay = this.draft!.overlays.find(
        (item) => item.id === dialog.id,
      )!;
      body = this.dialogFrame(
        fill(t.deleteOverlayTitle, { name: this.overlayName(overlay) }),
        "trash",
        html`<p class="lead">${t.deleteOverlayBody}</p>`,
        html`<button
          class="btn danger solid"
          data-action="confirm"
          @click=${() => {
            this.change(
              (draft) =>
                (draft.overlays = draft.overlays.filter(
                  (item) => item.id !== dialog.id,
                )),
            );
            this.newIds.delete(`overlay:${dialog.id}`);
            this.dialog = undefined;
            this.selectOverlay(null);
          }}
        >
          ${t.delete}
        </button>`,
      );
    } else if (dialog.kind === "warnings")
      body = this.dialogFrame(
        t.warningsTitle,
        "warning",
        html`<p class="lead">${t.warningsBody}</p>
          <ul class="effects" data-warnings>
            ${dialog.warnings.map((warning) => html`<li>${icon("warning", "s")}<span class="mono">${warning}</span></li>`)}
          </ul>`,
        html`<button
          class="btn primary"
          data-action="confirm"
          @click=${() => this.save(true)}
        >
          ${t.saveAnyway}
        </button>`,
      );
    else if (dialog.kind === "discard")
      body = this.dialogFrame(
        t.discardTitle,
        "warning",
        html`<p class="lead">${t.discardBody}</p>`,
        html`<button
          class="btn danger solid"
          data-action="confirm"
          @click=${() => this.discard()}
        >
          ${t.discard}
        </button>`,
      );
    else
      body = this.dialogFrame(
        t.leaveTitle,
        "warning",
        html`<p class="lead">${t.leaveBody}</p>`,
        html`<button
          class="btn danger solid"
          data-action="confirm"
          @click=${() => this.switchEntry(dialog.entryId)}
        >
          ${t.discard}
        </button>`,
      );
    return html`<div
      class="scrim"
      @click=${(e: Event) => e.target === e.currentTarget && (this.dialog = undefined)}
      @keydown=${(e: KeyboardEvent) => e.key === "Escape" && (this.dialog = undefined)}
    >
      ${body}
    </div>`;
  }

  private dialogFrame(
    title: string,
    iconName: string,
    content: TemplateResult,
    confirm: TemplateResult | typeof nothing,
  ) {
    const t = this.t;
    return html`<div
      class="dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
    >
      <div class="dialog-head">
        <span
          class="circ ${iconName === "trash" ? "tone-away" : "tone-overlay"}"
          >${icon(iconName)}</span
        >
        <h2 id="dialog-title">${title}</h2>
      </div>
      ${content}
      <div class="dialog-actions">
        <button
          class="btn ghost"
          data-action="cancel"
          @click=${() => (this.dialog = undefined)}
        >
          ${t.cancel}
        </button>
        ${confirm}
      </div>
    </div>`;
  }

  private renderDeleteState(dialog: { id: string; replacement: string }) {
    const t = this.t;
    const draft = this.draft!;
    const node = draft.state_tree.find((item) => item.id === dialog.id)!;
    const name = this.stateName(node);
    const plan = planDeletion(draft, dialog.id);
    if (plan.blocked) {
      const names = plan.blockingOverlays
        .map((overlay) => this.overlayName(overlay))
        .join(", ");
      return this.dialogFrame(
        fill(t.deleteTitle, { name }),
        "trash",
        html`<div class="note" role="alert" data-blocked=${plan.blocked}>
            ${icon("warning", "s")}<span
              >${plan.blocked === "last" ? t.deleteBlockedLast : fill(t.deleteBlockedOverlay, { names })}</span
            >
          </div>
          ${
            plan.blockingOverlays.length
              ? html`<div class="toolbar-row">
                  ${plan.blockingOverlays.map(
                    (overlay) =>
                      html`<button
                        class="btn"
                        @click=${() => {
                          this.dialog = undefined;
                          this.section = "overlays";
                          this.selectOverlay(overlay.id);
                        }}
                      >
                        ${fill(t.openOverlay, { name: this.overlayName(overlay) })}
                      </button>`,
                  )}
                </div>`
              : nothing
          }`,
        nothing,
      );
    }
    const names = (items: StateNode[]) =>
      items.map((item) => this.stateName(item)).join(", ");
    const effects: TemplateResult[] = [
      html`<li>
        ${icon("trash", "s")}<span>${fill(t.deleteRemove, { name })}</span>
      </li>`,
    ];
    if (plan.reparented.length)
      effects.push(
        html`<li>
          ${icon("tree", "s")}<span
            >${
              plan.newParent
                ? fill(t.deleteReparent, {
                    names: names(plan.reparented),
                    parent: this.stateName(plan.newParent),
                  })
                : fill(t.deleteReparentRoot, { names: names(plan.reparented) })
            }</span
          >
        </li>`,
      );
    for (const parent of plan.defaultCleared)
      effects.push(
        html`<li>
          ${icon("star", "s")}<span
            >${fill(t.deleteDefault, { name: this.stateName(parent) })}</span
          >
        </li>`,
      );
    for (const role of plan.rolesCleared)
      effects.push(
        html`<li>
          ${icon("flag", "s")}<span
            >${fill(t.deleteRole, { role: t.role[role] })}</span
          >
        </li>`,
      );
    for (const overlay of plan.overlaysTrimmed)
      effects.push(
        html`<li>
          ${icon("overlay", "s")}<span
            >${fill(t.deleteWhenState, { name: this.overlayName(overlay) })}</span
          >
        </li>`,
      );
    return this.dialogFrame(
      fill(t.deleteTitle, { name }),
      "trash",
      html`<p class="lead">${t.deleteIntro}</p>
        <ul class="effects" data-effects>
          ${effects}
        </ul>
        ${
          plan.needsInitial
            ? selectField({
                id: "replacement",
                label: t.deleteInitial,
                value: dialog.replacement,
                options: this.stateOptions(new Set([dialog.id])),
                onChange: (value) =>
                  (this.dialog = {
                    kind: "deleteState",
                    id: dialog.id,
                    replacement: value,
                  }),
              })
            : nothing
        }`,
      html`<button
        class="btn danger solid"
        data-action="confirm"
        @click=${() => this.confirmDeleteState(dialog.id, dialog.replacement)}
      >
        ${t.delete}
      </button>`,
    );
  }

  protected async firstUpdated() {
    this.addEventListener("keydown", (e: KeyboardEvent) => {
      if (e.key === "Escape" && this.dialog) this.dialog = undefined;
    });
  }

  protected willUpdate(changed: PropertyValues) {
    if (changed.has("dialog") && this.dialog)
      void this.updateComplete.then(() =>
        this.renderRoot
          .querySelector<HTMLElement>(".dialog .btn.ghost")
          ?.focus(),
      );
  }
}

if (!customElements.get("house-state-panel"))
  customElements.define("house-state-panel", HouseStatePanel);

declare global {
  interface HTMLElementTagNameMap {
    "house-state-panel": HouseStatePanel;
  }
}
