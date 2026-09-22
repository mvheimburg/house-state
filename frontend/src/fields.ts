/** Small form building blocks in the panel's own style. */
import { html, nothing, type TemplateResult } from "lit";
import { icon } from "./icons";
import { fill, type Strings } from "./localize";
import { fromParts, toParts, type Parts } from "./model";
import type { HomeAssistant } from "./types";

type Content = TemplateResult | string | typeof nothing;

const value = (event: Event) =>
  (event.target as HTMLInputElement | HTMLSelectElement).value;

/** Helper and error text under a control; errors are announced. */
export const help = (hint?: Content, error?: string) => html`
  ${hint ? html`<span class="hint">${hint}</span>` : nothing}
  ${
    error
      ? html`<span class="error-text" role="alert"
          >${icon("warning", "xs")}${error}</span
        >`
      : nothing
  }
`;

export interface TextOptions {
  label: string;
  value: string;
  onInput?: (value: string) => void;
  onChange?: (value: string) => void;
  hint?: Content;
  error?: string;
  id?: string;
  mono?: boolean;
  placeholder?: string;
  readonly?: boolean;
  maxlength?: number;
}

export const textField = (o: TextOptions) => html`
  <label class="field">
    <span class="label">${o.label}</span>
    <input
      id=${o.id ?? nothing}
      class=${o.mono ? "mono" : ""}
      type="text"
      autocomplete="off"
      spellcheck="false"
      maxlength=${o.maxlength ?? nothing}
      placeholder=${o.placeholder ?? nothing}
      ?readonly=${o.readonly}
      aria-invalid=${o.error ? "true" : "false"}
      .value=${o.value}
      @input=${(e: Event) => o.onInput?.(value(e))}
      @change=${(e: Event) => o.onChange?.(value(e))}
    />
    ${help(o.hint, o.error)}
  </label>
`;

export interface SelectOption {
  value: string;
  label: string;
}

export const selectField = (o: {
  label: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  hint?: Content;
  error?: string;
  id?: string;
  compact?: boolean;
  hideLabel?: boolean;
}) => html`
  <label class="field ${o.compact ? "compact" : ""}">
    <span class=${o.hideLabel ? "sr-only" : "label"}>${o.label}</span>
    <select
      id=${o.id ?? nothing}
      aria-invalid=${o.error ? "true" : "false"}
      @change=${(e: Event) => o.onChange(value(e))}
    >
      ${o.options.map(
        (option) =>
          html`<option
            value=${option.value}
            ?selected=${option.value === o.value}
          >
            ${option.label}
          </option>`,
      )}
    </select>
    ${help(o.hint, o.error)}
  </label>
`;

export const numberField = (o: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number | "any";
  unit?: string;
  hint?: Content;
  error?: string;
  id?: string;
  compact?: boolean;
  hideLabel?: boolean;
}) => html`
  <label class="field ${o.compact ? "compact" : ""}">
    <span class=${o.hideLabel ? "sr-only" : "label"}>${o.label}</span>
    <span class="with-unit">
      <input
        id=${o.id ?? nothing}
        type="number"
        inputmode="numeric"
        min=${o.min ?? nothing}
        max=${o.max ?? nothing}
        step=${o.step ?? 1}
        aria-invalid=${o.error ? "true" : "false"}
        .value=${Number.isFinite(o.value) ? String(o.value) : ""}
        @change=${(e: Event) => {
          const raw = value(e).trim();
          o.onChange(raw === "" ? 0 : Number(raw));
        }}
      />
      ${o.unit ? html`<span class="unit">${o.unit}</span>` : nothing}
    </span>
    ${help(o.hint, o.error)}
  </label>
`;

/** Several number boxes (hours, minutes, seconds) editing one value in seconds. */
export const durationField = (o: {
  label: string;
  seconds: number;
  units: ("h" | "m" | "s")[];
  strings: Strings;
  onChange: (seconds: number) => void;
  hint?: Content;
  error?: string;
  id?: string;
  disabled?: boolean;
}) => {
  const parts = toParts(o.seconds, o.units);
  const names = {
    h: o.strings.hours,
    m: o.strings.minutes,
    s: o.strings.seconds,
  };
  const set = (unit: keyof Parts, raw: string) => {
    const next = { ...parts, [unit]: Math.max(0, Number(raw) || 0) };
    o.onChange(fromParts(next));
  };
  return html`
    <div class="field" role="group" aria-label=${o.label} id=${o.id ?? nothing}>
      <span class="label">${o.label}</span>
      <span class="duration">
        ${o.units.map(
          (unit) => html`
            <span class="with-unit">
              <input
                type="number"
                inputmode="numeric"
                min="0"
                step=${unit === "m" && !o.units.includes("s") ? "any" : 1}
                data-unit=${unit}
                aria-label=${`${o.label} (${names[unit]})`}
                aria-invalid=${o.error ? "true" : "false"}
                ?disabled=${o.disabled}
                .value=${String(parts[unit])}
                @change=${(e: Event) => set(unit, value(e))}
              />
              <span class="unit">${names[unit]}</span>
            </span>
          `,
        )}
      </span>
      ${help(o.hint, o.error)}
    </div>
  `;
};

