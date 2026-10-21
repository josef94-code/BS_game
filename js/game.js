'use strict';
// ------------------------------------------------------------
//  Engine: Zustand, Spielschleife, Steuerung, UI
// ------------------------------------------------------------
const FIXES = [
  { id: 'licht', name: 'Hallenbeleuchtung' },
  { id: 'halterung', name: 'Motorhalterung' },
  { id: 'getriebe', name: 'Bandgetriebe' },
  { id: 'kompressor', name: 'Hauptkompressor' },
  { id: 'presse', name: 'Pneumatik-Presse' },
  { id: 'leitung', name: 'Steuerleitung Band' },
  { id: 'meldung', name: 'Meldeleuchte' },
  { id: 'steuerung', name: 'Bandsteuerung' },
  { id: 'ofen', name: 'Trockenofen' },
];

let G = null; // Spielzustand (wird gespeichert)

function newState() {
  return {
    room: 'umkleide', u: 0.5, v: 0.8, dir: 'U',
    inv: [], files: [], notes: [], flags: {}, hp: 100,
    mainSwitch: 'on', // 'on' | 'off' | 'locked'
    mistakes: 0, heals: 0, zaps: 0, time: 0, hints: {}, talk: {}, ver: 0,
  };
}

const $ = (s) => document.querySelector(s);
const canvas = $('#screen');
const ctx = canvas.getContext('2d');
const light = document.createElement('canvas'); light.width = W; light.height = H;
const lctx = light.getContext('2d');

