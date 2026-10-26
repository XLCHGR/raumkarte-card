/*
 * Raumkarte · Soft Dark Glass
 * Kompakte Raumkarte für Home Assistant mit Pop-up und grafischem Editor.
 * Bereich wählen → Lichter, bis zu 3 Rollos/Raffstores, Temperatur und Feuchte werden automatisch gefunden.
 */

const RK_VERSION = "1.0.0";

const COVER_SKIP = ["garage", "gate", "door", "damper", "window"];
const TILT_POSITION = 128;

const ICONS = {
  bulb: "mdi:lightbulb-outline",
  blinds: "mdi:blinds-horizontal",
  up: "mdi:chevron-up",
  down: "mdi:chevron-down",
  stop: "mdi:stop",
  close: "mdi:close",
  chevron: "mdi:chevron-right",
  power: "mdi:power",
  temp: "mdi:thermometer",
  hum: "mdi:water-percent",
};

const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

const fmtNum = (v, digits = 1) =>
  Number(v).toLocaleString("de-AT", { maximumFractionDigits: digits, minimumFractionDigits: 0 });

const STYLES = `
  :host {
    --rk-ground: #0B0E13;
    --rk-glass: rgba(255,255,255,0.055);
    --rk-glass-line: rgba(255,255,255,0.09);
    --rk-tile: rgba(255,255,255,0.04);
    --rk-tile-line: rgba(255,255,255,0.06);
    --rk-btn: rgba(255,255,255,0.07);
    --rk-text: #E9EDF2;
    --rk-muted: #9AA4B2;
    --rk-amber: #FFB547;
    --rk-amber-text: #FFD08A;
    --rk-sky: #5AB0FF;
    --rk-sky-text: #A8D4FF;
    --rk-ok: #7DD3A8;
    --rk-warn: #FF8A5B;
    --rk-warn-text: #FFB394;
    --rk-sheet: #151A22;
    display: block;
    font-family: var(--primary-font-family, Inter, system-ui, -apple-system, sans-serif);
    color: var(--rk-text);
  }
  * { box-sizing: border-box; }
  button { all: unset; box-sizing: border-box; cursor: pointer; -webkit-tap-highlight-color: transparent; }
  button:focus-visible, [data-slider]:focus-visible { outline: 2px solid var(--rk-sky); outline-offset: 2px; }
  ha-icon { display: flex; }

  .card {
    display: flex; flex-direction: column; gap: 10px; padding: 12px;
    border-radius: 22px; background: var(--rk-glass); border: 1px solid var(--rk-glass-line);
    -webkit-backdrop-filter: blur(20px); backdrop-filter: blur(20px);
  }
  .head { display: flex; align-items: center; gap: 12px; min-height: 48px; width: 100%; }
  .room-icon { width: 44px; height: 44px; flex: none; border-radius: 14px; display: flex; align-items: center; justify-content: center;
    background: var(--rk-btn); color: var(--rk-muted); --mdc-icon-size: 22px; }
  .room-icon.on { background: rgba(255,181,71,0.16); color: var(--rk-amber); }
  .titles { flex: 1; min-width: 0; display: flex; flex-direction: column; }
  .name { font-size: 17px; font-weight: 600; }
  .sub { font-size: 12px; color: var(--rk-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .climate { display: flex; flex-direction: column; align-items: flex-end; gap: 2px; }
  .temp { font-size: 18px; font-weight: 600; font-variant-numeric: tabular-nums; }
  .hum { display: flex; align-items: center; gap: 5px; font-size: 12px; color: var(--rk-muted); font-variant-numeric: tabular-nums; }
  .hum.warn { color: var(--rk-warn-text); }
  .dot { width: 6px; height: 6px; border-radius: 999px; background: var(--rk-ok); }
  .warn .dot { background: var(--rk-warn); }
  .chev { color: var(--rk-muted); --mdc-icon-size: 18px; }

  .actions { display: flex; gap: 8px; }
  .slider { position: relative; overflow: hidden; flex: 1; min-width: 0; height: 44px; border-radius: 14px;
    display: flex; align-items: center; gap: 4px; padding-right: 12px; font-size: 13px; font-weight: 600;
    background: var(--rk-btn); border: 1px solid transparent; touch-action: pan-y; user-select: none; -webkit-user-select: none; }
  .slider.on { background: rgba(255,181,71,0.06); border-color: rgba(255,181,71,0.35); color: var(--rk-amber-text); }
  .fill { position: absolute; left: 0; top: 0; bottom: 0; width: 0; background: rgba(255,181,71,0.22); pointer-events: none; transition: width .15s ease; }
  .dragging .fill { transition: none; }
  .slider .toggle { position: relative; z-index: 1; width: 44px; height: 42px; flex: none; display: flex; align-items: center; justify-content: center;
    color: var(--rk-muted); --mdc-icon-size: 18px; }
  .slider.on .toggle { color: var(--rk-amber); }
  .slider .label { position: relative; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; pointer-events: none; }

  .blinds { flex: none; height: 44px; border-radius: 14px; display: flex; align-items: stretch; overflow: hidden;
    background: rgba(90,176,255,0.10); border: 1px solid rgba(90,176,255,0.28); }
  .blinds .ico { width: 36px; display: flex; align-items: center; justify-content: center; color: var(--rk-sky-text);
    border-right: 1px solid rgba(90,176,255,0.22); --mdc-icon-size: 16px; }
  .blinds button { width: 44px; display: flex; align-items: center; justify-content: center; --mdc-icon-size: 20px; }
  .blinds .sep { width: 1px; align-self: center; height: 20px; background: rgba(90,176,255,0.22); }

  .empty { padding: 16px; font-size: 13px; color: var(--rk-muted); }

  /* Pop-up */
  .overlay { position: fixed; inset: 0; z-index: 6; display: flex; flex-direction: column; justify-content: flex-end; align-items: center; }
  .backdrop { position: absolute; inset: 0; background: rgba(4,6,10,0.62); animation: fade .18s ease; }
  .sheet { position: relative; width: 100%; max-width: 520px; max-height: 92vh; overflow-y: auto; overscroll-behavior: contain;
    display: flex; flex-direction: column; gap: 14px; padding: 10px 16px calc(28px + env(safe-area-inset-bottom));
    border-radius: 28px 28px 0 0; background: var(--rk-sheet); border-top: 1px solid rgba(255,255,255,0.10);
    animation: rise .22s cubic-bezier(.2,.8,.2,1); }
  @media (min-width: 700px) {
    .overlay { justify-content: center; }
    .sheet { border-radius: 28px; border: 1px solid rgba(255,255,255,0.10); max-height: 86vh; }
    .grab { display: none; }
  }
  @keyframes rise { from { transform: translateY(40px); opacity: 0; } to { transform: none; opacity: 1; } }
  @keyframes fade { from { opacity: 0; } to { opacity: 1; } }
  .grab { align-self: center; width: 40px; height: 5px; border-radius: 999px; background: rgba(255,255,255,0.18); }
  .sheet .name { font-size: 20px; }
  .iconbtn { width: 44px; height: 44px; flex: none; border-radius: 14px; background: var(--rk-btn); display: flex; align-items: center; justify-content: center;
    color: var(--rk-text); --mdc-icon-size: 20px; }
  .grid2 { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 8px; }
  .tile { display: flex; align-items: center; gap: 10px; padding: 12px; border-radius: 16px; background: var(--rk-tile); border: 1px solid var(--rk-tile-line); text-align: left; }
  .tile .val { font-size: 20px; font-weight: 600; font-variant-numeric: tabular-nums; }
  .tile .cap { font-size: 12px; color: var(--rk-muted); }
  .tile .cap.warn { color: var(--rk-warn-text); }
  .tile ha-icon { color: var(--rk-muted); --mdc-icon-size: 18px; }
  .section { display: flex; align-items: center; justify-content: space-between; min-height: 32px; }
  .section .t { font-size: 11px; font-weight: 600; letter-spacing: .12em; text-transform: uppercase; color: var(--rk-muted); }
  .pill { height: 32px; padding: 0 12px; border-radius: 999px; background: var(--rk-btn); font-size: 12px; font-weight: 600;
    display: flex; align-items: center; gap: 6px; --mdc-icon-size: 14px; }

  .light { position: relative; overflow: hidden; height: 60px; padding: 0 12px 0 8px; border-radius: 16px; display: flex; align-items: center; gap: 8px; min-width: 0;
    background: var(--rk-tile); border: 1px solid var(--rk-tile-line); touch-action: pan-y; user-select: none; -webkit-user-select: none; }
  .light.on { background: rgba(255,181,71,0.06); border-color: rgba(255,181,71,0.35); }
  .light.off-line { opacity: .5; }
  .light .toggle { position: relative; z-index: 1; width: 40px; height: 40px; flex: none; border-radius: 999px; display: flex; align-items: center; justify-content: center;
    background: rgba(255,255,255,0.08); color: var(--rk-muted); --mdc-icon-size: 18px; }
  .light.on .toggle { background: var(--rk-amber); color: #1A1206; }
  .light .txt { position: relative; display: flex; flex-direction: column; min-width: 0; pointer-events: none; }
  .light .n { font-size: 14px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .light .s { font-size: 12px; color: var(--rk-muted); }
  .light.on .s { color: var(--rk-amber-text); }

  .cover { display: flex; flex-direction: column; gap: 10px; padding: 12px; border-radius: 16px; background: var(--rk-tile); border: 1px solid var(--rk-tile-line); }
  .cover .row { display: flex; align-items: center; gap: 8px; }
  .cover .ci { width: 34px; height: 34px; flex: none; border-radius: 999px; display: flex; align-items: center; justify-content: center;
    background: rgba(255,255,255,0.08); color: var(--rk-muted); --mdc-icon-size: 18px; }
  .cover .ci.closed { background: rgba(90,176,255,0.16); color: var(--rk-sky); }
  .cover .info { flex: 1; min-width: 0; display: flex; flex-direction: column; text-align: left; }
  .cover .n { font-size: 14px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .cover .s { font-size: 12px; color: var(--rk-muted); }
  .bar { height: 4px; border-radius: 999px; background: rgba(255,255,255,0.08); overflow: hidden; }
  .bar div { height: 4px; border-radius: 999px; background: var(--rk-sky); }
  .tilt { display: flex; align-items: center; gap: 8px; }
  .tilt .t { flex: 1; font-size: 11px; font-weight: 600; letter-spacing: .12em; text-transform: uppercase; color: var(--rk-muted); }
  .tilt button { height: 36px; padding: 0 14px; border-radius: 999px; background: var(--rk-btn); font-size: 13px; font-weight: 600; display: flex; align-items: center; }
  .tilt button.active { background: rgba(90,176,255,0.16); color: var(--rk-sky-text); }
`;

