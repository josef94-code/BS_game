'use strict';
// ------------------------------------------------------------
//  Räume: Grafik, Hotspots, Licht
// ------------------------------------------------------------
const ROOMS = {};

function firstAid(flag, n) {
  return () => {
    if (Game.flag(flag)) { Game.say('Der Erste-Hilfe-Kasten ist leer. Nur noch eine Rettungsdecke und ein abgelaufenes Pflaster.'); return; }
    Game.set(flag);
    for (let i = 0; i < n; i++) Game.give('verband', i > 0);
    Game.say(`Ein Erste-Hilfe-Kasten. Du nimmst ${n === 1 ? 'ein Verbandpäckchen' : n + ' Verbandpäckchen'} mit.`);
  };
}
function firstAidBox(ctx, x, y, s) {
  rect(ctx, x - 9 * s, y - 7 * s, 18 * s, 14 * s, '#1c7a3a');
  rect(ctx, x - 1.5 * s, y - 5 * s, 3 * s, 10 * s, '#eee'); rect(ctx, x - 5 * s, y - 1.5 * s, 10 * s, 3 * s, '#eee');
}
function warnSign(ctx, x, y, s) {
  poly(ctx, [[x, y - 6 * s], [x + 6 * s, y + 5 * s], [x - 6 * s, y + 5 * s]], '#e8c020', '#111', 0.6);
  line(ctx, x + 1 * s, y - 2 * s, x - 1 * s, y + 1 * s, '#111', 0.8); line(ctx, x - 1 * s, y + 1 * s, x + 1 * s, y + 3 * s, '#111', 0.8);
}
function barrel(ctx, x, y, s, col) {
  rect(ctx, x - 7 * s, y - 22 * s, 14 * s, 22 * s, col);
  rect(ctx, x - 7 * s, y - 16 * s, 14 * s, 1.5 * s, shade(col, 0.6)); rect(ctx, x - 7 * s, y - 7 * s, 14 * s, 1.5 * s, shade(col, 0.6));
  ellipse(ctx, x, y - 22 * s, 7 * s, 2 * s, shade(col, 1.25));
  rect(ctx, x + 3 * s, y - 22 * s, 2 * s, 22 * s, 'rgba(255,255,255,0.08)');
}

// =====================================================================
//  UMKLEIDE
// =====================================================================
ROOMS.umkleide = {
  name: 'Umkleide',
  seed: 11,
  floor: { yb: 160, yf: 270, xbl: 100, xbr: 380, xfl: -30, xfr: 510, sb: 0.66, sf: 1 },
  wallTop: 22,
  walk: { u0: 0.03, u1: 0.97, v0: 0.12, v1: 0.95 },
  blockers: [{ u0: 0.3, u1: 0.7, v0: 0.47, v1: 0.6 }],
  darkness: st => 0.74 - st.r * 0.42,
  lights(st) {
    return [
      { x: 240, y: 40, r: 170, a: 0.9, flicker: st.r < 0.5, col: 'rgba(120,140,150,0.10)' },
      { x: 446, y: 150, r: 26, a: 0.6, col: 'rgba(40,200,80,0.25)' },
    ];
  },
  drawBg(ctx, st) {
    const R = this, f = R.floor;
    shell(ctx, R, { ceil: '#0e1012', wall: mixc('#4a5a52', '#7a8a80', st.r), floor: mixc('#3a3a36', '#5a5a54', st.r), tilesU: 10, tilesV: 7, tileAlpha: 0.25 });
    wallTex(ctx, R, 'tile', null, 95, f.yb);
    rect(ctx, f.xbl, 95, f.xbr - f.xbl, 1, '#222');
    // Spinde
    for (let i = 0; i < 8; i++) {
      const u0 = 0.04 + i * 0.065, p = proj(R, u0, 0), q = proj(R, u0 + 0.063, 0);
      const h = 72 * p.s, w = q.x - p.x;
      const col = i === 6 ? '#5a4a3a' : mixc('#56606a', '#6a7884', (i % 3) * 0.3);
      rect(ctx, p.x, p.y - h, w, h, col);
      rect(ctx, p.x, p.y - h, 1, h, '#1a1d20');
      for (let k = 0; k < 4; k++) rect(ctx, p.x + 3, p.y - h + 5 + k * 2, w - 6, 1, '#222');
      rect(ctx, p.x + w - 5, p.y - h * 0.5, 2, 5, '#999');
      text(ctx, String(12 + i + (i > 4 ? 1 : 0)), p.x + w / 2, p.y - h + 16, '#ccc', 4);
      if (i === 2) { rect(ctx, p.x + 2, p.y - h + 20, w - 4, 6, '#ddd'); text(ctx, 'AZUBI', p.x + w / 2, p.y - h + 23, '#222', 3.5); }
      if (i === 6) { // Kowalskis Spind mit Kette
        for (let k = 0; k < 7; k++) rect(ctx, p.x + 1 + k * 2.4, p.y - h * 0.5 - 2 + (k % 2), 2, 1.6, '#aaa');
        rect(ctx, p.x + w / 2 - 2, p.y - h * 0.5, 4, 5, '#a88a30');
        rect(ctx, p.x + 2, p.y - h + 20, w - 4, 6, '#ddd'); text(ctx, 'K.', p.x + w / 2, p.y - h + 23, '#222', 3.5);
      }
    }
    // Spiegel + Waschbecken
    const sp = proj(R, 0.62, 0);
    rect(ctx, sp.x - 10, sp.y - 70, 20, 24, '#9aa8b0'); line(ctx, sp.x - 6, sp.y - 68, sp.x + 4, sp.y - 50, '#334', 0.6); line(ctx, sp.x - 2, sp.y - 60, sp.x + 8, sp.y - 64, '#334', 0.6);
    rect(ctx, sp.x - 12, sp.y - 34, 24, 6, '#ccc'); rect(ctx, sp.x - 2, sp.y - 28, 4, 14, '#888');
    // Stempeluhr
    const su = proj(R, 0.74, 0);
    rect(ctx, su.x - 10, su.y - 70, 20, 26, '#3a3530'); rect(ctx, su.x - 7, su.y - 67, 14, 9, '#d8d0b8');
    text(ctx, '22:14', su.x, su.y - 62.5, '#a22', 4); rect(ctx, su.x - 4, su.y - 54, 8, 6, '#151515');
    rect(ctx, su.x + 12, su.y - 72, 6, 30, '#6a5a40'); for (let k = 0; k < 6; k++) rect(ctx, su.x + 13, su.y - 70 + k * 5, 4, 3, '#d8d0b8');
    // Aushang
    const au = proj(R, 0.87, 0);
    rect(ctx, au.x - 12, au.y - 76, 24, 30, '#c8b880'); rect(ctx, au.x - 10, au.y - 74, 20, 4, '#a22');
    for (let k = 0; k < 6; k++) rect(ctx, au.x - 9, au.y - 67 + k * 3.4, 18 - (k % 2) * 5, 1, '#554');
    ellipse(ctx, au.x + 4, au.y - 56, 7, 5, 'rgba(110,90,40,0.5)');
    // Leuchtstoffröhre
    tubeLamp(ctx, 240, 32, 60, true);
    // Tür zur Halle (rechte Wand)
    sideDoor(ctx, R, 'R', 0.1, 0.34, 78, '#4a5058', 'HALLE');
    // Erste Hilfe linke Wand
    const eh = proj(R, 0, 0.32); firstAidBox(ctx, eh.x + 7, eh.y - 50 * eh.s, eh.s);
    // Notausgang-Schild
    sign(ctx, 446, 140, 22, 8, '#1b8a3b', '#fff', 'EXIT ➜', 4.5);
    grime(ctx, R, 101, 1 - st.r * 0.9);
  },
  props: [
    { v: 0.6, draw(ctx, st) { // Sitzbank
      const R = ROOMS.umkleide;
      box(ctx, R, 0.32, 0.34, 0.5, 0.58, 10, '#2a2a2a', { noTop: true }); box(ctx, R, 0.66, 0.68, 0.5, 0.58, 10, '#2a2a2a', { noTop: true });
      box(ctx, R, 0.3, 0.7, 0.49, 0.59, 3, '#7a5a38', { lift: 10 });
      if (!Game.flag('read_zeitung')) { const p = proj(R, 0.52, 0.54); rect(ctx, p.x - 6, p.y - 14, 12, 4, '#cfc8b0'); rect(ctx, p.x - 5, p.y - 13, 6, 1, '#555'); }
    } },
  ],
  hotspots: [
    { u: 0.21, v: 0.13, label: 'Spind 17 (AZUBI)', glint: () => !Game.flag('spind'), gh: 50, use() {
      if (!Game.flag('spind')) {
        Game.set('spind');
        Game.give('taschenlampe'); Game.give('schloss', true);
        Game.say(['Dein Spind. Drinnen: eine Taschenlampe, ein rotes Vorhängeschloss mit deinem Namen – und ein Zettel.'], () => Game.addFile('brief'));
      } else Game.say('Dein Spind. Leer bis auf eine Brotzeitdose. Leberkässemmel. Von gestern.');
    } },
    { u: 0.33, v: 0.13, label: 'Spinde', use() { Game.say('Fremde Spinde. Abgeschlossen. An einem klebt ein ausgeblichenes Foto von einem Motorrad.'); } },
    { u: 0.47, v: 0.13, label: 'Spind mit Kette', use() {
      if (Game.flag('read_kowalski')) Game.say(['„K. Kowalski – Hausmeister“. Mit Kette gesichert.', 'Jetzt weißt du, wofür „K.“ steht. Durch den Schlitz riecht es nach verschmortem Kunststoff – wie ein durchgebrannter LS-Schalter.']);
      else Game.say(['Ein Spind mit dem Schild „K.“, mit einer schweren Kette gesichert.', 'Durch die Lüftungsschlitze riecht es nach verschmortem Kunststoff.']);
    } },
    { u: 0.62, v: 0.13, label: 'Spiegel', use() { Game.say(G.hp > 66 ? 'Du siehst müde aus. Aber entschlossen.' : 'Du siehst übel aus. Vielleicht solltest du dich verarzten.'); } },
    { u: 0.74, v: 0.13, label: 'Stempeluhr (Speichern)', use() {
      const p = Saves.profile();
      Game.ask(`Die alte Stempeluhr tickt. Stempelkarte: ${p ? p.klasse + ' – ' + p.name : '?'}. Auf welchen Platz speichern?`, [
        ...Array.from({ length: Saves.SLOTS }, (_, i) => ({ t: `Platz ${i + 1}: ${Saves.info(Saves.get(i))}`, f: () => {
          Snd.play('clank');
          Game.say(Game.save(i) ? `KA-CHUNK. Die Uhr stanzt die Zeit in deine Stempelkarte. Gespeichert auf Platz ${i + 1}${Saves.mode === 'file' ? ' (Datei „' + FileLink.name + '“)' : ''}.` : 'Die Uhr klemmt. (Speichern im Browser nicht möglich – nutze im Titelmenü „Spielstand als Datei speichern“.)');
        } })),
        { t: 'Ausstempeln (zum Titelmenü – vorher speichern!)', f: () => Game.ask('Wirklich zum Titelmenü? Nicht gespeicherter Fortschritt seit dem letzten Speichern geht verloren.', [{ t: 'Ja, zum Titelmenü', f: () => Game.toTitle() }, { t: 'Nein', f: () => {} }]) },
        { t: 'Abbrechen', f: () => {} },
      ]);
    } },
    { u: 0.87, v: 0.13, label: 'Aushang', use() { Game.addFile('aushang'); } },
    { u: 0.52, v: 0.66, label: 'Zeitung auf der Bank', use() { Game.set('read_zeitung'); Game.addFile('zeitung'); } },
    { u: 0.04, v: 0.32, label: 'Erste-Hilfe-Kasten', glint: () => !Game.flag('eh_umk'), gh: 50, use: firstAid('eh_umk', 2) },
    { u: 0.97, v: 0.22, r: 30, label: 'Tür zur Halle', use() {
      if (!Game.has('taschenlampe')) { Game.say('Draußen ist es stockfinster. Ohne Licht gehst du da nicht raus. Der Meister hat doch was von deinem Spind gesagt …'); return; }
      Game.goto('halle', 0.05, 0.2, 'R');
    } },
  ],
};

