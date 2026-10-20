import * as THREE from 'three';
import { heightAt, SPOTS, buildTerrain, makeHeightTexture } from './terrain.js';
import { buildWater } from './water.js';
import { buildVegetation } from './vegetation.js';
import { colliders } from './colliders.js';
import {
  makeContainer, makeWreck, makeShelter, makeFire, makeSolarPanel, makeWindTurbine, makePowerStation,
  makeLightString, makeBoat, placeOnGround, makeCrate, std, mesh,
} from './props.js';

export function buildWorld(scene, quality) {
  const W = {};
  W.terrain = buildTerrain(quality);
  scene.add(W.terrain);
  const ht = makeHeightTexture(256, 300);
  W.water = buildWater(ht.tex, ht.extent);
  scene.add(W.water.mesh);
  buildVegetation(scene, quality);

  // Strandgut-Container
  const cont = (key, color, label, rot, seed) => {
    const c = makeContainer(color, label, seed);
    placeOnGround(c, SPOTS[key].x, SPOTS[key].z, rot, true, 0.35);
    scene.add(c);
    colliders.box(SPOTS[key].x, SPOTS[key].z, 3.1, 1.3, rot);
    return c;
  };
  W.contA = cont('contA', '#b5452c', 'LND 4711', 0.5, 3);
  W.contB = cont('contB', '#2f6aa3', 'LND 2207', -0.35, 5);
  W.contC = cont('contC', '#3d8a4f', 'LND 5530', 1.9, 8);
  W.contA.rotation.z += 0.06;

  // Wrack an der Nordostküste
  W.wreck = makeWreck();
  W.wreck.position.set(SPOTS.wreck.x, -1.6, SPOTS.wreck.z);
  W.wreck.rotation.set(0.0, 0.38, 0.05);
  scene.add(W.wreck);
  {
    const { len, wid } = W.wreck.userData.dims;
    colliders.box(SPOTS.wreck.x, SPOTS.wreck.z, wid / 2, len / 2, 0.38);
  }
  // Eingang zum Leck (Weltkoordinaten der Rampe)
  const entry = new THREE.Vector3(-6.5 - 6.6, 0, 4).applyAxisAngle(new THREE.Vector3(0, 1, 0), 0.38).add(new THREE.Vector3(SPOTS.wreck.x, 0, SPOTS.wreck.z));
  W.wreckEntry = { x: entry.x, z: entry.z };

  // Lagerplatz
  const camp = SPOTS.camp;
  W.shelter = makeShelter(); placeOnGround(W.shelter, camp.x - 3, camp.z - 3, 0.3, false, 0); W.shelter.visible = false; scene.add(W.shelter);
  W.fire = makeFire(); placeOnGround(W.fire, camp.x + 1.5, camp.z + 1.5, 0, false, 0); W.fire.visible = false; scene.add(W.fire);
  W.campMarker = makeBuildMarker(); W.campMarker.position.set(camp.x, heightAt(camp.x, camp.z) + 0.05, camp.z); scene.add(W.campMarker);

  // Energiestation neben dem Lager
  const ex = camp.x + 7, ez = camp.z - 4;
  W.energySite = { x: ex, z: ez };
  W.solar = [];
  for (let i = 0; i < 4; i++) {
    const p = makeSolarPanel(); placeOnGround(p, ex + (i % 2) * 1.3 - 0.6, ez - 2 - Math.floor(i / 2) * 2.0 + 0.5, Math.PI, false, 0);
    p.visible = false; scene.add(p); W.solar.push(p);
  }
  W.power = makePowerStation(); placeOnGround(W.power, ex + 2.6, ez - 1, -Math.PI / 2, false, 0); W.power.visible = false; scene.add(W.power);
  W.turbine = makeWindTurbine(); placeOnGround(W.turbine, ex + 4, ez - 5, 0, false, 0); W.turbine.visible = false; scene.add(W.turbine);
  W.energyMarker = makeBuildMarker(); W.energyMarker.position.set(ex + 1, heightAt(ex + 1, ez - 2) + 0.05, ez - 2); W.energyMarker.visible = false; scene.add(W.energyMarker);
  const sh = W.shelter.position;
  W.lights = makeLightString([
    new THREE.Vector3(sh.x - 1.6, sh.y + 2.1, sh.z - 1.2), new THREE.Vector3(sh.x + 1, sh.y + 2.0, sh.z + 1.5),
    new THREE.Vector3(camp.x + 3, heightAt(camp.x + 3, camp.z + 3) + 2.0, camp.z + 3), new THREE.Vector3(ex + 2.6, heightAt(ex + 2.6, ez - 1) + 1.6, ez - 1.3)]);
  W.lights.visible = false; scene.add(W.lights);
  // Pfähle für die Lichterkette
  const pole = mesh(new THREE.CylinderGeometry(0.05, 0.06, 2.1, 6), std('#8a6a48'));
  pole.position.set(camp.x + 3, heightAt(camp.x + 3, camp.z + 3) + 1.05, camp.z + 3); W.lights.add(pole);

  // Bauplatz für das Boot (Slip)
  const sl = SPOTS.slip;
  W.boat = makeBoat();
  W.boat.position.set(sl.x, heightAt(sl.x, sl.z) + 0.2, sl.z - 3);
  W.boat.rotation.y = Math.PI * 0.95;
  for (const k of ['hull', 'drive', 'energy', 'control']) W.boat.userData.parts[k].visible = false;
  scene.add(W.boat);
  W.boatMarker = makeBuildMarker(3.2); W.boatMarker.position.set(sl.x, heightAt(sl.x, sl.z - 3) + 0.05, sl.z - 3); W.boatMarker.visible = false; scene.add(W.boatMarker);
  // Holzböcke
  for (const dz of [-1.5, 1.5]) {
    const b = mesh(new THREE.BoxGeometry(2.8, 0.3, 0.3), std('#7a5c3c'));
    b.position.set(sl.x, heightAt(sl.x, sl.z - 3 + dz) + 0.15, sl.z - 3 + dz); b.rotation.y = W.boat.rotation.y; scene.add(b);
  }

  // Quelle: kleines Becken
  const sp = SPOTS.spring;
  const pool = new THREE.Mesh(new THREE.CircleGeometry(1.5, 20), new THREE.MeshStandardMaterial({ color: '#4fb6c8', roughness: 0.05, metalness: 0.3, transparent: true, opacity: 0.85 }));
  pool.rotation.x = -Math.PI / 2; pool.position.set(sp.x, heightAt(sp.x, sp.z) + 0.08, sp.z); scene.add(pool);
  W.pool = pool;

  // Rettungsinsel-Kiste an der Lagune
  const lg = SPOTS.lagoon;
  const raft = new THREE.Group();
  const drum = mesh(new THREE.CapsuleGeometry(0.4, 0.9, 6, 12), std('#f0f0ea', { r: 0.4 })); drum.rotation.z = Math.PI / 2; drum.position.y = 0.4; raft.add(drum);
  const band = mesh(new THREE.CylinderGeometry(0.41, 0.41, 0.15, 12), std('#e35d1f')); band.rotation.z = Math.PI / 2; band.position.y = 0.4; raft.add(band);
  placeOnGround(raft, lg.x, lg.z, 0.8, false, 0.05); scene.add(raft);
  W.raft = raft;

  // Dekorative Kisten und Fässer am Strand
  const deco = [[SPOTS.contA.x - 4, SPOTS.contA.z + 3], [SPOTS.contB.x + 4, SPOTS.contB.z - 2], [SPOTS.contC.x - 3, SPOTS.contC.z + 4], [SPOTS.start.x + 6, SPOTS.start.z + 4]];
  deco.forEach(([x, z], i) => {
    const c = makeCrate(i % 2 ? '#9b7b4f' : '#8a6d45', 0.7 + (i % 3) * 0.15);
    placeOnGround(c, x, z, i * 0.7, true, -0.3); c.rotation.z += 0.2; scene.add(c);
    colliders.circle(x, z, 0.5);
  });

  return W;
}

// Leuchtender Bauplatz-Ring
export function makeBuildMarker(r = 1.6) {
  const g = new THREE.Group();
  const ring = new THREE.Mesh(new THREE.RingGeometry(r * 0.92, r, 48), new THREE.MeshBasicMaterial({ color: '#7fe3ff', transparent: true, opacity: 0.55, depthWrite: false, side: THREE.DoubleSide }));
  ring.rotation.x = -Math.PI / 2; g.add(ring);
  const inner = new THREE.Mesh(new THREE.CircleGeometry(r * 0.9, 48), new THREE.MeshBasicMaterial({ color: '#7fe3ff', transparent: true, opacity: 0.08, depthWrite: false, side: THREE.DoubleSide }));
  inner.rotation.x = -Math.PI / 2; g.add(inner);
  g.userData.update = (t) => { ring.material.opacity = 0.35 + Math.sin(t * 3) * 0.2; };
  return g;
}