class RaumkarteCard extends HTMLElement {
  static getConfigElement() {
    return document.createElement("raumkarte-card-editor");
  }

  static getStubConfig(hass) {
    const areas = Object.keys(hass?.areas || {});
    return { area: areas[0] || "" };
  }

  constructor() {
    super();
    this._root = this.attachShadow({ mode: "open" });
    this._popId = "rk-" + Math.random().toString(36).slice(2, 9);
    this._open = false;
    this._dragging = false;
    this._sig = "";
    this._bind(this._root);
    this._onPopState = () => {
      if (this._open && history.state?.raumkarte !== this._popId) this._closePopup(true);
    };
    this._onKey = (e) => {
      if (e.key === "Escape" && this._open) this._closePopup();
    };
  }

  setConfig(config) {
    if (!config) throw new Error("Ungültige Konfiguration");
    this._config = { ...config };
    this._sig = "";
    if (this._hass) this._update();
  }

  set hass(hass) {
    this._hass = hass;
    this._update();
  }

  getCardSize() {
    return 2;
  }

  getGridOptions() {
    return { columns: 12, min_columns: 6 };
  }

  disconnectedCallback() {
    this._closePopup(true);
  }

  // ── Daten ───────────────────────────────────────────────────────────

  _resolve() {
    const h = this._hass;
    const c = this._config || {};
    const areaId = c.area;
    const area = areaId ? h.areas?.[areaId] : null;
    const excl = new Set(c.exclude || []);
    const reg = h.entities || {};

    const inArea = (eid) => {
      const r = reg[eid];
      if (!r || r.hidden || r.entity_category) return false;
      const a = r.area_id || (r.device_id ? h.devices?.[r.device_id]?.area_id : null);
      return a === areaId;
    };
    const auto = areaId ? Object.keys(reg).filter((e) => h.states[e] && !excl.has(e) && inArea(e)) : [];
    const byName = (a, b) => this._label(a, area).localeCompare(this._label(b, area), "de");

    const lights = (c.lights?.length ? c.lights : auto.filter((e) => e.startsWith("light.") && !Array.isArray(h.states[e].attributes.entity_id)).sort(byName))
      .filter((e) => h.states[e]);
    const covers = (c.covers?.length
      ? c.covers
      : auto.filter((e) => e.startsWith("cover.") && !COVER_SKIP.includes(h.states[e].attributes.device_class)).sort(byName).slice(0, 3)
    ).filter((e) => h.states[e]);
    const pickSensor = (dc) => auto.find((e) => e.startsWith("sensor.") && h.states[e].attributes.device_class === dc);
    const temperature = c.temperature || pickSensor("temperature");
    const humidity = c.humidity || pickSensor("humidity");

    return {
      area,
      name: c.name || area?.name || "Raum",
      icon: c.icon || area?.icon || "mdi:home-outline",
      lights,
      covers,
      temperature: temperature && h.states[temperature] ? temperature : null,
      humidity: humidity && h.states[humidity] ? humidity : null,
    };
  }