// =====================================================================
//  HALLE 3
// =====================================================================
ROOMS.halle = {
  name: 'Halle 3',
  seed: 23,
  floor: { yb: 140, yf: 270, xbl: 50, xbr: 430, xfl: -70, xfr: 550, sb: 0.55, sf: 1 },
  wallTop: 6,
  walk: { u0: 0.03, u1: 0.97, v0: 0.06, v1: 0.96 },
  blockers: [
    { u0: 0.13, u1: 0.69, v0: 0.33, v1: 0.48 }, // Förderband
    { u0: 0.79, u1: 0.94, v0: 0.18, v1: 0.34 }, // Presse
    { u0: 0.93, u1: 1.0, v0: 0.4, v1: 0.52 },   // Kompressor
    { u0: 0.41, u1: 0.47, v0: 0.56, v1: 0.62 }, // Bedienpult
    { u0: 0.21, u1: 0.27, v0: 0.7, v1: 0.76 },  // Stehpult
    { u0: 0.0, u1: 0.11, v0: 0.46, v1: 0.66 },  // Trockenofen
  ],
  frontExit: { room: 'keller', u: 0.5, v: 0.86, dir: 'U', u0: 0.74, u1: 0.95, lock: () => HALL.kellerLock() },
  darkness: st => st.hall ? 0.6 - st.r * 0.5 : 0.9 - st.r * 0.08,
  lights(st, t) {
    const L = [];
    // Mondlicht durch die Fenster
    for (let i = 0; i < 5; i++) L.push({ x: 90 + i * 75, y: 40, r: 120, a: st.hall ? 0.15 : 0.2, cone: 40 });
    if (st.end) L.push({ x: proj(this, 0.67, 0).x, y: 100, r: 160, a: 0.9, col: 'rgba(255,170,110,0.18)' });
    // Notausgangsschilder
    L.push({ x: 18, y: 76, r: 30, a: 0.6, col: 'rgba(40,200,80,0.3)' });
    L.push({ x: 462, y: 76, r: 30, a: 0.5, col: 'rgba(40,200,80,0.25)' });
    // Produktionstafel
    L.push({ x: proj(this, 0.44, 0).x, y: 108, r: 26, a: 0.5 });
    if (st.hall) for (let i = 0; i < 5; i++) L.push({ x: 70 + i * 85, y: 42, r: 190, a: 0.95, cone: 140, col: 'rgba(255,230,170,0.07)', flicker: i === 3 && st.r < 0.7 });
    if (!st.end) L.push({ x: proj(this, 0.74, 0.5).x - 3, y: proj(this, 0.74, 0.5).y - 47, r: 12, a: 0.6 + Math.sin(t * 2) * 0.2, col: 'rgba(255,90,20,0.6)' });
    // Steuerschrank-Meldeleuchte / Bedienpult
    const bp = proj(this, 0.44, 0.59);
    if (Game.fixed('meldung') && st.main === 'on') L.push({ x: bp.x, y: bp.y - 30 * bp.s, r: 22, a: 0.7, col: 'rgba(40,255,80,0.35)' });
    return L;
  },
  drawBg(ctx, st) {
    const R = this, f = R.floor;
    shell(ctx, R, { ceil: '#08090b', wall: mixc('#3a3e40', '#6a7072', st.r), floor: mixc('#2e2e2b', '#55575a', st.r), tilesU: 12, tilesV: 8, beams: 6 });
    wallTex(ctx, R, 'metal');
    // Kranbahn
    rect(ctx, f.xbl, 12, f.xbr - f.xbl, 4, '#2a2418'); for (let x = f.xbl; x < f.xbr; x += 10) rect(ctx, x, 12, 5, 4, mixc('#8a6a10', '#c8a020', st.r));
    // Fenster
    for (let i = 0; i < 5; i++) windowPane(ctx, 66 + i * 75, 22, 50, 36, 300 + i, st.r < 0.5);
    // Laufsteg
    rect(ctx, f.xbl, 78, f.xbr - f.xbl, 3, '#26292c'); for (let x = f.xbl; x < f.xbr; x += 9) rect(ctx, x, 68, 1, 10, '#26292c'); rect(ctx, f.xbl, 68, f.xbr - f.xbl, 1, '#26292c');
    // Rohre
    rect(ctx, f.xbl, 88, f.xbr - f.xbl, 3, mixc('#4a3a2a', '#8a6a3a', st.r)); rect(ctx, f.xbl, 93, f.xbr - f.xbl, 2, '#30485a');
    // Türen hinten
    backDoor(ctx, R, 0.1, 34, 70, '#4b4f45', 'WERKSTATT');
    backDoor(ctx, R, 0.3, 32, 70, '#5a4a30', 'SCHALTRAUM');
    const sp = proj(R, 0.3, 0); warnSign(ctx, sp.x, sp.y - 26, 0.8);
    backDoor(ctx, R, 0.92, 34, 70, '#45505a', 'LAGER');
    // Rolltor
    const r0 = proj(R, 0.56, 0), r1 = proj(R, 0.78, 0);
    rect(ctx, r0.x - 3, r0.y - 92, r1.x - r0.x + 6, 92, '#1c1e20');
    const torBottom = st.end ? r0.y - 78 : r0.y;
    if (st.end) { // Tor offen: Morgendämmerung
      const g = ctx.createLinearGradient(0, r0.y - 80, 0, r0.y);
      g.addColorStop(0, '#5a6a8a'); g.addColorStop(0.6, '#d89a6a'); g.addColorStop(1, '#f0c890');
      ctx.fillStyle = g; ctx.fillRect(r0.x, r0.y - 80, r1.x - r0.x, 80);
      rect(ctx, r0.x, r0.y - 22, r1.x - r0.x, 22, '#3a3a40'); rect(ctx, r0.x + 10, r0.y - 40, 50, 22, '#c8c8c0'); rect(ctx, r0.x + 10, r0.y - 40, 50, 3, '#a22');
    }
    for (let y = r0.y - 89; y < torBottom; y += 4) { rect(ctx, r0.x, y, r1.x - r0.x, 3, mixc('#4a4d50', '#7a7d80', st.r)); }
    if (!st.end) for (let x = r0.x; x < r1.x; x += 16) for (let y = r0.y - 85; y < r0.y; y += 22) rect(ctx, x + 3, y, 6, 2, 'rgba(255,200,40,0.25)');
    sign(ctx, (r0.x + r1.x) / 2, r0.y - 97, 40, 7, '#1d2a3a', '#d8e0f0', 'TOR 3 – VERSAND', 4.3);
    // Produktionstafel
    const tp = proj(R, 0.44, 0);
    rect(ctx, tp.x - 20, 96, 40, 30, '#14161a'); rect(ctx, tp.x - 19, 97, 38, 5, '#2a2f38');
    text(ctx, 'PRODUKTION', tp.x, 99.7, '#aab', 3.6);
    FIXES.forEach((fx, i) => {
      const x = tp.x - 13 + (i % 3) * 13, y = 106 + Math.floor(i / 3) * 7;
      const on = Game.fixed(fx.id);
      circle(ctx, x, y, 2.4, on ? '#3f3' : '#511'); if (on) circle(ctx, x, y, 1, '#dfd');
    });
    // Türen seitlich
    sideDoor(ctx, R, 'L', 0.1, 0.3, 74, '#4a5058', 'UMKLEIDE');
    sideDoor(ctx, R, 'R', 0.1, 0.3, 74, '#5a4636', 'MEISTER');
    const kp = proj(R, 1, 0.33); rect(ctx, kp.x - 3, kp.y - 42 * kp.s, 5, 7, '#222'); rect(ctx, kp.x - 2, kp.y - 41 * kp.s, 3, 2, Game.flag('officeOpen') ? '#3c3' : '#c33');
    // Notausgang
    sign(ctx, 18, 70, 22, 7, '#1b8a3b', '#fff', '⬅ EXIT', 4.2); sign(ctx, 462, 70, 22, 7, '#1b8a3b', '#fff', 'EXIT ➜', 4.2);
    // Bodenmarkierungen (gelb)
    ctx.save(); ctx.globalAlpha = 0.25 + st.r * 0.6;
    for (const vv of [0.3, 0.52]) { const a = proj(R, 0.1, vv), b = proj(R, 0.72, vv); line(ctx, a.x, a.y, b.x, b.y, '#d8b020', 1.5 * a.s); }
    ctx.restore();
    grime(ctx, R, 202, 1 - st.r * 0.92);
  },
  props: [
    { v: 0.47, draw(ctx, st, t) { // Förderband
      const R = ROOMS.halle;
      for (const u of [0.16, 0.3, 0.44, 0.57]) box(ctx, R, u, u + 0.012, 0.37, 0.46, 18, '#2a2c2e', { noTop: true });
      const b = box(ctx, R, 0.14, 0.6, 0.36, 0.47, 5, mixc('#5a5a20', '#c8a020', st.r), { lift: 18, top: '#1a1a1a' });
      // Bandoberfläche bewegt sich
      const run = st.end;
      const p0 = proj(R, 0.14, 0.415), p1 = proj(R, 0.6, 0.415);
      const off = run ? (t * 30) % 12 : 0;
      for (let x = p0.x + off; x < p1.x; x += 12) rect(ctx, x, p0.y - 23 * p0.s - 1, 1, 2, '#333');
      if (run) for (let k = 0; k < 5; k++) { const x = p0.x + ((t * 30 + k * 50) % (p1.x - p0.x)); rect(ctx, x, p0.y - 23 * p0.s - 7, 10, 6, '#8a7a5a'); rect(ctx, x, p0.y - 23 * p0.s - 7, 10, 1, '#a89870'); }
      // Antrieb (Getriebe + Motor)
      box(ctx, R, 0.6, 0.64, 0.37, 0.46, 24, '#3a4048');
      const m = box(ctx, R, 0.64, 0.69, 0.38, 0.45, 16, Game.fixed('halterung') ? '#2a5a8a' : '#3a4a5a', { lift: Game.fixed('halterung') ? 6 : 2 });
      if (!Game.fixed('halterung')) { const p = proj(R, 0.66, 0.46); rect(ctx, p.x - 6, p.y - 4, 12, 3, '#555'); }
      if (Game.fixed('halterung') && run) { rect(ctx, m.x0 + 2, m.top + 2, 3, 3, (Math.floor(t * 8) % 2) ? '#bbb' : '#666'); }
      const gp = proj(R, 0.62, 0.46);
      if (Game.fixed('getriebe')) { circle(ctx, gp.x, gp.y - 14 * gp.s, 5 * gp.s, '#777'); line(ctx, gp.x, gp.y - 14 * gp.s, gp.x + Math.cos(run ? t * 4 : 0) * 4 * gp.s, gp.y - 14 * gp.s + Math.sin(run ? t * 4 : 0) * 4 * gp.s, '#222', 1); }
      else { circle(ctx, gp.x, gp.y - 14 * gp.s, 2 * gp.s, '#111'); }
    } },
    { v: 0.34, draw(ctx, st, t) { // Pneumatik-Presse
      const R = ROOMS.halle;
      box(ctx, R, 0.8, 0.93, 0.2, 0.33, 10, '#3a3a38');
      box(ctx, R, 0.8, 0.83, 0.2, 0.26, 78, mixc('#5a3a20', '#c85a20', st.r));
      const top = box(ctx, R, 0.8, 0.93, 0.2, 0.26, 12, mixc('#5a3a20', '#c85a20', st.r), { lift: 66 });
      const p = proj(R, 0.875, 0.29);
      const running = Game.fixed('presse') && st.main === 'on';
      const stroke = running ? (Math.sin(t * 2.5) > 0.6 ? 14 : 0) : (Game.fixed('presse') ? 0 : 6);
      rect(ctx, p.x - 5 * p.s, p.y - 72 * p.s, 10 * p.s, 14 * p.s, '#999');
      rect(ctx, p.x - 2 * p.s, p.y - 58 * p.s, 4 * p.s, (12 + stroke) * p.s, '#ccc');
      rect(ctx, p.x - 8 * p.s, p.y - (46 - stroke) * p.s, 16 * p.s, 5 * p.s, '#666');
      rect(ctx, p.x - 10 * p.s, p.y - 20 * p.s, 20 * p.s, 10 * p.s, '#444');
      // Zweihand-Taster
      circle(ctx, p.x - 14 * p.s, p.y - 16 * p.s, 2 * p.s, running ? '#3c3' : '#a22'); circle(ctx, p.x + 14 * p.s, p.y - 16 * p.s, 2 * p.s, running ? '#3c3' : '#a22');
      if (!Game.fixed('presse')) { ctx.strokeStyle = '#2a6ad8'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(p.x + 6, p.y - 60 * p.s); ctx.quadraticCurveTo(p.x + 20, p.y - 20, p.x + 12, p.y); ctx.stroke(); }
      // Warnstreifen
      for (let i = 0; i < 4; i++) rect(ctx, top.x0 + i * 6, top.top + 2, 3, 3, i % 2 ? '#111' : '#d8b020');
    } },
    { v: 0.51, draw(ctx, st) { // Kompressor
      const R = ROOMS.halle;
      const b = box(ctx, R, 0.93, 1.0, 0.41, 0.51, 16, '#2c4a6a');
      ellipse(ctx, b.x0 + b.w * 0.5, b.top - 4, 6, 4, '#3a5a7a');
    } },
    { v: 0.61, draw(ctx, st, t) { // Bedienpult
      const R = ROOMS.halle;
      const b = box(ctx, R, 0.42, 0.46, 0.57, 0.61, 30, '#4a4a40');
      const p = proj(R, 0.44, 0.61);
      circle(ctx, p.x - 4, b.top + 5, 2, Game.flag('ending') ? '#4f4' : '#2a4a2a');
      circle(ctx, p.x + 4, b.top + 5, 2, '#a22');
      const ok = Game.fixed('meldung') && st.main === 'on';
      circle(ctx, p.x, b.top + 11, 1.6, ok ? (Math.sin(t * 4) > -0.5 ? '#7f7' : '#3a3') : '#222');
      rect(ctx, p.x - 6, b.top - 1, 12, 2, '#ddd');
    } },
    { v: 0.75, draw(ctx, st) { // Stehpult mit Schichtbuch
      const R = ROOMS.halle;
      box(ctx, R, 0.235, 0.245, 0.72, 0.74, 26, '#333', { noTop: true });
      const b = box(ctx, R, 0.215, 0.265, 0.71, 0.75, 3, '#6a5034', { lift: 26 });
      rect(ctx, b.x0 + 4, b.top - 1, 10, 3, '#d8d0b0');
    } },
    { v: 0.66, draw(ctx, st, t) { // Trockenofen
      const R = ROOMS.halle;
      const b = box(ctx, R, -0.06, 0.11, 0.46, 0.66, 46, mixc('#4a4440', '#8a8a84', st.r));
      const hot = Game.fixed('ofen') && st.main === 'on';
      rect(ctx, b.x1 - 30, b.top + 8, 22, 26, '#222'); rect(ctx, b.x1 - 28, b.top + 10, 18, 22, hot ? `rgb(${200 + Math.sin(t * 3) * 30},90,30)` : '#2a1a14');
      rect(ctx, b.x1 - 44, b.top + 6, 10, 6, '#111'); text(ctx, hot ? '180°' : (st.main === 'on' ? 'ERR' : ''), b.x1 - 39, b.top + 9, hot ? '#f84' : '#a22', 4);
      text(ctx, 'TO-3', b.x1 - 39, b.top + 18, '#ddd', 4);
    } },
    { v: 0.99, draw(ctx, st) { // Kellertreppe
      const R = ROOMS.halle;
      const a = proj(R, 0.76, 0.9), c = proj(R, 0.95, 0.9);
      for (let k = 0; k < 4; k++) rect(ctx, a.x, a.y + 4 + k * 8, c.x - a.x, 2, '#3a3a36');
      rect(ctx, a.x - 2, a.y - 22, 3, 60, '#5a5a20'); rect(ctx, c.x - 1, c.y - 22, 3, 60, '#5a5a20'); rect(ctx, a.x - 2, a.y - 22, c.x - a.x + 4, 3, mixc('#8a7a20', '#d8b020', st.r));
      if (!Game.flag('kellerOffen')) { for (let x = a.x; x < c.x; x += 6) rect(ctx, x, a.y - 19, 1.5, 40, '#4a4a44'); rect(ctx, (a.x + c.x) / 2 - 3, a.y - 6, 6, 7, '#a88a30'); }
      sign(ctx, (a.x + c.x) / 2, a.y - 30, 36, 8, '#1d4a2a', '#d8f0d8', '▼ KELLER', 5);
    } },
  ],
  npcs() {
    const st = Game.vis();
    const list = [{ ...NPC.schorsch, u: st.end ? 0.55 : 0.74, v: st.end ? 0.62 : 0.52, dir: 'L' }];
    if (st.end) {
      list.push({ ...NPC.alois, u: 0.32, v: 0.62, dir: 'R' });
      list.push({ ...NPC.irmgard, u: 0.62, v: 0.72, dir: 'L' });
      list.push({ ...NPC.brandl, u: 0.67, v: 0.2, dir: 'D' });
      list.push({ ...NPC.dragan, u: 0.3, v: 0.82, dir: 'R' });
      list.push({ name: 'Arbeiter', look: LOOKS.arbeiter1, u: 0.86, v: 0.4, dir: 'L', talk: () => Game.say([['Frühschicht', 'Morgen! Was ist denn hier passiert? Es läuft ja alles!']]) });
      list.push({ name: 'Arbeiterin', look: LOOKS.arbeiter2, u: 0.2, v: 0.28, dir: 'R', talk: () => Game.say([['Frühschicht', 'Das Band läuft wie neu. Und der Boden ist gefegt. Ich glaub, ich träum.']]) });
    }
    if (Game.shadow && !st.end) list.push({ name: '???', look: LOOKS.kowalski, u: Game.shadow.u, v: Game.shadow.v, dir: 'D', alpha: Game.shadow.a, block: false });
    return list;
  },
  onEnter() {
    if (Game.fixed('licht') && !Game.flag('shadow1') && !Game.flag('ending')) {
      Game.set('shadow1');
      Game.shadow = { u: 0.67, v: 0.03, a: 0, t: 0 };
      setTimeout(() => Snd.play('sting'), 400);
    }
  },
  update(dt) {
    const sh = Game.shadow;
    if (Game.flag('ending')) { Game.shadow = null; return; }
    if (!sh) {
      if (Math.random() < dt / 90) Game.shadow = { u: [0.67, 0.1, 0.92][Math.floor(Math.random() * 3)], v: 0.03, a: 0, t: 0 };
      return;
    }
    sh.t += dt;
    const near = G.v < 0.3 && Math.abs(G.u - sh.u) < 0.25;
    if (sh.t < 1.5) sh.a = Math.min(0.85, sh.t / 1.5 * 0.85);
    else if (sh.t > 4.5 || near) sh.a -= dt * 1.2;
    if (sh.a <= 0 && sh.t > 1) Game.shadow = null;
  },
  hotspots: [
    { u: 0.03, v: 0.2, r: 30, label: 'Tür zur Umkleide', use() { Game.goto('umkleide', 0.92, 0.22, 'L'); } },
    { u: 0.1, v: 0.07, label: 'Tür zur Werkstatt', use() { Game.goto('werkstatt', 0.92, 0.24, 'L'); } },
    { u: 0.3, v: 0.07, label: 'Tür zum Schaltraum', use() {
      if (!Game.has('schluessel')) { Game.say('Abgeschlossen. Ein gelbes Schild: „Zutritt nur für Elektrofachkräfte und unterwiesene Personen“. Wer hat wohl den Schlüssel?'); return; }
      if (!Game.flag('schaltraumOpen')) { Game.set('schaltraumOpen'); Snd.play('clank'); Game.say('Der Schlüssel passt. Das Schloss knirscht.', () => Game.goto('schaltraum', 0.5, 0.88, 'U')); return; }
      Game.goto('schaltraum', 0.5, 0.88, 'U');
    } },
    { u: 0.92, v: 0.07, label: 'Tür zum Lager', use() { Game.goto('lager', 0.06, 0.26, 'R'); } },
    { u: 0.97, v: 0.2, r: 30, label: 'Meisterbüro', use() {
      if (Game.flag('officeOpen')) { Game.goto('buero', 0.06, 0.26, 'R'); return; }
      Game.puzzle('keypad');
    } },
    { u: 0.67, v: 0.07, label: 'Rolltor', use() {
      if (Game.flag('ending')) Game.say('Das Tor steht offen. Draußen dämmert es. Ein LKW setzt rückwärts an die Rampe.');
      else Game.say(['Das Versandtor. Verriegelt bis Schichtbeginn.', 'Darunter ein schmaler Spalt. Kalte Nachtluft zieht herein … und für einen Moment glaubst du, ein Atmen zu hören.']);
    } },
    { u: 0.44, v: 0.07, label: 'Produktionstafel', use() {
      const n = Game.fixCount();
      Game.say([`Die Anzeigetafel: ${n} von 6 Systemen bereit.`, n < 6 ? 'Offen: ' + FIXES.filter(f => !Game.fixed(f.id)).map(f => f.name).join(', ') + '.' : 'Alle Lampen grün. Jetzt fehlt nur noch der Start am Bedienpult.']);
    } },
    { u: 0.665, v: 0.5, label: 'Bandantrieb', use() { HALL.antrieb(); } },
    { u: 0.86, v: 0.37, label: 'Pneumatik-Presse', use() { HALL.presse(); } },
    { u: 0.44, v: 0.65, label: 'Bedienpult Förderband', use() { HALL.pult(); } },
    { u: 0.24, v: 0.79, label: 'Schichtbuch', use() { Game.addFile('schichtbuch'); } },
    { u: 0.96, v: 0.55, label: 'Druckluftbehälter', use() {
      if (Game.fixed('kompressor') && G.mainSwitch === 'on') Game.say('Der Druckluftbehälter. Das Manometer zeigt 9 bar. Von unten hört man den Hauptkompressor brummen.');
      else Game.say(['Der Druckluftbehälter der Halle. Das Manometer zeigt 0 bar.', 'Die Luft kommt vom Hauptkompressor im Keller. ' + (Game.fixed('kompressor') ? 'Der ist repariert – aber ohne Strom (Hauptschalter!) läuft er nicht.' : 'Der scheint zu stehen.')]);
    } },
    { u: 0.14, v: 0.57, label: 'Trockenofen', use() { HALL.ofen(); } },
    { u: 0.85, v: 0.9, label: 'Kellertreppe', use() { const m = HALL.kellerLock(); if (m) Game.say(m); else Game.goto('keller', 0.5, 0.86, 'U'); } },
  ],
};