const Game = {
  mode: 'title',
  t: 0,
  keys: {},
  bgCache: {},
  dialogQ: [], dialogCb: null, typing: null,
  choiceSel: 0, choiceOpts: null,
  trans: null,
  flash: 0, hurtFlash: 0,
  stepT: 0, phase: 0, moving: false,
  ambT: 5,
  shadow: null,
  hot: null,

  // ---------- Zustand-Helfer ----------
  has(id) { return G.inv.includes(id); },
  give(id, silent) {
    if (ITEMS[id].stack || !G.inv.includes(id)) G.inv.push(id);
    G.ver++;
    if (!silent) { Snd.play('pickup'); this.toast('Erhalten: ' + ITEMS[id].name); }
  },
  take(id) { const i = G.inv.indexOf(id); if (i >= 0) G.inv.splice(i, 1); G.ver++; },
  flag(k) { return !!G.flags[k]; },
  set(k, v) { G.flags[k] = (v === undefined ? true : v); G.ver++; },
  addFile(id, open) {
    if (!G.files.includes(id)) { G.files.push(id); this.toast('Dokument: ' + FILES[id].title); }
    if (open !== false) this.readFile(id);
  },
  fixed(id) { return !!G.flags['fix_' + id]; },
  lernen(id) {
    if (!G.notes.includes(id)) { G.notes.push(id); setTimeout(() => this.toast('Berichtsheft: neuer Eintrag „' + BERICHT[id].title + '“'), 900); }
  },
  fixCount() { return FIXES.filter(f => this.fixed(f.id)).length; },
  restore() { return this.flag('ending') ? 1 : this.fixCount() / FIXES.length; },
  hallLight() { return this.fixed('licht') && G.mainSwitch === 'on'; },
  fix(id, cb) {
    G.flags['fix_' + id] = true; G.ver++;
    Snd.play('fix'); this.flash = 1;
    const f = FIXES.find(x => x.id === id);
    this.toast('REPARIERT: ' + f.name + '  —  Produktion ' + Math.round(this.restore() * 100) + ' %', 4);
    Snd.setMood(this.restore(), false);
    if (this.save()) setTimeout(() => this.toast('Fortschritt automatisch gespeichert.'), 1800);
    if (cb) cb();
  },
  mistake() { G.mistakes++; },
  clock() {
    // 22:14 Uhr + 55 min je Reparatur + Spielzeit (1 Spielminute je 8 s)
    let m = 22 * 60 + 14 + this.fixCount() * 38 + Math.floor(G.time / 8);
    if (!this.flag('ending')) m = Math.min(m, 24 * 60 + 5 * 60 + 40);
    else m = 24 * 60 + 5 * 60 + 58;
    m %= 1440;
    return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
  },

  hurt(n, why) {
    G.hp = Math.max(0, G.hp - n); G.ver++;
    this.hurtFlash = 1; Snd.play('hurt');
    canvas.parentElement.classList.add('shake'); setTimeout(() => canvas.parentElement.classList.remove('shake'), 400);
    if (G.hp <= 0) { setTimeout(() => this.gameOver(why), 600); return true; }
    return false;
  },
  heal() {
    if (G.hp >= 100) { this.toast('Dir geht’s gut. Spar dir das Verbandpäckchen.'); return false; }
    G.hp = Math.min(100, G.hp + 45); G.heals++; this.take('verband'); Snd.play('ok');
    this.toast('Wunde versorgt. Zustand: ' + this.condition().t); return true;
  },
  condition() {
    if (G.hp > 66) return { t: 'OK', c: '#4c4' };
    if (G.hp > 33) return { t: 'VORSICHT', c: '#dc3' };
    return { t: 'GEFAHR', c: '#d33' };
  },

  // ---------- Dialog ----------
  say(lines, cb) {
    if (!Array.isArray(lines)) lines = [lines];
    this.dialogQ = lines.slice(); this.dialogCb = cb || null;
    this.prevMode = this.mode === 'dialog' ? this.prevMode : this.mode;
    this.mode = 'dialog';
    $('#dialog').classList.remove('hidden');
    this.nextLine();
  },
  nextLine() {
    if (!this.dialogQ.length) {
      $('#dialog').classList.add('hidden');
      this.mode = 'play';
      const cb = this.dialogCb; this.dialogCb = null;
      if (cb) cb();
      return;
    }
    let l = this.dialogQ.shift();
    let who = '', txt = l;
    if (Array.isArray(l)) { who = l[0]; txt = l[1]; }
    $('#dialog .who').textContent = who;
    $('#dialog .who').style.display = who ? 'block' : 'none';
    $('#dialog').classList.toggle('narr', !who);
    this.typing = { full: txt, i: 0, el: $('#dialog .text') };
    this.typing.el.innerHTML = '';
  },
  advanceDialog() {
    if (this.typing && this.typing.i < this.typing.full.length) { this.typing.i = this.typing.full.length; this.typing.el.innerHTML = this.typing.full; return; }
    Snd.play('select');
    this.nextLine();
  },

  ask(question, opts, who) {
    // opts: [{t:'Text', f:()=>{}}]
    const box = $('#choices');
    this.choiceOpts = opts; this.choiceSel = 0;
    box.innerHTML = (question ? `<div class="q">${who ? '<span class="whoq">' + who + ':</span> ' : ''}${question}</div>` : '') +
      opts.map((o, i) => `<div class="opt" data-i="${i}">${o.t}</div>`).join('');
    box.classList.remove('hidden');
    this.mode = 'choice';
    box.querySelectorAll('.opt').forEach(el => {
      el.addEventListener('click', () => this.pickChoice(+el.dataset.i));
      el.addEventListener('mouseenter', () => { this.choiceSel = +el.dataset.i; this.renderChoice(); });
    });
    this.renderChoice();
  },
  renderChoice() { $('#choices').querySelectorAll('.opt').forEach((el, i) => el.classList.toggle('sel', i === this.choiceSel)); },
  pickChoice(i) {
    const o = this.choiceOpts[i];
    $('#choices').classList.add('hidden');
    this.mode = 'play'; this.choiceOpts = null;
    Snd.play('select');
    if (o && o.f) o.f();
  },

  toast(msg, secs) {
    const el = $('#toast');
    const d = document.createElement('div'); d.className = 'toastmsg'; d.textContent = msg;
    el.appendChild(d);
    while (el.children.length > 4) el.firstChild.remove();
    setTimeout(() => d.classList.add('out'), (secs || 2.6) * 1000);
    setTimeout(() => d.remove(), (secs || 2.6) * 1000 + 600);
  },

  // ---------- Modal (Rätsel, Dokumente) ----------
  modal(html, opts) {
    opts = opts || {};
    const m = $('#modal'), p = $('#modal .panel');
    p.className = 'panel ' + (opts.cls || '');
    p.innerHTML = html + (opts.noClose ? '' : `<button class="btn close-x" title="Schließen (Esc)">✕</button>`);
    m.classList.remove('hidden');
    this.modalPrev = this.mode;
    this.mode = 'modal';
    this.modalOnClose = opts.onClose || null;
    const cx = p.querySelector('.close-x'); if (cx) cx.onclick = () => this.closeModal();
    p.scrollTop = 0;
    return p;
  },
  closeModal(silent) {
    if (this.mode !== 'modal') return;
    $('#modal').classList.add('hidden');
    this.mode = 'play';
    const cb = this.modalOnClose; this.modalOnClose = null;
    if (!silent) Snd.play('select');
    if (cb) cb();
  },
  readFile(id, back) {
    const f = FILES[id];
    this.modal(`<div class="doc"><h2>${f.title}</h2>${f.html}</div><div class="row"><button class="btn ok">Zurück</button></div>`, { cls: 'paper', onClose: back });
    $('#modal .ok').onclick = () => this.closeModal();
  },
  puzzle(name) { PUZZLES[name](); },

  // ---------- Raumwechsel ----------
  goto(room, u, v, dir, noDoor) {
    if (noDoor) { this.enter(room, u, v, dir); return; }
    this.mode = 'trans';
    this.trans = { t: 0, room, u, v, dir, switched: false };
    Snd.play('door');
  },
  enter(room, u, v, dir) {
    G.room = room; G.u = u; G.v = v; G.dir = dir || G.dir;
    const R = ROOMS[room];
    this.unstick(R);
    $('#roomname').textContent = R.name;
    $('#roomname').classList.remove('show'); void $('#roomname').offsetWidth; $('#roomname').classList.add('show');
    if (R.onEnter) R.onEnter();
  },

  // ---------- Speichern ----------
  save(slot) { return Saves.save(slot === undefined ? 'auto' : slot); },
  toTitle() {
    ['#dialog', '#choices', '#inventory', '#modal'].forEach(q => $(q).classList.add('hidden'));
    G = null; this.mode = 'title'; this.shadow = null; this.keys = {};
    $('#prompt').innerHTML = ''; $('#prompt').dataset.t = '';
    $('#roomname').classList.remove('show'); $('#toast').innerHTML = '';
    $('#title').classList.remove('hidden');
    TitleMenu.show('profile');
  },

  // ---------- Start / Ende ----------
  // state: geladener Spielstand oder null für ein neues Spiel
  start(state) {
    Snd.init();
    const load = !!state;
    G = load ? Object.assign(newState(), JSON.parse(JSON.stringify(state))) : newState();
    ['#dialog', '#choices', '#inventory', '#modal'].forEach(q => $(q).classList.add('hidden'));
    this.shadow = null;
    $('#title').classList.add('hidden');
    this.bgCache = {};
    this.enter(G.room, G.u, G.v, G.dir);
    this.mode = 'play';
    Snd.setMood(this.restore(), this.flag('ending'));
    if (!load) {
      this.say([
        'Samstag, 22:14 Uhr. Werk Kessler, Halle 3.',
        'Dein erster Tag als Azubi zum Mechatroniker – und man schickt dich in die Nachtschicht.',
        'Draußen regnet es. Drinnen riecht es nach Altöl, kaltem Rauch und Rost.',
        'Der Meister hat gesagt, er hinterlässt dir etwas in deinem Spind. Nummer 17.',
      ]);
    } else this.toast('Spielstand geladen.');
  },
  gameOver(why) {
    this.mode = 'modal';
    Snd.play('sting');
    const p = this.modal(`<div class="gameover"><h1>ARBEITSUNFALL</h1><p>${why || 'Du bist schwer verletzt.'}</p>
      <p class="note">Merke: Sicherheit geht vor. Jeder Unfall ist einer zu viel.</p>
      <div class="row">${Saves.latest() ? '<button class="btn ld">Letzten Spielstand laden</button>' : ''}<button class="btn nw">Neu beginnen</button><button class="btn tt">Titelmenü</button></div></div>`, { noClose: true, cls: 'dark' });
    const ld = p.querySelector('.ld'); if (ld) ld.onclick = () => this.start(Saves.latest().state);
    p.querySelector('.nw').onclick = () => this.start(null);
    p.querySelector('.tt').onclick = () => this.toTitle();
  },

  // ---------- Inventar ----------
  openInv(tab) {
    if (this.mode !== 'play') return;
    this.mode = 'inv'; this.invTab = tab || this.invTab || 'items'; this.invSel = 0; this.combine = null;
    $('#inventory').classList.remove('hidden');
    Snd.play('select');
    this.renderInv();
  },
  closeInv() { $('#inventory').classList.add('hidden'); this.mode = 'play'; Snd.play('select'); },
  renderInv() {
    const el = $('#inventory');
    const cond = this.condition();
    const tabs = [['items', 'Gegenstände'], ['files', 'Dokumente'], ['notes', 'Berichtsheft'], ['map', 'Karte'], ['status', 'Produktion']];
    let body = '';
    if (this.invTab === 'items') {
      const sel = G.inv[this.invSel];
      body = `<div class="grid">${Array.from({ length: Math.max(12, G.inv.length) }, (_, i) => {
        const id = G.inv[i];
        return `<div class="slot ${i === this.invSel ? 'sel' : ''} ${this.combine === id && id ? 'comb' : ''}" data-i="${i}">${id ? `<canvas width="48" height="48" data-icon="${id}"></canvas>` : ''}</div>`;
      }).join('')}</div>
      <div class="desc">${sel ? `<h3>${ITEMS[sel].name}</h3><p>${ITEMS[sel].desc}</p>
        <div class="row">${ITEMS[sel].use ? '<button class="btn use">Benutzen</button>' : ''}<button class="btn comb">${this.combine ? 'Kombinieren mit …' : 'Kombinieren'}</button></div>
        ${this.combine ? `<p class="note">Wähle einen zweiten Gegenstand, um ihn mit „${ITEMS[this.combine].name}“ zu kombinieren.</p>` : ''}` : '<p class="note">Leerer Platz.</p>'}</div>`;
    } else if (this.invTab === 'files') {
      body = `<div class="files">${G.files.length ? G.files.map(f => `<div class="file" data-f="${f}">📄 ${FILES[f].title}</div>`).join('') : '<p class="note">Noch keine Dokumente gefunden.</p>'}</div>`;
    } else if (this.invTab === 'notes') {
      body = `<div class="files">${G.notes.length ? '<p class="note">Was du heute Nacht gelernt hast – zum Nachlesen und Wiederholen:</p>' + G.notes.map(n => `<div class="file" data-n="${n}">✎ ${BERICHT[n].title}</div>`).join('') : '<p class="note">Noch keine Einträge. Nach jeder gelösten Aufgabe schreibst du hier auf, was du gelernt hast.</p>'}</div>`;
    } else if (this.invTab === 'map') {
      body = this.mapSvg();
    } else {
      body = `<div class="prod"><p>Produktionsbereitschaft: <b>${Math.round(this.restore() * 100)} %</b></p>
        ${FIXES.map(f => `<div class="pf ${this.fixed(f.id) ? 'ok' : ''}"><span class="lamp"></span>${f.name}</div>`).join('')}
        <p class="note">Hauptschalter Halle: <b>${{ on: 'EIN', off: 'AUS (nicht gesichert!)', locked: 'AUS + Schloss' }[G.mainSwitch]}</b><br>
        Fehler bisher: ${G.mistakes} · Verbandpäckchen benutzt: ${G.heals}</p></div>`;
    }
    el.innerHTML = `<div class="invhead"><div class="tabs">${tabs.map(t => `<div class="tab ${t[0] === this.invTab ? 'act' : ''}" data-t="${t[0]}">${t[1]}</div>`).join('')}</div>
      <div class="stat"><canvas id="ecg" width="120" height="30"></canvas><div class="cond" style="color:${cond.c}">${cond.t}</div><div class="clock">${this.clock()} Uhr</div></div></div>
      <div class="invbody">${body}</div><div class="invfoot">I / Esc: schließen · Pfeiltasten: wählen · E: Aktion</div>`;
    el.querySelectorAll('canvas[data-icon]').forEach(c => drawIcon(c.getContext('2d'), c.dataset.icon));
    el.querySelectorAll('.tab').forEach(t => t.onclick = () => { this.invTab = t.dataset.t; this.combine = null; Snd.play('select'); this.renderInv(); });
    el.querySelectorAll('.slot').forEach(s => s.onclick = () => { this.invSel = +s.dataset.i; this.slotAction(false); });
    el.querySelectorAll('.file[data-f]').forEach(f => f.onclick = () => this.readFileFromInv(f.dataset.f));
    el.querySelectorAll('.file[data-n]').forEach(f => f.onclick = () => this.readNote(f.dataset.n));
    const u = el.querySelector('.use'); if (u) u.onclick = () => this.useItem();
    const cb = el.querySelector('.comb'); if (cb) cb.onclick = () => { this.combine = this.combine ? null : G.inv[this.invSel]; Snd.play('select'); this.renderInv(); };
  },
  slotAction(fromKey) {
    const id = G.inv[this.invSel];
    if (this.combine && id && id !== this.combine) { this.doCombine(this.combine, id); return; }
    Snd.play('select'); this.renderInv();
  },
  readFileFromInv(f) {
    $('#inventory').classList.add('hidden');
    this.mode = 'play';
    this.readFile(f, () => { this.openInv('files'); });
  },
  readNote(n) {
    $('#inventory').classList.add('hidden');
    this.mode = 'play';
    const b = BERICHT[n];
    this.modal(`<div class="doc"><h2>Berichtsheft: ${b.title}</h2>${b.html}</div><div class="row"><button class="btn ok">Zurück</button></div>`, { cls: 'paper heft', onClose: () => this.openInv('notes') });
    $('#modal .ok').onclick = () => this.closeModal();
  },
  useItem() {
    const id = G.inv[this.invSel];
    if (ITEMS[id] && ITEMS[id].use === 'heal') { this.heal(); this.invSel = Math.min(this.invSel, G.inv.length - 1); this.renderInv(); }
  },
  doCombine(a, b) {
    this.combine = null;
    const pair = (x, y) => (a === x && b === y) || (a === y && b === x);
    if (pair('windeisen', 'gewindebohrer')) {
      this.take('windeisen'); this.take('gewindebohrer'); this.give('gewindeschneider', true);
      Snd.play('ok'); this.toast('Kombiniert: ' + ITEMS.gewindeschneider.name);
      this.invSel = G.inv.indexOf('gewindeschneider'); this.renderInv(); return;
    }
    if (pair('gewindeschneider', 'platte_gebohrt') || pair('gewindebohrer', 'platte_gebohrt')) {
      if (!this.has('gewindeschneider')) { Snd.play('err'); this.toast('Den Gewindebohrer kannst du nicht mit bloßen Händen drehen. Du brauchst ein Windeisen.'); this.renderInv(); return; }
      $('#inventory').classList.add('hidden'); this.mode = 'play';
      if (G.room !== 'werkstatt') { this.say('Dafür brauchst du einen Schraubstock. In der Werkstatt steht einer an der Werkbank.'); return; }
      this.puzzle('gewinde'); return;
    }
    if (pair('gewindeschneider', 'platte') || pair('windeisen', 'platte')) { Snd.play('err'); this.toast('Erst muss ein neues Kernloch gebohrt werden – das alte Gewinde ist völlig zerfetzt.'); this.renderInv(); return; }
    Snd.play('err'); this.toast('Das passt nicht zusammen.'); this.renderInv();
  },
  mapSvg() {
    const rooms = [
      ['werkstatt', 'Werkstatt', 20, 20, 120, 70], ['halle', 'Halle 3', 150, 20, 200, 150], ['lager', 'Lager', 360, 20, 120, 70],
      ['umkleide', 'Umkleide', 20, 100, 120, 70], ['schaltraum', 'Schaltraum', 190, -40, 90, 50], ['buero', 'Meisterbüro', 360, 100, 120, 70],
      ['keller', 'Kellergang', 150, 200, 200, 40], ['ewerkstatt', 'E-Werkstatt', 20, 190, 120, 60], ['kompressor', 'Kompressor', 360, 190, 120, 60], ['hausmeister', 'Hausmeister', 205, 250, 90, 40],
    ];
    const known = r => G.flags['seen_' + r] || r === G.room;
    return `<svg class="map" viewBox="0 -50 500 350">${rooms.map(([id, n, x, y, w, h]) => known(id) ? `<rect x="${x}" y="${y}" width="${w}" height="${h}" class="${id === G.room ? 'cur' : ''}"/><text x="${x + w / 2}" y="${y + h / 2 + 4}">${n}</text>` : `<rect x="${x}" y="${y}" width="${w}" height="${h}" class="unk"/><text x="${x + w / 2}" y="${y + h / 2 + 4}">?</text>`).join('')}
      <line x1="140" y1="55" x2="150" y2="55"/><line x1="140" y1="135" x2="150" y2="135"/><line x1="350" y1="55" x2="360" y2="55"/><line x1="350" y1="135" x2="360" y2="135"/><line x1="235" y1="10" x2="235" y2="20"/>${known('keller') ? '<line x1="300" y1="170" x2="300" y2="200"/><line x1="140" y1="220" x2="150" y2="220"/><line x1="350" y1="220" x2="360" y2="220"/><line x1="250" y1="240" x2="250" y2="250"/>' : ''}</svg>
      <p class="note center">Du bist hier: <b>${ROOMS[G.room].name}</b></p>`;
  },

  drawEcg() {
    const c = document.getElementById('ecg'); if (!c) return;
    const g = c.getContext('2d'), w = c.width, h = c.height;
    const cond = this.condition(), speed = G.hp > 66 ? 1 : G.hp > 33 ? 1.5 : 2.2;
    g.fillStyle = '#050805'; g.fillRect(0, 0, w, h);
    g.strokeStyle = cond.c; g.lineWidth = 1.5; g.beginPath();
    for (let x = 0; x < w; x++) {
      const ph = ((x / w) * 2 - this.t * speed) % 1, p = ph < 0 ? ph + 1 : ph;
      let y = 0;
      if (p > 0.40 && p < 0.44) y = -3; else if (p > 0.47 && p < 0.5) y = 11; else if (p >= 0.5 && p < 0.53) y = -10; else if (p > 0.6 && p < 0.68) y = 3;
      if (x === 0) g.moveTo(x, h / 2 - y); else g.lineTo(x, h / 2 - y);
    }
    g.stroke();
  },

  // ---------- Eingabe ----------
  action() {
    if (this.mode === 'dialog') { this.advanceDialog(); return; }
    if (this.mode === 'choice') { this.pickChoice(this.choiceSel); return; }
    if (this.mode === 'trans') return;
    if (this.mode === 'inv') {
      if (this.invTab === 'items') { if (this.combine) this.slotAction(true); else if (G.inv[this.invSel] && ITEMS[G.inv[this.invSel]].use) this.useItem(); }
      else if (this.invTab === 'files' && G.files.length) this.readFileFromInv(G.files[this.invSel] || G.files[0]);
      else if (this.invTab === 'notes' && G.notes.length) this.readNote(G.notes[this.invSel] || G.notes[0]);
      return;
    }
    if (this.mode === 'play' && this.hot) {
      const h = this.hot;
      G.dir = this.faceTo(h);
      if (h.npc) h.npc.talk(); else if (h.use) h.use();
    }
  },
  faceTo(h) {
    const R = ROOMS[G.room];
    const p = proj(R, G.u, G.v), q = proj(R, h.u, h.v);
    const dx = q.x - p.x, dy = q.y - p.y;
    if (Math.abs(dx) > Math.abs(dy) * 1.4) return dx < 0 ? 'L' : 'R';
    return dy < 0 ? 'U' : 'D';
  },
  onKey(e, down) {
    const k = e.key.toLowerCase();
    const tag = e.target && e.target.tagName;
    if ((tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') && k !== 'escape') return;
    const map ={ arrowleft: 'l', a: 'l', arrowright: 'r', d: 'r', arrowup: 'u', w: 'u', arrowdown: 'dn', s: 'dn', shift: 'run' };
    if (map[k]) { this.keys[map[k]] = down; if (this.mode !== 'play') e.preventDefault(); }
    if (!down) return;
    if (this.mode === 'title') { if ((k === 'enter' || k === ' ') && TitleMenu.screen === 'main') { $('#title .menu .btn').click(); } return; }
    if (k === 'm') { const mu = Snd.toggleMute(); this.toast(mu ? 'Ton aus' : 'Ton an'); return; }
    if (this.mode === 'choice') {
      if (map[k] === 'u') { this.choiceSel = (this.choiceSel + this.choiceOpts.length - 1) % this.choiceOpts.length; this.renderChoice(); Snd.play('select'); }
      if (map[k] === 'dn') { this.choiceSel = (this.choiceSel + 1) % this.choiceOpts.length; this.renderChoice(); Snd.play('select'); }
    }
    if (this.mode === 'inv') {
      const n = this.invTab === 'items' ? Math.max(12, G.inv.length) : this.invTab === 'notes' ? G.notes.length : G.files.length;
      if (map[k] === 'l') { this.invSel = Math.max(0, this.invSel - 1); this.renderInv(); }
      if (map[k] === 'r') { this.invSel = Math.min(n - 1, this.invSel + 1); this.renderInv(); }
      if (map[k] === 'u') { this.invSel = Math.max(0, this.invSel - 6); this.renderInv(); }
      if (map[k] === 'dn') { this.invSel = Math.min(n - 1, this.invSel + 6); this.renderInv(); }
      if (k === 'tab') { e.preventDefault(); const ts = ['items', 'files', 'notes', 'map', 'status']; this.invTab = ts[(ts.indexOf(this.invTab) + 1) % ts.length]; this.invSel = 0; this.renderInv(); }
    }
    if (k === 'e' || k === ' ' || k === 'enter') {
      if (this.mode === 'modal') return; // Formulare im Modal nicht stören
      e.preventDefault(); this.action(); return;
    }
    if (k === 'i' || (k === 'tab' && this.mode === 'play')) {
      e.preventDefault();
      if (this.mode === 'play') this.openInv(); else if (this.mode === 'inv') this.closeInv();
      return;
    }
    if (k === 'escape') {
      if (this.mode === 'inv') this.closeInv();
      else if (this.mode === 'modal') { const p = $('#modal .panel'); if (p.querySelector('.close-x')) this.closeModal(); }
    }
  },

  // ---------- Update ----------
  update(dt) {
    this.t += dt;
    if (this.flash > 0) this.flash = Math.max(0, this.flash - dt * 1.5);
    if (this.hurtFlash > 0) this.hurtFlash = Math.max(0, this.hurtFlash - dt * 2);
    if (this.typing && this.typing.i < this.typing.full.length) {
      const before = Math.floor(this.typing.i);
      this.typing.i = Math.min(this.typing.full.length, this.typing.i + dt * 70);
      if (Math.floor(this.typing.i) !== before) {
        this.typing.el.innerHTML = this.typing.full.slice(0, Math.floor(this.typing.i));
        if (Math.floor(this.typing.i) % 3 === 0) Snd.play('type');
      }
    }
    if (this.mode === 'trans') {
      const tr = this.trans; tr.t += dt;
      if (!tr.switched && tr.t > 0.9) { tr.switched = true; this.enter(tr.room, tr.u, tr.v, tr.dir); }
      if (tr.t > 1.9) { this.trans = null; this.mode = 'play'; }
      return;
    }
    if (this.mode === 'inv') this.drawEcg();
    if (this.mode === 'title' || !G) return;
    if (this.mode !== 'end') G.time += dt;
    const R = ROOMS[G.room];
    G.flags['seen_' + G.room] = true;
    if (this.mode === 'play') this.move(dt, R);
    else this.moving = false;
    if (R.update) R.update(dt);
    // Atmosphäre
    this.ambT -= dt;
    if (this.ambT <= 0) {
      const r = this.restore();
      this.ambT = 5 + Math.random() * 9 + r * 8;
      if (Math.random() > r * 0.9) Snd.play(['clank', 'drip', 'drip', 'creak', 'clank'][Math.floor(Math.random() * 5)]);
    }
    if (G.hp <= 33 && Math.floor(this.t * 1.1) !== Math.floor((this.t - dt) * 1.1)) Snd.play('heartbeat');
    // Hotspot finden
    this.hot = null;
    if (this.mode === 'play') this.findHot(R);
    const pr = $('#prompt');
    const txt = this.hot ? (this.hot.npc ? 'Reden: ' + this.hot.npc.name : this.hot.label) : '';
    if (pr.dataset.t !== txt) { pr.dataset.t = txt; pr.innerHTML = txt ? `<span class="key">E</span> ${txt}` : ''; }
  },
  move(dt, R) {
    let dx = 0, dy = 0;
    if (this.keys.l) dx -= 1; if (this.keys.r) dx += 1;
    if (this.keys.u) dy -= 1; if (this.keys.dn) dy += 1;
    this.moving = !!(dx || dy);
    if (!this.moving) return;
    if (dx && dy) { dx *= 0.75; dy *= 0.75; }
    if (Math.abs(dx) >= Math.abs(dy)) G.dir = dx < 0 ? 'L' : 'R'; else G.dir = dy < 0 ? 'U' : 'D';
    const f = R.floor, p = proj(R, G.u, G.v);
    const run = this.keys.run ? 1.75 : 1;
    const px = 62 * p.s * run * dt;
    const rowW = lerp(f.xbr, f.xfr, G.v) - lerp(f.xbl, f.xfl, G.v);
    const nu = G.u + dx * px / rowW;
    const nv = G.v + dy * px * 0.85 / (f.yf - f.yb);
    if (this.free(R, nu, G.v)) G.u = nu;
    if (this.free(R, G.u, nv)) G.v = nv;
    this.phase += dt * 11 * run;
    this.stepT -= dt * run;
    if (this.stepT <= 0) { this.stepT = 0.32; Snd.play('step'); }
    // Ausgang an der Vorderkante
    const e = R.frontExit;
    if (e && G.v >= R.walk.v1 - 0.005 && dy > 0 && (e.u0 === undefined || (G.u >= e.u0 && G.u <= e.u1))) {
      const msg = e.lock && e.lock();
      if (msg) { G.v -= 0.04; this.keys = {}; this.say(msg); }
      else this.goto(e.room, e.u, e.v, e.dir);
    }
  },
  // Falls die Figur in einem Hindernis steht: nächste freie Stelle suchen
  unstick(R) {
    if (this.free(R, G.u, G.v)) return;
    for (let d = 0.01; d < 0.5; d += 0.01) {
      for (let a = 0; a < 16; a++) {
        const u = G.u + Math.cos(a / 16 * Math.PI * 2) * d, v = G.v + Math.sin(a / 16 * Math.PI * 2) * d;
        if (this.free(R, u, v)) { G.u = u; G.v = v; return; }
      }
    }
  },
  free(R, u, v) {
    const w = R.walk;
    if (u < w.u0 || u > w.u1 || v < w.v0 || v > w.v1) return false;
    for (const b of (R.blockers || [])) if (u > b.u0 && u < b.u1 && v > b.v0 && v < b.v1) return false;
    for (const n of this.npcs(R)) if (n.block !== false && Math.abs(u - n.u) < 0.035 && Math.abs(v - n.v) < 0.05) return false;
    return true;
  },
  npcs(R) { return R.npcs ? R.npcs().filter(Boolean) : []; },
  findHot(R) {
    const p = proj(R, G.u, G.v);
    let best = null, bd = 1e9;
    const list = (R.hotspots || []).filter(h => !h.when || h.when());
    for (const n of this.npcs(R)) if (n.talk) list.push({ u: n.u, v: n.v, r: n.r || 30, npc: n });
    for (const h of list) {
      const q = proj(R, h.u, h.v);
      const d = Math.hypot(q.x - p.x, (q.y - p.y) * 1.6);
      if (d < (h.r || 26) * p.s * 1.2 && d < bd) { bd = d; best = h; }
    }
    this.hot = best;
  },

  // ---------- Rendern ----------
  vis() { return { r: this.restore(), hall: this.hallLight(), main: G.mainSwitch, end: this.flag('ending'), t: this.t }; },
  render() {
    if (!G) { this.renderTitleBg(); return; }
    if (this.mode === 'trans') { this.renderDoor(); return; }
    const R = ROOMS[G.room];
    const st = this.vis();
    const key = G.room + '|' + G.ver;
    let bg = this.bgCache[key];
    if (!bg) {
      for (const k in this.bgCache) if (k.startsWith(G.room + '|')) delete this.bgCache[k];
      bg = document.createElement('canvas'); bg.width = W; bg.height = H;
      R.drawBg(bg.getContext('2d'), st);
      this.bgCache[key] = bg;
    }
    ctx.drawImage(bg, 0, 0);
    if (R.drawFx) R.drawFx(ctx, st, this.t);
    // Tiefensortierung: Requisiten + Figuren
    const drawables = [];
    for (const pr of (R.props || [])) if (!pr.when || pr.when()) drawables.push({ v: pr.v, d: () => pr.draw(ctx, st, this.t) });
    for (const n of this.npcs(R)) drawables.push({ v: n.v, d: () => { const q = proj(R, n.u, n.v); person(ctx, q.x, q.y, q.s, n.look, n.dir || 'D', this.t * 2 + (n.u * 10), false, n.alpha); if (n.fx) n.fx(ctx, q, this.t); } });
    const pp = proj(R, G.u, G.v);
    drawables.push({ v: G.v, d: () => person(ctx, pp.x, pp.y, pp.s, LOOKS.azubi, G.dir, this.phase, this.moving) });
    drawables.sort((a, b) => a.v - b.v).forEach(d => d.d());
    if (R.drawFront) R.drawFront(ctx, st, this.t);
    // Glitzern bei aufhebbaren Dingen
    for (const h of (R.hotspots || [])) if (h.glint && (!h.when || h.when()) && h.glint()) {
      const q = proj(R, h.u, h.v); const gy = q.y - (h.gh || 20) * q.s;
      const a = (Math.sin(this.t * 4 + h.u * 9) + 1) / 2;
      ctx.fillStyle = `rgba(255,250,200,${0.25 + a * 0.6})`;
      ctx.fillRect(q.x - 0.5, gy - 3, 1, 7); ctx.fillRect(q.x - 3, gy - 0.5, 7, 1);
    }
    this.renderLight(R, st, pp);
    // Körnung, Vignette, Effekte
    ctx.globalAlpha = 0.5 + (1 - st.r) * 0.5;
    ctx.drawImage(GRAIN[Math.floor(this.t * 24) % GRAIN.length], 0, 0);
    ctx.globalAlpha = 1;
    const vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.95);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.65)');
    ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
    if (G.hp <= 33) { ctx.fillStyle = `rgba(120,0,0,${0.12 + 0.1 * Math.sin(this.t * 6.9)})`; ctx.fillRect(0, 0, W, H); }
    if (this.hurtFlash > 0) { ctx.fillStyle = `rgba(200,0,0,${this.hurtFlash * 0.5})`; ctx.fillRect(0, 0, W, H); }
    if (this.flash > 0) { ctx.fillStyle = `rgba(255,250,220,${this.flash * 0.35})`; ctx.fillRect(0, 0, W, H); }
  },
  renderLight(R, st, pp) {
    let dark = R.darkness(st);
    lctx.globalCompositeOperation = 'source-over';
    lctx.clearRect(0, 0, W, H);
    lctx.fillStyle = `rgba(4,5,9,${dark})`;
    lctx.fillRect(0, 0, W, H);
    lctx.globalCompositeOperation = 'destination-out';
    const lights = R.lights ? R.lights(st, this.t) : [];
    for (const L of lights) {
      let a = L.a ?? 1;
      if (L.flicker) { const f = Math.sin(this.t * 37 + L.x) * Math.sin(this.t * 13.3 + L.y); if (f > 0.75 || (Math.sin(this.t * 2.1 + L.x) > 0.97)) a *= 0.2; }
      const g = lctx.createRadialGradient(L.x, L.y, 0, L.x, L.y, L.r);
      g.addColorStop(0, `rgba(0,0,0,${a})`); g.addColorStop(1, 'rgba(0,0,0,0)');
      lctx.fillStyle = g;
      if (L.cone) { lctx.beginPath(); lctx.moveTo(L.x, L.y); lctx.lineTo(L.x - L.cone, L.y + L.r); lctx.lineTo(L.x + L.cone, L.y + L.r); lctx.closePath(); lctx.fill(); }
      else lctx.fillRect(L.x - L.r, L.y - L.r, L.r * 2, L.r * 2);
    }
    // Taschenlampe
    if (this.has('taschenlampe')) {
      const cx = pp.x, cy = pp.y - 30 * pp.s;
      const dirs = { L: [-1, 0.15], R: [1, 0.15], U: [0, -1], D: [0, 1] };
      const [fx, fy] = dirs[G.dir];
      const len = 150, spread = 0.42;
      const ang = Math.atan2(fy, fx);
      const g = lctx.createRadialGradient(cx, cy, 0, cx, cy, len);
      const fl = Math.random() < 0.01 ? 0.5 : 1;
      g.addColorStop(0, `rgba(0,0,0,${0.95 * fl})`); g.addColorStop(0.6, `rgba(0,0,0,${0.6 * fl})`); g.addColorStop(1, 'rgba(0,0,0,0)');
      lctx.fillStyle = g;
      lctx.beginPath(); lctx.moveTo(cx, cy);
      lctx.arc(cx, cy, len, ang - spread, ang + spread); lctx.closePath(); lctx.fill();
    }
    // Eigenes Umgebungslicht um die Figur
    const g2 = lctx.createRadialGradient(pp.x, pp.y - 20 * pp.s, 0, pp.x, pp.y - 20 * pp.s, 42);
    g2.addColorStop(0, 'rgba(0,0,0,0.55)'); g2.addColorStop(1, 'rgba(0,0,0,0)');
    lctx.fillStyle = g2; lctx.fillRect(pp.x - 50, pp.y - 80, 100, 110);
    ctx.drawImage(light, 0, 0);
    // farbiger Lichtschein
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (const L of lights) if (L.col) {
      const g = ctx.createRadialGradient(L.x, L.y, 0, L.x, L.y, L.r * 0.7);
      g.addColorStop(0, L.col); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.fillRect(L.x - L.r, L.y - L.r, L.r * 2, L.r * 2);
    }
    ctx.restore();
  },
  renderDoor() {
    const tr = this.trans, t = tr.t;
    rect(ctx, 0, 0, W, H, '#000');
    // Tür-Sequenz im Stil der alten Survival-Horror-Spiele
    const k = clamp((t - 0.25) / 1.4, 0, 1);
    const z = 1 + k * k * 2.2;
    const dw = 70 * z, dh = 130 * z;
    const x = W / 2 - dw / 2, y = H / 2 - dh / 2 + 10;
    ctx.globalAlpha = clamp(t / 0.3, 0, 1) * clamp((1.9 - t) / 0.35, 0, 1);
    rect(ctx, x - 8 * z, y - 8 * z, dw + 16 * z, dh + 8 * z, '#1a1c20');
    rect(ctx, x, y, dw, dh, '#020202');
    const open = clamp((t - 0.45) / 0.9, 0, 1);
    const ow = dw * (1 - open * 0.92);
    const g = ctx.createLinearGradient(x, 0, x + ow, 0);
    g.addColorStop(0, '#3b3f44'); g.addColorStop(1, '#25282c');
    ctx.fillStyle = g; ctx.fillRect(x, y, ow, dh);
    rect(ctx, x + ow - 9 * z * (1 - open), y + dh * 0.5, 4 * z * (1 - open) + 1, 3 * z, '#9a8a5a');
    for (let i = 1; i < 4; i++) rect(ctx, x + 4 * z, y + i * dh / 4, Math.max(0, ow - 8 * z), 1, 'rgba(0,0,0,0.4)');
    ctx.globalAlpha = 1;
    ctx.drawImage(GRAIN[Math.floor(t * 24) % GRAIN.length], 0, 0);
  },
  renderTitleBg() {
    rect(ctx, 0, 0, W, H, '#050608');
    for (let i = 0; i < 6; i++) {
      const x = 40 + i * 80 + Math.sin(this.t * 0.3 + i) * 4;
      rect(ctx, x, 0, 2, H, 'rgba(60,70,90,0.15)');
    }
    const a = 0.5 + 0.5 * Math.sin(this.t * 1.7);
    if (Math.sin(this.t * 23) > 0.6 && Math.sin(this.t * 3) > 0.5) { /* flackern */ } else {
      const g = ctx.createRadialGradient(W / 2, 40, 0, W / 2, 40, 180);
      g.addColorStop(0, `rgba(200,210,180,${0.1 + a * 0.04})`); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    }
    person(ctx, W / 2, 230, 1.3, LOOKS.azubi, 'U', 0, false);
    if (GRAIN.length) ctx.drawImage(GRAIN[Math.floor(this.t * 24) % GRAIN.length], 0, 0);
  },

  loop(ts) {
    const now = ts / 1000;
    const dt = Math.min(0.05, now - (this.last || now));
    this.last = now;
    this.update(dt);
    this.render();
    requestAnimationFrame(t => this.loop(t));
  },
};

