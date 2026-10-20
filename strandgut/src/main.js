import * as THREE from 'three';
import { buildWorld } from './world.js';
import { Environment } from './sky.js';
import { Player } from './player.js';
import { windUniforms } from './vegetation.js';
import { SPOTS, heightAt } from './terrain.js';
import { buildInterior } from './interior.js';
import { UI } from './ui.js';
import { Audio } from './audio.js';
import { Game } from './game.js';

const params = new URLSearchParams(location.search);
let quality = params.get('q');
try { quality = quality || localStorage.getItem('strandgut_quality'); } catch (e) { }
if (!['low', 'medium', 'high'].includes(quality)) quality = 'medium';

const canvas = document.getElementById('game');
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: quality !== 'low', powerPreference: 'high-performance' });
} catch (e) {
  document.getElementById('ui').innerHTML = '<div class="nogl"><h1>STRANDGUT</h1><p>Dieser Browser oder Rechner unterstützt kein WebGL (3D-Grafik).</p><p>Bitte einen aktuellen Chrome, Edge oder Firefox verwenden und in den Einstellungen die Hardwarebeschleunigung aktivieren.</p></div>';
  throw e;
}
const pixelRatio = { low: 0.75, medium: 1, high: Math.min(devicePixelRatio, 2) }[quality];
renderer.setPixelRatio(pixelRatio);
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = quality !== 'low';
renderer.shadowMap.type = quality === 'high' ? THREE.PCFSoftShadowMap : THREE.PCFShadowMap;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(62, innerWidth / innerHeight, 0.1, 6000);
const env = new Environment(scene, renderer, quality);
const W = buildWorld(scene, quality);
const interior = buildInterior(scene);
const player = new Player(scene, camera, canvas);
const ui = new UI(document.getElementById('ui'));
const audio = new Audio();
const game = new Game({ scene, camera, renderer, env, W, player, ui, audio, interior, quality });
env.onThunder = () => audio.sfx('thunder');
ui.onLine = (l) => { if (l.radio) audio.sfx('radio'); };

// ---------- Eingabe ----------
addEventListener('keydown', (e) => {
  if (e.repeat) return;
  if (!game.active) return;
  if (e.code === 'Tab' || e.code === 'KeyI') {
    e.preventDefault();
    if (ui.modalKind === 'bag') ui.closeModal();
    else if (!ui.busy) ui.openBag(game.G, game, 'inv');
    return;
  }
  if (e.code === 'KeyM' && !ui.modalKind) { audio.setMuted(!audio.muted); ui.toast(audio.muted ? '🔇 Ton aus' : '🔊 Ton an'); return; }
  if (e.code === 'Escape') {
    if (ui.modalKind === 'pause') { ui.closeModal(); return; }
    if (ui.modalKind && ui.modalKind !== 'puzzle') { ui.closeModal(); return; }
    if (!ui.busy) openPause();
    return;
  }
  if (game.boatMode) return;
  if (e.code === 'KeyE' && !ui.busy) game.interact();
  if (e.code === 'KeyF' && !ui.busy) game.radioCall();
});
canvas.addEventListener('click', () => {
  audio.init();
  if (game.active && !ui.busy && !game.boatMode && document.pointerLockElement !== canvas) {
    try { const r = canvas.requestPointerLock(); if (r && r.catch) r.catch(() => { }); } catch (e) { }
  }
});
document.addEventListener('pointerlockchange', () => { player.dragging = false; });

