import { ITEMS, DOCS, LOG } from './data.js';
import { heightAt, SPOTS } from './terrain.js';

const $ = (sel, root = document) => root.querySelector(sel);
const h = (tag, cls, html = '') => { const e = document.createElement(tag); if (cls) e.className = cls; e.innerHTML = html; return e; };

const ICON = {
  thirst: '<svg viewBox="0 0 24 24"><path d="M12 2C8 8 5 11.5 5 15a7 7 0 0014 0c0-3.5-3-7-7-13z" fill="currentColor"/></svg>',
  hunger: '<svg viewBox="0 0 24 24"><path d="M7 2v8a3 3 0 002 2.8V22h2V12.8A3 3 0 0013 10V2h-1.5v7h-1V2h-1v7h-1V2zM17 2c-1.7 0-3 2.2-3 6v5h2v9h2V2z" fill="currentColor"/></svg>',
  energy: '<svg viewBox="0 0 24 24"><path d="M13 2L4 14h6l-1 8 9-12h-6z" fill="currentColor"/></svg>',
  sun: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="5" fill="currentColor"/><g stroke="currentColor" stroke-width="2"><path d="M12 1v3M12 20v3M1 12h3M20 12h3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/></g></svg>',
  moon: '<svg viewBox="0 0 24 24"><path d="M20 15A9 9 0 019 4a8 8 0 1011 11z" fill="currentColor"/></svg>',
  storm: '<svg viewBox="0 0 24 24"><path d="M6 14a4 4 0 010-8 6 6 0 0111.3 1.5A3.5 3.5 0 0117 14H6zM11 15l-2 4h3l-1 4 4-6h-3l1-2z" fill="currentColor"/></svg>',
};

export class UI {
  constructor(root) {
    this.root = root;
    root.innerHTML = `
      <div id="hud" class="hidden">
        <div id="clock"><span class="ico"></span><span class="t"></span></div>
        <div id="compass"><div class="strip"></div><div class="needle"></div></div>
        <div id="stats"></div>
        <div id="quest"></div>
        <div id="prompt" class="hidden"></div>
        <div id="hint-keys"><span><b>Tab</b> Rucksack</span><span><b>F</b> Funk</span><span><b>Esc</b> Menü</span></div>
        <div id="vignette"></div>
      </div>
      <div id="toasts"></div>
      <div id="dialog" class="hidden"><div class="portrait"></div><div class="body"><div class="who"></div><div class="text"></div></div><div class="next">E / Enter ▸</div></div>
      <div id="progress" class="hidden"><div class="lbl"></div><div class="bar"><i></i></div></div>
      <div id="modal" class="hidden"><div class="panel"></div></div>
      <div id="fade"></div>
      <div id="cards" class="hidden"><div class="card"></div><div class="skip">Leertaste: weiter</div></div>
      <div id="screen" class="hidden"></div>`;
    this.hud = $('#hud', root);
    this.modal = $('#modal', root);
    this.panel = $('.panel', this.modal);
    this.modalKind = null;
    this.dialogOpen = false;
    this._dialogResolve = null;
    addEventListener('keydown', (e) => {
      if (this.dialogOpen && (e.code === 'KeyE' || e.code === 'Enter' || e.code === 'Space')) { e.preventDefault(); this._advance(); }
    });
    $('#dialog', root).addEventListener('click', () => this._advance());
  }

  get busy() { return this.dialogOpen || !!this.modalKind || this.cardsOpen || this.screenOpen || this.progressOpen || performance.now() - (this._closedAt || 0) < 250; }

  showHUD(v) { this.hud.classList.toggle('hidden', !v); }