// ------------------------------------------------------------
//  Setup
// ------------------------------------------------------------
function fitScreen() {
  const wrap = $('#wrap');
  const vw = window.innerWidth, vh = window.innerHeight - ($('#touch').offsetHeight || 0);
  let w = vw, h = vw * 9 / 16;
  if (h > vh) { h = vh; w = vh * 16 / 9; }
  wrap.style.width = w + 'px'; wrap.style.height = h + 'px';
  wrap.style.fontSize = (w / 480 * 7.2) + 'px';
}

window.addEventListener('load', () => {
  buildGrain();
  if ('ontouchstart' in window || navigator.maxTouchPoints > 0) document.body.classList.add('touch');
  fitScreen();
  window.addEventListener('resize', fitScreen);
  window.addEventListener('keydown', e => Game.onKey(e, true));
  window.addEventListener('keyup', e => Game.onKey(e, false));
  window.addEventListener('blur', () => { Game.keys = {}; });
  $('#dialog').addEventListener('click', () => Game.action());
  // Titel
  Saves.read();
  TitleMenu.show('main');
  FileLink.restore().then(() => { if (Game.mode === 'title' && TitleMenu.screen === 'main') TitleMenu.show('main'); });
  // Touch
  document.querySelectorAll('#touch [data-k]').forEach(b => {
    const k = b.dataset.k;
    const on = e => { e.preventDefault(); Game.keys[k] = true; }, off = e => { e.preventDefault(); Game.keys[k] = false; };
    b.addEventListener('touchstart', on); b.addEventListener('touchend', off); b.addEventListener('touchcancel', off);
    b.addEventListener('mousedown', on); b.addEventListener('mouseup', off); b.addEventListener('mouseleave', off);
  });
  $('#touch .ta').addEventListener('click', e => { e.preventDefault(); Game.action(); });
  $('#touch .ti').addEventListener('click', e => { e.preventDefault(); if (Game.mode === 'play') Game.openInv(); else if (Game.mode === 'inv') Game.closeInv(); });
  requestAnimationFrame(t => Game.loop(t));
});
