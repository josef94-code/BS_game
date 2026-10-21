'use strict';
// ------------------------------------------------------------
//  Spielstände: Profile (Klasse + Name), je 5 Speicherplätze + Autosave,
//  Export/Import als Datei, Übernahme des alten Einzel-Spielstands,
//  optional: verbundene Spielstand-Datei (z. B. im Cloud-Ordner)
// ------------------------------------------------------------
const Saves = {
  KEY: 'nachtschicht_profiles_v2',
  OLD: 'nachtschicht_save_v1',
  SLOTS: 5,
  db: null,
  localDb: null,
  mode: 'local', // 'local' = nur im Browser, 'file' = verbundene Spielstand-Datei
  cur: null,
  ok: true,

  read() {
    let db = null;
    try { db = JSON.parse(localStorage.getItem(this.KEY)); } catch (e) { this.ok = false; }
    this.localDb = this.db = db && db.profiles ? db : { profiles: {}, last: null };
    this.migrate();
    this.pickLast();
  },
  pickLast() { this.cur = this.db.last && this.db.profiles[this.db.last] ? this.db.last : null; },
  write() {
    if (this.mode === 'file') { FileLink.push(this.fileData()); return true; }
    try { localStorage.setItem(this.KEY, JSON.stringify(this.db)); return true; } catch (e) { this.ok = false; return false; }
  },
  fileData() { return { type: 'nachtschicht-spielstaende', version: 2, profiles: this.db.profiles, last: this.db.last }; },
  // Inhalt einer Spielstand-Datei in eine Profil-Datenbank umwandeln
  normalize(d) {
    if (!d) return { profiles: {}, last: null };
    if (d.type === 'nachtschicht-profil' && d.profile) { const id = this.pid(d.profile.klasse || 'Ohne Klasse', d.profile.name); return { profiles: { [id]: d.profile }, last: id }; }
    if (d.type === 'nachtschicht-spielstaende' && d.profiles) return { profiles: d.profiles, last: d.last || null };
    return null;
  },
  useFile(db) { this.mode = 'file'; this.db = db; this.pickLast(); },
  useLocal() { this.mode = 'local'; this.db = this.localDb; this.pickLast(); },
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
//  Verbundene Spielstand-Datei (File System Access API, Chrome/Edge am PC).
//  Liegt die Datei in einem synchronisierten Cloud-Ordner (OneDrive, Google
//  Drive, Nextcloud …), sind die Spielstände auf jedem Rechner verfügbar.
// ------------------------------------------------------------
const FileLink = {
  supported: typeof window.showOpenFilePicker === 'function' && typeof window.showSaveFilePicker === 'function' && 'indexedDB' in window,
  handle: null,
  name: null,
  status: 'none', // 'none' | 'needs-permission' | 'ok' | 'error'
  queue: Promise.resolve(),
  TYPES: [{ description: 'Nachtschicht-Spielstände', accept: { 'application/json': ['.json'] } }],

  idb(op, val) {
    return new Promise(res => {
      try {
        const rq = indexedDB.open('nachtschicht', 1);
        rq.onupgradeneeded = () => rq.result.createObjectStore('kv');
        rq.onerror = () => res(null);
        rq.onsuccess = () => {
          try {
            const tx = rq.result.transaction('kv', op === 'get' ? 'readonly' : 'readwrite'), st = tx.objectStore('kv');
            const r = op === 'get' ? st.get('fileHandle') : op === 'set' ? st.put(val, 'fileHandle') : st.delete('fileHandle');
            r.onsuccess = () => res(op === 'get' ? r.result : true); r.onerror = () => res(null);
          } catch (e) { res(null); }
        };
      } catch (e) { res(null); }
    });
  },
  // Beim Start: gemerkte Datei wiederfinden
  async restore() {
    if (!this.supported) return;
    const h = await this.idb('get');
    if (!h) return;
    this.handle = h; this.name = h.name;
    let perm = 'prompt';
    try { perm = await h.queryPermission({ mode: 'readwrite' }); } catch (e) { /* alter Browser */ }
    if (perm === 'granted') await this.pull(); else this.status = 'needs-permission';
  },
  // Freigabe einholen (muss aus einem Klick heraus passieren)
  async ensure() {
    if (this.status !== 'needs-permission' || !this.handle) return this.status === 'ok';
    let perm = 'denied';
    try { perm = await this.handle.requestPermission({ mode: 'readwrite' }); } catch (e) { /* abgelehnt */ }
    if (perm !== 'granted') return false;
    return this.pull();
  },
  // Datei lesen und als aktive Spielstände übernehmen
  async pull() {
    try {
      const f = await this.handle.getFile();
      const txt = (await f.text()).trim();
      const db = txt ? Saves.normalize(JSON.parse(txt)) : { profiles: {}, last: null };
      if (!db) throw new Error('Keine Nachtschicht-Spielstanddatei');
      this.status = 'ok';
      Saves.useFile(db);
      return true;
    } catch (e) {
      this.status = 'error'; this.error = e.message;
      Saves.useLocal();
      return false;
    }
  },
  push(data) {
    if (!this.handle) return;
    const json = JSON.stringify(data, null, 1);
    try { localStorage.setItem('nachtschicht_file_backup', json); } catch (e) { /* egal */ }
    this.queue = this.queue.then(async () => {
      const w = await this.handle.createWritable();
      await w.write(json); await w.close();
      if (this.status === 'error') this.status = 'ok';
    }).catch(e => {
      this.status = 'error'; this.error = e.message;
      if (typeof Game !== 'undefined' && Game.toast) Game.toast('Achtung: Speichern in „' + this.name + '“ fehlgeschlagen! Spielstand bitte zusätzlich exportieren.', 6);
    });
    return this.queue;
  },
  async attach(h, takeOver) {
    this.handle = h; this.name = h.name;
    await this.idb('set', h);
    if (takeOver) { this.status = 'ok'; Saves.useFile(takeOver); await this.push(Saves.fileData()); return true; }
    return this.pull();
  },
  // Bestehende Datei öffnen
  async openExisting() {
    const [h] = await window.showOpenFilePicker({ types: this.TYPES, multiple: false });
    let perm = 'granted';
    try { perm = await h.requestPermission({ mode: 'readwrite' }); } catch (e) { /* ältere Version */ }
    if (perm !== 'granted') throw new Error('Keine Schreibberechtigung für die Datei.');
    return this.attach(h);
  },
  // Neue Datei anlegen; optional das aktuelle Profil mitnehmen
  async createNew(profileId) {
    const p = profileId ? Saves.db.profiles[profileId] : null;
    const h = await window.showSaveFilePicker({ suggestedName: p ? ('nachtschicht_' + p.klasse + '_' + p.name).replace(/[^\wäöüÄÖÜß-]+/g, '_') + '.json' : 'nachtschicht_spielstaende.json', types: this.TYPES });
    const db = p ? { profiles: { [profileId]: JSON.parse(JSON.stringify(p)) }, last: profileId } : { profiles: {}, last: null };
    return this.attach(h, db);
  },
  async unlink() {
    await this.queue;
    await this.idb('del');
    this.handle = null; this.name = null; this.status = 'none';
    Saves.useLocal();
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
      const fl = FileLink.status === 'ok' ? `Spielstand-Datei: <b>${e(FileLink.name)}</b> ✔` : FileLink.status === 'needs-permission' ? `Spielstand-Datei: <b>${e(FileLink.name)}</b> – beim Klick auf „Spielen“ freigeben` : FileLink.status === 'error' ? `<span class="warn">Spielstand-Datei „${e(FileLink.name || '')}“ nicht lesbar – es wird im Browser gespeichert.</span>` : '';
      el.innerHTML = `<button class="btn play">Spielen</button><button class="btn help">Steuerung</button>${fl ? `<p class="flstat">${fl}</p>` : ''}`;
      el.querySelector('.play').onclick = async () => {
        if (FileLink.status === 'needs-permission' && !(await FileLink.ensure())) alert('Ohne Freigabe kann die Spielstand-Datei nicht benutzt werden. Es wird nur im Browser gespeichert.');
        this.show(Saves.profile() ? 'profile' : 'profiles');
      };
      el.querySelector('.help').onclick = () => $('#helpbox').classList.toggle('hidden');
    } else if (this.screen === 'profiles') {
      const groups = Saves.groups();
      el.innerHTML = `<div class="pbox"><h3>Wer spielt?</h3>
        ${groups.length ? groups.map(g => `<div class="kl"><div class="klh">${e(g.klasse)}</div>${g.list.map(p => `<div class="prow"><button class="btn pick" data-id="${e(p.id)}">${e(p.name)}</button><span class="pinfo">${e(Saves.info(Saves.latestOf(p)))}</span><button class="btn small del" data-id="${e(p.id)}" title="Profil löschen">🗑</button></div>`).join('')}</div>`).join('') : '<p class="note">Noch keine Profile. Leg unten eins an.</p>'}
        <div class="newp"><input class="inp" id="pk" placeholder="Klasse, z. B. MT10a" maxlength="20"><input class="inp" id="pn" placeholder="Name" maxlength="30"><button class="btn mk">Profil anlegen</button></div>
        <div class="row"><button class="btn imp">Export-Datei importieren …</button><button class="btn back">Zurück</button></div>
        <input type="file" id="impf" accept=".json,application/json" class="hidden">
        <div class="ort"><div class="klh">SPEICHERORT</div>
        ${Saves.mode === 'file' ? `<p>Spielstand-Datei: <b>${e(FileLink.name)}</b>${FileLink.status === 'error' ? ' <span class="warn">(Fehler beim Speichern!)</span>' : ' ✔'}<br><span class="note">Liegt sie in deinem Cloud-Ordner (OneDrive, Google Drive …), sind die Spielstände auf jedem Rechner verfügbar, auf dem du dieselbe Datei verbindest.</span></p>
          <div class="row"><button class="btn unl">Verbindung trennen</button></div>`
        : FileLink.supported ? `<p class="note">Zurzeit nur in diesem Browser. Verbinde eine Spielstand-Datei in deinem Cloud-Ordner, dann kannst du überall weiterspielen.</p>
          <div class="row"><button class="btn fopen">Spielstand-Datei öffnen …</button><button class="btn fnew">Neue Spielstand-Datei anlegen …</button></div>`
        : `<p class="note">Zurzeit nur in diesem Browser. Spielstand-Dateien im Cloud-Ordner gehen nur mit Chrome oder Edge am PC. Alternative: Export/Import.</p>`}</div>
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
      const fail = err => { if (err && err.name !== 'AbortError') alert('Das hat nicht geklappt: ' + (err.message || err)); this.show('profiles'); };
      const fo = el.querySelector('.fopen'); if (fo) fo.onclick = () => FileLink.openExisting().then(ok => { if (!ok) alert('Die Datei ist keine Nachtschicht-Spielstanddatei.'); this.show(Saves.profile() ? 'profile' : 'profiles'); }, fail);
      const fn = el.querySelector('.fnew'); if (fn) fn.onclick = () => {
        const p = Saves.profile();
        const take = p && confirm(`Das Profil „${p.klasse} – ${p.name}“ mit seinen Spielständen in die neue Datei übernehmen?`);
        FileLink.createNew(take ? Saves.cur : null).then(() => this.show(Saves.profile() ? 'profile' : 'profiles'), fail);
      };
      const un = el.querySelector('.unl'); if (un) un.onclick = () => { if (confirm('Verbindung zur Spielstand-Datei trennen? Die Datei bleibt erhalten, gespeichert wird dann nur noch im Browser.')) FileLink.unlink().then(() => this.show('profiles')); };
    } else if (this.screen === 'profile') {
      const p = Saves.profile();
      if (!p) { this.show('profiles'); return; }
      const row = (slot, label) => { const r = Saves.get(slot); return `<div class="srow"><span class="sl">${label}</span><span class="pinfo">${e(Saves.info(r))}</span><button class="btn small ld" data-s="${slot}" ${r ? '' : 'disabled'}>Laden</button></div>`; };
      el.innerHTML = `<div class="pbox"><h3>${e(p.klasse)} – ${e(p.name)}</h3>
        <div class="row"><button class="btn nw">Neues Spiel</button></div>
        ${row('auto', 'Autosave')}${Array.from({ length: Saves.SLOTS }, (_, i) => row(i, 'Platz ' + (i + 1))).join('')}
        <p class="note">Speichern im Spiel an den Stempeluhren (Umkleide, Kellergang). Nach jeder Reparatur wird automatisch gesichert.<br>Gespeichert wird ${Saves.mode === 'file' ? `in der Datei <b>${e(FileLink.name)}</b>.` : 'nur in diesem Browser (unter „Profil wechseln“ kannst du eine Spielstand-Datei verbinden).'}</p>
        <div class="row"><button class="btn ex">Spielstand als Datei speichern</button><button class="btn sw">Profil wechseln</button></div></div>`;
      el.querySelector('.nw').onclick = () => Game.start(null);
      el.querySelectorAll('.ld').forEach(b => b.onclick = () => { const r = Saves.get(b.dataset.s === 'auto' ? 'auto' : +b.dataset.s); if (r) Game.start(r.state); });
      el.querySelector('.ex').onclick = () => Saves.exportProfile(Saves.cur);
      el.querySelector('.sw').onclick = () => this.show('profiles');
    }
  },
};
Saves.latestOf = p => [p.auto, ...(p.slots || [])].filter(Boolean).sort((a, b) => b.at - a.at)[0] || null;