const HALL = {
  kellerLock() {
    if (Game.flag('kellerOffen')) return null;
    if (!Game.has('bolzenschneider')) return ['Ein Gitter versperrt die Kellertreppe. Daran hängt ein fettes Vorhängeschloss mit eingeritztem „K.“.', 'Ohne Werkzeug kommst du da nicht durch.'];
    Game.set('kellerOffen'); Snd.play('clank');
    return ['Du setzt den Bolzenschneider an. KNACK. Kowalskis Schloss fällt scheppernd auf die Stufen.', 'Aus dem Keller weht kalte, modrige Luft herauf.'];
  },
  ofen() {
    if (Game.fixed('ofen')) { Game.say(G.mainSwitch === 'on' ? 'Der Trockenofen läuft mit 2 kW. Drinnen glüht es warm.' : 'Der Ofen ist richtig geklemmt. Ohne Strom heizt er aber nicht.'); return; }
    if (!Game.flag('ofenSeen')) {
      Game.set('ofenSeen');
      Game.say(['Der Durchlauf-Trockenofen. Hier trocknet der Lack der Gehäuse.', 'Hinter der Klemmenabdeckung: drei Heizstäbe, wild durcheinander geklemmt. Auf dem Typenschild klebt ein Edding-Gekritzel …'], () => Game.addFile('ofen_schild'));
      return;
    }
    if (!Game.has('aderleitung')) { Game.say('Zum Umklemmen der Heizstäbe brauchst du Aderleitung für die Brücken. In einer Elektrowerkstatt gibt’s so was.'); return; }
    SR.safety('dem Trockenofen', () => Game.puzzle('ofen'));
  },
  antrieb() {
    if (!Game.fixed('halterung')) {
      if (Game.has('platte_fertig')) {
        Game.take('platte_fertig');
        Game.say(['Du setzt die Halteplatte ein, richtest den Motor aus und ziehst die M10-Schraube fest.', 'Sitzt bombenfest.'], () => Game.fix('halterung'));
        return;
      }
      if (!Game.flag('platteRaus')) {
        Game.say(['Der Bandmotor hängt schief. Die Halteplatte ist nur noch an einer Schraube befestigt – das Gewinde der anderen ist komplett ausgerissen.', 'Du schraubst die Platte ab. Die muss in die Werkstatt: neu aufbohren und ein Gewinde M10 schneiden.'], () => { Game.set('platteRaus'); Game.give('platte'); });
        return;
      }
      Game.say('Ohne Halteplatte hängt der Motor nur lose da. Die Platte muss in der Werkstatt neu gebohrt und mit Gewinde M10 versehen werden.');
      return;
    }
    if (!Game.fixed('getriebe')) {
      if (Game.has('zahnraeder')) { Game.puzzle('getriebe'); return; }
      Game.say(['Der Motor sitzt. Aber im Getriebe fehlt das große Zahnrad – das Motorritzel dreht ins Leere.', 'Auf dem Typenschild: Motor n = 1400 1/min, Ritzel z₁ = 18. Ein Aufkleber am Band: „Antriebswelle 350 1/min“.', 'Ersatzräder gibt es vielleicht im Lager.']);
      return;
    }
    Game.say(Game.flag('ending') ? 'Der Antrieb schnurrt. Genau 350 Umdrehungen an der Bandwelle.' : 'Motor sitzt, Getriebe ist komplett. Mechanisch ist das Band jetzt fit.');
  },
  presse() {
    if (Game.fixed('presse')) { Game.say(G.mainSwitch === 'on' ? 'Die Presse stampft sauber im Takt. Zweihandbedienung funktioniert.' : 'Die Presse ist fertig verschlaucht. Ohne Strom am Kompressor bewegt sie sich aber nicht.'); return; }
    if (!Game.has('schlauch')) { Game.say(['Die Pneumatik-Presse. Die Schläuche am 5/2-Wegeventil hängen lose herum, einer ist zerschnitten.', 'Ohne neuen Pneumatikschlauch geht hier nichts.']); return; }
    if (!Game.fixed('kompressor')) { Game.say(['Du hast den Schlauch – aber auf der Druckluftleitung ist kein Druck.', 'Die Druckluft kommt vom Hauptkompressor im Keller. Der muss erst wieder laufen.']); return; }
    if (G.mainSwitch !== 'on') { Game.say('Du hast den Schlauch – aber der Kompressor hat keinen Strom. Erst muss der Hauptschalter im Schaltraum wieder an sein.'); return; }
    Game.puzzle('pneumatik');
  },
  pult() {
    if (Game.flag('ending')) { Game.say('Alles läuft. Die Gehäuse wandern im Takt über das Band.'); return; }
    if (G.mainSwitch !== 'on') { Game.say('Das Bedienpult ist tot. Der Hauptschalter im Schaltraum ist aus.'); return; }
    const open = FIXES.filter(f => !Game.fixed(f.id));
    if (open.length) {
      Snd.play('err');
      Game.say(['Du drückst START. Im Display erscheint: „STÖRUNG“.', 'Offen: ' + open.map(f => f.name).join(', ') + '.']);
      return;
    }
    Game.ask('Alle Systeme bereit. START drücken?', [{ t: 'START', f: () => ENDING.run() }, { t: 'Noch nicht', f: () => {} }]);
  },
};

