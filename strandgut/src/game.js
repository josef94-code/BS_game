import * as THREE from 'three';
import { ITEMS, PICKUPS, CONTAINERS, DOCS, LOG, HINTS } from './data.js';
import { PUZZLES, runPuzzle } from './puzzles.js';
import { heightAt, SPOTS } from './terrain.js';
import { waveHeight } from './water.js';
import { IX, IZ, ROOM } from './interior.js';
import { makeSparkle, makeCrate, std, mesh, makeWreck } from './props.js';
import { clamp, lerp } from './noise.js';

const SAVE_KEY = 'strandgut_save_v1';
const V = (x, z) => ({ x, z });

function newState() {
  return {
    v: 1, day: 1, time: 14.5, stats: { thirst: 55, hunger: 70, energy: 80 },
    inv: {}, docs: [], log: [], flags: {}, solved: {}, picked: {}, pm: {},
    mistakes: 0, hintsUsed: 0, faints: 0, playTime: 0,
    pos: { x: SPOTS.start.x, z: SPOTS.start.z, zone: 'island', facing: Math.PI }, faintTimer: 0, cooldown: {},
  };
}

export class Game {
  constructor(o) {
    Object.assign(this, o);
    this.G = newState();
    this.active = false;
    this.pickupObjs = {};
    this.t = 0;
    this.stepT = 0;
    this.boatMode = false;
    this.buildPickups();
    this.buildRescueShip();
    this.ui.onModalClose = () => { this.audio.sfx('click'); };
  }