  updateHUD(G, env, questHTML, yaw, markers) {
    const st = $('#stats');
    const bar = (k, v, label) => `<div class="stat ${v < 20 ? 'low' : ''}" title="${label}"><span class="ico">${ICON[k]}</span><div class="bar"><i style="width:${Math.max(0, v)}%"></i></div></div>`;
    st.innerHTML = bar('thirst', G.stats.thirst, 'Durst') + bar('hunger', G.stats.hunger, 'Hunger') + bar('energy', G.stats.energy, 'Energie');
    const hh = Math.floor(env.time), mm = Math.floor((env.time - hh) * 60);
    $('#clock .t').textContent = `Tag ${G.day} · ${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
    $('#clock .ico').innerHTML = env.storm > 0.5 ? ICON.storm : env.isNight ? ICON.moon : ICON.sun;
    if (this._questHTML !== questHTML) { $('#quest').innerHTML = questHTML; this._questHTML = questHTML; }
    // Kompass
    const strip = $('#compass .strip');
    const deg = ((-yaw * 180 / Math.PI) % 360 + 360) % 360;
    let s = '';
    const dirs = { 0: 'N', 45: 'NO', 90: 'O', 135: 'SO', 180: 'S', 225: 'SW', 270: 'W', 315: 'NW' };
    for (let a = 0; a < 360; a += 15) {
      const d = ((a - deg + 540) % 360) - 180;
      if (Math.abs(d) > 178) continue;
      const lab = dirs[a];
      s += `<span class="tick ${lab ? 'big' : ''}" style="left:${50 + d / 180 * 50}%">${lab || ''}</span>`;
    }
    for (const m of markers || []) {
      let d = m.bearing - deg; d = ((d + 540) % 360) - 180;
      if (Math.abs(d) < 175) s += `<span class="mark" style="left:${50 + d / 180 * 50}%;--c:${m.color || '#ffcf5a'}">◆<small>${m.dist < 1000 ? Math.round(m.dist) + ' m' : ''}</small></span>`;
    }
    strip.innerHTML = s;
    const low = Math.min(G.stats.thirst, G.stats.hunger);
    $('#vignette').style.opacity = low < 15 ? (1 - low / 15) * 0.9 : 0;
  }

  prompt(text) {
    const p = $('#prompt');
    if (!text) { p.classList.add('hidden'); this._prompt = null; return; }
    if (this._prompt !== text) { p.innerHTML = `<kbd>E</kbd> ${text}`; this._prompt = text; }
    p.classList.remove('hidden');
  }

  toast(html, kind = '') {
    const t = h('div', 'toast ' + kind, html);
    $('#toasts').append(t);
    setTimeout(() => t.classList.add('out'), 3400);
    setTimeout(() => t.remove(), 4000);
  }

  // Dialog mit Schreibmaschinen-Effekt; lines: [{who, text, radio}]
  say(lines) {
    return new Promise(res => {
      this._lines = lines.slice(); this._dialogResolve = res; this.dialogOpen = true;
      $('#dialog').classList.remove('hidden');
      this._showLine();
    });
  }
  _showLine() {
    const l = this._lines.shift();
    if (!l) { this._closedAt = performance.now(); this.dialogOpen = false; $('#dialog').classList.add('hidden'); const r = this._dialogResolve; this._dialogResolve = null; r && r(); return; }
    const d = $('#dialog');
    d.classList.toggle('radio', !!l.radio);
    d.querySelector('.who').textContent = l.who || '';
    d.querySelector('.portrait').innerHTML = l.who === 'Henrik' ? '<svg viewBox="0 0 48 48"><rect x="14" y="10" width="20" height="30" rx="4" fill="#333"/><rect x="28" y="2" width="3" height="10" fill="#333"/><rect x="17" y="14" width="14" height="8" fill="#6fcf97"/><circle cx="24" cy="31" r="5" fill="#555"/></svg>'
      : l.who === 'Jana' ? '<svg viewBox="0 0 48 48"><circle cx="24" cy="20" r="11" fill="#e0b08c"/><path d="M13 18a11 11 0 0122 0c0-6-5-10-11-10s-11 4-11 10z" fill="#4a2c1a"/><path d="M8 46c2-10 8-14 16-14s14 4 16 14z" fill="#e8742a"/></svg>' : '';
    const el = d.querySelector('.text');
    el.innerHTML = '';
    this._full = l.text; this._typing = true;
    let i = 0;
    clearInterval(this._ti);
    this._ti = setInterval(() => {
      i += 2;
      el.innerHTML = this._full.slice(0, i);
      if (i >= this._full.length) { clearInterval(this._ti); this._typing = false; }
    }, 16);
    this.onLine && this.onLine(l);
  }
  _advance() {
    if (!this.dialogOpen) return;
    if (this._typing) { clearInterval(this._ti); this._typing = false; $('#dialog .text').innerHTML = this._full; return; }
    this._showLine();
  }

  openModal(kind) {
    this.modalKind = kind;
    this.modal.className = 'm-' + kind;
    this.panel.className = 'panel';
    this.panel.innerHTML = '';
    if (document.pointerLockElement) document.exitPointerLock();
    return this.panel;
  }
  closeModal() { this._closedAt = performance.now(); this.modalKind = null; this.modal.className = 'hidden'; this.onModalClose && this.onModalClose(); }

  progress(label, secs) {
    return new Promise(res => {
      const p = $('#progress'); this.progressOpen = true;
      p.classList.remove('hidden'); p.querySelector('.lbl').textContent = label;
      const bar = p.querySelector('i'); bar.style.transition = 'none'; bar.style.width = '0%';
      requestAnimationFrame(() => { bar.style.transition = `width ${secs}s linear`; bar.style.width = '100%'; });
      setTimeout(() => { p.classList.add('hidden'); this.progressOpen = false; res(); }, secs * 1000);
    });
  }

  fade(black, ms = 800) {
    const f = $('#fade');
    f.style.transition = `opacity ${ms}ms`;
    f.style.opacity = black ? 1 : 0;
    f.style.pointerEvents = black ? 'all' : 'none';
    return new Promise(r => setTimeout(r, ms));
  }

  // Texttafeln (Intro, Zwischensequenzen)
  cards(list) {
    return new Promise(res => {
      const c = $('#cards'); c.classList.remove('hidden'); this.cardsOpen = true;
      const card = c.querySelector('.card');
      let i = 0, timer;
      const next = () => {
        clearTimeout(timer);
        if (i >= list.length) { c.classList.add('hidden'); this.cardsOpen = false; removeEventListener('keydown', key); c.onclick = null; res(); return; }
        card.classList.remove('in'); void card.offsetWidth;
        card.innerHTML = list[i++]; card.classList.add('in');
        timer = setTimeout(next, 6500);
      };
      const key = (e) => { if (e.code === 'Space' || e.code === 'Enter' || e.code === 'KeyE') { e.preventDefault(); next(); } };
      addEventListener('keydown', key); c.onclick = next;
      next();
    });
  }

  screen(html) {
    const s = $('#screen');
    if (html === null) { s.classList.add('hidden'); this.screenOpen = false; return s; }
    s.innerHTML = html; s.classList.remove('hidden'); this.screenOpen = true;
    return s;
  }

  // Rucksack mit Reitern
  openBag(G, game, tab = 'inv') {
    const p = this.openModal('bag');
    const tabs = [['inv', 'Inventar'], ['plan', 'Bauplan'], ['log', 'Logbuch'], ['docs', 'Dokumente'], ['map', 'Karte']];
    p.innerHTML = `<div class="bag-head"><h2>Rucksack</h2><div class="tabs">${tabs.map(([k, t]) => `<button data-t="${k}" class="${k === tab ? 'on' : ''}">${t}</button>`).join('')}</div><button class="x">✕</button></div><div class="bag-body"></div>`;
    p.querySelector('.x').onclick = () => this.closeModal();
    p.querySelectorAll('.tabs button').forEach(b => b.onclick = () => this.openBag(G, game, b.dataset.t));
    const body = p.querySelector('.bag-body');
    this.bagTab = tab;
    if (tab === 'inv') {
      const ids = Object.keys(G.inv).filter(k => G.inv[k] > 0);
      if (!ids.length) body.innerHTML = '<p class="empty">Noch leer. Sammle angespültes Strandgut ein!</p>';
      const grid = h('div', 'inv-grid'); const info = h('div', 'inv-info', '<p class="empty">Wähle einen Gegenstand.</p>');
      for (const id of ids) {
        const it = ITEMS[id];
        const b = h('button', 'slot', `${it.icon}${G.inv[id] > 1 ? `<span class="n">${G.inv[id]}</span>` : ''}`);
        b.title = it.name;
        b.onclick = () => {
          grid.querySelectorAll('.slot').forEach(x => x.classList.remove('sel')); b.classList.add('sel');
          info.innerHTML = `<div class="big">${it.icon}</div><h3>${it.name}</h3><p>${it.desc}</p>`;
          const act = game.itemAction(id);
          if (act) { const ab = h('button', 'btn primary', act.label); ab.onclick = () => { act.run(); this.openBag(G, game, 'inv'); }; info.append(ab); }
        };
        grid.append(b);
      }
      if (ids.length) { body.append(grid, info); }
    } else if (tab === 'plan') {
      body.innerHTML = game.bauplanHTML();
    } else if (tab === 'log') {
      const ids = G.log;
      body.innerHTML = ids.length ? `<div class="log-list">${ids.map(id => `<article><div class="lf">${LOG[id].lf}</div><h3>${LOG[id].title}</h3>${LOG[id].html}</article>`).join('')}</div>`
        : '<p class="empty">Hier landen deine Lerneinträge – nach jeder gelösten Aufgabe einer.</p>';
    } else if (tab === 'docs') {
      const list = h('div', 'doc-list'), view = h('div', 'doc-view', '<p class="empty">Wähle ein Dokument.</p>');
      if (!G.docs.length) body.innerHTML = '<p class="empty">Noch keine Dokumente gefunden.</p>';
      for (const id of G.docs) {
        const b = h('button', 'doc-btn', DOCS[id].title);
        b.onclick = () => { list.querySelectorAll('button').forEach(x => x.classList.remove('sel')); b.classList.add('sel'); view.innerHTML = `<h3>${DOCS[id].title}</h3>${id === 'bauplan' ? game.bauplanHTML(true) : DOCS[id].html}`; };
        list.append(b);
      }
      if (G.docs.length) { body.append(list, view); list.lastChild.click(); }
    } else if (tab === 'map') {
      body.append(this.mapCanvas(G, game));
    }
  }

  mapCanvas(G, game) {
    const S = 520, ext = 280;
    const c = document.createElement('canvas'); c.width = c.height = S; c.className = 'map';
    const g = c.getContext('2d');
    if (!this._mapImg) {
      const img = g.createImageData(S, S);
      for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) {
        const x = (i / S - 0.5) * ext, z = (j / S - 0.5) * ext, hh = heightAt(x, z);
        let r, gg, b;
        if (hh < -6) [r, gg, b] = [24, 70, 110]; else if (hh < 0) [r, gg, b] = [40 + (hh + 6) * 10, 120 + (hh + 6) * 14, 150 + (hh + 6) * 8];
        else if (hh < 1.8) [r, gg, b] = [226, 208, 160]; else { const k = Math.min(1, hh / 26); [r, gg, b] = [80 - k * 10 + k * 60, 130 - k * 20, 60 + k * 40]; }
        const shade = (heightAt(x - 1, z - 1) - hh) * 8;
        const o = (j * S + i) * 4; img.data[o] = r + shade; img.data[o + 1] = gg + shade; img.data[o + 2] = b + shade; img.data[o + 3] = 255;
      }
      this._mapImg = img;
    }
    g.putImageData(this._mapImg, 0, 0);
    const tp = (x, z) => [(x / ext + 0.5) * S, (z / ext + 0.5) * S];
    g.font = '600 13px system-ui, sans-serif'; g.textAlign = 'center';
    for (const m of game.mapMarkers()) {
      const [px, py] = tp(m.x, m.z);
      g.fillStyle = m.color || '#fff'; g.beginPath(); g.arc(px, py, m.goal ? 7 : 5, 0, 7); g.fill();
      if (m.goal) { g.strokeStyle = '#fff'; g.lineWidth = 2; g.stroke(); }
      g.fillStyle = 'rgba(0,0,0,.6)'; g.fillText(m.label, px + 1, py - 9); g.fillStyle = '#fff'; g.fillText(m.label, px, py - 10);
    }
    const [px, py] = tp(game.playerPos().x, game.playerPos().z);
    g.save(); g.translate(px, py); g.rotate(-game.playerPos().facing + Math.PI);
    g.fillStyle = '#ff6a2a'; g.strokeStyle = '#fff'; g.lineWidth = 2;
    g.beginPath(); g.moveTo(0, -10); g.lineTo(7, 8); g.lineTo(0, 4); g.lineTo(-7, 8); g.closePath(); g.fill(); g.stroke(); g.restore();
    g.fillStyle = '#fff'; g.font = 'bold 16px system-ui'; g.fillText('N', S - 24, 28); g.fillText('↑', S - 24, 46);
    return c;
  }
}