// =====================================================================
//  WERKSTATT
// =====================================================================
ROOMS.werkstatt = {
  name: 'Lehrwerkstatt',
  seed: 37,
  floor: { yb: 150, yf: 270, xbl: 80, xbr: 400, xfl: -40, xfr: 520, sb: 0.62, sf: 1 },
  wallTop: 18,
  walk: { u0: 0.03, u1: 0.97, v0: 0.17, v1: 0.95 },
  blockers: [{ u0: 0.8, u1: 0.96, v0: 0.44, v1: 0.56 }, { u0: 0.58, u1: 0.76, v0: 0, v1: 0.16 }],
  darkness: st => 0.8 - st.r * 0.45,
  lights(st) {
    const p = proj(this, 0.32, 0);
    return [
      { x: p.x, y: 48, r: 140, a: 0.9, cone: 90, flicker: st.r < 0.4, col: 'rgba(255,200,120,0.1)' },
      { x: 360, y: 40, r: 90, a: 0.3, cone: 30 },
      ...(st.r > 0.3 ? [{ x: 300, y: 40, r: 200, a: st.r * 0.8, cone: 140 }] : []),
    ];
  },
  drawBg(ctx, st) {
    const R = this, f = R.floor;
    shell(ctx, R, { ceil: '#0c0d0e', wall: mixc('#4a3a32', '#7a6050', st.r), floor: mixc('#33302c', '#5a5650', st.r), tilesU: 9, tilesV: 6 });
    wallTex(ctx, R, 'brick');
    windowPane(ctx, 330, 32, 44, 30, 77, st.r < 0.5);
    // Lochwand mit Werkzeug
    const a = proj(R, 0.12, 0), b = proj(R, 0.5, 0);
    rect(ctx, a.x, 60, b.x - a.x, 50, '#6a6250');
    for (let x = a.x + 3; x < b.x; x += 5) for (let y = 63; y < 108; y += 5) rect(ctx, x, y, 1, 1, '#3a3428');
    const tool = (x, y, w, h, c) => rect(ctx, x, y, w, h, c);
    tool(a.x + 10, 66, 3, 22, '#888'); tool(a.x + 8, 64, 7, 4, '#a33'); // Schraubendreher
    tool(a.x + 22, 66, 14, 3, '#999'); tool(a.x + 22, 66, 3, 14, '#999'); // Winkel
    tool(a.x + 44, 68, 18, 4, '#777'); tool(a.x + 48, 72, 4, 14, '#5a3a2a'); // Hammer
    if (!Game.flag('wand_windeisen')) { tool(a.x + 70, 76, 22, 2, '#999'); tool(a.x + 79, 73, 4, 8, '#666'); }
    if (!Game.flag('wand_pruefer')) { tool(a.x + 100, 66, 4, 16, '#e6c000'); tool(a.x + 108, 66, 4, 16, '#e6c000'); }
    tool(a.x + 70, 90, 30, 3, '#888'); tool(a.x + 18, 92, 10, 10, '#4a6a8a');
    // Werkbank
    // Säulenbohrmaschine
    const d = proj(R, 0.67, 0.06);
    rect(ctx, d.x - 2 * d.s, d.y - 90 * d.s, 5 * d.s, 90 * d.s, '#5a6a5a');
    rect(ctx, d.x - 14 * d.s, d.y - 100 * d.s, 28 * d.s, 18 * d.s, mixc('#3a5a4a', '#3a8a5a', st.r));
    rect(ctx, d.x - 2 * d.s, d.y - 82 * d.s, 3 * d.s, 14 * d.s, '#aaa');
    rect(ctx, d.x - 16 * d.s, d.y - 54 * d.s, 30 * d.s, 4 * d.s, '#4a4a4a');
    rect(ctx, d.x - 12 * d.s, d.y - 6 * d.s, 26 * d.s, 6 * d.s, '#3a3a3a');
    line(ctx, d.x + 12 * d.s, d.y - 90 * d.s, d.x + 22 * d.s, d.y - 80 * d.s, '#aaa', 1.5);
    if (!Game.flag('schutzOk')) { for (let k = 0; k < 6; k++) rect(ctx, d.x - 18 * d.s + k * 6 * d.s, d.y - 62 * d.s + k * 2, 6 * d.s, 3, k % 2 ? '#eee' : '#c22'); rect(ctx, d.x + 4, d.y - 76 * d.s, 10, 7, '#eee'); text(ctx, '!', d.x + 9, d.y - 73 * d.s, '#c22', 6); }
    // Aushang an der Bohrmaschine
    const ap = proj(R, 0.76, 0); rect(ctx, ap.x - 7, ap.y - 70, 14, 18, '#d8d0a8'); rect(ctx, ap.x - 6, ap.y - 69, 12, 3, '#26a'); for (let k = 0; k < 4; k++) rect(ctx, ap.x - 5, ap.y - 64 + k * 3, 10, 1, '#555');
    // Regal rechts
    const s0 = proj(R, 0.82, 0), s1 = proj(R, 0.97, 0);
    for (let k = 0; k < 4; k++) rect(ctx, s0.x, s0.y - 18 - k * 18, s1.x - s0.x, 2, '#5a4a3a');
    rect(ctx, s0.x, s0.y - 76, 2, 76, '#4a3a2a'); rect(ctx, s1.x - 2, s0.y - 76, 2, 76, '#4a3a2a');
    for (let k = 0; k < 6; k++) rect(ctx, s0.x + 4 + k * 7, s0.y - 30, 5, 11, ['#a33', '#26a', '#aa3', '#555', '#3a6', '#a63'][k]);
    rect(ctx, s0.x + 6, s0.y - 46, 22, 9, '#6a6a5a');
    // Hängelampe
    hangLamp(ctx, proj(R, 0.32, 0).x, 42, 0, true, 1.2);
    // Tür, Erste Hilfe
    sideDoor(ctx, R, 'R', 0.12, 0.34, 76, '#4b4f45', 'HALLE');
    const eh = proj(R, 0, 0.36); firstAidBox(ctx, eh.x + 7, eh.y - 50 * eh.s, eh.s);
    // Plakat
    rect(ctx, 115, 40, 22, 14, '#b8b090'); text(ctx, 'SICHER-', 126, 45, '#a22', 3.5); text(ctx, 'HEIT!', 126, 50, '#a22', 3.5);
    grime(ctx, R, 303, 1 - st.r * 0.9);
  },
  props: [
    { v: 0.15, draw(ctx, st) { // Werkbank mit Schraubstock
      const R = ROOMS.werkstatt;
      box(ctx, R, 0.13, 0.15, 0.02, 0.14, 28, '#3a3a3a', { noTop: true }); box(ctx, R, 0.47, 0.49, 0.02, 0.14, 28, '#3a3a3a', { noTop: true });
      const b = box(ctx, R, 0.12, 0.5, 0.01, 0.15, 4, '#7a5a30', { lift: 28, top: '#8a6a3a' });
      const v = proj(R, 0.44, 0.08);
      rect(ctx, v.x - 7, v.y - 40 * v.s, 14, 8, '#4a6a8a'); rect(ctx, v.x - 9, v.y - 34 * v.s, 18, 4, '#3a5a7a'); rect(ctx, v.x + 9, v.y - 37 * v.s, 8, 1.5, '#aaa');
      const tb = proj(R, 0.31, 0.1); rect(ctx, tb.x - 6, tb.y - 34 * tb.s, 12, 3, '#2a4a8a'); rect(ctx, tb.x - 6, tb.y - 35 * tb.s, 12, 1, '#ddd');
      const bx = proj(R, 0.2, 0.08); rect(ctx, bx.x - 5, bx.y - 36 * bx.s, 8, 5, '#555');
    } },
    { v: 0.55, draw(ctx, st) { // Tisch mit Prüfstück
      const R = ROOMS.werkstatt;
      box(ctx, R, 0.82, 0.835, 0.45, 0.55, 26, '#333', { noTop: true }); box(ctx, R, 0.94, 0.955, 0.45, 0.55, 26, '#333', { noTop: true });
      box(ctx, R, 0.8, 0.96, 0.44, 0.56, 3, '#5a5248', { lift: 26 });
      const p = proj(R, 0.88, 0.5);
      rect(ctx, p.x - 8, p.y - 31, 16, 2, '#ccc'); rect(ctx, p.x - 8, p.y - 34, 2, 5, '#ccc'); rect(ctx, p.x - 2, p.y - 33, 5, 4, '#8a7a6a');
    } },
  ],
  npcs() {
    if (Game.flag('ending')) return [];
    return [{ ...NPC.alois, u: 0.28, v: 0.4, dir: 'D' }];
  },
  hotspots: [
    { u: 0.22, v: 0.18, label: 'Werkzeugwand', glint: () => !Game.flag('wand_windeisen') || !Game.flag('wand_pruefer'), gh: 65, use() {
      const got = [];
      if (!Game.flag('wand_windeisen')) { Game.set('wand_windeisen'); Game.give('windeisen', true); got.push('ein Windeisen'); }
      if (!Game.flag('wand_pruefer')) { Game.set('wand_pruefer'); Game.give('pruefer', true); got.push('einen zweipoligen Spannungsprüfer'); }
      if (got.length) { Snd.play('pickup'); Game.say('An der Lochwand hängen säuberlich die Umrisse jedes Werkzeugs. Du nimmst ' + got.join(' und ') + ' mit.'); }
      else Game.say('Hammer, Feilen, Winkel, Schraubendreher. Alles an seinem Platz – Alois achtet darauf.');
    } },
    { u: 0.32, v: 0.18, label: 'Tabellenbuch', use() { Game.addFile('gewinde'); } },
    { u: 0.44, v: 0.18, label: 'Schraubstock', use() {
      if (Game.has('platte_gebohrt')) {
        if (Game.has('gewindeschneider')) { Game.puzzle('gewinde'); return; }
        Game.say(Game.has('gewindebohrer') || Game.has('windeisen') ? 'Du brauchst Windeisen UND Gewindebohrer – kombiniere sie im Inventar.' : 'Zum Gewindeschneiden brauchst du einen Handgewindebohrer-Satz M10 und ein Windeisen.');
        return;
      }
      Game.say('Ein schwerer Parallelschraubstock. Die Schutzbacken aus Alu sind voller Kerben.');
    } },
    { u: 0.67, v: 0.19, label: 'Säulenbohrmaschine', use() {
      if (!Game.flag('schutzOk')) {
        if (!Game.flag('sawDrill')) { Game.set('sawDrill'); Game.say(['Um die Säulenbohrmaschine ist rot-weißes Flatterband gewickelt. Ein Zettel: „GESPERRT! Gehäuse kribbelt!! – A.“', 'Daneben hängt das Prüfprotokoll.'], () => Game.addFile('dguv')); return; }
        if (Game.has('geraetetester') && Game.has('fi_kasten')) { Game.puzzle('schutz'); return; }
        Game.say(['Gesperrt. Bevor hier jemand bohrt, muss die Maschine elektrisch geprüft werden: Schutzleiter, FI-Schutzschalter.', Game.has('geraetetester') ? 'Den Gerätetester hast du. Falls der FI defekt ist, brauchst du Ersatz.' : 'Dafür brauchst du einen Gerätetester. Vielleicht hat der Betriebselektriker einen?']);
        return;
      }
      if (Game.has('platte')) { Game.puzzle('bohren'); return; }
      if (Game.has('platte_gebohrt') || Game.has('platte_fertig') || Game.fixed('halterung')) { Game.say('Die Bohrmaschine. Du hast hier schon gute Arbeit geleistet.'); return; }
      Game.say('Eine alte Säulenbohrmaschine. Wenn du etwas zum Bohren hättest …');
    } },
    { u: 0.77, v: 0.18, label: 'Betriebsanweisung', use() { Game.addFile('bohren'); } },
    { u: 0.89, v: 0.19, label: 'Regal', use() { Game.addFile('messschieber'); } },
    { u: 0.88, v: 0.6, label: 'Prüfstück mit Messschieber', use() { Game.puzzle('messschieber'); } },
    { u: 0.04, v: 0.36, label: 'Erste-Hilfe-Kasten', glint: () => !Game.flag('eh_werk'), gh: 50, use: firstAid('eh_werk', 1) },
    { u: 0.97, v: 0.24, r: 30, label: 'Tür zur Halle', use() { Game.goto('halle', 0.1, 0.12, 'D'); } },
  ],
};

// =====================================================================
//  LAGER
// =====================================================================
ROOMS.lager = {
  name: 'Lager',
  seed: 51,
  floor: { yb: 145, yf: 270, xbl: 90, xbr: 390, xfl: -30, xfr: 510, sb: 0.6, sf: 1 },
  wallTop: 14,
  walk: { u0: 0.03, u1: 0.97, v0: 0.2, v1: 0.95 },
  blockers: [{ u0: 0.36, u1: 0.64, v0: 0, v1: 0.19 }, { u0: 0.77, u1: 0.97, v0: 0.48, v1: 0.63 }, { u0: 0.03, u1: 0.2, v0: 0.55, v1: 0.66 }],
  darkness: st => 0.86 - st.r * 0.45,
  lights(st) {
    return [{ x: 240, y: 52, r: 120, a: 0.85, cone: 70, flicker: st.r < 0.6, col: 'rgba(255,190,100,0.12)' }, { x: 26, y: 120, r: 24, a: 0.5, col: 'rgba(40,200,80,0.2)' }];
  },
  drawBg(ctx, st) {
    const R = this, f = R.floor;
    shell(ctx, R, { ceil: '#08090a', wall: mixc('#34383c', '#606870', st.r), floor: mixc('#2a2a28', '#504e4a', st.r) });
    wallTex(ctx, R, 'metal');
    // Regale
    const shelf = (u0, u1, seed) => {
      const a = proj(R, u0, 0), b = proj(R, u1, 0), rr = rngf(seed);
      rect(ctx, a.x, a.y - 92, 2, 92, '#3a4048'); rect(ctx, b.x - 2, a.y - 92, 2, 92, '#3a4048');
      for (let k = 0; k < 5; k++) {
        const y = a.y - 4 - k * 22;
        rect(ctx, a.x, y, b.x - a.x, 2, mixc('#6a4a20', '#c87a20', st.r));
        for (let x = a.x + 3; x < b.x - 8;) { const w = 6 + rr() * 12, h = 6 + rr() * 12; rect(ctx, x, y - h, w, h, ['#6a5a40', '#5a4a3a', '#4a5a6a', '#7a6a4a', '#3a3a3a'][Math.floor(rr() * 5)]); x += w + 1 + rr() * 4; }
      }
    };
    shelf(0.02, 0.34, 9); shelf(0.66, 0.98, 19);
    // Ausgabe-Käfig Rückwand
    const c0 = proj(R, 0.36, 0), c1 = proj(R, 0.64, 0);
    rect(ctx, c0.x, R.wallTop + 20, c1.x - c0.x, c0.y - R.wallTop - 20, '#1a1c1e');
    for (let k = 0; k < 3; k++) rect(ctx, c0.x + 6 + k * 18, 70, 14, 50, '#3a3428');
    sign(ctx, 240, R.wallTop + 26, 50, 8, '#c8b020', '#111', 'MATERIALAUSGABE', 4.4);
    hangLamp(ctx, 240, 46, R.wallTop, true, 1.1);
    sideDoor(ctx, R, 'L', 0.14, 0.38, 76, '#45505a', 'HALLE');
    grime(ctx, R, 404, 1 - st.r * 0.88);
  },
  props: [
    { v: 0.19, draw(ctx, st) { // Theke + Gitter
      const R = ROOMS.lager;
      const b = box(ctx, R, 0.36, 0.64, 0.08, 0.19, 30, '#4a4038');
      if (!Game.flag('read_pneu')) { rect(ctx, b.x0 + 10, b.top - 2, 12, 3, '#d8d0b0'); }
      const c0 = proj(R, 0.36, 0.08), c1 = proj(R, 0.64, 0.08);
      const yTop = R.wallTop + 30, yBot = c0.y - 30 * c0.s;
      ctx.strokeStyle = 'rgba(150,150,150,0.45)'; ctx.lineWidth = 0.6;
      for (let x = c0.x; x < c1.x; x += 5) { if (x > 225 && x < 255) { line(ctx, x, yTop, x, yBot - 26, 'rgba(150,150,150,0.45)', 0.6); continue; } line(ctx, x, yTop, x, yBot, 'rgba(150,150,150,0.45)', 0.6); }
      for (let y = yTop; y < yBot; y += 5) line(ctx, c0.x, y, c1.x, y, 'rgba(150,150,150,0.3)', 0.5);
      rect(ctx, 224, yBot - 26, 32, 1.5, '#555');
    } },
    { v: 0.63, draw(ctx, st) { // Kisten rechts
      const R = ROOMS.lager;
      box(ctx, R, 0.78, 0.96, 0.5, 0.62, 20, '#6a5232', { edge: '#3a2a1a' });
      box(ctx, R, 0.82, 0.94, 0.51, 0.6, 14, '#7a6040', { lift: 20, edge: '#3a2a1a' });
      if (!Game.has('zahnraeder') && !Game.flag('took_zahn')) { const p = proj(R, 0.88, 0.56); circle(ctx, p.x, p.y - 37, 4, '#888'); circle(ctx, p.x, p.y - 37, 1.4, '#333'); }
    } },
    { v: 0.66, draw(ctx, st) { // Palette links
      const R = ROOMS.lager;
      box(ctx, R, 0.03, 0.2, 0.56, 0.66, 5, '#8a7050');
      if (!Game.flag('took_schlauch')) { const p = proj(R, 0.12, 0.6); ctx.strokeStyle = '#2a6ad8'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(p.x, p.y - 8, 9, 3, 0, 0, Math.PI * 2); ctx.stroke(); ctx.beginPath(); ctx.ellipse(p.x, p.y - 10, 7, 2.4, 0, 0, Math.PI * 2); ctx.stroke(); }
    } },
  ],
  drawFx(ctx, st, t) {
    // Ratte
    if (st.r < 0.8) {
      const k = (t % 17) / 2.5;
      if (k < 1) { const p = proj(this, lerp(0.95, 0.05, k), 0.82); rect(ctx, p.x, p.y - 3, 7, 3, '#2a2420'); rect(ctx, p.x + 7, p.y - 2, 5, 1, '#3a302a'); rect(ctx, p.x - 2, p.y - 3, 2, 2, '#2a2420'); }
      if (Math.abs((t % 17) - 0.05) < 0.02) Snd.play('rat');
    }
  },
  npcs() { if (Game.flag('ending')) return []; return [{ ...NPC.irmgard, u: 0.5, v: 0.05, dir: 'D', r: 55, block: false }]; },
  hotspots: [
    { u: 0.15, v: 0.22, label: 'Regal (Elektro)', glint: () => !Game.flag('took_ls') || !Game.flag('took_klemmen'), gh: 60, use() {
      if (!Game.flag('took_ls')) { Game.set('took_ls'); Game.give('ls'); Game.say('Zwischen Kabeltrommeln und Schukosteckern: ein Sortimentskasten mit Leitungsschutzschaltern. B6, B10, B16, B32.'); }
      else if (!Game.flag('took_klemmen')) { Game.set('took_klemmen'); Game.give('klemmen'); Game.say('Kabeltrommeln, Aderendhülsen – und ein Karton „Lüsterklemmen“. Irmgard hat das Wort durchgestrichen und „VERBINDUNGSKLEMMEN“ darübergeschrieben. Du nimmst ihn mit.'); }
      else Game.say('Kabeltrommeln und Aderendhülsen. Sonst nichts Brauchbares.');
    } },
    { u: 0.82, v: 0.22, label: 'Regal (Werkzeug)', glint: () => !Game.flag('took_gb'), gh: 60, use() {
      if (!Game.flag('took_gb')) { Game.set('took_gb'); Game.give('gewindebohrer'); Game.say('In einer Schublade mit der Aufschrift „Gewinde“: ein Satz Handgewindebohrer M10. Drei Stück, mit 1, 2 und 3 Ringen.'); }
      else Game.say('Schubladen voller Schrauben, Muttern, Scheiben. Sauber beschriftet in Irmgards Handschrift.');
    } },
    { u: 0.87, v: 0.68, label: 'Kisten', glint: () => !Game.flag('took_zahn'), gh: 40, use() {
      if (!Game.flag('took_zahn')) { Game.set('took_zahn'); Game.give('zahnraeder'); Game.say('Eine schwere Kiste: „Ersatzräder Bandgetriebe“. Stirnräder mit 36, 54, 72 und 90 Zähnen.'); return; }
      if (!Game.flag('read_kowalski')) { Game.set('read_kowalski'); Snd.play('sting'); Game.say('Zwischen den Kisten klemmt ein zerknüllter Zettel …', () => Game.addFile('kowalski')); return; }
      Game.say('Nur noch Holzwolle und Spinnweben.');
    } },
    { u: 0.12, v: 0.72, label: 'Palette', glint: () => !Game.flag('took_schlauch'), gh: 20, use() {
      if (!Game.flag('took_schlauch')) { Game.set('took_schlauch'); Game.give('schlauch'); Game.say('Eine Rolle blauer Pneumatikschlauch, 6 mm, samt Steckverschraubungen und Schalldämpfern.'); }
      else Game.say('Eine leere Europalette.');
    } },
    { u: 0.4, v: 0.24, label: 'Katalog auf der Theke', use() { Game.set('read_pneu'); Game.addFile('pneumatik'); } },
    { u: 0.03, v: 0.26, r: 30, label: 'Tür zur Halle', use() { Game.goto('halle', 0.92, 0.12, 'D'); } },
  ],
};