  // ---------- Speichern / Laden ----------
  hasSave() { try { return !!localStorage.getItem(SAVE_KEY); } catch (e) { return false; } }
  save(quiet) {
    if (this.boatMode || !this.active) return;
    const G = this.G;
    G.time = this.env.time;
    const p = this.player;
    G.pos = { x: p.pos.x, z: p.pos.z, zone: p.zone, facing: p.facing };
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(G)); if (!quiet) this.ui.toast('💾 Spielstand gespeichert'); } catch (e) { /* privater Modus */ }
  }
  load() {
    try {
      const s = JSON.parse(localStorage.getItem(SAVE_KEY));
      if (!s) return false;
      this.G = Object.assign(newState(), s);
      return true;
    } catch (e) { return false; }
  }
  clearSave() { try { localStorage.removeItem(SAVE_KEY); } catch (e) { } }

  start(fromSave) {
    if (!fromSave) this.G = newState();
    const G = this.G;
    this.env.time = G.time;
    this.applyWorldState();
    const p = G.pos;
    this.setZone(p.zone || 'island', true);
    this.player.teleport(p.x, undefined, p.z, p.facing ?? Math.PI);
    this.active = true;
    this.ui.showHUD(true);
    this.lastSave = 0;
  }

  // Welt passend zum Fortschritt herrichten (auch nach dem Laden)
  applyWorldState() {
    const { W, G, interior: I } = this, f = G.flags;
    W.shelter.visible = !!f.camp; W.fire.visible = !!f.camp; W.campMarker.visible = !f.camp;
    W.energyMarker.visible = G.day >= 2 && !!f.bauplan && !(G.solved.p4 && G.solved.p5 && G.solved.p6);
    W.solar.forEach(s => s.visible = !!G.solved.p4);
    W.power.visible = !!G.solved.p4;
    W.lights.visible = !!G.solved.p5; W.lights.userData.set(!!G.solved.p5);
    W.turbine.visible = !!G.solved.p6;
    const bp = W.boat.userData.parts;
    bp.hull.visible = !!G.solved.p8; bp.drive.visible = !!G.solved.p9; bp.control.visible = !!G.solved.p10; bp.energy.visible = !!G.solved.p11;
    W.boatMarker.visible = !!f.bauplan && G.day >= 3 && !G.solved.p11;
    if (f.contA_open) W.contA.userData.open(1);
    if (f.contB_open) W.contB.userData.open(1);
    if (f.contC_open) W.contC.userData.open(1);
    if (G.solved.p3) I.openDoor(true);
    this.env.stormTarget = this.stormWanted();
    this.env.storm = this.env.stormTarget;
  }

  stormWanted() { const G = this.G; return G.day === 2 && G.flags.stormEvent ? 1 : 0; }

  // ---------- Inventar ----------
  give(id, n = 1, quiet) {
    this.G.inv[id] = (this.G.inv[id] || 0) + n;
    if (!quiet) this.ui.toast(`<span class="ti">${ITEMS[id].icon}</span> +${n > 1 ? n + ' ' : ''}${ITEMS[id].name}`);
    if (id === 'bauplan') { this.G.flags.bauplan = true; this.applyWorldState(); }
  }
  has(id, n = 1) { return (this.G.inv[id] || 0) >= n; }
  take(id, n = 1) { this.G.inv[id] = Math.max(0, (this.G.inv[id] || 0) - n); }
  addDoc(id) {
    if (!this.G.docs.includes(id)) { this.G.docs.push(id); this.ui.toast(`📄 Neues Dokument: ${DOCS[id].title}`, 'doc'); }
  }

  itemAction(id) {
    const it = ITEMS[id], G = this.G;
    if (it.use === 'trinken') return { label: 'Trinken', run: () => { this.take(id); G.stats.thirst = Math.min(100, G.stats.thirst + it.thirst); G.flags.drank = true; this.audio.sfx('drink'); } };
    if (it.use === 'essen') return { label: 'Essen', run: () => { this.take(id); G.stats.hunger = Math.min(100, G.stats.hunger + it.hunger); G.stats.thirst = Math.min(100, G.stats.thirst + (it.thirst || 0)); this.audio.sfx('eat'); } };
    if (id === 'funk' && G.flags.radio) return { label: 'Henrik anfunken', run: () => { this.ui.closeModal(); this.radioCall(); } };
    if (id === 'bauplan') return { label: 'Bauplan ansehen', run: () => this.ui.openBag(G, this, 'plan') };
    return null;
  }

  // ---------- Fundstücke in der Welt ----------
  buildPickups() {
    const models = {
      crate: () => makeCrate('#9b7b4f', 0.7),
      box: () => { const g = new THREE.Group(); const b = mesh(new THREE.BoxGeometry(0.6, 0.4, 0.45), std('#3f5566', { m: 0.4, r: 0.5 })); b.position.y = 0.2; g.add(b); const l = mesh(new THREE.BoxGeometry(0.62, 0.05, 0.47), std('#e0b62f')); l.position.y = 0.42; g.add(l); return g; },
      battery: () => { const g = new THREE.Group(); const b = mesh(new THREE.BoxGeometry(0.9, 0.55, 0.5), std('#2b5aa0', { m: 0.3 })); b.position.y = 0.28; g.add(b); for (const [x, c] of [[-0.3, '#c0392b'], [0.3, '#222']]) { const t = mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.1, 8), std(c)); t.position.set(x, 0.6, 0); g.add(t); } return g; },
      paper: () => { const g = new THREE.Group(); const p = mesh(new THREE.BoxGeometry(0.6, 0.01, 0.42), std('#2a5fa8')); p.rotation.y = 0.2; g.add(p); const p2 = mesh(new THREE.BoxGeometry(0.21, 0.012, 0.3), std('#f3efe2')); p2.position.set(0.25, 0.01, 0.05); p2.rotation.y = -0.3; g.add(p2); return g; },
      coco: () => { const g = new THREE.Group(); for (let i = 0; i < 2; i++) { const c = mesh(new THREE.SphereGeometry(0.15, 8, 6), std('#6b4a2b')); c.position.set(i * 0.25 - 0.12, 0.13, i * 0.1); g.add(c); } return g; },
      wood: () => { const g = new THREE.Group(); for (let i = 0; i < 3; i++) { const w = mesh(new THREE.CylinderGeometry(0.05, 0.06, 1.3, 6), std('#a07a52')); w.rotation.set(Math.PI / 2, 0, i * 0.4 - 0.4); w.position.set(0, 0.06 + i * 0.05, 0); g.add(w); } return g; },
      pipe: () => { const p = mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.2, 8), std('#a9b1b8', { m: 0.8, r: 0.3 })); p.rotation.set(Math.PI / 2, 0, 0.6); p.position.y = 0.04; const g = new THREE.Group(); g.add(p); return g; },
      float: () => { const g = new THREE.Group(); const f = mesh(new THREE.CapsuleGeometry(0.4, 1.4, 6, 12), std('#ecf0f1', { r: 0.4 })); f.rotation.z = Math.PI / 2; f.position.y = 0.38; g.add(f); const s = mesh(new THREE.CylinderGeometry(0.41, 0.41, 0.3, 12), std('#e74c3c')); s.rotation.z = Math.PI / 2; s.position.y = 0.38; g.add(s); return g; },
    };
    for (const pk of PICKUPS) {
      const obj = models[pk.model]();
      let x, z, y;
      if (pk.zone === 'wrack') { x = IX + pk.lx; z = IZ + pk.lz; y = pk.y ?? 0; }
      else { x = pk.x; z = pk.z; y = Math.max(heightAt(x, z), -0.3); }
      obj.position.set(x, y, z);
      obj.rotation.y = (pk.x || pk.lx || 0) * 1.7;
      const sp = makeSparkle(); sp.position.y = 0.9; obj.add(sp); obj.userData.sparkle = sp;
      this.scene.add(obj);
      this.pickupObjs[pk.id] = obj;
      pk.wx = x; pk.wz = z;
    }
  }
  pickupVisible(pk) {
    const G = this.G;
    if (G.picked[pk.id]) return false;
    if (pk.req && !G.flags[pk.req]) return false;
    return true;
  }

  // ---------- Rettungsschiff fürs Finale ----------
  buildRescueShip() {
    const ship = makeWreck();
    ship.scale.setScalar(1.25);
    // Containerschiff im besseren Zustand: Leck und Rampe ausblenden
    ship.children.forEach(c => { if (c.geometry && c.geometry.type === 'PlaneGeometry' && c.material.color && c.material.color.getHex() === 0x050505) c.visible = false; });
    ship.position.set(560, -1.2, 330);
    ship.rotation.y = -0.6;
    ship.visible = false;
    this.scene.add(ship);
    this.rescueShip = ship;
    const lamp = new THREE.PointLight(0xffffff, 0, 60); lamp.position.set(0, 22, 0); ship.add(lamp);
  }

  // ---------- Ziele / Aufgaben ----------
  objective() {
    const G = this.G, f = G.flags, s = G.solved, inv = (k) => G.inv[k] || 0;
    const pkPos = (id) => { const p = PICKUPS.find(q => q.id === id); return { x: p.wx, z: p.wz, zone: p.zone || 'island' }; };
    const contPos = (k) => this.containerDoor(k);
    const camp = { ...SPOTS.camp, zone: 'island' };
    if (!f.drank) return { title: 'Durst!', text: 'Du bist völlig ausgedörrt. Finde etwas zu trinken.', steps: [], target: G.picked.p_wasser1 ? null : pkPos('p_wasser1'), hint: 'Am Strand liegt eine angeschwemmte Kiste. Vielleicht ist Wasser drin. Im Rucksack (Tab) kannst du dann trinken.' };
    if (!f.contA_open) return { title: 'Strandgut untersuchen', text: 'Der rote Container LND 4711 am Strand könnte nützliche Ausrüstung enthalten.', steps: [{ t: 'Etwas zum Hebeln finden', d: inv('rohr') > 0 }, { t: 'Container LND 4711 öffnen', d: false }], target: inv('rohr') ? contPos('contA') : pkPos('p_rohr'), hint: 'Die Tür klemmt. Ein Stahlrohr als Hebelverlängerung wäre gut – am Strand Richtung Osten lag etwas Metallisches.' };
    if (!f.camp) return { title: 'Ein Lager errichten', text: 'Bevor es dunkel wird, brauchst du einen Unterschlupf im Palmenhain.', steps: [{ t: `Treibholz sammeln (${Math.min(4, inv('holz'))}/4)`, d: inv('holz') >= 4 }, { t: 'Abdeckplane', d: inv('plane') > 0 }, { t: 'Lager am Bauplatz errichten', d: false }], target: inv('holz') >= 4 ? camp : this.nearestPickup('holz'), hint: 'Am Strand liegt überall Treibholz. Der leuchtende Ring im Palmenhain markiert einen guten Lagerplatz.' };
    if (!f.radio) return { title: 'Funkkontakt', text: 'Vielleicht hat noch jemand von der Crew überlebt. Bring das Funkgerät zum Laufen.', steps: [{ t: 'Funkgerät im Lager reparieren', d: false }], target: camp, hint: 'Im Lager kannst du in Ruhe am Funkgerät arbeiten. Im Container waren auch Batterien.' };
    if (G.day === 1) return { title: 'Die erste Nacht', text: 'Es wird dunkel. Ruh dich im Unterstand aus.', steps: [{ t: 'Im Unterstand schlafen', d: false }], target: camp, hint: 'Leg dich im Unterstand schlafen. Morgen geht es ins Wrack.' };
    if (!s.p3) return { title: 'Das Wrack', text: 'Henriks Bauplan liegt in seiner Kabine im Maschinenraum der LINDAU.', steps: [{ t: 'Ins Wrack gelangen', d: !!f.wreckVisited }, { t: 'Schott zum Maschinenraum öffnen', d: false }], target: this.player.zone === 'wrack' ? { x: IX, z: IZ + 11, zone: 'wrack' } : { ...this.W.wreckEntry, zone: 'island' }, hint: 'Das Wrack liegt an der Nordostküste. An der Landseite ist ein Leck – über die abgerissene Lukenabdeckung kommst du hinein.' };
    if (!f.bauplan) return { title: 'Henriks Bauplan', text: 'Finde den Bauplan auf Henriks Schreibtisch.', steps: [], target: pkPos('w_bauplan'), hint: 'Mein Schreibtisch steht hinten rechts im Maschinenraum, bei der Lampe.' };
    if (!(s.p4 && s.p5)) {
      const need = [['akku', 'w_akku'], ['regler', 'w_regler'], ['kabel', 'w_kabel'], ['sicherungen', 'w_sich']];
      const miss = need.find(([k]) => !inv(k));
      let target = { ...this.W.energySite, zone: 'island' };
      if (miss) target = pkPos(miss[1]); else if (inv('solar') < 4) target = contPos('contB');
      return { title: 'Energie!', text: 'Ohne Strom kein Boot. Baue am Lager eine Energiestation auf.', steps: [
        { t: 'Akku (Maschinenraum)', d: inv('akku') > 0 }, { t: 'Laderegler (Maschinenraum)', d: inv('regler') > 0 }, { t: 'Kabeltrommel (Laderaum)', d: inv('kabel') > 0 }, { t: 'Sicherungen (Laderaum)', d: inv('sicherungen') > 0 },
        { t: `Solarmodule (${inv('solar')}/4) – Container LND 2207`, d: inv('solar') >= 4 }, { t: 'Solarfeld verschalten', d: !!s.p4 }, { t: 'Antrieb absichern', d: !!s.p5 }], target, hint: 'Akku und Laderegler stehen im Maschinenraum, Kabel und Sicherungen im Laderaum. Die Solarmodule sind im blauen Container LND 2207 im Südwesten.' };
    }
    if (!s.p6) {
      const ok = inv('wind') && inv('dioden');
      return { title: 'Sturm zieht auf', text: 'Wind ohne Ende – nutze ihn! Baue die Kleinwindanlage an der Energiestation auf.', steps: [{ t: 'Windanlage und Dioden (Container LND 5530)', d: !!ok }, { t: 'Gleichrichter bauen', d: false }], target: ok ? { ...this.W.energySite, zone: 'island' } : contPos('contC'), hint: 'Der grüne Container LND 5530 liegt am Oststrand. Darin: Windgenerator und Dioden.' };
    }
    if (G.day === 2) return { title: 'Sturmnacht', text: 'Der Sturm tobt. Schlaf im Unterstand, bis er vorüber ist.', steps: [{ t: 'Im Unterstand schlafen', d: false }], target: camp, hint: 'Jetzt ist nicht die Zeit für Ausflüge. Leg dich hin.' };
    // Tag 3: Bootsbau
    const tasks = this.boatTasks();
    const next = tasks.find(t => !t.done);
    let target = { ...SPOTS.slip, zone: 'island' };
    if (next && next.missing && next.missing.length) target = next.missing[0].pos;
    if (next && next.id === 'p12') target = { ...SPOTS.lagoon, zone: 'island' };
    return { title: 'Das Solarboot', text: 'Bau das Boot nach Henriks Plan und bring es zur Schifffahrtsroute.', steps: tasks.map(t => ({ t: t.label + (t.missing && t.missing.length && !t.done ? ` <small>– fehlt: ${t.missing.map(m => m.name).join(', ')}</small>` : ''), d: t.done })), target, hint: next ? next.hint : '' };
  }

  boatTasks() {
    const G = this.G, s = G.solved, inv = (k) => G.inv[k] || 0;
    const pk = (id, name) => { const p = PICKUPS.find(q => q.id === id); return { name, pos: { x: p.wx, z: p.wz, zone: p.zone || 'island' } }; };
    const ct = (k, name) => ({ name, pos: this.containerDoor(k) });
    const miss = (list) => list.filter(Boolean);
    return [
      { id: 'p8', label: 'Rumpf bauen', done: !!s.p8, missing: miss([inv('schwimmer') < 2 && (G.picked.p_schwimmer1 ? pk('p_schwimmer2', 'Schwimmkörper (Lagune)') : pk('p_schwimmer1', 'Schwimmkörper (beim Wrack)')), !inv('alu') && ct('contC', 'Aluprofile'), !inv('schrauben') && pk('w_schrauben', 'Schrauben (Maschinenraum)')]), hint: 'Zwei Schwimmkörper hat das Meer angespült: einen beim Wrack, einen an der Lagune im Westen. Schrauben liegen im Maschinenraum.' },
      { id: 'p7', label: 'Motor prüfen', done: !!s.p7, missing: miss([!inv('motor') && ct('contC', 'Motor'), !inv('multimeter') && pk('w_multi', 'Multimeter (Laderaum)')]), hint: 'Der Motor lag im Wasser. Miss ihn durch, bevor du ihn anschließt – das Multimeter war im Werkstattschrank im Laderaum.' },
      { id: 'p9', label: 'Antrieb montieren', done: !!s.p9, needs: ['p8', 'p7'], missing: miss([!inv('riemen') && pk('w_riemen', 'Zahnriemen-Satz (Maschinenraum)'), !inv('propeller') && ct('contB', 'Propeller')]), hint: 'Riemenscheiben liegen im Ersatzteilregal im Maschinenraum, der Propeller war im blauen Container.' },
      { id: 'p10', label: 'Steuerung verdrahten', done: !!s.p10, needs: ['p9'], missing: miss([!inv('relais') && pk('w_relais', 'Relais-Set (Laderaum)')]), hint: 'Das Relais-Set liegt bei den Schaltschrank-Ersatzteilen im Laderaum.' },
      { id: 'p12', label: 'Notfunkbake aktivieren (Lagune)', done: !!s.p12, missing: [], hint: 'An der Lagune im Westen liegt eine Rettungsinsel-Kiste. Da muss eine Bake drin sein.' },
      { id: 'p11', label: 'Systemcheck und Ablegen', done: !!s.p11, needs: ['p8', 'p9', 'p10', 'p12'], missing: [], hint: 'Rechne nach, ob die Energie bis zur Schifffahrtsroute reicht.' },
    ];
  }

  nearestPickup(item) {
    const p = this.player.pos;
    let best = null, bd = 1e9;
    for (const pk of PICKUPS) if (pk.item === item && this.pickupVisible(pk) && !pk.zone) { const d = Math.hypot(pk.wx - p.x, pk.wz - p.z); if (d < bd) { bd = d; best = pk; } }
    return best ? { x: best.wx, z: best.wz, zone: 'island' } : null;
  }

  containerDoor(k) {
    const c = this.W[k];
    const v = new THREE.Vector3(c.userData.size.L / 2 + 1.3, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), c.rotation.y);
    return { x: c.position.x + v.x, z: c.position.z + v.z, zone: 'island' };
  }

  questHTML() {
    const o = this.objective();
    this._obj = o;
    return `<div class="q-title">${o.title}</div><div class="q-text">${o.text}</div>${o.steps.length ? '<ul>' + o.steps.map(s => `<li class="${s.d ? 'done' : ''}">${s.t}</li>`).join('') + '</ul>' : ''}`;
  }

  bauplanHTML() {
    const G = this.G;
    if (!G.flags.bauplan) return '<p class="empty">Du hast noch keinen Bauplan. Henrik sagt, er liegt in seiner Kabine im Wrack.</p>';
    const t = this.boatTasks();
    const done = (id) => t.find(x => x.id === id)?.done;
    const e = G.solved;
    return `<div class="blueprint"><svg viewBox="0 0 520 300"><defs><pattern id="gr" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0H0V20" fill="none" stroke="#3b6fb3" stroke-width=".5"/></pattern></defs>
      <rect width="520" height="300" fill="#1d4a8a"/><rect width="520" height="300" fill="url(#gr)"/>
      <g stroke="#fff" fill="none" stroke-width="1.6">
        <rect x="60" y="150" width="400" height="34" rx="17" class="${done('p8') ? 'ok' : ''}"/><rect x="60" y="196" width="400" height="34" rx="17" class="${done('p8') ? 'ok' : ''}"/>
        <path d="M90 145 H430" class="${done('p8') ? 'ok' : ''}"/><rect x="380" y="120" width="40" height="24" class="${done('p9') ? 'ok' : ''}"/>
        <circle cx="470" cy="190" r="16" class="${done('p9') ? 'ok' : ''}"/><path d="M420 132 L470 175" class="${done('p9') ? 'ok' : ''}"/>
        <rect x="120" y="40" width="240" height="14" class="${done('p11') ? 'ok' : ''}"/><path d="M130 54 V145 M350 54 V145" class="${done('p11') ? 'ok' : ''}"/>
        <rect x="200" y="112" width="60" height="30" class="${e.p5 ? 'ok' : ''}"/><rect x="290" y="112" width="34" height="30" class="${done('p10') ? 'ok' : ''}"/>
      </g>
      <g fill="#fff" font-size="11" font-family="monospace"><text x="20" y="22">SOLAR-KATAMARAN „LINDAU II“ – H. OLSEN</text>
        <text x="62" y="250">Schwimmkörper 2×, Rahmen Alu 40×40</text><text x="380" y="112">DC-Motor 1 kW</text><text x="440" y="222">Prop.</text>
        <text x="130" y="34">PV-Dach 4 × 100 W</text><text x="196" y="106">Akku 24 V</text><text x="286" y="106">Steuerung</text>
        <text x="20" y="285">i = 3 (Zahnriemen) · Sicherung am Pluspol! · Reißleine nicht vergessen!</text></g></svg></div>
      <ul class="plan-list">${t.map(x => `<li class="${x.done ? 'done' : ''}">${x.label}</li>`).join('')}</ul>`;
  }

  mapMarkers() {
    const G = this.G, f = G.flags;
    const m = [{ ...SPOTS.camp, label: f.camp ? 'Lager' : 'Lagerplatz', color: '#ffcf5a' }, { ...this.W.wreckEntry, label: 'Wrack', color: '#ff7a5a' }, { ...SPOTS.spring, label: 'Quelle', color: '#6ad4ff' }];
    m.push({ ...this.containerDoor('contA'), label: 'LND 4711', color: '#e05a3a' }, { ...this.containerDoor('contB'), label: 'LND 2207', color: '#4a8ad8' }, { ...this.containerDoor('contC'), label: 'LND 5530', color: '#4fbf6a' });
    if (f.bauplan) m.push({ ...SPOTS.slip, label: 'Bootsbau', color: '#c58bff' }, { ...SPOTS.lagoon, label: 'Lagune', color: '#6ad4ff' });
    const o = this._obj && this._obj.target;
    if (o && o.zone === 'island') m.push({ x: o.x, z: o.z, label: 'Ziel', color: '#ffe14d', goal: true });
    return m;
  }
  playerPos() { const p = this.player; return p.zone === 'island' ? { x: p.pos.x, z: p.pos.z, facing: p.facing } : { ...this.W.wreckEntry, facing: p.facing }; }

  // ---------- Interaktionen ----------
  interactables() {
    const G = this.G, f = G.flags, s = G.solved, W = this.W, list = [];
    const add = (o) => list.push(o);
    for (const pk of PICKUPS) {
      if (!this.pickupVisible(pk)) continue;
      add({ x: pk.wx, z: pk.wz, zone: pk.zone || 'island', r: 1.8, label: pk.label ? `${pk.label} durchsuchen` : `Aufheben: ${ITEMS[pk.item].name}`, act: () => this.pickUp(pk) });
    }
    // Container
    for (const k of ['contA', 'contB', 'contC']) {
      if (f[k + '_open'] && f[k + '_looted']) continue;
      const d = this.containerDoor(k);
      add({ ...d, r: 2.4, label: f[k + '_open'] ? `${CONTAINERS[k].name} ausräumen` : `${CONTAINERS[k].name} öffnen`, act: () => this.useContainer(k) });
    }
    // Quelle
    add({ ...SPOTS.spring, zone: 'island', r: 2.6, label: 'An der Quelle trinken', act: () => { G.stats.thirst = 100; f.drank = true; f.springFound = true; this.audio.sfx('drink'); this.ui.toast('💧 Frisches Quellwasser!'); } });
    // Kokospalmen am Lager
    for (const [i, x, z] of [[0, SPOTS.camp.x - 9, SPOTS.camp.z + 4], [1, SPOTS.camp.x + 10, SPOTS.camp.z + 8]]) {
      add({ x, z, zone: 'island', r: 2.2, label: 'Kokosnüsse pflücken', act: () => {
        const cd = G.cooldown['palm' + i] || 0;
        if (G.playTime < cd) { this.ui.toast('Hier hängt gerade nichts Reifes mehr.'); return; }
        G.cooldown['palm' + i] = G.playTime + 90; this.player.interactAnim = 1; this.give('kokos', 2);
      } });
    }
    // Lager
    if (!f.camp) add({ ...SPOTS.camp, zone: 'island', r: 3, label: 'Lager errichten', act: () => this.buildCamp() });
    else {
      const sh = W.shelter.position;
      if (!f.radio) add({ x: sh.x + 1.5, z: sh.z + 2, zone: 'island', r: 2.6, label: 'Funkgerät reparieren', act: () => this.startPuzzle('p2') });
      add({ x: sh.x, z: sh.z, zone: 'island', r: 2.5, label: this.canSleep() ? 'Schlafen (bis zum Morgen)' : 'Kurz ausruhen', act: () => this.sleep() });
    }
    // Energiestation
    if (G.day >= 2 && f.bauplan && !(s.p4 && s.p5 && s.p6)) add({ ...W.energySite, x: W.energySite.x + 1, z: W.energySite.z - 2, zone: 'island', r: 3, label: 'Energiestation bauen', act: () => this.workbench('energy') });
    // Boot
    if (f.bauplan && G.day >= 3) add({ ...SPOTS.slip, z: SPOTS.slip.z - 3, zone: 'island', r: 3.6, label: s.p11 ? 'Ablegen!' : 'Am Boot arbeiten', act: () => s.p11 ? this.launch() : this.workbench('boat') });
    // Lagune: Bake
    if (f.bauplan && !s.p12) add({ ...SPOTS.lagoon, zone: 'island', r: 2.4, label: 'Rettungsinsel-Kiste öffnen', act: () => {
      if (G.day < 3) { this.say([{ who: 'Jana', text: 'Eine Rettungsinsel-Kiste! Darin ist bestimmt eine Notfunkbake. Die nehme ich mit, wenn das Boot fertig ist.' }]); return; }
      if (!this.has('bake')) { this.give('bake'); this.addDoc('handbuch_bake'); }
      this.startPuzzle('p12');
    } });
    // Wrack
    add({ ...W.wreckEntry, zone: 'island', r: 3, label: 'Durch das Leck ins Wrack klettern', act: () => this.enterWreck() });
    add({ x: IX - 2.5, z: IZ - 7.2, zone: 'wrack', r: 2.2, label: 'Wrack verlassen', act: () => this.exitWreck() });
    if (!s.p3) add({ x: IX, z: IZ + 11.2, zone: 'wrack', r: 2.4, label: 'Schott zum Maschinenraum untersuchen', act: () => { this.addDoc('schild_hydraulik'); this.startPuzzle('p3'); } });
    return list;
  }

  pickUp(pk) {
    const G = this.G;
    G.picked[pk.id] = true;
    this.pickupObjs[pk.id].visible = false;
    this.player.interactAnim = 1;
    this.audio.sfx('pickup');
    this.give(pk.item, pk.n);
    if (pk.doc) this.addDoc(pk.doc);
    if (pk.id === 'p_wasser1') this.say([{ who: 'Jana', text: 'Wasserflaschen! Und eine Ladeliste der LINDAU – die Kiste muss von Bord gespült worden sein.' }, { who: 'Jana', text: 'Erst mal trinken. <i>(Tab drücken → Rucksack → Wasserflasche → Trinken)</i>' }]);
    if (pk.item === 'akku') this.say([{ who: 'Jana', text: 'Der Notstrom-Akku – 24 Volt, 100 Amperestunden. Schwer, aber den brauche ich!' }]);
    if (pk.id === 'w_bauplan') this.onBauplan();
    this.save(true);
  }

  useContainer(k) {
    const G = this.G, f = G.flags, C = CONTAINERS[k];
    const open = () => { f[k + '_open'] = true; this.audio.sfx('metal'); this.animateDoor(this.W[k]); setTimeout(() => this.loot(k), 900); };
    if (f[k + '_open']) { this.loot(k); return; }
    if (C.req && !f[C.req]) { this.say([{ who: 'Jana', text: 'Der Container ist verbeult und verriegelt. Bevor ich mich hier abmühe, sollte ich wissen, was ich eigentlich brauche.' }]); return; }
    if (k === 'contA') {
      if (!this.has('rohr')) { this.say([{ who: 'Jana', text: 'Der Verschlusshebel ist festgerostet. Mit bloßen Händen keine Chance – ich brauche etwas als Hebelverlängerung.' }]); return; }
      this.startPuzzle('p1');
      return;
    }
    if (!this.has('rohr')) { this.say([{ who: 'Jana', text: 'Klemmt. Mit dem Stahlrohr könnte ich den Hebel lösen.' }]); return; }
    this.ui.progress('Hebel mit dem Rohr lösen …', 1.6).then(open);
  }

  animateDoor(c) { let t = 0; const step = () => { t = Math.min(1, t + 0.03); c.userData.open(t); if (t < 1) requestAnimationFrame(step); }; step(); }

  loot(k) {
    const G = this.G, C = CONTAINERS[k];
    const p = this.ui.openModal('loot');
    const items = Object.entries(C.items);
    p.innerHTML = `<h2>${C.name}</h2><div class="loot">${items.map(([id, n]) => `<div class="loot-it">${ITEMS[id].icon}<b>${n > 1 ? n + ' × ' : ''}${ITEMS[id].name}</b><small>${ITEMS[id].desc}</small></div>`).join('')}</div>`;
    const b = document.createElement('button'); b.className = 'btn primary'; b.textContent = 'Alles einpacken';
    b.onclick = () => {
      this.ui.closeModal();
      for (const [id, n] of items) this.give(id, n);
      if (C.doc) this.addDoc(C.doc);
      G.flags[k + '_looted'] = true;
      this.audio.sfx('pickup');
      if (k === 'contA') this.say([{ who: 'Jana', text: 'Werkzeug, eine Plane, Konserven … und ein Handfunkgerät! Wenn ich das zum Laufen bringe, erreiche ich vielleicht jemanden.' }, { who: 'Jana', text: 'Aber zuerst brauche ich einen Unterschlupf. Im Palmenhain hinter dem Strand ist ein guter Platz.' }]);
      if (k === 'contC') this.say([{ who: 'Jana', text: 'Der Motor ist nass geworden. Bevor ich den anschließe, sollte ich ihn durchmessen.' }]);
      this.save(true);
    };
    p.append(b);
  }

  buildCamp() {
    const G = this.G;
    const miss = [];
    if (!this.has('holz', 4)) miss.push(`Treibholz (${G.inv.holz || 0}/4)`);
    if (!this.has('plane')) miss.push('eine Plane');
    if (miss.length) { this.say([{ who: 'Jana', text: `Hier wäre ein guter Platz. Mir fehlt noch: ${miss.join(' und ')}.` }]); return; }
    this.ui.progress('Lager errichten …', 2.5).then(() => {
      this.take('holz', 4); this.take('plane');
      G.flags.camp = true; this.audio.sfx('build');
      this.applyWorldState();
      this.ui.toast('🏕️ Lager errichtet – hier kannst du schlafen und speichern.');
      this.say([{ who: 'Jana', text: 'Nicht gerade ein Hotel, aber trocken. Jetzt das Funkgerät …' }]);
      this.save(true);
    });
  }

  canSleep() { const G = this.G; return (G.day === 1 && G.flags.radio) || (G.day === 2 && G.solved.p6); }

  async sleep() {
    const G = this.G;
    if (!this.canSleep()) {
      await this.ui.fade(true, 600);
      G.stats.energy = Math.min(100, G.stats.energy + 45);
      this.env.time = Math.min(this.timeCap(), this.env.time + 1);
      await this.ui.fade(false, 600);
      this.ui.toast('⚡ Ausgeruht. Energie aufgefüllt.');
      this.save(true);
      return;
    }
    await this.ui.fade(true, 1000);
    const lines = G.day === 1
      ? ['<p>Die Nacht ist warm. Die Brandung rauscht.</p><p>Henriks Stimme geht dir nicht aus dem Kopf: <i>„Der Bauplan liegt in meiner Kabine.“</i></p>']
      : ['<p>Der Sturm heult die ganze Nacht. Die Plane knattert, das Windrad surrt.</p><p>Gegen Morgen wird es still.</p>'];
    await this.ui.cards(lines);
    G.day++;
    this.env.time = G.day === 2 ? 7 : 7.5;
    G.stats.energy = 100; G.stats.thirst = Math.max(15, G.stats.thirst - 25); G.stats.hunger = Math.max(15, G.stats.hunger - 25);
    this.applyWorldState();
    this.env.storm = this.env.stormTarget = this.stormWanted();
    this.player.teleport(this.W.shelter.position.x + 1.5, undefined, this.W.shelter.position.z + 2.5, 0.4);
    await this.ui.fade(false, 1200);
    this.save();
    if (G.day === 2) await this.say([{ who: 'Henrik', radio: true, text: 'LINDAU-Rettungsinsel an Jana, hörst du mich? Guten Morgen! Uns geht es gut, wir treiben nach Südwesten.' }, { who: 'Henrik', radio: true, text: 'Heute holst du meinen Bauplan aus dem Wrack. Das Schott zum Maschinenraum ist hydraulisch – vielleicht klemmt es.' }]);
    if (G.day === 3) await this.say([{ who: 'Henrik', radio: true, text: 'Jana! Die Sonne scheint, der Sturm ist durch. Ein perfekter Tag zum Bootsbau.' }, { who: 'Henrik', radio: true, text: 'Laut Seekarte verläuft die Schifffahrtsroute etwa 45 Kilometer südöstlich. Bau das Boot nach meinem Plan – Schritt für Schritt.' }]);
  }

  // ---------- Werkbank-Menüs ----------
  workbench(kind) {
    const G = this.G, s = G.solved;
    const p = this.ui.openModal('bench');
    let tasks;
    if (kind === 'energy') {
      const base = ['akku', 'regler', 'kabel', 'sicherungen'];
      const missE = (ids) => ids.filter(i => !this.has(i, i === 'solar' ? 4 : 1)).map(i => ITEMS[i].name + (i === 'solar' ? ` (${G.inv.solar || 0}/4)` : ''));
      tasks = [
        { id: 'p4', label: 'Solarfeld verschalten', done: s.p4, missing: missE([...base, 'solar']) },
        { id: 'p5', label: 'Antrieb absichern (Sicherung und Leitung)', done: s.p5, missing: s.p4 ? missE(['sicherungen', 'kabel']) : ['erst das Solarfeld'] },
        { id: 'p6', label: 'Kleinwindanlage mit Gleichrichter', done: s.p6, missing: !s.p5 ? ['erst die Absicherung'] : missE(['wind', 'dioden']) },
      ];
    } else {
      tasks = this.boatTasks().filter(t => t.id !== 'p12').map(t => {
        const pre = (t.needs || []).filter(n => !s[n]).map(n => this.boatTasks().find(x => x.id === n).label);
        return { id: t.id, label: t.label, done: t.done, missing: pre.length ? pre.map(x => 'erst: ' + x) : t.missing.map(m => m.name) };
      });
    }
    p.innerHTML = `<h2>${kind === 'energy' ? 'Energiestation' : 'Bootsbau – „LINDAU II“'}</h2><div class="bench"></div>`;
    const list = p.querySelector('.bench');
    for (const t of tasks) {
      const row = document.createElement('div'); row.className = 'bench-row' + (t.done ? ' done' : '');
      row.innerHTML = `<div><b>${t.label}</b><small>${t.done ? 'erledigt ✓' : t.missing.length ? 'Fehlt: ' + t.missing.join(', ') : 'bereit – ' + PUZZLES[t.id].lf}</small></div>`;
      if (!t.done) {
        const b = document.createElement('button'); b.className = 'btn primary'; b.textContent = 'Arbeiten';
        b.disabled = !!t.missing.length;
        b.onclick = () => { this.ui.closeModal(); this.startPuzzle(t.id); };
        row.append(b);
      }
      list.append(row);
    }
    const c = document.createElement('button'); c.className = 'btn ghost'; c.textContent = 'Schließen'; c.onclick = () => this.ui.closeModal();
    p.append(c);
  }

  startPuzzle(id) {
    if (this.G.solved[id]) return;
    runPuzzle(id, this.G, this.ui, {
      hints: HINTS,
      sound: (n) => this.audio.sfx(n),
      openDocs: () => { this._returnPuzzle = id; this.ui.openBag(this.G, this, 'docs'); this.addBackButton(id); },
      onSolve: (pid) => this.onSolve(pid),
    });
  }
  addBackButton(id) {
    const head = document.querySelector('.bag-head');
    if (!head) return;
    const b = document.createElement('button'); b.className = 'btn primary back'; b.textContent = '← Zurück zur Aufgabe';
    b.onclick = () => { this.ui.closeModal(); this.startPuzzle(id); };
    head.append(b);
  }

  async onSolve(id) {
    const G = this.G, s = G.solved;
    s[id] = true;
    G.log.push(id);
    this.audio.sfx('solve');
    this.ui.toast(`📘 Logbuch-Eintrag: ${LOG[id].title}`, 'log');
    switch (id) {
      case 'p1':
        G.flags.contA_open = true; this.animateDoor(this.W.contA); this.audio.sfx('metal');
        setTimeout(() => this.loot('contA'), 1000);
        break;
      case 'p2':
        G.flags.radio = true;
        this.take('batterien');
        await this.say([
          { who: 'Jana', text: 'Mayday, Mayday, hier ist Jana Brandl von der LINDAU. Hört mich jemand?' },
          { who: 'Henrik', radio: true, text: 'Jana?! Hier Henrik! Gott sei Dank, du lebst! Wir sind in der Rettungsinsel – alle elf. Wir dachten, du bist ertrunken!' },
          { who: 'Jana', text: 'Henrik! Ich bin auf einer Insel gestrandet. Die LINDAU liegt hier auf dem Riff.' },
          { who: 'Henrik', radio: true, text: 'Unser Notsender ist hin, die Strömung treibt uns weg. Ich kann dich nicht holen … Aber hör zu: In meiner Kabine im Maschinenraum liegt mein Bauplan für ein Solarboot.' },
          { who: 'Henrik', radio: true, text: 'Die halbe Ladung besteht aus Solar- und Antriebstechnik. Du bist Mechatronikerin – du kannst das bauen! Ich helfe dir per Funk. <i>(Taste F)</i>' },
          { who: 'Henrik', radio: true, text: 'Aber nicht mehr heute. Es wird dunkel. Ruh dich aus. Henrik Ende.' },
        ]);
        this.env.time = Math.max(this.env.time, 19.1);
        break;
      case 'p3':
        this.interior.openDoor(); this.audio.sfx('door');
        this.updateZoneBounds();
        this.say([{ who: 'Jana', text: 'Es bewegt sich! … Der Maschinenraum. Henriks Schreibtisch muss hinten rechts sein.' }]);
        break;
      case 'p4':
        this.take('solar', 4); this.take('regler');
        this.applyWorldState();
        break;
      case 'p5':
        this.take('akku');
        this.applyWorldState();
        G.flags.stormEvent = true;
        this.env.time = Math.max(this.env.time, 16.2);
        this.env.stormTarget = 1;
        await this.say([
          { who: 'Jana', text: 'Die Lichterkette leuchtet! Der Akku wird geladen.' },
          { who: 'Henrik', radio: true, text: 'Saubere Arbeit! Aber pass auf: Das Barometer fällt. Da zieht ein Sturm auf.' },
          { who: 'Henrik', radio: true, text: 'Im grünen Container LND 5530 ist eine Kleinwindanlage. Bei Sturm liefert die richtig Energie – aber Wechselstrom. Du brauchst einen Gleichrichter.' },
        ]);
        break;
      case 'p6':
        this.take('wind'); this.take('dioden');
        this.applyWorldState();
        await this.say([{ who: 'Henrik', radio: true, text: 'Hörst du das Windrad surren? Der Akku wird über Nacht voll. Jetzt ab in den Unterstand!' }]);
        break;
      case 'p7': break;
      case 'p8': this.take('schwimmer', 2); this.take('alu'); this.take('schrauben'); this.applyWorldState(); break;
      case 'p9': this.take('riemen'); this.take('propeller'); this.take('motor'); this.applyWorldState(); break;
      case 'p10': this.take('relais'); this.applyWorldState(); break;
      case 'p12':
        this.take('bake');
        await this.say([{ who: 'Jana', text: 'Gruppen-ID eingestellt. Die Bake kommt mit aufs Boot – in der Nähe der Schifffahrtsroute schalte ich sie ein.' }]);
        break;
      case 'p11':
        this.applyWorldState();
        await this.say([
          { who: 'Henrik', radio: true, text: '56 Kilometer Reichweite, 45 brauchst du. Das reicht! Jana … du hast das wirklich gebaut.' },
          { who: 'Jana', text: 'Mit deinem Plan, Henrik. Und mit dem, was ich in der Berufsschule gelernt habe.' },
          { who: 'Henrik', radio: true, text: 'Dann leg ab! Reißleine ans Handgelenk und Kurs Südost. Wir sehen uns auf dem Schiff!' },
        ]);
        break;
    }
    this.save(true);
  }

  async onBauplan() {
    this.applyWorldState();
    await this.say([
      { who: 'Jana', text: 'Henriks Bauplan! Ein Solar-Katamaran: zwei Schwimmkörper, Alurahmen, Elektromotor, Solardach.' },
      { who: 'Henrik', radio: true, text: 'Hast du ihn? Wunderbar! Zuerst brauchst du Energie: Akku und Laderegler stehen hier im Maschinenraum. Kabel und Sicherungen findest du im Laderaum.' },
      { who: 'Henrik', radio: true, text: 'Die Solarmodule waren im blauen Container LND 2207. Bau am Lager eine Energiestation auf – alles Weitere im Bauplan (Rucksack).' },
    ]);
  }

  radioCall() {
    if (!this.G.flags.radio) { this.ui.toast('Das Funkgerät funktioniert noch nicht.'); return; }
    const o = this.objective();
    this.audio.sfx('radio');
    this.say([{ who: 'Jana', text: 'Henrik, hier Jana. Was soll ich als Nächstes tun?' }, { who: 'Henrik', radio: true, text: o.hint || 'Du machst das gut. Weiter so!' }]);
  }

  say(lines) { return this.ui.say(lines); }

  // ---------- Wrack betreten / verlassen ----------
  async enterWreck() {
    await this.ui.fade(true, 500);
    this.setZone('wrack');
    this.player.teleport(IX - 2.5, 0, IZ - 6, 0);
    if (!this.G.flags.wreckVisited) {
      this.G.flags.wreckVisited = true;
      setTimeout(() => this.say([{ who: 'Jana', text: 'Der Laderaum … alles schief und nass. Hinten ist das Schott zum Maschinenraum.' }]), 700);
    }
    await this.ui.fade(false, 600);
    this.save(true);
  }
  async exitWreck() {
    await this.ui.fade(true, 500);
    this.setZone('island');
    const e = this.W.wreckEntry;
    this.player.teleport(e.x - 2.5, undefined, e.z + 1.5, -1.2);
    await this.ui.fade(false, 600);
    this.save(true);
  }
  setZone(z, instant) {
    this.player.zone = z;
    this.interior.group.visible = z === 'wrack';
    this.env.indoor = z === 'wrack';
    this.updateZoneBounds();
  }
  updateZoneBounds() {
    if (this.player.zone !== 'wrack') { this.player.zoneBounds = null; return; }
    this.player.zoneBounds = { x0: ROOM.x0, x1: ROOM.x1, z0: ROOM.z0, z1: this.interior.doorOpen ? ROOM.z1 : ROOM.wallZ - 0.3, floor: 0, ceil: ROOM.ceil };
  }

  // ---------- Zeit ----------
  timeCap() {
    const G = this.G, s = G.solved;
    if (G.day === 1) return G.flags.radio ? 23.8 : 18.9;
    if (G.day === 2) return s.p5 ? (s.p6 ? 23.8 : 19.5) : 16.0;
    return 17.5;
  }

  // ---------- Hauptschleife ----------
  update(dt) {
    if (!this.active) return;
    this.t += dt;
    const G = this.G, ui = this.ui, p = this.player;
    const paused = ui.busy;
    if (this.boatMode) { this.updateBoat(dt); return; }
    p.enabled = !paused;
    const mv = p.update(paused ? 0 : dt, G.stats);
    if (!paused) {
      G.playTime += dt;
      // Uhrzeit
      const cap = this.timeCap();
      if (this.env.time < cap) this.env.time = Math.min(cap, this.env.time + dt / 150);
      // Überleben
      const run = mv.running ? 2.6 : 1;
      G.stats.thirst = Math.max(0, G.stats.thirst - dt * 0.13 * (this.env.storm > 0.5 ? 0.6 : 1));
      G.stats.hunger = Math.max(0, G.stats.hunger - dt * 0.07);
      G.stats.energy = Math.max(0, G.stats.energy - dt * 0.045 * run);
      if (G.stats.thirst <= 0 || G.stats.hunger <= 0) {
        G.faintTimer += dt;
        if (G.faintTimer > 1 && !this._warned) { this._warned = true; ui.toast(G.stats.thirst <= 0 ? '⚠️ Du verdurstest! Trink sofort etwas!' : '⚠️ Du bist völlig entkräftet! Iss etwas!', 'warn'); }
        if (G.faintTimer > 25) this.faint();
      } else { G.faintTimer = 0; this._warned = false; }
      if (G.stats.thirst < 25 && !this._thirstNote && G.flags.drank) { this._thirstNote = true; ui.toast('💧 Du hast Durst.'); }
      if (G.stats.thirst > 40) this._thirstNote = false;
      if (G.stats.hunger < 25 && !this._hungerNote) { this._hungerNote = true; ui.toast('🍖 Dein Magen knurrt.'); }
      if (G.stats.hunger > 40) this._hungerNote = false;
      // Schritte
      if (mv.moving && p.grounded) {
        this.stepT -= dt * (mv.running ? 1.6 : 1);
        if (this.stepT <= 0) { this.stepT = 0.42; this.audio.sfx(p.zone === 'wrack' ? 'stepMetal' : mv.depth > 0.1 ? 'stepWater' : 'step'); }
      }
      // Autosave
      if (G.playTime - this.lastSave > 60) { this.lastSave = G.playTime; this.save(true); }
    }
    // Lampe nachts/innen
    const lampOn = (this.env.isNight || p.zone === 'wrack' || this.env.storm > 0.6) && this.has('werkzeug');
    p.model.lamp.intensity = lampOn ? (p.zone === 'wrack' ? 9 : 40) : 0;
    // Feuer
    this.W.fire.userData.lit = G.flags.camp && (this.env.time > 17.5 || this.env.time < 7.5 || this.env.storm > 0.3);
    this.W.fire.userData.update(this.t, dt);
    this.W.lights.userData.set(!!G.solved.p5 && (this.env.time > 17 || this.env.time < 7.5 || this.env.storm > 0.3));
    // Windrad
    if (this.W.turbine.visible) this.W.turbine.userData.rotor.rotation.z += dt * (2 + this.env.storm * 16);
    for (const m of [this.W.campMarker, this.W.energyMarker, this.W.boatMarker]) m.visible && m.userData.update(this.t);
    // Wrack-Lampe blinkt
    this.W.wreck.userData.lamp.intensity = (Math.sin(this.t * 3) > 0.6) ? 20 : 0;
    for (const [id, o] of Object.entries(this.pickupObjs)) {
      if (!o.visible && !G.picked[id]) { const pk = PICKUPS.find(q => q.id === id); if (this.pickupVisible(pk)) o.visible = true; }
      if (o.visible) { const pk = PICKUPS.find(q => q.id === id); if (!this.pickupVisible(pk)) o.visible = false; o.userData.sparkle.material.opacity = 0.5 + Math.sin(this.t * 4 + o.position.x) * 0.4; }
    }
    if (p.zone === 'wrack') this.interior.update(this.t, dt);

    // Interaktion
    let best = null;
    if (!paused) {
      let bd = 1e9;
      const fx = Math.sin(p.facing), fz = Math.cos(p.facing);
      for (const it of this.interactables()) {
        if (it.zone !== p.zone) continue;
        const dx = it.x - p.pos.x, dz = it.z - p.pos.z, d = Math.hypot(dx, dz);
        if (d > it.r) continue;
        const score = d - (d > 0.01 ? (dx * fx + dz * fz) / d : 1) * 0.6;
        if (score < bd) { bd = score; best = it; }
      }
    }
    this.current = best;
    ui.prompt(best ? best.label : null);

    // HUD
    if ((this._hudT = (this._hudT || 0) - dt) <= 0) {
      this._hudT = 0.2;
      const o = this.objective();
      const markers = [];
      if (o.target && o.target.zone === p.zone) {
        const dx = o.target.x - p.pos.x, dz = o.target.z - p.pos.z;
        markers.push({ bearing: (Math.atan2(dx, -dz) * 180 / Math.PI + 360) % 360, dist: Math.hypot(dx, dz) });
      } else if (o.target && p.zone === 'wrack') {
        markers.push({ bearing: 180, dist: 9999, color: '#ffffff' });
      }
      ui.updateHUD(G, this.env, this.questHTML(), p.camYaw, markers);
    }
  }

  interact() {
    if (this.ui.busy || !this.current) return;
    this.player.interactAnim = 1;
    this.audio.sfx('click');
    this.current.act();
  }

  async faint() {
    const G = this.G;
    G.faintTimer = 0; G.faints++; G.mistakes++;
    this.active = false;
    await this.ui.fade(true, 1500);
    await this.ui.cards(['<p>Dir wird schwarz vor Augen …</p><p><small>Ohnmacht: Achte auf Durst und Hunger! Trinken kannst du an der Quelle oder aus Flaschen, essen über den Rucksack (Tab).</small></p>']);
    G.stats.thirst = Math.max(G.stats.thirst, 45); G.stats.hunger = Math.max(G.stats.hunger, 45); G.stats.energy = Math.max(G.stats.energy, 40);
    if (this.player.zone === 'wrack') this.setZone('island');
    const spot = G.flags.camp ? { x: this.W.shelter.position.x + 1.5, z: this.W.shelter.position.z + 2.5 } : SPOTS.start;
    this.player.teleport(spot.x, undefined, spot.z, 0);
    this.env.time = Math.min(this.timeCap(), this.env.time + 1.5);
    this.active = true;
    await this.ui.fade(false, 1200);
    this.say([{ who: 'Jana', text: 'Uff … ich muss besser auf mich aufpassen.' }]);
  }

  // ---------- Finale: Bootsfahrt ----------
  async launch() {
    const G = this.G;
    await this.ui.fade(true, 900);
    this.boatMode = true;
    const boat = this.W.boat;
    this.boat = { x: SPOTS.slip.x + 2, z: SPOTS.slip.z + 22, heading: Math.PI * 0.85, speed: 0, energy: 100, dist0: 0, bakeOn: false, arrived: false };
    boat.rotation.set(0, this.boat.heading, 0);
    this.player.model.root.visible = true;
    this.player.sitting = true;
    this.rescueShip.visible = true;
    this.env.time = 8;
    this.ui.showHUD(false);
    this.ui.screen(`<div class="boat-hud"><div><small>AKKU</small><b id="bh-e">100 %</b></div><div><small>FAHRT</small><b id="bh-v">0 km/h</b></div><div><small>ZUR ROUTE</small><b id="bh-d">–</b></div><div class="bh-keys">W/S Gas · A/D lenken</div></div>`);
    document.getElementById('screen').classList.add('pass');
    await this.ui.fade(false, 1200);
    await this.say([{ who: 'Jana', text: 'Reißleine ist dran. Kurs Südost … Los geht’s!' }]);
  }

  updateBoat(dt) {
    const b = this.boat, k = this.player.keys, boat = this.W.boat, cam = this.player.camera;
    const busy = this.ui.busy;
    if (!busy && !b.arrived) {
      const thr = (k.KeyW || k.ArrowUp ? 1 : 0) - (k.KeyS || k.ArrowDown ? 0.5 : 0);
      const steer = (k.KeyA || k.ArrowLeft ? 1 : 0) - (k.KeyD || k.ArrowRight ? 1 : 0);
      b.speed = lerp(b.speed, thr * 11, dt * 0.6);
      b.heading += steer * dt * 0.7 * clamp(Math.abs(b.speed) / 4, 0.25, 1);
      b.energy = Math.max(5, b.energy - Math.abs(b.speed) * dt * 0.012);
    } else b.speed = lerp(b.speed, 0, dt * 0.8);
    const nx = b.x + Math.sin(b.heading) * b.speed * dt, nz = b.z + Math.cos(b.heading) * b.speed * dt;
    if (heightAt(nx, nz) < -0.7) { b.x = nx; b.z = nz; } else b.speed *= -0.3;
    const t = this.t, st = this.env.storm;
    const y = waveHeight(b.x, b.z, t, st);
    boat.position.set(b.x, y - 0.15, b.z);
    boat.rotation.set((waveHeight(b.x, b.z + 2, t, st) - waveHeight(b.x, b.z - 2, t, st)) * 0.2, b.heading, (waveHeight(b.x - 1, b.z, t, st) - waveHeight(b.x + 1, b.z, t, st)) * 0.25);
    boat.userData.parts.prop.rotation.z += b.speed * dt * 3;
    // Jana sitzt am Steuer
    const seat = new THREE.Vector3(0, 0.75, 0.2).applyEuler(boat.rotation).add(boat.position);
    const m = this.player.model;
    m.root.position.copy(seat); m.root.rotation.y = b.heading;
    m.hips.position.y = 0.55; m.limbs.hipL.rotation.x = m.limbs.hipR.rotation.x = -1.4; m.limbs.knL.rotation.x = m.limbs.knR.rotation.x = 1.4;
    m.limbs.shR.rotation.x = -0.9; m.limbs.shL.rotation.x = -0.5;
    // Kamera hinter dem Boot
    const camWant = new THREE.Vector3(-Math.sin(b.heading) * 11, 5, -Math.cos(b.heading) * 11).add(boat.position);
    cam.position.lerp(camWant, 1 - Math.exp(-dt * 3));
    cam.lookAt(boat.position.x + Math.sin(b.heading) * 6, boat.position.y + 1.5, boat.position.z + Math.cos(b.heading) * 6);
    this.player.pos.copy(boat.position);
    // Rettungsschiff
    const ship = this.rescueShip;
    const dx = ship.position.x - b.x, dz = ship.position.z - b.z, dist = Math.hypot(dx, dz);
    if (!b.bakeOn && dist < 420) {
      b.bakeOn = true; this.audio.sfx('radio');
      this.say([{ who: 'Jana', text: 'Ein Schiff am Horizont! Bake an – Sicherungsstift ziehen, Schalter auf ON!' }, { who: 'Funk', radio: true, text: '„AIS-SART-Signal empfangen. Hier MV NORDKAP. Wir sehen Sie. Wir drehen bei, halten Sie Kurs!“' }]).then(() => this.audio.sfx('horn'));
    }
    if (b.bakeOn && !b.arrived) {
      // Schiff kommt entgegen
      const sp = 4 * dt; ship.position.x -= dx / dist * sp; ship.position.z -= dz / dist * sp;
      ship.rotation.y = lerp(ship.rotation.y, Math.atan2(-dx, -dz), dt * 0.2);
    }
    if (!b.arrived && dist < 55) { b.arrived = true; this.finish(); }
    const ee = document.getElementById('bh-e'); if (ee) {
      ee.textContent = Math.round(b.energy) + ' %';
      document.getElementById('bh-v').textContent = Math.round(Math.abs(b.speed) * 3.6 / 1.6) + ' km/h';
      document.getElementById('bh-d').textContent = b.bakeOn ? 'Schiff in Sicht!' : Math.max(0, Math.round((dist - 55) / 11.5)) + ' km';
    }
    this.audioState = { motor: Math.abs(b.speed) / 11 };
  }

  async finish() {
    const G = this.G;
    this.audio.sfx('horn');
    await this.say([{ who: 'Funk', radio: true, text: '„MV NORDKAP an Solarboot: Wir lassen die Lotsenleiter runter. Willkommen an Bord!“' },
      { who: 'Henrik', radio: true, text: 'Jana? Die NORDKAP hat uns vor einer Stunde aufgefischt – dank deines Bakensignals haben sie den Kurs geändert! Wir sehen dich!' }]);
    await this.ui.fade(true, 1500);
    this.clearSave();
    const grade = this.grade();
    const mins = Math.round(G.playTime / 60);
    const lfs = [['LF 1', 'Funktionszusammenhänge, Energiefluss', ['p4', 'p11']], ['LF 2', 'Mechanische Teilsysteme', ['p1', 'p8', 'p9']], ['LF 3', 'Elektrische Betriebsmittel, Sicherheit', ['p2', 'p4', 'p5', 'p6', 'p7']], ['LF 4', 'Energie- und Informationsflüsse', ['p3', 'p10']], ['LF 5', 'Kommunikation, Datenverarbeitung', ['p12']]];
    const s = this.ui.screen(`<div class="end"><h1>GERETTET</h1><p class="sub">Jana Brandl, Mechatronikerin, 1. Ausbildungsjahr – drei Tage auf einer einsamen Insel.</p>
      <div class="end-grid"><div><small>Spielzeit</small><b>${mins} min</b></div><div><small>Fehlversuche</small><b>${G.mistakes}</b></div><div><small>Funk-Tipps</small><b>${G.hintsUsed}</b></div><div><small>Ohnmachten</small><b>${G.faints}</b></div></div>
      <div class="grade"><small>Beurteilung durch den Chief</small><b>${grade.n}</b><span>${grade.t}</span></div>
      <ul class="lf-list">${lfs.map(([a, b, ids]) => `<li><b>${a}</b> ${b} <span>${ids.map(i => G.pm[i] ? `<em class="bad">${PUZZLES[i].title} (${G.pm[i]} ✗)</em>` : `<em>${PUZZLES[i].title} ✓</em>`).join('')}</span></li>`).join('')}</ul>
      <div class="end-btns"><button class="btn" id="end-log">Logbuch ansehen</button><button class="btn primary" id="end-new">Neues Spiel</button></div></div>`);
    s.classList.remove('pass');
    await this.ui.fade(false, 1200);
    s.querySelector('#end-log').onclick = () => { this.ui.openBag(G, this, 'log'); };
    s.querySelector('#end-new').onclick = () => location.reload();
    this.active = false;
  }

  grade() {
    const e = this.G.mistakes;
    const tab = [[3, '1', 'Hervorragend – du hast die Crew gerettet und kaum Fehler gemacht.'], [7, '2', 'Gut gemacht! Ein paar Patzer, aber du hattest alles im Griff.'], [12, '3', 'Befriedigend. Das Boot schwimmt – schau dir die markierten Themen nochmal an.'], [18, '4', 'Ausreichend. Wiederhole die Logbuch-Einträge mit Fehlern.'], [25, '5', 'Mangelhaft. Gerettet – aber eher mit Glück. Nochmal üben!']];
    const r = tab.find(([m]) => e <= m) || [0, '6', 'Ungenügend. Spiel es nochmal und lies die Logbuch-Einträge gründlich.'];
    return { n: r[1], t: r[2] };
  }
}
