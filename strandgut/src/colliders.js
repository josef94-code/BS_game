// Einfache 2D-Kollision (Draufsicht): Kreise und gedrehte Rechtecke
class Colliders {
  constructor() { this.list = []; this.cell = 8; this.grid = new Map(); }

  _key(i, j) { return i * 10007 + j; }
  _insert(c) {
    const r = c.bound, s = this.cell;
    for (let i = Math.floor((c.x - r) / s); i <= Math.floor((c.x + r) / s); i++)
      for (let j = Math.floor((c.z - r) / s); j <= Math.floor((c.z + r) / s); j++) {
        const k = this._key(i, j);
        if (!this.grid.has(k)) this.grid.set(k, []);
        this.grid.get(k).push(c);
      }
    this.list.push(c);
    return c;
  }

  circle(x, z, r, tag) { return this._insert({ type: 'c', x, z, r, bound: r, tag, on: true }); }

  // Rechteck mit halber Breite hx, halber Tiefe hz, Drehung rot (um y)
  box(x, z, hx, hz, rot = 0, tag) {
    return this._insert({ type: 'b', x, z, hx, hz, cos: Math.cos(rot), sin: Math.sin(rot), bound: Math.hypot(hx, hz), tag, on: true });
  }

  // Schiebt einen Kreis (Spieler) aus allen Hindernissen heraus
  resolve(pos, radius) {
    const s = this.cell, i0 = Math.floor(pos.x / s), j0 = Math.floor(pos.z / s);
    const seen = new Set();
    for (let i = i0 - 1; i <= i0 + 1; i++) for (let j = j0 - 1; j <= j0 + 1; j++) {
      const cell = this.grid.get(this._key(i, j));
      if (!cell) continue;
      for (const c of cell) {
        if (seen.has(c) || !c.on) continue; seen.add(c);
        if (c.type === 'c') {
          const dx = pos.x - c.x, dz = pos.z - c.z, d = Math.hypot(dx, dz), m = c.r + radius;
          if (d < m && d > 1e-5) { pos.x = c.x + dx / d * m; pos.z = c.z + dz / d * m; }
        } else {
          const dx = pos.x - c.x, dz = pos.z - c.z;
          let lx = dx * c.cos - dz * c.sin, lz = dx * c.sin + dz * c.cos;
          const cx = Math.max(-c.hx, Math.min(c.hx, lx)), cz = Math.max(-c.hz, Math.min(c.hz, lz));
          let ex = lx - cx, ez = lz - cz, d = Math.hypot(ex, ez);
          if (d < radius) {
            if (d < 1e-5) { // im Inneren: zur nächsten Kante schieben
              const px = c.hx - Math.abs(lx), pz = c.hz - Math.abs(lz);
              if (px < pz) lx = Math.sign(lx || 1) * (c.hx + radius); else lz = Math.sign(lz || 1) * (c.hz + radius);
            } else { lx = cx + ex / d * radius; lz = cz + ez / d * radius; }
            pos.x = c.x + lx * c.cos + lz * c.sin;
            pos.z = c.z - lx * c.sin + lz * c.cos;
          }
        }
      }
    }
  }
}

export const colliders = new Colliders();