// =====================================================================
//  SCHALTRAUM
// =====================================================================
ROOMS.schaltraum = {
  name: 'Schaltraum',
  seed: 67,
  floor: { yb: 150, yf: 270, xbl: 100, xbr: 380, xfl: -20, xfr: 500, sb: 0.64, sf: 1 },
  wallTop: 22,
  walk: { u0: 0.05, u1: 0.95, v0: 0.17, v1: 0.95 },
  blockers: [{ u0: 0.02, u1: 0.22, v0: 0.52, v1: 0.74 }],
  frontExit: { room: 'halle', u: 0.3, v: 0.12, dir: 'D' },
  darkness: st => 0.82 - st.r * 0.42,
  lights(st, t) {
    const L = [{ x: 240, y: 34, r: 110, a: 0.6, cone: 60, flicker: true, col: 'rgba(255,60,40,0.06)' }];
    const hs = proj(this, 0.46, 0);
    L.push({ x: hs.x, y: hs.y - 50 * hs.s, r: 18, a: 0.6, col: st.main === 'on' ? 'rgba(40,255,60,0.35)' : 'rgba(255,40,40,0.35)' });
    const sc = proj(this, 0.72, 0.1);
    if (Game.fixed('meldung') && st.main === 'on') L.push({ x: sc.x, y: sc.y - 70 * sc.s, r: 26, a: 0.8, col: 'rgba(40,255,80,0.4)' });
    if (st.main === 'on') L.push({ x: sc.x + 8, y: sc.y - 54 * sc.s, r: 14, a: 0.5, col: 'rgba(80,160,255,0.3)' });
    return L;
  },
  drawBg(ctx, st) {
    const R = this;
    shell(ctx, R, { ceil: '#0a0b0d', wall: mixc('#3a4250', '#6a7888', st.r), floor: mixc('#2e3034', '#55585e', st.r), tilesU: 6, tilesV: 6 });
    wallTex(ctx, R, 'panel');
    // Kabeltrassen
    rect(ctx, R.floor.xbl, 40, R.floor.xbr - R.floor.xbl, 4, '#3a3a3a');
    for (let k = 0; k < 8; k++) rect(ctx, R.floor.xbl + k * 35, 44, 1.5, 30 + (k % 3) * 10, ['#222', '#333', '#4a3a20'][k % 3]);
    // Hauptschalter (Wandkasten)
    const hs = proj(R, 0.46, 0);
    rect(ctx, hs.x - 11, hs.y - 66 * hs.s, 22, 28, '#d8c820'); rect(ctx, hs.x - 9, hs.y - 64 * hs.s, 18, 24, '#ddd');
    circle(ctx, hs.x, hs.y - 54 * hs.s, 6, '#a22');
    if (G.mainSwitch === 'on') rect(ctx, hs.x - 1.5, hs.y - 62 * hs.s, 3, 10, '#600'); else rect(ctx, hs.x - 5, hs.y - 55 * hs.s, 10, 3, '#600');
    if (G.mainSwitch === 'locked') { rect(ctx, hs.x + 6, hs.y - 50 * hs.s, 6, 6, '#c22'); ctx.strokeStyle = '#bbb'; ctx.beginPath(); ctx.arc(hs.x + 9, hs.y - 50 * hs.s, 2.5, Math.PI, 0); ctx.stroke(); }
    text(ctx, 'HAUPTSCHALTER', hs.x, hs.y - 70 * hs.s, '#ddd', 3.6); text(ctx, 'HALLE 3', hs.x, hs.y - 66 * hs.s - 4, '#ddd', 3.2);
    text(ctx, G.mainSwitch === 'on' ? 'I' : '0', hs.x + 8, hs.y - 62 * hs.s, '#111', 4);
    // Warnschilder
    warnSign(ctx, proj(R, 0.21, 0).x, 58, 1); warnSign(ctx, proj(R, 0.72, 0).x, 56, 1);
    sign(ctx, 240, 155, 40, 6, '#1b8a3b', '#fff', '▼ HALLE', 4); // Hinweis zur Tür vorne
    // Schreibtisch links
    grime(ctx, R, 505, 1 - st.r * 0.9);
  },
  props: [
    { v: 0.1, draw(ctx, st) { // Verteilung
      const R = ROOMS.schaltraum;
      const b = box(ctx, R, 0.08, 0.34, 0.0, 0.1, 82, '#8a9098');
      line(ctx, (b.x0 + b.x1) / 2, b.top + 2, (b.x0 + b.x1) / 2, b.y - 2, '#555', 0.8);
      rect(ctx, b.x0 + 4, b.top + 6, 30, 6, '#ddd'); text(ctx, 'UV HALLE 3', b.x0 + 19, b.top + 9, '#222', 3.6);
      // Sichtfenster mit LS-Reihe
      rect(ctx, b.x0 + 6, b.top + 18, b.w - 12, 10, '#1a1a1a');
      for (let i = 0; i < 8; i++) { const x = b.x0 + 8 + i * ((b.w - 16) / 8); if (i === 2 && !Game.fixed('licht')) { rect(ctx, x, b.top + 19, 4, 8, '#000'); continue; } rect(ctx, x, b.top + 19, 4, 8, '#eee'); rect(ctx, x + 1, b.top + 21, 2, 2, st.main === 'on' ? '#2a2' : '#a22'); }
      rect(ctx, b.x1 - 6, b.top + 40, 2, 6, '#aaa');
    } },
    { v: 0.1, draw(ctx, st, t) { // Steuerschrank
      const R = ROOMS.schaltraum;
      const b = box(ctx, R, 0.6, 0.85, 0.0, 0.1, 86, '#7a8088');
      rect(ctx, b.x0 + 4, b.top + 6, 40, 6, '#ddd'); text(ctx, 'FB-01 FÖRDERBAND', b.x0 + 24, b.top + 9, '#222', 3.4);
      // Meldeleuchte
      const on = Game.fixed('meldung') && st.main === 'on';
      circle(ctx, b.x0 + 12, b.top + 22, 3.4, on ? '#5f5' : '#232'); if (on) circle(ctx, b.x0 + 12, b.top + 22, 1.5, '#efe');
      text(ctx, 'BEREIT', b.x0 + 12, b.top + 28, '#ddd', 3);
      // Kleinsteuerung-Display
      rect(ctx, b.x0 + 22, b.top + 17, 22, 12, '#2a3a2a'); rect(ctx, b.x0 + 23, b.top + 18, 20, 8, st.main === 'on' ? '#6a9aca' : '#1a2a3a');
      if (st.main === 'on') text(ctx, Game.fixed('steuerung') ? 'RUN' : 'ERR', b.x0 + 33, b.top + 22, '#fff', 4);
      // Farbcode-Aufkleber
      rect(ctx, b.x1 - 14, b.top + 34, 10, 12, '#e8e0c8'); for (let k = 0; k < 5; k++) rect(ctx, b.x1 - 13, b.top + 36 + k * 2, 3, 1, ['#6b3b1a', '#c22', '#e67a00', '#e6d200', '#2a2'][k]);
      rect(ctx, b.x1 - 6, b.top + 50, 2, 8, '#aaa');
    } },
    { v: 0.74, draw(ctx, st) { // Schreibtisch
      const R = ROOMS.schaltraum;
      box(ctx, R, 0.03, 0.05, 0.54, 0.73, 24, '#333', { noTop: true }); box(ctx, R, 0.19, 0.21, 0.54, 0.73, 24, '#333', { noTop: true });
      const b = box(ctx, R, 0.02, 0.22, 0.53, 0.74, 3, '#5a5a52', { lift: 24 });
      rect(ctx, b.x0 + b.w * 0.5, b.top - 2, 12, 4, '#e0d8c0'); rect(ctx, b.x0 + b.w * 0.5 + 2, b.top - 1, 8, 1, '#447');
      rect(ctx, b.x0 + b.w * 0.2, b.top - 6, 6, 6, '#3a3a3a');
    } },
  ],
  drawFront(ctx, st, t) {
    const a = 0.4 + 0.3 * Math.sin(t * 3);
    ctx.fillStyle = `rgba(200,220,200,${a})`; ctx.font = '7px monospace'; ctx.textAlign = 'center'; ctx.fillText('▼', 240, 266);
  },
  hotspots: [
    { u: 0.21, v: 0.18, label: 'Unterverteilung', use() { SR.verteilung(); } },
    { u: 0.46, v: 0.18, label: 'Hauptschalter Halle 3', use() { SR.hauptschalter(); } },
    { u: 0.72, v: 0.18, label: 'Steuerschrank Förderband', use() { SR.steuerschrank(); } },
    { u: 0.86, v: 0.18, label: 'Aufkleber an der Schranktür', use() { Game.addFile('farbcode'); } },
    { u: 0.12, v: 0.78, label: 'Schreibtisch', use() { Game.addFile('leistung'); } },
  ],
};