/** A row of pill buttons choosing exactly one value. */
export const segmented = <T extends string>(o: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  hint?: Content;
  error?: string;
  hideLabel?: boolean;
  name?: string;
}) => html`
  <div class="field">
    ${o.hideLabel ? nothing : html`<span class="label">${o.label}</span>`}
    <div
      class="segment"
      role="radiogroup"
      aria-label=${o.label}
      data-name=${o.name ?? nothing}
    >
      ${o.options.map(
        (option) => html`
          <button
            type="button"
            role="radio"
            class="pill ${option.value === o.value ? "active" : ""}"
            aria-checked=${option.value === o.value ? "true" : "false"}
            data-value=${option.value}
            @click=${() => option.value !== o.value && o.onChange(option.value)}
          >
            ${option.value === o.value ? icon("check", "s") : nothing}${option.label}
          </button>
        `,
      )}
    </div>
    ${help(o.hint, o.error)}
  </div>
`;

export const toggleField = (o: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  hint?: Content;
  id?: string;
}) => html`
  <label class="toggle-row">
    <span class="toggle-text">
      <span class="toggle-label">${o.label}</span>
      ${o.hint ? html`<span class="hint">${o.hint}</span>` : nothing}
    </span>
    <input
      id=${o.id ?? nothing}
      type="checkbox"
      role="switch"
      class="switch"
      .checked=${o.checked}
      @change=${(e: Event) => o.onChange((e.target as HTMLInputElement).checked)}
    />
  </label>
`;

// ---------------------------------------------------------------- entities

export interface PickerOptions {
  hass: HomeAssistant;
  strings: Strings;
  label: string;
  domains: string[];
  multiple?: boolean;
  value: string | string[];
  onChange: (value: any) => void;
  hint?: Content;
  error?: string;
  name: string;
}

const matching = (hass: HomeAssistant, domains: string[]) =>
  Object.keys(hass.states ?? {})
    .filter((id) => domains.includes(id.split(".")[0]))
    .sort();

const friendly = (hass: HomeAssistant, id: string) =>
  hass.states?.[id]?.attributes?.friendly_name as string | undefined;

/**
 * Home Assistant's own entity selector when the frontend has loaded it;
 * otherwise a plain input with suggestions, so the panel stays usable.
 */
export function entityPicker(o: PickerOptions): TemplateResult {
  const selector = {
    entity: {
      domain: o.domains.length === 1 ? o.domains[0] : o.domains,
      multiple: !!o.multiple,
    },
  };
  if (customElements.get("ha-selector")) {
    return html`
      <div class="field picker" data-picker=${o.name}>
        <ha-selector
          .hass=${o.hass}
          .selector=${selector}
          .value=${o.multiple ? [...(o.value as string[])] : o.value || undefined}
          .label=${o.label}
          .required=${false}
          @value-changed=${(e: CustomEvent) => {
            e.stopPropagation();
            const next = e.detail?.value;
            o.onChange(
              o.multiple ? (Array.isArray(next) ? next : []) : next || "",
            );
          }}
        ></ha-selector>
        ${help(o.hint, o.error)}
      </div>
    `;
  }
  const listId = `list-${o.name}`;
  const options = html`<datalist id=${listId}>
    ${matching(o.hass, o.domains).map(
      (id) => html`<option value=${id}>${friendly(o.hass, id) ?? id}</option>`,
    )}
  </datalist>`;
  if (!o.multiple) {
    return html`
      <label class="field picker" data-picker=${o.name}>
        <span class="label">${o.label}</span>
        <input
          class="mono"
          type="text"
          list=${listId}
          autocomplete="off"
          spellcheck="false"
          placeholder=${`${o.domains[0]}.…`}
          .value=${(o.value as string) || ""}
          @change=${(e: Event) => o.onChange(value(e).trim())}
        />
        ${options} ${help(o.hint, o.error)}
      </label>
    `;
  }
  const current = o.value as string[];
  const add = (input: HTMLInputElement) => {
    const id = input.value.trim();
    if (id && !current.includes(id)) o.onChange([...current, id]);
    input.value = "";
  };
  return html`
    <div class="field picker" data-picker=${o.name}>
      <span class="label">${o.label}</span>
      ${
        current.length
          ? html`<div class="chips">
              ${current.map(
                (id) =>
                  html`<span class="chip"
                    ><span
                      >${friendly(o.hass, id) ?? id}
                      ${
                        friendly(o.hass, id)
                          ? html`<span class="mono muted">${id}</span>`
                          : nothing
                      }</span
                    ><button
                      type="button"
                      class="chip-x"
                      aria-label=${fill(o.strings.remove, { name: id })}
                      @click=${() => o.onChange(current.filter((item) => item !== id))}
                    >
                      ${icon("close", "xs")}
                    </button></span
                  >`,
              )}
            </div>`
          : nothing
      }
      <span class="add-row">
        <input
          class="mono"
          type="text"
          list=${listId}
          autocomplete="off"
          spellcheck="false"
          aria-label=${o.label}
          placeholder=${`${o.domains[0]}.…`}
          @change=${(e: Event) => add(e.target as HTMLInputElement)}
        />
      </span>
      ${options} ${help(o.hint, o.error)}
    </div>
  `;
}

/** Ask Home Assistant to load its selector elements for a custom panel. */
export async function loadHaSelector(): Promise<void> {
  if (customElements.get("ha-selector")) return;
  try {
    const helpers = await (window as any).loadCardHelpers?.();
    const card = await helpers?.createCardElement?.({
      type: "entities",
      entities: [],
    });
    await card?.constructor?.getConfigElement?.();
  } catch {
    // The plain fallback inputs remain usable.
  }
}