  _label(eid, area) {
    const st = this._hass.states[eid];
    let n = st?.attributes.friendly_name || eid;
    const an = area?.name;
    if (an && n.toLowerCase().startsWith(an.toLowerCase() + " ") && n.length > an.length + 1) n = n.slice(an.length + 1);
    return n;
  }

  _signature(m) {
    const h = this._hass;
    const ids = [...m.lights, ...m.covers, m.temperature, m.humidity].filter(Boolean);
    return JSON.stringify([
      m.name, m.icon, this._open,
      ids.map((e) => {
        const s = h.states[e];
        return [e, s.state, s.attributes.brightness, s.attributes.current_position, s.attributes.current_tilt_position, s.attributes.friendly_name];
      }),
    ]);
  }

  _update() {
    if (!this._hass || !this._config) return;
    const m = this._resolve();
    this._model = m;
    const sig = this._signature(m);
    if (sig === this._sig || this._dragging) return;
    // Nicht neu zeichnen, solange ein Finger drauf ist – sonst geht der Tipp verloren.
    if (this._pressed) {
      this._pending = true;
      return;
    }
    this._sig = sig;
    this._render();
  }

  _isOn(eid) {
    return this._hass.states[eid]?.state === "on";
  }

  _pct(eid) {
    const b = this._hass.states[eid]?.attributes.brightness;
    return b == null ? 100 : Math.max(1, Math.round(b / 2.55));
  }