const SR = {
  // Prüft die Sicherheitsregeln vor Arbeiten im Schrank. cb() wird bei Erfolg aufgerufen.
  safety(what, cb) {
    if (G.mainSwitch === 'on') {
      Game.ask(`Der Hauptschalter steht auf EIN. Trotzdem an ${what} arbeiten?`, [
        { t: 'Ja, geht schon schnell', f: () => {
          G.zaps++; Game.mistake(); Snd.play('zap');
          if (!Game.hurt(40, 'Stromschlag beim Arbeiten unter Spannung. Regel 1: FREISCHALTEN!')) Game.say(['ZZZACK! Ein Schlag fährt dir durch den Arm.', 'Regel Nr. 1: FREISCHALTEN! Erst den Hauptschalter aus.']);
        } },
        { t: 'Nein – erst freischalten', f: () => Game.say('Richtig. Der Hauptschalter für die Halle ist hier im Raum an der Wand.') },
      ]);
      return;
    }
    if (G.mainSwitch === 'off') {
      Game.ask('Der Hauptschalter ist aus – aber nicht gesichert. Einfach anfangen?', [
        { t: 'Ja, ist ja aus', f: () => {
          G.zaps++; Game.mistake(); G.mainSwitch = 'on'; G.ver++;
          Snd.play('breaker');
          setTimeout(() => {
            Snd.play('zap'); Snd.play('sting');
            if (!Game.hurt(30, 'Jemand hat den ungesicherten Hauptschalter wieder eingeschaltet. Regel 2: Gegen Wiedereinschalten sichern!'))
              Game.say(['Hinter dir: KLACK. Jemand hat den Hauptschalter wieder eingelegt!', 'ZZZACK!', 'Als du dich umdrehst, ist niemand da. Nur die Tür schwingt leise.', 'Regel 2: Gegen Wiedereinschalten sichern – mit deinem Vorhängeschloss!']);
          }, 600);
        } },
        { t: 'Nein – erst sichern', f: () => Game.say(Game.has('schloss') ? 'Gut. Häng dein Vorhängeschloss an den Hauptschalter.' : 'Gut. Du brauchst ein Vorhängeschloss – war da nicht eins in deinem Spind?') },
      ]);
      return;
    }
    if (!Game.has('pruefer')) {
      Game.say(['Hauptschalter aus und gesichert. Aber Regel 3: Spannungsfreiheit feststellen!', 'Dafür brauchst du einen zweipoligen Spannungsprüfer. An Alois’ Werkzeugwand hängt einer.']);
      return;
    }
    Game.say([`Du prüfst mit dem zweipoligen Spannungsprüfer alle Leiter an ${what} gegeneinander und gegen PE.`, 'Keine LED leuchtet. Spannungsfrei. (Erden und Kurzschließen ist bei Niederspannung hier nicht nötig, benachbarte Teile sind abgedeckt.)'], cb);
  },
  verteilung() {
    if (Game.fixed('licht')) { Game.say(G.mainSwitch === 'on' ? 'Alle LS-Schalter drin, alle eingeschaltet. F3 Hallenbeleuchtung: B16.' : 'Der neue B16 sitzt. Jetzt Schloss ab und Hauptschalter wieder ein!'); return; }
    if (!Game.flag('sawF3')) {
      Game.set('sawF3');
      Game.say(['Die Unterverteilung der Halle. Im Sichtfenster: eine Reihe LS-Schalter …', '… und eine Lücke. Platz F3 – „HALLENBELEUCHTUNG“ – ist leer. Jemand hat den Automaten einfach ausgebaut.'], () => SR.verteilung());
      return;
    }
    if (!Game.has('ls')) { Game.say('Für F3 fehlt ein Leitungsschutzschalter. Ersatz gibt es bestimmt im Lager.'); return; }
    SR.safety('der Verteilung', () => Game.puzzle('sicherung'));
  },
  hauptschalter() {
    const s = G.mainSwitch;
    const after = () => { G.ver++; Snd.setMood(Game.restore(), false); };
    if (s === 'on') {
      Game.ask('Hauptschalter Halle 3: EIN. Was tun?', [
        { t: 'Ausschalten (Freischalten)', f: () => {
          G.mainSwitch = 'off'; after(); Snd.play('breaker');
          if (Game.has('schloss')) Game.ask('Ausgeschaltet. Dein Vorhängeschloss anbringen?', [{ t: 'Ja, sichern', f: () => { G.mainSwitch = 'locked'; after(); Snd.play('clank'); Game.say('Klick. Jetzt kann niemand außer dir den Schalter wieder einlegen.'); } }, { t: 'Nein', f: () => {} }]);
          else Game.say('Der Schalter steht auf 0.');
        } },
        { t: 'Lassen', f: () => {} },
      ]);
    } else if (s === 'off') {
      Game.ask('Hauptschalter Halle 3: AUS (nicht gesichert).', [
        ...(Game.has('schloss') ? [{ t: 'Vorhängeschloss anbringen', f: () => { G.mainSwitch = 'locked'; after(); Snd.play('clank'); Game.say('Klick. Gesichert gegen Wiedereinschalten.'); } }] : []),
        { t: 'Wieder einschalten', f: () => { G.mainSwitch = 'on'; after(); Snd.play('breaker'); SR.onPower(); } },
        { t: 'Lassen', f: () => {} },
      ]);
    } else {
      Game.ask('Hauptschalter Halle 3: AUS, mit deinem Schloss gesichert.', [
        { t: 'Schloss abnehmen und einschalten', f: () => {
          G.mainSwitch = 'on'; after(); Snd.play('breaker');
          SR.onPower();
        } },
        { t: 'Lassen', f: () => {} },
      ]);
    }
  },
  onPower() {
    const msg = ['KLACK. Irgendwo in der Halle springen Schütze an. Der Kompressor läuft hoch.'];
    if (Game.fixed('licht') && !Game.flag('lightSeen')) { Game.set('lightSeen'); msg.push('Durch den Türspalt fällt helles Licht: Die Hallenbeleuchtung brennt wieder!'); }
    Game.say(msg);
  },
  steuerschrank() {
    if (!Game.flag('ledSeen')) {
      Game.set('ledSeen');
      Game.say(['Der Steuerschrank für das Förderband.', 'Die Meldeleuchte „BEREIT“ ist tot. Darunter auf der Klemmleiste: ein schwarz verkohlter Vorwiderstand.', 'Und das Display der Kleinsteuerung zeigt „ERR“ – jemand hat das Programm gelöscht.'], () => SR.steuerschrank());
      return;
    }
    const opts = [];
    if (!Game.fixed('meldung')) opts.push({ t: 'Vorwiderstand der Meldeleuchte ersetzen', f: () => {
      if (!Game.has('widerstaende')) { Game.say('Du brauchst Ersatz-Widerstände. Wer hat hier so was rumliegen? Vielleicht einer der alten Hasen.'); return; }
      SR.safety('dem Steuerschrank', () => Game.puzzle('widerstand'));
    } });
    if (!Game.fixed('steuerung')) opts.push({ t: 'Kleinsteuerung programmieren', f: () => {
      if (!Game.has('schaltplan')) { Game.say('Ohne Schaltplan weißt du nicht, wie die Logik aussehen soll. Der Plan liegt sicher im Meisterbüro.'); return; }
      if (G.mainSwitch !== 'on') { Game.say('Das Display ist dunkel. Zum Programmieren braucht die Kleinsteuerung Spannung – Hauptschalter wieder ein.'); return; }
      Game.puzzle('logik');
    } });
    if (!opts.length) { Game.say('Meldeleuchte und Steuerung sind in Ordnung. Das Display zeigt „RUN“.'); return; }
    opts.push({ t: 'Nichts', f: () => {} });
    Game.ask('Steuerschrank FB-01:', opts);
  },
};

// =====================================================================
//  MEISTERBÜRO
// =====================================================================
ROOMS.buero = {
  name: 'Meisterbüro',
  seed: 83,
  floor: { yb: 150, yf: 270, xbl: 110, xbr: 370, xfl: 0, xfr: 480, sb: 0.66, sf: 1 },
  wallTop: 20,
  walk: { u0: 0.04, u1: 0.96, v0: 0.18, v1: 0.95 },
  blockers: [{ u0: 0.33, u1: 0.72, v0: 0.28, v1: 0.44 }, { u0: 0.02, u1: 0.15, v0: 0, v1: 0.22 }],
  darkness: st => 0.78 - st.r * 0.4,
  lights(st) {
    const p = proj(this, 0.62, 0.34);
    return [{ x: p.x, y: p.y - 34, r: 90, a: 0.9, col: 'rgba(255,200,110,0.18)' }, { x: 190, y: 60, r: 70, a: st.r > 0.1 ? 0.6 : 0.25, cone: 30 }];
  },
  drawBg(ctx, st) {
    const R = this;
    shell(ctx, R, { ceil: '#0e0c0a', wall: mixc('#4a3e30', '#7a6a50', st.r), floor: mixc('#3a2e22', '#5a4a38', st.r), tilesU: 12, tilesV: 6, tileAlpha: 0.3 });
    wallTex(ctx, R, 'panel');
    // Fenster zur Halle
    rect(ctx, 150, 40, 80, 50, '#1a1c1e');
    const lit = Game.hallLight();
    const g = ctx.createLinearGradient(0, 42, 0, 88); g.addColorStop(0, lit ? '#8a8a70' : '#10141c'); g.addColorStop(1, lit ? '#5a5a48' : '#06080c');
    ctx.fillStyle = g; ctx.fillRect(152, 42, 76, 46);
    rect(ctx, 189, 42, 2, 46, '#1a1c1e'); rect(ctx, 152, 64, 76, 2, '#1a1c1e');
    if (lit) for (let i = 0; i < 4; i++) circle(ctx, 160 + i * 20, 48, 1.5, '#ffe');
    // Kalender
    rect(ctx, 250, 46, 26, 30, '#eee'); rect(ctx, 250, 46, 26, 6, '#a22'); text(ctx, 'OKTOBER', 263, 49, '#fff', 3.4);
    for (let k = 0; k < 20; k++) rect(ctx, 252 + (k % 5) * 5, 55 + Math.floor(k / 5) * 5, 3, 3, '#999');
    ctx.strokeStyle = '#d22'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(264, 70, 4, 0, Math.PI * 2); ctx.stroke();
    // Urkunde
    rect(ctx, 290, 50, 22, 16, '#6a4a20'); rect(ctx, 292, 52, 18, 12, '#e8dcb0'); text(ctx, 'IHK', 301, 57, '#444', 3.4);
    // Kaffeemaschine
    const k = proj(R, 0.08, 0.1);
    box(ctx, R, 0.02, 0.15, 0.0, 0.22, 24, '#4a3a2a');
    rect(ctx, k.x - 6, k.y - 50 * k.s, 12, 14, '#222'); rect(ctx, k.x - 4, k.y - 38 * k.s, 8, 6, '#5a3a20');
    // Aktenschrank
    const a = box(ctx, R, 0.76, 0.96, 0.0, 0.12, 64, '#5a5e60');
    for (let i = 0; i < 4; i++) { rect(ctx, a.x0 + 2, a.top + 4 + i * a.h / 4, a.w - 4, a.h / 4 - 3, '#6a6e70'); rect(ctx, a.x0 + a.w / 2 - 4, a.top + 8 + i * a.h / 4, 8, 2, '#aaa'); }
    sideDoor(ctx, R, 'L', 0.14, 0.38, 76, '#5a4636', 'HALLE');
    const eh = proj(R, 1, 0.5); firstAidBox(ctx, eh.x - 7, eh.y - 50 * eh.s, eh.s);
    grime(ctx, R, 606, (1 - st.r * 0.9) * 0.6);
  },
  props: [
    { v: 0.44, draw(ctx, st) {
      const R = ROOMS.buero;
      box(ctx, R, 0.35, 0.38, 0.3, 0.43, 26, '#3a2a1a', { noTop: true }); box(ctx, R, 0.67, 0.7, 0.3, 0.43, 26, '#3a2a1a', { noTop: true });
      const b = box(ctx, R, 0.33, 0.72, 0.29, 0.44, 3, '#6a4a2a', { lift: 26, top: '#7a5a34' });
      const lp = proj(R, 0.62, 0.34);
      rect(ctx, lp.x - 1, lp.y - 40, 2, 10, '#333'); poly(ctx, [[lp.x - 7, lp.y - 40], [lp.x + 7, lp.y - 40], [lp.x + 3, lp.y - 46], [lp.x - 3, lp.y - 46]], '#2a5a3a');
      rect(ctx, b.x0 + 14, b.top - 2, 14, 4, '#e0d8c0'); rect(ctx, b.x0 + 34, b.top - 3, 10, 5, '#3a2a1a');
      rect(ctx, b.x0 + 50, b.top - 6, 5, 6, '#ddd');
    } },
  ],
  hotspots: [
    { u: 0.48, v: 0.48, label: 'Schreibtisch', glint: () => !G.files.includes('tagebuch'), gh: 30, use() {
      if (!G.files.includes('tagebuch')) Game.say('Auf dem Schreibtisch liegt ein abgegriffenes Notizbuch. Die Handschrift des Meisters.', () => Game.addFile('tagebuch'));
      else Game.addFile('tagebuch');
    } },
    { u: 0.86, v: 0.18, label: 'Aktenschrank', glint: () => !Game.has('schaltplan') && !Game.fixed('steuerung'), gh: 60, use() {
      if (!Game.has('schaltplan') && !Game.fixed('steuerung')) { Game.give('schaltplan'); Game.say('Ordner „FB-01 Förderband“. Darin: der laminierte Schaltplan. Auf der Rückseite hat der Meister etwas notiert.', () => Game.addFile('logik')); }
      else Game.say('Ordner über Ordner. Prüfprotokolle, Wartungspläne, Ausbildungsnachweise.');
    } },
    { u: 0.08, v: 0.26, label: 'Kaffeemaschine', use() { Game.say(Game.flag('ending') ? 'Frischer Kaffee. Du hast ihn dir verdient.' : 'Die Kanne ist noch lauwarm. Der Meister kann nicht lange weg sein.'); } },
    { u: 0.58, v: 0.18, label: 'Kalender', use() { Game.say('Oktober. Der Montag ist dick rot umkringelt: „LIEFERUNG 2000 STK – 6:00 !!!“'); } },
    { u: 0.3, v: 0.18, label: 'Fenster zur Halle', use() { Game.say(Game.hallLight() ? 'Von hier oben sieht man die ganze Halle. Das Licht brennt. Sieht fast wieder aus wie eine Fabrik.' : 'Unten ist alles schwarz. Nur das Mondlicht malt Streifen auf den Hallenboden. War da gerade eine Bewegung beim Rolltor?'); } },
    { u: 0.96, v: 0.52, label: 'Erste-Hilfe-Kasten', glint: () => !Game.flag('eh_buero'), gh: 50, use: firstAid('eh_buero', 1) },
    { u: 0.03, v: 0.26, r: 30, label: 'Tür zur Halle', use() { Game.goto('halle', 0.955, 0.2, 'L'); } },
  ],
};

// =====================================================================
//  KELLERGANG
// =====================================================================
function pipesAlong(ctx, R, y, col) {
  const f = R.floor;
  line(ctx, f.xbl, y, f.xbr, y, col, 3);
  const k = f.sf / f.sb;
  const yl = f.yf - (f.yb - y) * k;
  line(ctx, f.xbl, y, f.xfl, yl, col, 3 * 1.6); line(ctx, f.xbr, y, f.xfr, yl, col, 3 * 1.6);
}
function stampClock(ctx, x, y) {
  rect(ctx, x - 9, y - 24, 18, 24, '#3a3530'); rect(ctx, x - 6, y - 21, 12, 8, '#d8d0b8');
  text(ctx, '--:--', x, y - 17, '#a22', 3.6); rect(ctx, x - 3, y - 10, 6, 5, '#151515');
}

