'use strict';
// ------------------------------------------------------------
//  Spielstände: Profile (Klasse + Name), je 5 Speicherplätze + Autosave,
//  Export/Import als Datei, Übernahme des alten Einzel-Spielstands
// ------------------------------------------------------------
const Saves = {
  KEY: 'nachtschicht_profiles_v2',
  OLD: 'nachtschicht_save_v1',
  SLOTS: 5,
  db: null,
  cur: null,
  ok: true,

  read() {
    let db = null;
    try { db = JSON.parse(localStorage.getItem(this.KEY)); } catch (e) { this.ok = false; }
    this.db = db && db.profiles ? db : { profiles: {}, last: null };
    this.migrate();
    if (this.db.last && this.db.profiles[this.db.last]) this.cur = this.db.last;
  },
  write() {
    try { localStorage.setItem(this.KEY, JSON.stringify(this.db)); return true; } catch (e) { this.ok = false; return false; }
  },
  // Alten Spielstand (Version mit nur einem Speicherplatz) einmalig übernehmen
  migrate() {
    if (this.db.migrated) return;
    let old = null;
    try { old = JSON.parse(localStorage.getItem(this.OLD)); } catch (e) { /* nichts */ }
    if (old && old.room) {
      const id = this.create('Ohne Klasse', 'Bisheriger Spielstand', true);
      const rec = this.record(old);
      this.db.profiles[id].slots[0] = rec;
      this.db.profiles[id].auto = rec;
      this.db.last = id;
    }
    this.db.migrated = true;
    this.write();
  },

  pid(klasse, name) { return klasse.trim().toLowerCase() + '|' + name.trim().toLowerCase(); },
  create(klasse, name, silent) {
    klasse = klasse.trim() || 'Ohne Klasse'; name = name.trim();
    const id = this.pid(klasse, name);
    if (!this.db.profiles[id]) this.db.profiles[id] = { klasse, name, slots: Array(this.SLOTS).fill(null), auto: null, created: Date.now() };
    if (!silent) this.write();
    return id;
  },
  remove(id) { delete this.db.profiles[id]; if (this.db.last === id) this.db.last = null; if (this.cur === id) this.cur = null; this.write(); },
  select(id) { this.cur = id; this.db.last = id; this.write(); },
  profile() { return this.cur ? this.db.profiles[this.cur] : null; },
  // Profile nach Klasse gruppiert
  groups() {
    const g = {};
    for (const [id, p] of Object.entries(this.db.profiles)) (g[p.klasse] = g[p.klasse] || []).push({ id, ...p });
    return Object.keys(g).sort((a, b) => a.localeCompare(b, 'de')).map(k => ({ klasse: k, list: g[k].sort((a, b) => a.name.localeCompare(b.name, 'de')) }));
  },

  record(state) {
    const fixes = FIXES.filter(f => state.flags && state.flags['fix_' + f.id]).length;
    return { at: Date.now(), room: state.room, prod: Math.round(fixes / FIXES.length * 100), end: !!(state.flags && state.flags.ending), state: JSON.parse(JSON.stringify(state)) };
  },
  // slot: 0..4 oder 'auto'
  save(slot) {
    const p = this.profile();
    if (!p || !G) return false;
    const rec = this.record(G);
    if (slot === 'auto') p.auto = rec; else p.slots[slot] = rec;
    return this.write();
  },
  get(slot) { const p = this.profile(); if (!p) return null; return slot === 'auto' ? p.auto : p.slots[slot]; },
  latest() {
    const p = this.profile(); if (!p) return null;
    return [p.auto, ...p.slots].filter(Boolean).sort((a, b) => b.at - a.at)[0] || null;
  },
  info(rec) {
    if (!rec) return '— leer —';
    const d = new Date(rec.at);
    const when = d.toLocaleDateString('de-DE') + ' ' + d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
    return `${ROOMS[rec.room] ? ROOMS[rec.room].name : rec.room} · Produktion ${rec.prod} %${rec.end ? ' · geschafft ✔' : ''} · ${when}`;
  },

  // ---------- Datei-Export / -Import ----------
  exportProfile(id) {
    const p = this.db.profiles[id]; if (!p) return;
    const data = JSON.stringify({ type: 'nachtschicht-profil', version: 2, profile: p }, null, 1);
    const blob = new Blob([data], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = ('nachtschicht_' + p.klasse + '_' + p.name).replace(/[^\wäöüÄÖÜß-]+/g, '_') + '.json';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  },
  importFile(file, done) {
    const r = new FileReader();
    r.onload = () => {
      let d = null;
      try { d = JSON.parse(r.result); } catch (e) { /* ungültig */ }
      if (!d || d.type !== 'nachtschicht-profil' || !d.profile || !d.profile.name) { done(null, 'Das ist keine gültige Nachtschicht-Spielstanddatei.'); return; }
      const p = d.profile;
      const id = this.pid(p.klasse || 'Ohne Klasse', p.name);
      if (this.db.profiles[id] && !confirm(`Das Profil „${p.klasse} – ${p.name}“ gibt es hier schon. Mit der Datei überschreiben?`)) { done(null, null); return; }
      const slots = Array(this.SLOTS).fill(null);
      (p.slots || []).slice(0, this.SLOTS).forEach((s, i) => slots[i] = s && s.state ? s : null);
      this.db.profiles[id] = { klasse: p.klasse || 'Ohne Klasse', name: p.name, slots, auto: p.auto && p.auto.state ? p.auto : null, created: p.created || Date.now() };
      this.select(id);
      done(id, null);
    };
    r.readAsText(file);
  },
};

// ------------------------------------------------------------
//  Titelmenü: Profilwahl und Speicherplätze
// ------------------------------------------------------------
const TitleMenu = {
  esc(s) { return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); },
  show(screen) {
    this.screen = screen || 'main';
    const el = $('#title .menu');
    const e = this.esc;
    if (this.screen === 'main') {
      el.innerHTML = `<button class="btn play">Spielen</button><button class="btn help">Steuerung</button>`;
      el.querySelector('.play').onclick = () => this.show(Saves.profile() ? 'profile' : 'profiles');
      el.querySelector('.help').onclick = () => $('#helpbox').classList.toggle('hidden');
    } else if (this.screen === 'profiles') {
      const groups = Saves.groups();
      el.innerHTML = `<div class="pbox"><h3>Wer spielt?</h3>
        ${groups.length ? groups.map(g => `<div class="kl"><div class="klh">${e(g.klasse)}</div>${g.list.map(p => `<div class="prow"><button class="btn pick" data-id="${e(p.id)}">${e(p.name)}</button><span class="pinfo">${e(Saves.info(Saves.latestOf(p)))}</span><button class="btn small del" data-id="${e(p.id)}" title="Profil löschen">🗑</button></div>`).join('')}</div>`).join('') : '<p class="note">Noch keine Profile. Leg unten eins an.</p>'}
        <div class="newp"><input class="inp" id="pk" placeholder="Klasse, z. B. MT10a" maxlength="20"><input class="inp" id="pn" placeholder="Name" maxlength="30"><button class="btn mk">Profil anlegen</button></div>
        <div class="row"><button class="btn imp">Spielstand-Datei laden …</button><button class="btn back">Zurück</button></div>
        <input type="file" id="impf" accept=".json,application/json" class="hidden">
        ${Saves.ok ? '' : '<p class="note">Achtung: Dieser Browser erlaubt kein Speichern. Spielstände gehen beim Schließen verloren – nutze den Export.</p>'}</div>`;
      el.querySelectorAll('.pick').forEach(b => b.onclick = () => { Saves.select(b.dataset.id); Snd.play && Snd.play('select'); this.show('profile'); });
      el.querySelectorAll('.del').forEach(b => b.onclick = () => {
        const p = Saves.db.profiles[b.dataset.id];
        if (confirm(`Profil „${p.klasse} – ${p.name}“ mit allen Spielständen löschen?`)) { Saves.remove(b.dataset.id); this.show('profiles'); }
      });
      el.querySelector('.mk').onclick = () => {
        const k = el.querySelector('#pk').value, n = el.querySelector('#pn').value;
        if (!n.trim()) { el.querySelector('#pn').focus(); el.querySelector('#pn').placeholder = 'Bitte Namen eingeben'; return; }
        Saves.select(Saves.create(k, n)); this.show('profile');
      };
      el.querySelector('#pn').onkeydown = ev => { if (ev.key === 'Enter') el.querySelector('.mk').click(); };
      el.querySelector('.imp').onclick = () => el.querySelector('#impf').click();
      el.querySelector('#impf').onchange = ev => {
        const f = ev.target.files[0]; if (!f) return;
        Saves.importFile(f, (id, err) => { if (err) alert(err); if (id) this.show('profile'); });
      };
      el.querySelector('.back').onclick = () => this.show('main');
    } else if (this.screen === 'profile') {
      const p = Saves.profile();
      if (!p) { this.show('profiles'); return; }
      const row = (slot, label) => { const r = Saves.get(slot); return `<div class="srow"><span class="sl">${label}</span><span class="pinfo">${e(Saves.info(r))}</span><button class="btn small ld" data-s="${slot}" ${r ? '' : 'disabled'}>Laden</button></div>`; };
      el.innerHTML = `<div class="pbox"><h3>${e(p.klasse)} – ${e(p.name)}</h3>
        <div class="row"><button class="btn nw">Neues Spiel</button></div>
        ${row('auto', 'Autosave')}${Array.from({ length: Saves.SLOTS }, (_, i) => row(i, 'Platz ' + (i + 1))).join('')}
        <p class="note">Speichern im Spiel an den Stempeluhren (Umkleide, Kellergang). Nach jeder Reparatur wird automatisch gesichert.</p>
        <div class="row"><button class="btn ex">Spielstand als Datei speichern</button><button class="btn sw">Profil wechseln</button></div></div>`;
      el.querySelector('.nw').onclick = () => Game.start(null);
      el.querySelectorAll('.ld').forEach(b => b.onclick = () => { const r = Saves.get(b.dataset.s === 'auto' ? 'auto' : +b.dataset.s); if (r) Game.start(r.state); });
      el.querySelector('.ex').onclick = () => Saves.exportProfile(Saves.cur);
      el.querySelector('.sw').onclick = () => this.show('profiles');
    }
  },
};
Saves.latestOf = p => [p.auto, ...(p.slots || [])].filter(Boolean).sort((a, b) => b.at - a.at)[0] || null;