function openPause() {
  const p = ui.openModal('pause');
  p.innerHTML = `<h2>Pause</h2><div class="menu">
    <button class="btn primary" data-a="go">Weiterspielen</button>
    <button class="btn" data-a="save">Speichern</button>
    <button class="btn" data-a="help">Steuerung</button>
    <button class="btn" data-a="gfx">Grafik: ${{ low: 'Niedrig', medium: 'Mittel', high: 'Hoch' }[quality]}</button>
    <button class="btn" data-a="snd">Ton: ${audio.muted ? 'aus' : 'an'}</button>
    <button class="btn ghost" data-a="menu">Hauptmenü</button></div>`;
  p.querySelectorAll('button').forEach(b => b.onclick = () => {
    const a = b.dataset.a;
    if (a === 'go') ui.closeModal();
    if (a === 'save') { game.save(); ui.closeModal(); }
    if (a === 'help') { showHelp(p); }
    if (a === 'gfx') cycleQuality();
    if (a === 'snd') { audio.setMuted(!audio.muted); openPause(); }
    if (a === 'menu') { game.save(true); location.reload(); }
  });
}
function showHelp(p) {
  p.innerHTML = HELP + '<button class="btn primary">Zurück</button>';
  p.querySelector('button').onclick = () => game.active ? openPause() : ui.closeModal();
}
const HELP = `<h2>Steuerung</h2><table class="keys">
  <tr><td><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd></td><td>Laufen (<kbd>Shift</kbd> = rennen, <kbd>Leertaste</kbd> = springen)</td></tr>
  <tr><td>Maus</td><td>Umsehen (ins Bild klicken; Mausrad = Zoom)</td></tr>
  <tr><td><kbd>E</kbd></td><td>Benutzen, aufheben, Dialog weiter</td></tr>
  <tr><td><kbd>Tab</kbd> / <kbd>I</kbd></td><td>Rucksack: Inventar, Bauplan, Logbuch, Dokumente, Karte</td></tr>
  <tr><td><kbd>F</kbd></td><td>Henrik anfunken (Tipp zum nächsten Ziel)</td></tr>
  <tr><td><kbd>M</kbd></td><td>Ton an/aus</td></tr><tr><td><kbd>Esc</kbd></td><td>Pause / Fenster schließen</td></tr></table>
  <p class="small">Achte auf <b>Durst</b>, <b>Hunger</b> und <b>Energie</b> unten links. Wasser gibt es an der Quelle, Kokosnüsse an den Palmen beim Lager. Im Unterstand kannst du dich ausruhen.</p>`;
function cycleQuality() {
  const next = { low: 'medium', medium: 'high', high: 'low' }[quality];
  try { localStorage.setItem('strandgut_quality', next); } catch (e) { }
  if (game.active) game.save(true);
  location.search = '';
}

// ---------- Titelbildschirm ----------
let titleMode = true;
function showTitle() {
  const hasSave = game.hasSave();
  const s = ui.screen(`<div class="title">
    <div class="logo"><small>EIN SURVIVAL-LERNSPIEL</small><h1>STRANDGUT</h1><p>Eine Mechatronikerin. Eine einsame Insel. Ein Boot aus Fracht.</p></div>
    <div class="menu">
      ${hasSave ? '<button class="btn primary" data-a="cont">Fortsetzen</button>' : ''}
      <button class="btn ${hasSave ? '' : 'primary'}" data-a="new">Neues Spiel</button>
      <button class="btn" data-a="help">Steuerung</button>
      <button class="btn" data-a="gfx">Grafik: ${{ low: 'Niedrig', medium: 'Mittel', high: 'Hoch' }[quality]}</button>
    </div>
    <div class="foot">Mechatroniker/-in · 10. Jahrgangsstufe · Lernfelder 1–5 · ca. 90 Minuten</div></div>`);
  s.querySelectorAll('button').forEach(b => b.onclick = async () => {
    audio.init();
    const a = b.dataset.a;
    if (a === 'help') { showHelp(ui.openModal('help')); return; }
    if (a === 'gfx') { cycleQuality(); return; }
    if (a === 'new' && hasSave && !confirm('Neues Spiel starten? Der alte Spielstand wird überschrieben.')) return;
    ui.screen(null);
    titleMode = false;
    if (a === 'cont') { game.load(); await ui.fade(true, 300); game.start(true); await ui.fade(false, 800); }
    else await intro();
  });
}