ROOMS.keller = {
  name: 'Kellergang',
  seed: 701,
  floor: { yb: 140, yf: 270, xbl: 160, xbr: 320, xfl: -60, xfr: 540, sb: 0.48, sf: 1 },
  wallTop: 46,
  walk: { u0: 0.06, u1: 0.94, v0: 0.1, v1: 0.95 },
  frontExit: { room: 'halle', u: 0.85, v: 0.86, dir: 'U', u0: 0.3, u1: 0.7 },
  darkness: st => 0.84 - st.r * 0.4,
  lights(st, t) {
    return [
      { x: 240, y: 60, r: 130, a: 0.75, cone: 60, flicker: st.r < 0.7, col: 'rgba(255,200,120,0.08)' },
      { x: 240, y: 175, r: 60, a: 0.35, col: 'rgba(200,30,20,0.12)' },
      { x: proj(this, 0.5, 0).x, y: 110, r: 30, a: 0.4, col: 'rgba(255,180,90,0.25)' },
    ];
  },
  onEnter() {
    if (!Game.flag('kellerSeen')) {
      Game.set('kellerSeen'); Snd.play('sting');
      Game.say(['Der Keller. Es riecht nach Moder und Schmieröl. Irgendwo tropft Wasser.', 'Am Ende des Gangs steht eine Tür einen Spalt offen. Dahinter flackert schwaches Licht.']);
    }
  },
  drawBg(ctx, st) {
    const R = this, f = R.floor;
    shell(ctx, R, { ceil: '#070708', wall: mixc('#34302a', '#5a564c', st.r), floor: mixc('#242422', '#44443e', st.r), tilesU: 4, tilesV: 10, tileAlpha: 0.3 });
    wallTex(ctx, R, 'brick');
    pipesAlong(ctx, R, 58, mixc('#4a3020', '#7a5a3a', st.r));
    pipesAlong(ctx, R, 66, '#2a3a4a');
    // Kabeltrasse
    pipesAlong(ctx, R, 74, '#1a1a1a');
    // Tür am Ende (Hausmeister) – angelehnt
    const d = proj(R, 0.5, 0);
    rect(ctx, d.x - 12, d.y - 42, 24, 42, '#141414'); rect(ctx, d.x - 11, d.y - 41, 8, 41, '#050505');
    poly(ctx, [[d.x - 3, d.y - 41], [d.x + 11, d.y - 41], [d.x + 11, d.y], [d.x - 3, d.y]], '#4a3a2a');
    sign(ctx, d.x, d.y - 49, 34, 7, '#3a3a3a', '#ddd', 'HAUSMEISTER', 4.2);
    // Stempeluhr + Werkszeitung an der Rückwand
    stampClock(ctx, proj(R, 0.15, 0).x, d.y - 18);
    rect(ctx, proj(R, 0.82, 0).x - 8, d.y - 44, 16, 20, '#c8b880'); for (let k = 0; k < 5; k++) rect(ctx, proj(R, 0.82, 0).x - 6, d.y - 40 + k * 3, 12, 1, '#665');
    // Seitentüren
    sideDoor(ctx, R, 'L', 0.22, 0.42, 76, '#3a4a5a', 'E-WERKSTATT');
    sideDoor(ctx, R, 'R', 0.22, 0.42, 76, '#4a4a40', 'KOMPRESSOR');
    // Abzweigkasten rechts
    const ab = proj(R, 1, 0.66);
    poly(ctx, [[ab.x - 4, ab.y - 70 * ab.s], [ab.x - 4, ab.y - 40 * ab.s], [ab.x - 30, ab.y - 44 * ab.s + 8], [ab.x - 30, ab.y - 72 * ab.s + 6]], '#7a7a70', '#222', 1);
    text(ctx, 'FB-01', ab.x - 17, ab.y - 58 * ab.s + 3, '#111', 5);
    // Treppe nach oben (vorne)
    sign(ctx, 240, 258, 34, 8, '#1d4a2a', '#d8f0d8', '▼ HALLE', 5);
    // Pfützen
    const rr = rngf(9);
    for (let i = 0; i < 5; i++) { const p = proj(R, rr(), rr() * 0.9 + 0.05); ellipse(ctx, p.x, p.y, 14 * p.s, 3 * p.s, 'rgba(60,70,90,0.35)'); }
    grime(ctx, R, 707, 1 - st.r * 0.85);
  },
  drawFx(ctx, st, t) {
    // Tropfen
    const k = (t * 0.7) % 1, p = proj(this, 0.62, 0.55);
    if (k < 0.8) rect(ctx, p.x, lerp(70, p.y - 2, k / 0.8), 1, 2, 'rgba(160,180,220,0.7)');
    else ellipse(ctx, p.x, p.y, (k - 0.8) * 30, (k - 0.8) * 8, 'rgba(160,180,220,0.4)');
  },
  hotspots: [
    { u: 0.15, v: 0.12, label: 'Stempeluhr (Speichern)', use() { ROOMS.umkleide.hotspots.find(h => h.label.startsWith('Stempeluhr')).use(); } },
    { u: 0.82, v: 0.12, label: 'Zeitungsausschnitt', use() { Game.addFile('werkszeitung'); } },
    { u: 0.5, v: 0.1, label: 'Tür (Hausmeister)', use() { Game.goto('hausmeister', 0.5, 0.86, 'U'); } },
    { u: 0.05, v: 0.32, r: 30, label: 'Tür zur E-Werkstatt', use() { Game.goto('ewerkstatt', 0.92, 0.26, 'L'); } },
    { u: 0.95, v: 0.32, r: 30, label: 'Tür zum Kompressorraum', use() { Game.goto('kompressor', 0.08, 0.26, 'R'); } },
    { u: 0.93, v: 0.66, r: 30, label: 'Abzweigkasten Steuerleitung FB-01', use() {
      if (Game.fixed('leitung')) { Game.say('Der Abzweigkasten. Ader 3 ist abgeklemmt, das Signal läuft jetzt über die Reserveader 7. Sauber beschriftet.'); return; }
      if (!Game.flag('sawLeitung')) { Game.set('sawLeitung'); Game.say(['Ein grauer Abzweigkasten: „Steuerleitung FB-01 Förderband, 24 V DC“.', 'Durch diesen Kasten läuft die Steuerleitung vom Schaltraum zum Band. Am Kabel sieht man frische Kratzer – als hätte jemand daran herumgeschnitten.'], () => ROOMS.keller.hotspots[5].use()); return; }
      if (!Game.has('multimeter')) { Game.say('Um herauszufinden, ob eine Ader beschädigt ist, brauchst du ein Messgerät.'); return; }
      if (!Game.has('klemmen')) { Game.say('Du hast ein Multimeter. Aber falls eine Ader durch ist, brauchst du auch Verbindungsklemmen zum Umklemmen. Irmgard hat bestimmt welche.'); return; }
      Game.puzzle('multimeter');
    } },
  ],
};

// =====================================================================
//  E-WERKSTATT
// =====================================================================
ROOMS.ewerkstatt = {
  name: 'E-Werkstatt',
  seed: 702,
  floor: { yb: 150, yf: 270, xbl: 90, xbr: 390, xfl: -30, xfr: 510, sb: 0.62, sf: 1 },
  wallTop: 20,
  walk: { u0: 0.04, u1: 0.96, v0: 0.18, v1: 0.95 },
  blockers: [{ u0: 0.08, u1: 0.3, v0: 0.5, v1: 0.68 }],
  darkness: st => 0.82 - st.r * 0.42,
  lights(st) {
    return [
      { x: 180, y: 36, r: 150, a: 0.85, cone: 80, flicker: true, col: 'rgba(170,220,255,0.07)' },
      { x: proj(this, 0.22, 0.58).x, y: proj(this, 0.22, 0.58).y - 36, r: 80, a: 0.85, col: 'rgba(255,190,100,0.2)' },
    ];
  },
  drawBg(ctx, st) {
    const R = this;
    shell(ctx, R, { ceil: '#09090a', wall: mixc('#3a4248', '#6a7880', st.r), floor: mixc('#2a2c2e', '#50545a', st.r), tilesU: 8, tilesV: 6 });
    wallTex(ctx, R, 'panel');
    tubeLamp(ctx, 180, 30, 50, true); tubeLamp(ctx, 320, 30, 50, false);
    // Prüfplatz an der Rückwand
    const a = proj(R, 0.08, 0), b = proj(R, 0.46, 0);
    rect(ctx, a.x, a.y - 70, b.x - a.x, 36, '#2a2c30');
    for (let i = 0; i < 6; i++) { rect(ctx, a.x + 6 + i * 22, a.y - 64, 16, 12, '#111'); rect(ctx, a.x + 8 + i * 22, a.y - 62, 12, 5, ['#2a6', '#a82', '#26a', '#2a6', '#a22', '#666'][i]); }
    for (let i = 0; i < 8; i++) circle(ctx, a.x + 10 + i * 16, a.y - 44, 2.4, ['#c22', '#111', '#e6c000', '#2a2', '#24c', '#c22', '#111', '#ddd'][i]);
    sign(ctx, (a.x + b.x) / 2, a.y - 76, 46, 7, '#c8b020', '#111', 'PRÜFPLATZ', 4.4);
    rect(ctx, a.x, a.y - 34, b.x - a.x, 34, '#3a3a36'); rect(ctx, a.x, a.y - 34, b.x - a.x, 3, '#5a5a50');
    // Pinnwand
    const pw = proj(R, 0.55, 0);
    rect(ctx, pw.x - 14, pw.y - 76, 28, 22, '#8a6a40'); rect(ctx, pw.x - 11, pw.y - 73, 9, 11, '#ddd'); rect(ctx, pw.x + 1, pw.y - 72, 10, 8, '#e8d890'); rect(ctx, pw.x - 8, pw.y - 60, 14, 4, '#bbb');
    // Regal mit Kartons
    const r0 = proj(R, 0.64, 0), r1 = proj(R, 0.84, 0);
    for (let k = 0; k < 4; k++) rect(ctx, r0.x, r0.y - 6 - k * 22, r1.x - r0.x, 2, '#5a5a5a');
    rect(ctx, r0.x, r0.y - 74, 2, 74, '#444'); rect(ctx, r1.x - 2, r0.y - 74, 2, 74, '#444');
    const rr = rngf(21);
    for (let k = 0; k < 3; k++) for (let x = r0.x + 3; x < r1.x - 12; x += 13) rect(ctx, x, r0.y - 18 - k * 22, 11, 12, ['#8a7a5a', '#6a6a6a', '#3a5a8a', '#8a5a3a'][Math.floor(rr() * 4)]);
    // Kabeltrommeln
    const kt = proj(R, 0.92, 0.12);
    for (const [dx, c] of [[-8, '#c84'], [8, '#333']]) { circle(ctx, kt.x + dx, kt.y - 12, 11, '#5a4a30'); circle(ctx, kt.x + dx, kt.y - 12, 8, c); circle(ctx, kt.x + dx, kt.y - 12, 3, '#222'); }
    sideDoor(ctx, R, 'R', 0.14, 0.38, 76, '#3a4a5a', 'KELLER');
    warnSign(ctx, 120, 60, 1.2);
    grime(ctx, R, 777, 1 - st.r * 0.9);
  },
  props: [
    { v: 0.68, draw(ctx, st) { // Dragans Schreibtisch
      const R = ROOMS.ewerkstatt;
      box(ctx, R, 0.09, 0.11, 0.52, 0.67, 24, '#333', { noTop: true }); box(ctx, R, 0.27, 0.29, 0.52, 0.67, 24, '#333', { noTop: true });
      const b = box(ctx, R, 0.08, 0.3, 0.51, 0.68, 3, '#4a4a42', { lift: 24 });
      const lp = proj(R, 0.19, 0.58);
      rect(ctx, lp.x - 1, lp.y - 40, 2, 12, '#333'); poly(ctx, [[lp.x - 6, lp.y - 40], [lp.x + 6, lp.y - 40], [lp.x + 3, lp.y - 45], [lp.x - 3, lp.y - 45]], '#8a2a2a');
      rect(ctx, b.x0 + 8, b.top - 9, 5, 9, '#5a6a5a'); rect(ctx, b.x0 + 8, b.top - 10, 5, 2, '#333');
      rect(ctx, b.x1 - 22, b.top - 3, 14, 4, '#e0d8c0');
    } },
  ],
  npcs() { if (Game.flag('ending')) return []; return [{ ...NPC.dragan, u: 0.36, v: 0.58, dir: 'L' }]; },
  hotspots: [
    { u: 0.27, v: 0.2, label: 'Prüfplatz', use() { Game.addFile('multimeter_heft'); } },
    { u: 0.55, v: 0.2, label: 'Pinnwand', use() { Game.addFile('schutz_heft'); } },
    { u: 0.74, v: 0.2, label: 'Regal', glint: () => !Game.flag('took_fi'), gh: 60, use() {
      if (!Game.flag('took_fi')) { Game.set('took_fi'); Game.give('fi_kasten'); Game.say('Im Regal: ein Karton neuer FI-Schutzschalter. 30 mA, 300 mA, 500 mA. Daneben ein Ordner „Grundlagen“.'); return; }
      Game.addFile('rp_heft');
    } },
    { u: 0.9, v: 0.24, label: 'Kabeltrommeln', glint: () => !Game.flag('took_ader'), gh: 30, use() {
      if (!Game.flag('took_ader')) { Game.set('took_ader'); Game.give('aderleitung'); Game.say('Zwischen den Kabeltrommeln: eine Rolle Aderleitung 1,5 mm², Aderendhülsen und eine Crimpzange.'); }
      else Game.say('NYM-J 3×1,5, NYM-J 5×2,5, Steuerleitung 7×1. Genug Kabel für eine ganze Halle.');
    } },
    { u: 0.24, v: 0.72, label: 'Schreibtisch', use() { Game.say(Game.flag('ending') ? 'Die Thermoskanne ist leer. Daneben ein Zettel: „Danke, Azubi. – D.“' : 'Eine Thermoskanne, die nach „Kräutertee“ riecht. Ein Stapel Prüfprotokolle. Und eine Visitenkarte: „Dr. F. Falk – Falk Grundbesitz GmbH“. Zerknüllt.'); } },
    { u: 0.97, v: 0.26, r: 30, label: 'Tür zum Kellergang', use() { Game.goto('keller', 0.08, 0.32, 'R'); } },
  ],
};