  _dimmable(eid) {
    const modes = this._hass.states[eid]?.attributes.supported_color_modes || [];
    return modes.some((x) => x !== "onoff" && x !== "unknown");
  }

  _coverPos(eid) {
    const s = this._hass.states[eid];
    if (!s) return 0;
    const p = s.attributes.current_position;
    return p == null ? (s.state === "closed" ? 0 : 100) : p;
  }

  _hasTilt(eid) {
    return (this._hass.states[eid]?.attributes.supported_features || 0) & TILT_POSITION;
  }

  _roomPct(m) {
    const on = m.lights.filter((e) => this._isOn(e));
    if (!on.length) return 0;
    return Math.round(on.reduce((s, e) => s + this._pct(e), 0) / on.length);
  }

  _humInfo(m) {
    if (!m.humidity) return null;
    const v = Number(this._hass.states[m.humidity].state);
    if (isNaN(v)) return null;
    const r = Math.round(v);
    return { v: r, warn: r > 60 || r < 35, label: r > 60 ? "Feuchte · lüften" : r < 35 ? "Feuchte · trocken" : "Feuchte" };
  }

  _tempText(m) {
    if (!m.temperature) return null;
    const v = Number(this._hass.states[m.temperature].state);
    return isNaN(v) ? "–" : fmtNum(v) + "°";
  }

  _subText(m, compact) {
    const on = m.lights.filter((e) => this._isOn(e)).length;
    let blinds = "";
    if (m.covers.length) {
      const pos = m.covers.map((e) => this._coverPos(e));
      blinds = pos.every((p) => p === 100) ? "Rollo offen" : pos.every((p) => p === 0) ? "Rollo zu" : "Rollo teilweise";
    }
    if (!m.lights.length) return blinds || "";
    if (compact && blinds) return `${on ? on + (on === 1 ? " Licht an" : " Lichter an") : "Licht aus"} · ${blinds}`;
    return on ? `${on} von ${m.lights.length} Lichter an` : "Alle Lichter aus";
  }

  // ── Rendering ───────────────────────────────────────────────────────