async function intro() {
  await ui.fade(true, 600);
  game.clearSave();
  await ui.cards([
    '<p class="where">Indischer Ozean · 15. März · 02:10 Uhr</p><p>Der Frachter <b>MV LINDAU</b> kämpft sich durch den Zyklon „Imani“. An Bord: Maschinenbauteile, Solartechnik und Ersatzteile für eine Fabrik auf Mauritius.</p>',
    '<p>Im Maschinenraum arbeitet <b>Jana Brandl</b>, 19, Mechatronikerin im ersten Ausbildungsjahr. Mit Chief Engineer <b>Henrik Olsen</b> versucht sie, die ausgefallene Ruderanlage zu reparieren.</p>',
    '<p>Dann ein Krachen. Die LINDAU läuft auf ein Riff.</p><p>„Alle Mann an Deck!“</p><p>Eine Welle reißt Jana über Bord …</p>',
    '<p class="where">Stunden später.</p>',
  ]);
  game.start(false);
  await ui.fade(false, 2500);
  audio.sfx('splash');
  await ui.say([
    { who: 'Jana', text: 'Uff … Sand. Ich lebe!' },
    { who: 'Jana', text: 'Da drüben im Nordosten – das ist die LINDAU! Sie liegt auf dem Riff. Und überall am Strand liegt Strandgut aus den Containern.' },
    { who: 'Jana', text: 'Mein Hals ist staubtrocken. Da vorne liegt eine Kiste. Vielleicht ist da Wasser drin.' },
  ]);
  ui.toast('🖱️ Ins Bild klicken: Maus steuert die Kamera · <b>WASD</b> laufen · <b>E</b> benutzen · <b>Tab</b> Rucksack');
  game.save(true);
}

// Kamera-Rundflug fürs Titelbild
function titleCam(t) {
  const a = t * 0.04 + 2.2, r = 190;
  camera.position.set(Math.cos(a) * r, 55, Math.sin(a) * r);
  camera.lookAt(0, 4, 0);
  player.model.root.position.set(SPOTS.start.x, heightAt(SPOTS.start.x, SPOTS.start.z), SPOTS.start.z);
}

// ---------- Schleife ----------
const clock = new THREE.Clock();
let elapsed = 0, fpsAcc = 0, fpsN = 0;
function loop() {
  const dt = Math.min(clock.getDelta(), 0.05); elapsed += dt;
  windUniforms.uTime.value = elapsed;
  windUniforms.uWind.value = 0.25 + env.storm * 1.2;
  if (titleMode) { env.time = 16.4; titleCam(elapsed); }
  else game.update(dt);
  env.update(dt, player.pos, camera, W.water.uniforms, elapsed);
  if (player.zone === 'wrack') {
    env.sun.intensity = 0; env.hemi.intensity = 0.7; env.hemi.color.set('#8fa6c0'); env.hemi.groundColor.set('#3a2a22'); env.ambient.intensity = 0.0;
    scene.fog.color.set('#0b0f12'); scene.fog.near = 6; scene.fog.far = 40;
    renderer.toneMappingExposure = 0.8;
  }
  const near = (x, z, r) => Math.hypot(player.pos.x - x, player.pos.z - z) < r;
  audio.update(dt, {
    storm: env.storm, indoor: player.zone === 'wrack',
    distSea: Math.max(0, heightAt(player.pos.x, player.pos.z)) * 12,
    fireNear: W.fire.userData.lit && near(W.fire.position.x, W.fire.position.z, 6),
    motor: game.boatMode ? (game.audioState?.motor || 0) : 0,
    musicOn: titleMode || game.boatMode,
  });
  renderer.render(scene, camera);
  fpsAcc += dt; fpsN++;
  if (fpsAcc > 3) {
    // Automatisch Schatten abschalten, wenn es ruckelt
    const fps = fpsN / fpsAcc; fpsAcc = 0; fpsN = 0;
    if (fps < 22 && renderer.shadowMap.enabled && !titleMode) { renderer.shadowMap.enabled = false; env.sun.castShadow = false; scene.traverse(o => { if (o.material) o.material.needsUpdate = true; }); ui.toast('Grafik reduziert (Schatten aus), damit es flüssiger läuft.'); }
  }
  requestAnimationFrame(loop);
}
addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); });

// Debug-/Testzugang (für Lehrkräfte: ?test=1 überspringt das Intro)
window.__game = game;
showTitle();
if (params.get('test')) { ui.screen(null); titleMode = false; game.start(false); }
loop();