// =====================================================================
//  KOMPRESSORRAUM
// =====================================================================
ROOMS.kompressor = {
  name: 'Kompressorraum',
  seed: 703,
  floor: { yb: 150, yf: 270, xbl: 100, xbr: 380, xfl: -20, xfr: 500, sb: 0.64, sf: 1 },
  wallTop: 22,
  walk: { u0: 0.04, u1: 0.96, v0: 0.2, v1: 0.95 },
  blockers: [{ u0: 0.28, u1: 0.78, v0: 0.06, v1: 0.46 }],
  darkness: st => 0.82 - st.r * 0.42,
  lights(st, t) {
    const L = [{ x: 240, y: 30, r: 140, a: 0.6, cone: 50, flicker: true }];
    const sk = proj(this, 0.88, 0);
    L.push({ x: sk.x, y: sk.y - 50, r: 16, a: 0.5, col: Game.fixed('kompressor') && st.main === 'on' ? 'rgba(40,255,60,0.4)' : 'rgba(255,40,40,0.35)' });
    return L;
  },
  drawBg(ctx, st) {
    const R = this;
    shell(ctx, R, { ceil: '#08080a', wall: mixc('#3a3a34', '#66665c', st.r), floor: mixc('#28261f', '#4c4a40', st.r), tilesU: 6, tilesV: 6 });
    wallTex(ctx, R, 'brick');
    hangLamp(ctx, 240, 26, R.wallTop, true, 1);
    pipesAlong(ctx, R, 50, '#2a4a6a');
    // Schaltkasten rechts an der Rückwand
    const sk = proj(R, 0.88, 0);
    rect(ctx, sk.x - 14, sk.y - 74, 28, 34, '#7a8088'); rect(ctx, sk.x - 12, sk.y - 72, 24, 6, '#ddd'); text(ctx, 'K-01', sk.x, sk.y - 69, '#222', 4);
    circle(ctx, sk.x - 6, sk.y - 58, 3, '#2a2'); circle(ctx, sk.x + 6, sk.y - 58, 3, '#a22');
    text(ctx, 'I', sk.x - 6, sk.y - 52, '#ddd', 3.6); text(ctx, '0', sk.x + 6, sk.y - 52, '#ddd', 3.6);
    if (!Game.fixed('kompressor')) { line(ctx, sk.x - 8, sk.y - 40, sk.x - 12, sk.y - 30, '#c22', 1); line(ctx, sk.x - 4, sk.y - 40, sk.x - 2, sk.y - 28, '#24c', 1); }
    // Wartungsplan links
    const wp = proj(R, 0.12, 0); rect(ctx, wp.x - 9, wp.y - 70, 18, 22, '#d8d0b0'); rect(ctx, wp.x - 8, wp.y - 69, 16, 3, '#26a'); for (let k = 0; k < 5; k++) rect(ctx, wp.x - 7, wp.y - 63 + k * 3, 14, 1, '#555');
    sideDoor(ctx, R, 'L', 0.14, 0.38, 76, '#4a4a40', 'KELLER');
    grime(ctx, R, 733, 1 - st.r * 0.9);
  },
  props: [
    { v: 0.46, draw(ctx, st, t) {
      const R = ROOMS.kompressor;
      const run = Game.fixed('kompressor') && st.main === 'on';
      // Druckbehälter liegend
      const b = box(ctx, R, 0.3, 0.76, 0.3, 0.45, 8, '#3a3a3a');
      const c0 = proj(R, 0.32, 0.38), c1 = proj(R, 0.74, 0.38);
      rect(ctx, c0.x, c0.y - 34 * c0.s, c1.x - c0.x, 26 * c0.s, mixc('#5a2a20', '#b83a2a', st.r));
      ellipse(ctx, c0.x, c0.y - 21 * c0.s, 5, 13 * c0.s, mixc('#4a2018', '#982a20', st.r));
      ellipse(ctx, c1.x, c1.y - 21 * c1.s, 5, 13 * c1.s, mixc('#6a3a2a', '#c84a3a', st.r));
      rect(ctx, c0.x, c0.y - 30 * c0.s, c1.x - c0.x, 3, 'rgba(255,255,255,0.12)');
      // Motor + Verdichter oben drauf
      const m = proj(R, 0.45, 0.33);
      const shake = run ? Math.sin(t * 60) * 0.6 : 0;
      rect(ctx, m.x - 20 + shake, m.y - 58 * m.s, 26, 22, '#2a4a6a'); rect(ctx, m.x + 10 + shake, m.y - 62 * m.s, 20, 26, '#555');
      for (let k = 0; k < 4; k++) rect(ctx, m.x + 11 + shake, m.y - 60 * m.s + k * 6, 18, 2, '#777');
      // Manometer
      const mp = proj(R, 0.7, 0.4); circle(ctx, mp.x, mp.y - 42 * mp.s, 5, '#ddd'); const ang = run ? -2.2 + 3.2 * 0.9 : -2.2;
      line(ctx, mp.x, mp.y - 42 * mp.s, mp.x + Math.cos(ang) * 4, mp.y - 42 * mp.s + Math.sin(ang) * 4, '#a22', 1);
    } },
  ],
  hotspots: [
    { u: 0.12, v: 0.22, label: 'Wartungsplan', use() { Game.say(['„Wartungsplan Hauptkompressor K-01: Ölstand wöchentlich, Kondensat täglich ablassen, Ansaugfilter monatlich.“', 'Die letzten drei Einträge fehlen. Stattdessen steht da in krakeliger Schrift: „Wird eh abgerissen.“']); } },
    { u: 0.52, v: 0.5, label: 'Kompressor', use() {
      if (!Game.flag('brandl2')) { Game.set('brandl2'); Game.say('Auf dem Druckbehälter liegt ein herausgerissenes Notizbuchblatt. Die Handschrift des Meisters!', () => Game.addFile('brandl2')); return; }
      Game.say(Game.fixed('kompressor') ? (G.mainSwitch === 'on' ? 'Der Kompressor rattert und füllt den Kessel. 9 bar.' : 'Bereit – aber ohne Strom (Hauptschalter!) steht er still.') : 'Ein 15-kW-Schraubenkompressor mit liegendem Druckbehälter. Mechanisch sieht alles in Ordnung aus. Das Problem muss im Schaltkasten liegen.');
    } },
    { u: 0.88, v: 0.22, label: 'Schaltkasten K-01', use() { KOMP.schaltkasten(); } },
    { u: 0.03, v: 0.26, r: 30, label: 'Tür zum Kellergang', use() { Game.goto('keller', 0.92, 0.32, 'L'); } },
  ],
};
const KOMP = {
  schaltkasten() {
    if (Game.fixed('kompressor')) { Game.say('Schütz, Motorschutz, Taster – alles verdrahtet. Selbsthaltung über den Hilfskontakt 13-14.'); return; }
    if (!Game.flag('sawSchuetz')) {
      Game.set('sawSchuetz');
      Game.say(['Der Schaltkasten des Kompressors: Schütz K1, Motorschutzrelais F2, EIN- und AUS-Taster.', 'Mehrere Adern sind abgeklemmt. Und am Schütz fehlt der aufsteckbare Hilfsschalterblock – nur die leeren Rastnasen sind noch da.', 'Innen in der Tür klebt ein Stromlaufplan.'], () => Game.addFile('schuetz_plan'));
      return;
    }
    if (!Game.has('hilfskontakt')) { Game.say('Ohne den Hilfsschalterblock 13/14 gibt es keine Selbsthaltung – der Kompressor würde nur laufen, solange man den EIN-Taster gedrückt hält. Wer hat das Teil wohl mitgenommen?'); return; }
    if (!Game.has('aderleitung')) { Game.say('Für die fehlenden Verbindungen brauchst du Aderleitung. In der E-Werkstatt gibt es bestimmt welche.'); return; }
    SR.safety('dem Kompressor-Schaltkasten', () => Game.puzzle('schuetz'));
  },
};

// =====================================================================
//  HAUSMEISTERRAUM
// =====================================================================
ROOMS.hausmeister = {
  name: 'Hausmeisterraum',
  seed: 704,
  floor: { yb: 155, yf: 270, xbl: 130, xbr: 350, xfl: 0, xfr: 480, sb: 0.68, sf: 1 },
  wallTop: 30,
  walk: { u0: 0.05, u1: 0.95, v0: 0.22, v1: 0.95 },
  blockers: [{ u0: 0.66, u1: 0.98, v0: 0.42, v1: 0.62 }],
  frontExit: { room: 'keller', u: 0.5, v: 0.14, dir: 'D', u0: 0.3, u1: 0.7 },
  darkness: st => 0.84 - st.r * 0.3,
  lights(st, t) {
    const x = 240 + Math.sin(t * 1.3) * 18 * (st.end ? 0.1 : 1);
    return [{ x, y: 60, r: 120, a: 0.85, col: 'rgba(255,190,110,0.12)' }];
  },
  onEnter() {
    if (!Game.flag('hmSeen')) {
      Game.set('hmSeen'); Snd.play('sting');
      Game.say(['Eine nackte Glühbirne pendelt hin und her, als hätte sie gerade jemand angestoßen.', 'Ein Radio rauscht leise. Hier hat jemand gewohnt – oder sich versteckt.']);
    }
  },
  drawBg(ctx, st) {
    const R = this;
    shell(ctx, R, { ceil: '#080706', wall: mixc('#3a3228', '#5a5040', st.r), floor: mixc('#2a2620', '#46403a', st.r), tilesU: 6, tilesV: 5 });
    wallTex(ctx, R, 'brick');
    // Pinnwand mit roten Fäden
    const pw = proj(R, 0.5, 0);
    rect(ctx, pw.x - 34, pw.y - 92, 68, 40, '#6a5030');
    const rr = rngf(77), pts = [];
    for (let i = 0; i < 7; i++) { const x = pw.x - 28 + rr() * 54, y = pw.y - 88 + rr() * 30; pts.push([x, y]); rect(ctx, x - 4, y - 3, 9, 7, i === 0 ? '#e8e0c8' : ['#ccc', '#aab', '#dcb'][i % 3]); }
    ctx.strokeStyle = '#c22'; ctx.lineWidth = 0.6; ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.stroke();
    // Werkbank links
    const wb = box(ctx, R, 0.05, 0.36, 0.0, 0.14, 26, '#4a3a28', { top: '#5a4632' });
    rect(ctx, wb.x0 + 8, wb.top - 6, 10, 6, '#333'); rect(ctx, wb.x0 + 30, wb.top - 3, 16, 3, '#888');
    // Spind
    const sp = proj(R, 0.86, 0); rect(ctx, sp.x - 12, sp.y - 70, 24, 70, '#4a5058'); rect(ctx, sp.x - 1, sp.y - 70, 1, 70, '#222');
    // Radio
    rect(ctx, wb.x1 - 22, wb.top - 9, 16, 9, '#5a3a2a'); circle(ctx, wb.x1 - 17, wb.top - 4.5, 2.5, '#222'); rect(ctx, wb.x1 - 12, wb.top - 7, 5, 4, '#cc9');
    grime(ctx, R, 744, 1 - st.r * 0.6);
  },
  props: [
    { v: 0.62, draw(ctx, st) { // Pritsche
      const R = ROOMS.hausmeister;
      box(ctx, R, 0.66, 0.98, 0.43, 0.61, 12, '#3a4a3a');
      const b = box(ctx, R, 0.67, 0.97, 0.44, 0.6, 3, '#5a6a50', { lift: 12 });
      rect(ctx, b.x0 + 4, b.top - 3, 18, 4, '#8a8a7a');
      if (!G.files.includes('sms')) { rect(ctx, b.x1 - 20, b.top - 2, 6, 3, '#111'); rect(ctx, b.x1 - 19, b.top - 2, 4, 1, '#4af'); }
    } },
  ],
  drawFront(ctx, st, t) { const a = 0.4 + 0.3 * Math.sin(t * 3); ctx.fillStyle = `rgba(200,220,200,${a})`; ctx.font = '7px monospace'; ctx.textAlign = 'center'; ctx.fillText('▼', 240, 266); },
  hotspots: [
    { u: 0.5, v: 0.24, label: 'Pinnwand', use() {
      if (!G.files.includes('sabotage')) Game.say(['Fotos der Halle: der LS-Schalter, der Bandmotor, die Presse, der Kompressor. Rote Fäden verbinden alles.', 'In der Mitte: eine Liste.'], () => Game.addFile('sabotage'));
      else Game.addFile('sabotage');
    } },
    { u: 0.2, v: 0.2, label: 'Werkbank', glint: () => !Game.flag('took_hk'), gh: 40, use() {
      if (!Game.flag('took_hk')) { Game.set('took_hk'); Game.give('hilfskontakt'); Game.say(['In der Schublade unter der Werkbank: ein ausgebauter LS-Schalter-Karton (leer), ein Zahnrad-Abdruck im Staub …', '… und ein Hilfsschalterblock 13/14. Genau der fehlt am Kompressor!']); }
      else Game.say(['Seitenschneider, Isolierband, eine Packung Zigaretten. Und eine Quittung: „Audi Zentrum – Anzahlung“.']);
    } },
    { u: 0.82, v: 0.66, label: 'Pritsche', use() {
      if (!G.files.includes('sms')) Game.say('Auf der Pritsche liegt ein altes Handy. Das Display leuchtet noch.', () => Game.addFile('sms'));
      else Game.say('Eine durchgelegene Pritsche. Kowalski hat hier wohl öfter übernachtet.');
    } },
    { u: 0.86, v: 0.24, label: 'Spind', use() { Game.say('Kowalskis zweiter Spind. Drin: ein Blaumann, eine Sturmhaube und eine Taschenlampe mit Rotlichtfilter. Für Nachtarbeit, bei der man nicht gesehen werden will.'); } },
    { u: 0.34, v: 0.2, label: 'Radio', use() { Snd.play('hiss'); Game.say('… rrrsch … „… und für Montag erwarten wir Regen. Und nun die Verkehrsmeldungen …“ … rrrsch.'); } },
  ],
};