  _render() {
    const m = this._model;
    if (!this._config.area && !m.lights.length && !m.covers.length) {
      this._root.innerHTML = `<style>${STYLES}</style><div class="card"><div class="empty">Bitte im Editor einen Bereich wählen.</div></div>`;
      return;
    }
    const anyOn = m.lights.some((e) => this._isOn(e));
    const pct = this._roomPct(m);
    const temp = this._tempText(m);
    const hum = this._humInfo(m);

    const climate = temp || hum
      ? `<span class="climate">
          ${temp ? `<span class="temp">${temp}</span>` : ""}
          ${hum ? `<span class="hum ${hum.warn ? "warn" : ""}"><span class="dot"></span>${hum.v} %</span>` : ""}
        </span>`
      : "";

    const slider = m.lights.length
      ? `<div class="slider ${anyOn ? "on" : ""}" data-slider="room" tabindex="0" role="slider" aria-label="Licht ${esc(m.name)} dimmen"
            aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}">
          <div class="fill" style="width:${pct}%"></div>
          <button class="toggle" data-act="room-toggle" aria-label="Licht ${esc(m.name)} umschalten"><ha-icon icon="${ICONS.bulb}"></ha-icon></button>
          <span class="label" data-label>${anyOn ? `Licht ${pct} %` : "Licht aus"}</span>
        </div>`
      : "";

    const blinds = m.covers.length
      ? `<div class="blinds" role="group" aria-label="Rollo">
          <span class="ico"><ha-icon icon="${ICONS.blinds}"></ha-icon></span>
          <button data-act="covers" data-svc="open_cover" aria-label="Rollo auf"><ha-icon icon="${ICONS.up}"></ha-icon></button>
          <span class="sep"></span>
          <button data-act="covers" data-svc="close_cover" aria-label="Rollo ab"><ha-icon icon="${ICONS.down}"></ha-icon></button>
        </div>`
      : "";

    this._root.innerHTML = `<style>${STYLES}</style>
      <div class="card">
        <button class="head" data-act="open" aria-label="${esc(m.name)} öffnen">
          <span class="room-icon ${anyOn ? "on" : ""}"><ha-icon icon="${esc(m.icon)}"></ha-icon></span>
          <span class="titles"><span class="name">${esc(m.name)}</span><span class="sub">${esc(this._subText(m, true))}</span></span>
          ${climate}
          <ha-icon class="chev" icon="${ICONS.chevron}"></ha-icon>
        </button>
        ${slider || blinds ? `<div class="actions">${slider}${blinds}</div>` : ""}
      </div>`;

    if (this._open) this._renderPopup();
  }

  _renderPopup() {
    const m = this._model;
    const h = this._hass;
    const anyOn = m.lights.some((e) => this._isOn(e));
    const temp = this._tempText(m);
    const hum = this._humInfo(m);

    const climate = temp || hum
      ? `<div class="grid2">
          ${temp ? `<button class="tile" data-act="more" data-e="${m.temperature}">
              <ha-icon icon="${ICONS.temp}"></ha-icon>
              <span style="display:flex;flex-direction:column"><span class="val">${temp}</span><span class="cap">Temperatur</span></span></button>` : ""}
          ${hum ? `<button class="tile" data-act="more" data-e="${m.humidity}">
              <ha-icon icon="${ICONS.hum}"></ha-icon>
              <span style="display:flex;flex-direction:column"><span class="val">${hum.v} %</span><span class="cap ${hum.warn ? "warn" : ""}">${hum.label}</span></span></button>` : ""}
        </div>`
      : "";

    const lights = m.lights.map((e) => {
      const s = h.states[e];
      const on = s.state === "on";
      const unavail = s.state === "unavailable";
      const dim = this._dimmable(e);
      const pct = on ? this._pct(e) : 0;
      const stateTxt = unavail ? "Nicht verfügbar" : on ? (dim ? `${this._pct(e)} %` : "An") : "Aus";
      return `<div class="light ${on ? "on" : ""} ${unavail ? "off-line" : ""}" ${dim && !unavail ? `data-slider="${e}" tabindex="0" role="slider" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}"` : `data-tap="${e}"`}
            aria-label="${esc(this._label(e, m.area))}">
          <div class="fill" style="width:${pct}%"></div>
          <button class="toggle" data-act="light-toggle" data-e="${e}" data-hold="${e}" aria-label="${esc(this._label(e, m.area))} umschalten"><ha-icon icon="${esc(s.attributes.icon || ICONS.bulb)}"></ha-icon></button>
          <span class="txt"><span class="n">${esc(this._label(e, m.area))}</span><span class="s" data-label>${stateTxt}</span></span>
        </div>`;
    }).join("");

    const covers = m.covers.map((e) => {
      const s = h.states[e];
      const pos = this._coverPos(e);
      const hasPos = s.attributes.current_position != null;
      const tilt = this._hasTilt(e);
      const t = s.attributes.current_tilt_position;
      let txt = s.state === "unavailable" ? "Nicht verfügbar" : pos === 100 ? "Offen" : pos === 0 ? "Geschlossen" : `${pos} % offen`;
      if (s.state === "opening") txt = "Fährt auf …";
      if (s.state === "closing") txt = "Fährt zu …";
      return `<div class="cover">
          <div class="row">
            <button class="ci ${pos < 100 ? "closed" : ""}" data-act="more" data-e="${e}" aria-label="${esc(this._label(e, m.area))} Details"><ha-icon icon="${esc(s.attributes.icon || ICONS.blinds)}"></ha-icon></button>
            <button class="info" data-act="more" data-e="${e}"><span class="n">${esc(this._label(e, m.area))}</span><span class="s">${txt}</span></button>
            <button class="iconbtn" data-act="cover" data-e="${e}" data-svc="open_cover" aria-label="Auf"><ha-icon icon="${ICONS.up}"></ha-icon></button>
            <button class="iconbtn" data-act="cover" data-e="${e}" data-svc="stop_cover" aria-label="Stopp" style="--mdc-icon-size:16px"><ha-icon icon="${ICONS.stop}"></ha-icon></button>
            <button class="iconbtn" data-act="cover" data-e="${e}" data-svc="close_cover" aria-label="Ab"><ha-icon icon="${ICONS.down}"></ha-icon></button>
          </div>
          ${hasPos ? `<div class="bar"><div style="width:${pos}%"></div></div>` : ""}
          ${tilt ? `<div class="tilt"><span class="t">Lamelle</span>
              <button class="${t === 100 ? "active" : ""}" data-act="tilt" data-e="${e}" data-v="100">Offen</button>
              <button class="${t > 0 && t < 100 ? "active" : ""}" data-act="tilt" data-e="${e}" data-v="50">Halb</button>
              <button class="${t === 0 ? "active" : ""}" data-act="tilt" data-e="${e}" data-v="0">Zu</button></div>` : ""}
        </div>`;
    }).join("");

    this._pop.innerHTML = `<style>${STYLES}</style>
      <div class="overlay">
        <button class="backdrop" data-act="close" aria-label="Schließen"></button>
        <div class="sheet" role="dialog" aria-modal="true" aria-label="${esc(m.name)}">
          <div class="grab"></div>
          <div class="head">
            <span class="room-icon ${anyOn ? "on" : ""}"><ha-icon icon="${esc(m.icon)}"></ha-icon></span>
            <span class="titles"><span class="name">${esc(m.name)}</span><span class="sub">${esc(this._subText(m, false))}</span></span>
            <button class="iconbtn" data-act="close" aria-label="Schließen"><ha-icon icon="${ICONS.close}"></ha-icon></button>
          </div>
          ${climate}
          ${m.lights.length ? `<div class="section"><span class="t">Licht</span>
              <button class="pill" data-act="all-off"><ha-icon icon="${ICONS.power}"></ha-icon>Alle aus</button></div>
            <div class="grid2">${lights}</div>` : ""}
          ${m.covers.length ? `<div class="section"><span class="t">Beschattung</span></div>${covers}` : ""}
        </div>
      </div>`;
  }

  // ── Pop-up ──────────────────────────────────────────────────────────

  _openPopup() {
    if (this._open) return;
    this._open = true;
    this._popHost = document.createElement("raumkarte-popup");
    this._pop = this._popHost.attachShadow({ mode: "open" });
    this._bind(this._pop);
    document.body.appendChild(this._popHost);
    history.pushState({ ...(history.state || {}), raumkarte: this._popId }, "");
    window.addEventListener("popstate", this._onPopState);
    window.addEventListener("keydown", this._onKey);
    document.documentElement.style.overflow = "hidden";
    this._sig = "";
    this._update();
  }

  _closePopup(fromHistory = false) {
    if (!this._open) return;
    this._open = false;
    window.removeEventListener("popstate", this._onPopState);
    window.removeEventListener("keydown", this._onKey);
    document.documentElement.style.overflow = "";
    this._popHost?.remove();
    this._popHost = this._pop = null;
    if (!fromHistory && history.state?.raumkarte === this._popId) history.back();
  }

  // ── Interaktion ─────────────────────────────────────────────────────

  _bind(root) {
    root.addEventListener("pointerdown", () => {
      this._pressed = true;
      const release = () => {
        window.removeEventListener("pointerup", release);
        window.removeEventListener("pointercancel", release);
        // Klick-Ereignis abwarten, dann aufgestaute Updates zeichnen
        setTimeout(() => {
          this._pressed = false;
          if (this._pending) {
            this._pending = false;
            this._update();
          }
        }, 0);
      };
      window.addEventListener("pointerup", release);
      window.addEventListener("pointercancel", release);
    }, true);
    root.addEventListener("click", (e) => this._onClick(e));
    root.addEventListener("pointerdown", (e) => this._onPointerDown(e));
    root.addEventListener("keydown", (e) => this._onSliderKey(e));
  }

  _call(domain, service, data) {
    this._hass.callService(domain, service, data);
  }

  _moreInfo(entityId) {
    this.dispatchEvent(new CustomEvent("hass-more-info", { detail: { entityId }, bubbles: true, composed: true }));
  }

  _onClick(ev) {
    if (this._suppressClick) {
      this._suppressClick = false;
      ev.preventDefault();
      return;
    }
    const tapTile = ev.target.closest("[data-tap]");
    const el = ev.target.closest("[data-act]");
    if (!el && tapTile) {
      this._call("light", "toggle", { entity_id: tapTile.dataset.tap });
      return;
    }
    if (!el) return;
    const m = this._model;
    const e = el.dataset.e;
    switch (el.dataset.act) {
      case "open": return this._openPopup();
      case "close": return this._closePopup();
      case "more": return this._moreInfo(e);
      case "light-toggle": return this._call("light", "toggle", { entity_id: e });
      case "room-toggle": {
        const anyOn = m.lights.some((x) => this._isOn(x));
        return this._call("light", anyOn ? "turn_off" : "turn_on", { entity_id: m.lights });
      }
      case "all-off": return this._call("light", "turn_off", { entity_id: m.lights });
      case "covers": return this._call("cover", el.dataset.svc, { entity_id: m.covers });
      case "cover": return this._call("cover", el.dataset.svc, { entity_id: e });
      case "tilt": return this._call("cover", "set_cover_tilt_position", { entity_id: e, tilt_position: Number(el.dataset.v) });
    }
  }

  _setBrightness(target, pct) {
    const m = this._model;
    if (target === "room") {
      const dim = m.lights.filter((e) => this._dimmable(e));
      const plain = m.lights.filter((e) => !this._dimmable(e));
      if (dim.length) this._call("light", "turn_on", { entity_id: dim, brightness_pct: pct });
      if (plain.length) this._call("light", "turn_on", { entity_id: plain });
    } else {
      this._call("light", "turn_on", { entity_id: target, brightness_pct: pct });
    }
  }

  _showValue(slider, pct) {
    slider.querySelector(".fill").style.width = pct + "%";
    slider.setAttribute("aria-valuenow", pct);
    const label = slider.querySelector("[data-label]");
    if (label) label.textContent = slider.dataset.slider === "room" ? `Licht ${pct} %` : `${pct} %`;
    slider.classList.add("on");
  }

  _onSliderKey(ev) {
    const s = ev.target.closest?.("[data-slider]");
    if (!s || ev.target !== s || !["ArrowLeft", "ArrowRight"].includes(ev.key)) return;
    ev.preventDefault();
    const cur = Number(s.getAttribute("aria-valuenow")) || 0;
    const v = Math.max(1, Math.min(100, cur + (ev.key === "ArrowRight" ? 10 : -10)));
    this._showValue(s, v);
    this._setBrightness(s.dataset.slider, v);
  }

  _onPointerDown(ev) {
    // Halten auf ein Licht-Icon → Details
    const holdEl = ev.target.closest("[data-hold]");
    if (holdEl) {
      const id = holdEl.dataset.hold;
      const timer = setTimeout(() => {
        this._suppressClick = true;
        this._moreInfo(id);
      }, 500);
      const clear = () => {
        clearTimeout(timer);
        window.removeEventListener("pointerup", clear);
        window.removeEventListener("pointercancel", clear);
        window.removeEventListener("pointermove", moveCheck);
      };
      const sx = ev.clientX, sy = ev.clientY;
      const moveCheck = (e) => { if (Math.hypot(e.clientX - sx, e.clientY - sy) > 8) clear(); };
      window.addEventListener("pointerup", clear);
      window.addEventListener("pointercancel", clear);
      window.addEventListener("pointermove", moveCheck);
      return;
    }

    const s = ev.target.closest("[data-slider]");
    if (!s || ev.target.closest("button") || ev.button > 0) return;
    const rect = s.getBoundingClientRect();
    const sx = ev.clientX, sy = ev.clientY;
    let drag = false;
    let cancelled = false;
    const val = (x) => Math.max(1, Math.min(100, Math.round(((x - rect.left) / rect.width) * 100)));

    const move = (e) => {
      const dx = e.clientX - sx, dy = e.clientY - sy;
      if (!drag) {
        if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx)) { cancelled = true; return done(); }
        if (Math.abs(dx) < 6) return;
        drag = true;
        this._dragging = true;
        s.classList.add("dragging");
      }
      e.preventDefault();
      this._showValue(s, val(e.clientX));
    };
    const up = (e) => {
      done();
      if (cancelled || e.type === "pointercancel") return;
      const v = val(e.clientX);
      this._showValue(s, v);
      this._setBrightness(s.dataset.slider, v);
    };
    const done = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      s.classList.remove("dragging");
      this._dragging = false;
    };
    window.addEventListener("pointermove", move, { passive: false });
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
  }
}

// ── Editor ──────────────────────────────────────────────────────────────

const LABELS = {
  area: "Bereich",
  name: "Name (leer = Bereichsname)",
  icon: "Symbol (leer = Bereichssymbol)",
  lights: "Lichter",
  covers: "Rollos / Raffstores (max. 3 empfohlen)",
  temperature: "Temperatursensor",
  humidity: "Feuchtesensor",
  exclude: "Ausschließen",
};

const HELPERS = {
  lights: "Leer = alle Lichter im Bereich",
  covers: "Leer = Rollos/Raffstores im Bereich (bis zu 3)",
  temperature: "Leer = erster Temperatursensor im Bereich",
  humidity: "Leer = erster Feuchtesensor im Bereich",
  exclude: "Entitäten, die nicht automatisch übernommen werden sollen",
};

const SCHEMA = [
  { name: "area", selector: { area: {} } },
  {
    type: "grid",
    name: "",
    schema: [
      { name: "name", selector: { text: {} } },
      { name: "icon", selector: { icon: {} } },
    ],
  },
  {
    type: "expandable",
    name: "",
    flatten: true,
    title: "Entitäten anpassen (optional)",
    icon: "mdi:tune-variant",
    schema: [
      { name: "lights", selector: { entity: { multiple: true, filter: { domain: "light" } } } },
      { name: "covers", selector: { entity: { multiple: true, filter: { domain: "cover" } } } },
      { name: "temperature", selector: { entity: { filter: { domain: "sensor", device_class: "temperature" } } } },
      { name: "humidity", selector: { entity: { filter: { domain: "sensor", device_class: "humidity" } } } },
      { name: "exclude", selector: { entity: { multiple: true } } },
    ],
  },
];

class RaumkarteCardEditor extends HTMLElement {
  setConfig(config) {
    this._config = { ...config };
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    if (this._form) this._form.hass = hass;
    else this._render();
  }

  async _ensureForm() {
    if (customElements.get("ha-form")) return;
    // ha-form wird von HA erst bei Bedarf geladen
    const helpers = await window.loadCardHelpers?.();
    const card = helpers && (await helpers.createCardElement({ type: "entities", entities: [] }));
    await card?.constructor?.getConfigElement?.();
    await customElements.whenDefined("ha-form");
  }

  async _render() {
    if (!this._hass || !this._config) return;
    if (!this._form) {
      if (this._loading) return;
      this._loading = true;
      await this._ensureForm();
      this._form = document.createElement("ha-form");
      this._form.computeLabel = (s) => LABELS[s.name] ?? s.name;
      this._form.computeHelper = (s) => HELPERS[s.name];
      this._form.addEventListener("value-changed", (ev) => {
        const cfg = { ...ev.detail.value };
        for (const k of Object.keys(cfg)) {
          if (cfg[k] === "" || cfg[k] == null || (Array.isArray(cfg[k]) && !cfg[k].length)) delete cfg[k];
        }
        cfg.type = this._config.type;
        this._config = cfg;
        this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: cfg }, bubbles: true, composed: true }));
      });
      this.appendChild(this._form);
    }
    this._form.hass = this._hass;
    this._form.schema = SCHEMA;
    this._form.data = this._config;
  }
}

customElements.define("raumkarte-card", RaumkarteCard);
customElements.define("raumkarte-card-editor", RaumkarteCardEditor);
customElements.define("raumkarte-popup", class extends HTMLElement {});

window.customCards = window.customCards || [];
window.customCards.push({
  type: "raumkarte-card",
  name: "Raumkarte",
  description: "Kompakte Raumkarte mit Licht-Slider, Rollos und Klima. Bereich wählen – den Rest findet sie selbst.",
  preview: true,
});

console.info(`%c RAUMKARTE %c ${RK_VERSION} `, "background:#FFB547;color:#1A1206;font-weight:700", "background:#151A22;color:#E9EDF2");
