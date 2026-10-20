// Fachrätsel – jedes Rätsel besteht aus Schritten. Fehlversuche zählen für die Bewertung.
const h = (tag, attrs = {}, html = '') => { const e = document.createElement(tag); for (const [k, v] of Object.entries(attrs)) { if (k === 'class') e.className = v; else if (k.startsWith('on')) e.addEventListener(k.slice(2), v); else e.setAttribute(k, v); } if (html) e.innerHTML = html; return e; };
const num = (s) => parseFloat(String(s).replace(',', '.').replace(/\s/g, ''));
const fmt = (v, d = 1) => v.toFixed(d).replace('.', ',');

// ---------- Schritt-Bausteine ----------
function choice(q, options, correct, why = {}) {
  return (el, c) => {
    el.append(h('div', { class: 'pz-q' }, q));
    const box = h('div', { class: 'pz-opts' });
    const order = options.map((_, i) => i).sort(() => Math.random() - 0.5);
    for (const i of order) {
      const b = h('button', { class: 'opt' }, options[i]);
      b.onclick = () => {
        if (i === correct) { b.classList.add('right'); box.querySelectorAll('button').forEach(x => x.disabled = true); c.ok(); }
        else { b.classList.add('wrong'); b.disabled = true; c.wrong(why[i] || 'Das stimmt nicht. Überleg noch einmal.'); }
      };
      box.append(b);
    }
    el.append(box);
  };
}

function multi(q, options, correctSet, why = 'Noch nicht ganz. Prüfe jede Aussage einzeln.') {
  return (el, c) => {
    el.append(h('div', { class: 'pz-q' }, q + ' <small>(Mehrere Antworten möglich)</small>'));
    const box = h('div', { class: 'pz-opts' });
    const sel = new Set();
    options.forEach((o, i) => {
      const b = h('button', { class: 'opt check' }, o);
      b.onclick = () => { sel.has(i) ? sel.delete(i) : sel.add(i); b.classList.toggle('sel'); };
      box.append(b);
    });
    el.append(box);
    const go = h('button', { class: 'btn primary' }, 'Prüfen');
    go.onclick = () => {
      const ok = sel.size === correctSet.length && correctSet.every(i => sel.has(i));
      if (ok) { go.disabled = true; box.querySelectorAll('button').forEach(x => x.disabled = true); c.ok(); } else c.wrong(why);
    };
    el.append(go);
  };
}

function number(q, unit, answer, tol, wrongFn) {
  return (el, c) => {
    el.append(h('div', { class: 'pz-q' }, q));
    const row = h('div', { class: 'pz-num' });
    const inp = h('input', { type: 'text', inputmode: 'decimal', placeholder: '?' });
    row.append(inp, h('span', { class: 'unit' }, unit));
    const go = h('button', { class: 'btn primary' }, 'Prüfen');
    const check = () => {
      const v = num(inp.value);
      if (isNaN(v)) { c.info('Bitte eine Zahl eingeben.'); return; }
      if (Math.abs(v - answer) <= tol) { inp.disabled = true; go.disabled = true; inp.classList.add('right'); c.ok(); }
      else { inp.classList.add('wrong'); setTimeout(() => inp.classList.remove('wrong'), 600); c.wrong((wrongFn && wrongFn(v)) || 'Das Ergebnis stimmt nicht. Rechne noch einmal nach.'); }
    };
    go.onclick = check; inp.onkeydown = (e) => { e.stopPropagation(); if (e.key === 'Enter') check(); };
    row.append(go); el.append(row);
    setTimeout(() => inp.focus(), 50);
  };
}

function text(q, answers, wrong) {
  return (el, c) => {
    el.append(h('div', { class: 'pz-q' }, q));
    const row = h('div', { class: 'pz-num' });
    const inp = h('input', { type: 'text', placeholder: '?' });
    const go = h('button', { class: 'btn primary' }, 'Prüfen');
    const check = () => {
      const v = inp.value.trim().toUpperCase().replace(/^0X/, '').replace(/\s/g, '');
      if (answers.includes(v)) { inp.disabled = true; go.disabled = true; inp.classList.add('right'); c.ok(); } else c.wrong(wrong);
    };
    go.onclick = check; inp.onkeydown = (e) => { e.stopPropagation(); if (e.key === 'Enter') check(); };
    row.append(inp, go); el.append(row);
    setTimeout(() => inp.focus(), 50);
  };
}

// Reihenfolge durch Anklicken festlegen
function order(q, items, wrongMsg) {
  return (el, c) => {
    el.append(h('div', { class: 'pz-q' }, q));
    const pool = h('div', { class: 'pz-pool' }), seq = h('div', { class: 'pz-seq' });
    const chosen = [];
    const shuffled = items.map((t, i) => ({ t, i })).sort(() => Math.random() - 0.5);
    const redraw = () => {
      seq.innerHTML = '';
      chosen.forEach((it, k) => {
        const s = h('button', { class: 'chip on' }, `<b>${k + 1}</b> ${it.t}`);
        s.onclick = () => { chosen.splice(k, 1); redraw(); };
        seq.append(s);
        if (k < items.length - 1) seq.append(h('span', { class: 'arrow' }, '→'));
      });
      pool.querySelectorAll('button').forEach(b => { b.disabled = chosen.some(x => x.i === +b.dataset.i); });
    };
    for (const it of shuffled) {
      const b = h('button', { class: 'chip', 'data-i': it.i }, it.t);
      b.onclick = () => { if (!chosen.includes(it)) { chosen.push(it); redraw(); } };
      pool.append(b);
    }
    const go = h('button', { class: 'btn primary' }, 'Prüfen');
    go.onclick = () => {
      if (chosen.length < items.length) { c.info('Ordne zuerst alle Elemente ein.'); return; }
      if (chosen.every((it, k) => it.i === k)) { go.disabled = true; pool.querySelectorAll('button').forEach(b => b.disabled = true); seq.querySelectorAll('button').forEach(b => b.disabled = true); c.ok(); }
      else { const k = chosen.findIndex((it, k) => it.i !== k); c.wrong(wrongMsg ? wrongMsg(k) : `Position ${k + 1} stimmt nicht.`); }
    };
    el.append(h('div', { class: 'pz-sub' }, 'Antippen zum Einordnen, nochmal antippen zum Entfernen:'), pool, seq, go);
  };
}

// Zuordnen in Kategorien
function sort(q, cats, items, wrongMsg) {
  return (el, c) => {
    el.append(h('div', { class: 'pz-q' }, q));
    const grid = h('div', { class: 'pz-sort' });
    const state = items.map(() => -1);
    items.forEach((it, i) => {
      const row = h('div', { class: 'sort-row' }, `<span>${it.t}</span>`);
      const btns = h('div', { class: 'sort-btns' });
      cats.forEach((cat, k) => {
        const b = h('button', { class: 'chip small' }, cat);
        b.onclick = () => { state[i] = k; btns.querySelectorAll('button').forEach((x, j) => x.classList.toggle('on', j === k)); };
        btns.append(b);
      });
      row.append(btns); grid.append(row);
    });
    const go = h('button', { class: 'btn primary' }, 'Prüfen');
    go.onclick = () => {
      if (state.includes(-1)) { c.info('Ordne zuerst alle Verbindungen zu.'); return; }
      const bad = items.filter((it, i) => state[i] !== it.c);
      if (!bad.length) { go.disabled = true; grid.querySelectorAll('button').forEach(b => b.disabled = true); c.ok(); }
      else c.wrong((wrongMsg || 'Noch nicht richtig: ') + bad.length + ' Zuordnung(en) falsch.');
    };
    el.append(grid, go);
  };
}

// ---------- Eigene Widgets ----------

// P1: Hebel-Simulation
function leverSim(el, c) {
  el.append(h('div', { class: 'pz-q' }, 'Schieb das Rohr über den Verschlusshebel und wähle, wo du anpackst. Du drückst mit <b>F = 300 N</b>.'));
  const svg = h('div', { class: 'pz-svg' });
  const slider = h('input', { type: 'range', min: '0.15', max: '1.2', step: '0.05', value: '0.3' });
  const out = h('div', { class: 'pz-readout' });
  const draw = () => {
    const l = +slider.value, M = 300 * l;
    const x = 40 + l / 1.2 * 380;
    svg.innerHTML = `<svg viewBox="0 0 460 150"><rect x="20" y="30" width="30" height="100" fill="#8b4a3a"/><circle cx="40" cy="80" r="7" fill="#333"/>
      <rect x="40" y="74" width="380" height="12" rx="6" fill="#a9b1b8"/><rect x="40" y="76" width="70" height="8" fill="#555"/>
      <line x1="40" y1="105" x2="${x}" y2="105" stroke="#7fe3ff" stroke-width="2" marker-end="url(#a)"/><text x="${(40 + x) / 2}" y="122" fill="#7fe3ff" font-size="13" text-anchor="middle">l = ${fmt(l, 2)} m</text>
      <line x1="${x}" y1="20" x2="${x}" y2="66" stroke="#ffb347" stroke-width="4" marker-end="url(#b)"/><text x="${x + 8}" y="30" fill="#ffb347" font-size="13">F = 300 N</text>
      <defs><marker id="a" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8z" fill="#7fe3ff"/></marker><marker id="b" markerWidth="8" markerHeight="8" refX="4" refY="6" orient="auto"><path d="M0,0 L8,4 L0,8z" fill="#ffb347"/></marker></defs></svg>`;
    out.innerHTML = `Drehmoment M = F · l = 300 N · ${fmt(l, 2)} m = <b>${fmt(M, 0)} N·m</b> &nbsp; <span class="${M >= 180 ? 'good' : 'bad'}">${M >= 180 ? '≥ 180 N·m – reicht!' : '< 180 N·m – zu wenig'}</span>`;
  };
  slider.oninput = draw; draw();
  const go = h('button', { class: 'btn primary' }, 'Drücken!');
  go.onclick = () => {
    if (300 * +slider.value >= 180) { go.disabled = true; slider.disabled = true; c.ok(); }
    else c.wrong('Der Hebel bewegt sich keinen Millimeter. Das Drehmoment reicht nicht – greif weiter außen an.');
  };
  el.append(svg, slider, out, go);
}

// P2: Batteriefach mit 8 Zellen
function batteryBox(el, c) {
  el.append(h('div', { class: 'pz-q' }, 'Setz die Zellen ins Batteriefach. Antippen dreht eine Zelle um. Ziel: <b>12,0 V</b> am Funkgerät.'));
  const flip = [false, true, false, false, true, false, true, false];
  const box = h('div', { class: 'cells' });
  const meter = h('div', { class: 'pz-readout big' });
  const draw = () => {
    box.innerHTML = '';
    flip.forEach((f, i) => {
      const b = h('button', { class: 'cell' + (f ? ' flipped' : '') }, `<span class="pole">${f ? '−' : '+'}</span><span class="lbl">1,5 V</span><span class="pole">${f ? '+' : '−'}</span>`);
      b.onclick = () => { flip[i] = !flip[i]; draw(); };
      box.append(b);
    });
    const U = flip.reduce((s, f) => s + (f ? -1.5 : 1.5), 0);
    meter.innerHTML = `Voltmeter: <b>${fmt(U)} V</b>`;
  };
  draw();
  const go = h('button', { class: 'btn primary' }, 'Funkgerät einschalten');
  go.onclick = () => {
    const U = flip.reduce((s, f) => s + (f ? -1.5 : 1.5), 0);
    if (Math.abs(U - 12) < 0.01) { go.disabled = true; box.querySelectorAll('button').forEach(b => b.disabled = true); c.ok(); }
    else c.wrong(`Das Display flackert kurz und geht aus – nur ${fmt(U)} V. Jede verkehrt herum eingesetzte Zelle zieht Spannung ab.`);
  };
  el.append(box, meter, go);
}

// P3: Handpumpe und Manometer
function pumpSim(el, c) {
  el.append(h('div', { class: 'pz-q' }, 'Pumpe den Zylinder auf den nötigen Druck. Das Schott öffnet sich bei <b>50 bar</b>.'));
  let p = 0, done = false;
  const gauge = h('div', { class: 'pz-svg' });
  const draw = () => {
    const a = -120 + Math.min(p, 100) / 100 * 240;
    const rad = (a - 90) * Math.PI / 180;
    gauge.innerHTML = `<svg viewBox="0 0 200 140"><circle cx="100" cy="80" r="56" fill="#eee" stroke="#555" stroke-width="5"/>
      ${[0, 20, 40, 60, 80, 100].map(v => { const aa = (-120 + v / 100 * 240 - 90) * Math.PI / 180; return `<text x="${100 + Math.cos(aa) * 42}" y="${84 + Math.sin(aa) * 42}" font-size="10" text-anchor="middle" fill="#333">${v}</text>`; }).join('')}
      <path d="M ${100 + Math.cos((-120 + 63 * 2.4 - 90) * Math.PI / 180) * 52} ${80 + Math.sin((-120 + 63 * 2.4 - 90) * Math.PI / 180) * 52} A 52 52 0 0 1 ${100 + Math.cos((120 - 90) * Math.PI / 180) * 52} ${80 + Math.sin((120 - 90) * Math.PI / 180) * 52}" stroke="#e74c3c" stroke-width="6" fill="none"/>
      <line x1="100" y1="80" x2="${100 + Math.cos(rad) * 46}" y2="${80 + Math.sin(rad) * 46}" stroke="#c0392b" stroke-width="3"/><circle cx="100" cy="80" r="5" fill="#333"/>
      <text x="100" y="118" text-anchor="middle" font-size="12" fill="#333">bar</text><text x="100" y="134" text-anchor="middle" font-size="13" fill="#fff">${fmt(p, 0)} bar</text></svg>`;
  };
  draw();
  const pump = h('button', { class: 'btn primary' }, 'Pumpen');
  const hold = h('button', { class: 'btn' }, 'Ventil schließen – fertig');
  const note = h('div', { class: 'pz-sub' }, '');
  pump.onclick = () => {
    if (done) return;
    p += 4 + Math.random() * 3;
    if (p > 63) { p = 63; note.textContent = 'Zischen! Das Druckbegrenzungsventil öffnet bei 63 bar – mehr geht nicht.'; }
    draw();
  };
  hold.onclick = () => {
    if (p >= 49.5) { done = true; pump.disabled = hold.disabled = true; c.ok(); }
    else c.wrong(`Bei ${fmt(p, 0)} bar bewegt sich das Schott nicht. Du hast ausgerechnet, wie viel Druck nötig ist.`);
  };
  el.append(gauge, h('div', { class: 'row' }, ''), note);
  el.lastChild.previousSibling.append(pump, hold);
}

// P4: PV-Verschaltung
function pvConfig(el, c) {
  el.append(h('div', { class: 'pz-q' }, 'Wähle die Verschaltung der 4 Module. Der Regler-Check zeigt sofort, ob die Werte passen.'));
  const configs = [
    { k: '4S1P', s: 4, p: 1, txt: '4 in Reihe' }, { k: '1S4P', s: 1, p: 4, txt: '4 parallel' }, { k: '2S2P', s: 2, p: 2, txt: '2 in Reihe, 2 Stränge parallel' },
  ];
  let sel = null;
  const btns = h('div', { class: 'pz-opts row' });
  const vis = h('div', { class: 'pz-svg' });
  const out = h('div', { class: 'pz-readout' });
  const draw = () => {
    if (!sel) { out.innerHTML = '<i>Noch keine Verschaltung gewählt.</i>'; vis.innerHTML = ''; return; }
    const Voc = 22 * sel.s, Vmp = 18 * sel.s, I = 5.56 * sel.p, P = Vmp * I;
    const chk = (ok, t) => `<span class="${ok ? 'good' : 'bad'}">${ok ? '✓' : '✗'} ${t}</span>`;
    out.innerHTML = `V<sub>oc</sub> = ${fmt(Voc, 0)} V · V<sub>mp</sub> = ${fmt(Vmp, 0)} V · I<sub>mp</sub> = ${fmt(I, 1)} A · P = ${fmt(P, 0)} W<br>
      ${chk(Voc <= 75, 'V<sub>oc</sub> ≤ 75 V')} &nbsp; ${chk(I <= 15, 'I ≤ 15 A')} &nbsp; ${chk(Vmp >= 29, 'V<sub>mp</sub> ≥ 24 V + 5 V')}`;
    let s = '<svg viewBox="0 0 420 150">';
    for (let pi = 0; pi < sel.p; pi++) for (let si = 0; si < sel.s; si++) {
      const x = 20 + pi * (380 / sel.p) + si * 44, y = 20 + si * 0;
      s += `<rect x="${x}" y="${30}" width="36" height="56" fill="#1a2a50" stroke="#8aa" rx="2"/><text x="${x + 18}" y="62" fill="#9cf" font-size="10" text-anchor="middle">${pi * sel.s + si + 1}</text>`;
      if (si < sel.s - 1) s += `<line x1="${x + 36}" y1="45" x2="${x + 44}" y2="45" stroke="#e74c3c" stroke-width="2"/>`;
    }
    s += `<line x1="20" y1="110" x2="400" y2="110" stroke="#e74c3c" stroke-width="2"/><line x1="20" y1="125" x2="400" y2="125" stroke="#3498db" stroke-width="2"/>
      <text x="405" y="114" fill="#e74c3c" font-size="11">+</text><text x="405" y="129" fill="#3498db" font-size="11">−</text>`;
    for (let pi = 0; pi < sel.p; pi++) { const x0 = 20 + pi * (380 / sel.p), x1 = x0 + (sel.s - 1) * 44 + 36; s += `<line x1="${x0 + 4}" y1="86" x2="${x0 + 4}" y2="125" stroke="#3498db" stroke-width="2"/><line x1="${x1 - 4}" y1="86" x2="${x1 - 4}" y2="110" stroke="#e74c3c" stroke-width="2"/>`; }
    vis.innerHTML = s + '</svg>';
  };
  for (const cf of configs) {
    const b = h('button', { class: 'opt' }, `<b>${cf.k}</b><br><small>${cf.txt}</small>`);
    b.onclick = () => { sel = cf; btns.querySelectorAll('button').forEach(x => x.classList.toggle('sel', x === b)); draw(); };
    btns.append(b);
  }
  draw();
  const go = h('button', { class: 'btn primary' }, 'Anschließen');
  go.onclick = () => {
    if (!sel) { c.info('Wähle zuerst eine Verschaltung.'); return; }
    if (sel.k === '2S2P') { go.disabled = true; btns.querySelectorAll('button').forEach(b => b.disabled = true); c.ok(); }
    else if (sel.k === '4S1P') c.wrong('Stopp! 88 V Leerlaufspannung würden den Regler zerstören (max. 75 V).');
    else c.wrong('Der Regler lädt nicht: 18 V liegen unter 24 V + 5 V – und 22 A sind auch zu viel Strom.');
  };
  el.append(btns, vis, out, go);
}

// P6: Brückengleichrichter
function bridge(el, c) {
  el.append(h('div', { class: 'pz-q' }, 'Setz die vier Dioden ein. Antippen eines Platzes: leer → Diode → umgedreht. Das Oszilloskop zeigt die Ausgangsspannung.'));
  // Knoten: A links, B rechts, P oben (+), N unten (−). Dioden: D1 A–P, D2 B–P, D3 N–A, D4 N–B; Zustand 1 = Durchlass von erstem zu zweitem Knoten
  const D = [{ a: 'A', b: 'P' }, { a: 'B', b: 'P' }, { a: 'N', b: 'A' }, { a: 'N', b: 'B' }];
  const st = [0, 0, 0, 0];
  const pos = { P: [160, 20], N: [160, 180], A: [60, 100], B: [260, 100] };
  const wrap = h('div', { class: 'bridge' });
  const scope = h('div', { class: 'pz-svg scope' });
  const msg = h('div', { class: 'pz-sub' });
  const edges = () => { const e = []; st.forEach((s, i) => { if (s === 1) e.push([D[i].a, D[i].b]); if (s === 2) e.push([D[i].b, D[i].a]); }); return e; };
  const reach = (from, to, E, withLoad) => {
    const adj = {}; for (const [a, b] of E) (adj[a] = adj[a] || []).push(b);
    if (withLoad) { (adj.P = adj.P || []).push('N*'); (adj['N*'] = ['N']); }
    const seen = new Set([from]), q = [from];
    while (q.length) { const n = q.shift(); if (n === to) return true; for (const m of adj[n] || []) if (!seen.has(m)) { seen.add(m); q.push(m); } }
    return false;
  };
  // Ergebnis je Halbwelle: +1 (Last P→N), -1 (N→P), 0 (kein Strom), 'short'
  const half = (src, dst) => {
    const E = edges();
    if (reach(src, dst, E, false)) return 'short';
    const adjP = (E2) => reach(src, dst, E2, true);
    if (adjP(E)) return 1;
    // umgekehrte Lastrichtung
    const E3 = E.concat([['N', 'P']]);
    const adj = {}; for (const [a, b] of E3) (adj[a] = adj[a] || []).push(b);
    const seen = new Set([src]), q = [src];
    while (q.length) { const n = q.shift(); if (n === dst) return -1; for (const m of adj[n] || []) if (!seen.has(m)) { seen.add(m); q.push(m); } }
    return 0;
  };
  let cap = false;
  const draw = () => {
    const r1 = half('A', 'B'), r2 = half('B', 'A');
    let s = `<svg viewBox="0 0 320 200"><text x="160" y="12" text-anchor="middle" fill="#e74c3c" font-size="12">+ (zum Akku)</text><text x="160" y="198" text-anchor="middle" fill="#3498db" font-size="12">− (zum Akku)</text>
      <text x="40" y="104" text-anchor="end" fill="#ffd27a" font-size="12">~</text><text x="280" y="104" fill="#ffd27a" font-size="12">~</text>`;
    D.forEach((d, i) => {
      const [x1, y1] = pos[d.a], [x2, y2] = pos[d.b];
      s += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#667" stroke-width="2" stroke-dasharray="${st[i] ? '0' : '4 4'}"/>`;
      if (st[i]) {
        const [fx, fy] = st[i] === 1 ? [x1, y1] : [x2, y2], [tx, ty] = st[i] === 1 ? [x2, y2] : [x1, y1];
        const mx = (x1 + x2) / 2, my = (y1 + y2) / 2, ang = Math.atan2(ty - fy, tx - fx) * 180 / Math.PI;
        s += `<g transform="translate(${mx},${my}) rotate(${ang})"><path d="M-10,-11 L10,0 L-10,11 Z" fill="#ddd"/><rect x="10" y="-12" width="3" height="24" fill="#ddd"/></g>`;
      }
      s += `<circle cx="${(x1 + x2) / 2}" cy="${(y1 + y2) / 2}" r="20" fill="transparent" data-d="${i}" style="cursor:pointer"/>`;
      s += `<text x="${(x1 + x2) / 2 + (x1 < 160 || x2 < 160 ? -30 : 30)}" y="${(y1 + y2) / 2}" fill="#9ab" font-size="11" text-anchor="middle">D${i + 1}</text>`;
    });
    for (const [k, [x, y]] of Object.entries(pos)) s += `<circle cx="${x}" cy="${y}" r="5" fill="#ccc"/>`;
    wrap.innerHTML = s + '</svg>';
    wrap.querySelectorAll('[data-d]').forEach(n => n.onclick = () => { const i = +n.dataset.d; st[i] = (st[i] + 1) % 3; draw(); });
    // Oszilloskop
    let path = '';
    const short = r1 === 'short' || r2 === 'short';
    for (let x = 0; x <= 300; x += 2) {
      const ph = x / 300 * Math.PI * 4, u = Math.sin(ph);
      let v = u >= 0 ? (r1 === 'short' ? 0 : r1 * u) : (r2 === 'short' ? 0 : r2 * -u);
      if (cap && !short && r1 === 1 && r2 === 1) v = Math.max(v, 0.82 + 0.18 * Math.cos((ph % Math.PI)));
      path += `${x === 0 ? 'M' : 'L'}${10 + x},${60 - v * 42} `;
    }
    scope.innerHTML = `<svg viewBox="0 0 320 120"><rect width="320" height="120" fill="#06140c"/><path d="M10 60 H310" stroke="#1d4a2c"/><path d="M10 18 V102" stroke="#1d4a2c"/>
      <path d="${path}" stroke="#4dff88" stroke-width="2" fill="none"/>${short ? '<text x="160" y="40" fill="#ff5a5a" font-size="16" text-anchor="middle">KURZSCHLUSS!</text>' : ''}</svg>`;
    msg.textContent = short ? 'Achtung: Zwei Dioden schließen die Wechselspannung kurz – die Sicherung würde auslösen.' :
      (r1 === 1 && r2 === 1) ? 'Beide Halbwellen ergeben positive Spannung – Vollweggleichrichtung.' :
      (r1 === 0 && r2 === 0) ? 'Kein Stromfluss.' : 'Nur teilweise gleichgerichtet oder falsch gepolt.';
  };
  draw();
  const go = h('button', { class: 'btn primary' }, 'Windrad anschließen');
  go.onclick = () => {
    const r1 = half('A', 'B'), r2 = half('B', 'A');
    if (r1 === 1 && r2 === 1) { go.disabled = true; wrap.style.pointerEvents = 'none'; c.ok(); }
    else if (r1 === 'short' || r2 === 'short') c.wrong('Funken! Die Sicherung brennt durch – zum Glück hattest du sie eingebaut. Zwei Dioden bilden einen Kurzschluss.');
    else if (r1 === -1 || r2 === -1) c.wrong('Der Akku würde falsch gepolt geladen oder gar nicht. Oben muss Plus herauskommen.');
    else c.wrong('Nur eine Halbwelle kommt durch (oder gar keine). Für Vollweggleichrichtung müssen alle vier Dioden richtig sitzen.');
  };
  el.append(h('div', { class: 'row two' }, ''), msg, go);
  el.querySelector('.row.two').append(wrap, scope);
  el._cap = (v) => { cap = v; draw(); };
}

// P7: Multimeter
function meterSim(el, c, G, withNext = true) {
  el.append(h('div', { class: 'pz-q' }, 'Miss jetzt. Wähle die Messpunkte – das Display zeigt den Wert.'));
  const disp = h('div', { class: 'meter-disp' }, '– – –');
  const pts = [['A1 – A2 (Ankerwicklung)', '0,18 Ω'], ['A1 – Gehäuse', G.flags.motorDry ? 'OL' : '2,1 kΩ'], ['A2 – Gehäuse', G.flags.motorDry ? 'OL' : '2,3 kΩ']];
  const box = h('div', { class: 'pz-opts row' });
  const seen = new Set();
  const go = h('button', { class: 'btn primary' }, 'Messwerte notiert →');
  go.disabled = true;
  pts.forEach(([t, v], i) => { const b = h('button', { class: 'opt' }, t); b.onclick = () => { disp.textContent = v; seen.add(i); box.querySelectorAll('button').forEach(x => x.classList.toggle('sel', x === b)); if (seen.size >= 2) go.disabled = false; }; box.append(b); });
  go.onclick = () => { go.disabled = true; c.ok(); };
  el.append(disp, box);
  if (withNext) el.append(go);
}

// P10: Strompfade der Wendeschaltung
function relayLogic(el, c) {
  el.append(h('div', { class: 'pz-q' }, 'Bestücke die Strompfade der Relaisspulen K1 (vorwärts) und K2 (rückwärts). Tippe einen Platz an und wähle ein Bauteil. Danach kannst du testen.'));
  const parts = ['S0 Öffner (Reißleine)', 'S1 Schließer (vor)', 'S2 Schließer (zurück)', 'K1 Öffner', 'K2 Öffner', 'K1 Schließer', 'K2 Schließer', '— Brücke —'];
  const short = ['S0⌐', 'S1', 'S2', 'K1⌐', 'K2⌐', 'K1', 'K2', '—', '?'];
  const path = { K1: [8, 8, 8], K2: [8, 8, 8] };
  let pick = null;
  const sim = { S0pulled: false, S1: false, S2: false };
  const wrap = h('div', { class: 'relay' });
  const pal = h('div', { class: 'pz-pool' });
  const test = h('div', { class: 'pz-opts row' });
  const out = h('div', { class: 'pz-readout' });
  const contact = (p, K) => {
    switch (p) {
      case 0: return !sim.S0pulled; case 1: return sim.S1; case 2: return sim.S2;
      case 3: return !K.K1; case 4: return !K.K2; case 5: return K.K1; case 6: return K.K2; case 7: return true; default: return false;
    }
  };
  const solve = () => { // Relaiszustände iterativ bestimmen
    let K = { K1: false, K2: false };
    for (let i = 0; i < 6; i++) {
      // nacheinander auswerten wie echte Relais: eines zieht zuerst an
      const n1 = path.K1.every(p => contact(p, K));
      const n2 = path.K2.every(p => contact(p, { K1: n1, K2: K.K2 }));
      const nk = { K1: n1, K2: n2 };
      if (nk.K1 === K.K1 && nk.K2 === K.K2) return { K, osc: false };
      K = nk;
    }
    return { K, osc: true };
  };
  const draw = () => {
    let s = '';
    for (const k of ['K1', 'K2']) {
      s += `<div class="rpath"><span class="rail">+24 V</span>`;
      path[k].forEach((p, i) => { s += `<button class="slot ${pick && pick.k === k && pick.i === i ? 'sel' : ''}" data-k="${k}" data-i="${i}">${short[p]}</button><span class="wire"></span>`; });
      s += `<span class="coil">${k}</span><span class="rail">0 V</span></div>`;
    }
    wrap.innerHTML = s;
    wrap.querySelectorAll('.slot').forEach(b => b.onclick = () => { pick = { k: b.dataset.k, i: +b.dataset.i }; draw(); });
    const { K, osc } = solve();
    const dir = K.K1 && K.K2 ? '<span class="bad">KURZSCHLUSS im Polwender!</span>' : K.K1 ? '<span class="good">Motor: VORWÄRTS</span>' : K.K2 ? '<span class="good">Motor: RÜCKWÄRTS</span>' : 'Motor: Stillstand';
    out.innerHTML = `K1 ${K.K1 ? '●' : '○'} &nbsp; K2 ${K.K2 ? '●' : '○'} &nbsp; → ${osc ? '<span class="bad">Relais flattern!</span>' : dir}`;
    test.querySelectorAll('button').forEach(b => b.classList.toggle('sel', !!sim[b.dataset.s]));
  };
  parts.forEach((p, i) => { const b = h('button', { class: 'chip small' }, p); b.onclick = () => { if (pick) { path[pick.k][pick.i] = i; pick = null; draw(); } else c.info('Tippe zuerst einen Platz im Strompfad an.'); }; pal.append(b); });
  [['S1', 'S1 vorwärts drücken'], ['S2', 'S2 rückwärts drücken'], ['S0pulled', 'Reißleine ziehen']].forEach(([k, t]) => {
    const b = h('button', { class: 'opt', 'data-s': k }, t); b.onclick = () => { sim[k] = !sim[k]; draw(); }; test.append(b);
  });
  draw();
  const go = h('button', { class: 'btn primary' }, 'Schaltung prüfen');
  go.onclick = () => {
    if ([...path.K1, ...path.K2].includes(8)) { c.info('Bestücke zuerst alle sechs Plätze (eine Brücke ist ein durchgehender Draht).'); return; }
    // vollständige Wahrheitstabelle durchtesten
    const save = { ...sim }; const fails = [];
    for (const S0pulled of [false, true]) for (const S1 of [false, true]) for (const S2 of [false, true]) {
      Object.assign(sim, { S0pulled, S1, S2 });
      const { K, osc } = solve();
      if (osc) { fails.push('Relais schalten sich ständig selbst ein und aus.'); continue; }
      if (K.K1 && K.K2) fails.push('Beide Relais können gleichzeitig anziehen → Kurzschluss. Es fehlt eine Verriegelung.');
      if (S0pulled && (K.K1 || K.K2)) fails.push('Reißleine gezogen, aber der Motor läuft weiter!');
      if (!S0pulled && S1 && !S2 && !K.K1) fails.push('S1 gedrückt, aber K1 zieht nicht an.');
      if (!S0pulled && S2 && !S1 && !K.K2) fails.push('S2 gedrückt, aber K2 zieht nicht an.');
      if (!S1 && K.K1) fails.push('K1 zieht an, obwohl S1 nicht gedrückt ist.');
      if (!S2 && K.K2) fails.push('K2 zieht an, obwohl S2 nicht gedrückt ist.');
    }
    Object.assign(sim, save); draw();
    if (!fails.length) { go.disabled = true; wrap.style.pointerEvents = 'none'; pal.querySelectorAll('button').forEach(b => b.disabled = true); c.ok(); }
    else c.wrong([...new Set(fails)][0]);
  };
  el.append(wrap, pal, h('div', { class: 'pz-sub' }, 'Test:'), test, out, go);
}

// P12: DIP-Schalter
function dipSwitch(el, c) {
  el.append(h('div', { class: 'pz-q' }, 'Stelle die Gruppen-ID <b>178</b> an den DIP-Schaltern ein (Schalter 1 = MSB = 128).'));
  const bits = [0, 0, 0, 0, 0, 0, 0, 0];
  const box = h('div', { class: 'dip' });
  const out = h('div', { class: 'pz-readout big' });
  const draw = () => {
    box.innerHTML = '';
    bits.forEach((b, i) => {
      const s = h('button', { class: 'sw' + (b ? ' on' : '') }, `<span class="knob"></span><span class="n">${i + 1}</span><span class="v">${128 >> i}</span>`);
      s.onclick = () => { bits[i] ^= 1; draw(); };
      box.append(s);
    });
    const v = bits.reduce((s, b, i) => s + b * (128 >> i), 0);
    out.innerHTML = `Display: <span class="lcd">ID ${v.toString(16).toUpperCase().padStart(2, '0')}</span> &nbsp; <small>(dezimal ${v})</small>`;
  };
  draw();
  const go = h('button', { class: 'btn primary' }, 'ID übernehmen');
  go.onclick = () => {
    const v = bits.reduce((s, b, i) => s + b * (128 >> i), 0);
    if (v === 178) { go.disabled = true; box.querySelectorAll('button').forEach(b => b.disabled = true); c.ok(); }
    else c.wrong(`Die Bake zeigt ID ${v} – nicht 178. Zerlege 178 in Zweierpotenzen.`);
  };
  el.append(box, out, go);
}

// ---------- Die Rätsel ----------
export const PUZZLES = {
  p1: {
    title: 'Der festgerostete Containerhebel', lf: 'LF 2 – Mechanische Teilsysteme', place: 'Container LND 4711',
    intro: 'Der Verschlusshebel der Containertür sitzt bombenfest. Auf einem Aufkleber steht: <b>Lösemoment M = 180 N·m</b>. Mit deinem Körpergewicht kannst du etwa <b>F = 300 N</b> aufbringen.',
    steps: [
      number('Wie lang muss der Hebelarm l mindestens sein?', 'm', 0.6, 0.011, v => v > 10 ? 'Achte auf die Einheit: Meter, nicht Zentimeter.' : 'Tipp: M = F · l. Nach l umstellen.'),
      leverSim,
      choice('Was ist beim Arbeiten mit Hebelverlängerungen wichtig?', ['Fester Stand, Handschuhe, nicht in Zugrichtung stehen – das Rohr kann abrutschen.', 'Möglichst ruckartig springen, dann löst sich der Hebel am besten.', 'Auf das Rohr stellen und hüpfen spart Kraft.'], 0, { 1: 'Ruckartige Belastung kann Hebel oder Rohr brechen lassen – Verletzungsgefahr!', 2: 'Viel zu gefährlich: abrutschen, stürzen, Hebel bricht.' }),
    ],
  },
  p2: {
    title: 'Strom fürs Funkgerät', lf: 'LF 3 – Elektrische Betriebsmittel', place: 'Lager',
    intro: 'Das Handfunkgerät braucht <b>12 V DC</b>. Im Notfall-Batteriefach ist Platz für Mignonzellen mit je <b>1,5 V</b>.',
    steps: [
      number('Wie viele Zellen müssen in Reihe geschaltet werden?', 'Zellen', 8, 0, v => v === 12 ? 'Nicht die Volt zählen, sondern Zellen: 12 V geteilt durch …' : 'U_ges = n · 1,5 V. Nach n umstellen.'),
      batteryBox,
      choice('Wie verhält sich die Kapazität (mAh) bei einer Reihenschaltung von Zellen?', ['Sie bleibt so groß wie die einer einzelnen Zelle.', 'Sie addiert sich: 8 · 2500 mAh.', 'Sie halbiert sich.'], 0, { 1: 'Das gilt für die Parallelschaltung. In Reihe fließt derselbe Strom durch alle Zellen.' }),
    ],
  },
  p3: {
    title: 'Das hydraulische Schott', lf: 'LF 4 – Energie- und Informationsflüsse', place: 'Wrack, Laderaum',
    intro: 'Das wasserdichte Schott zum Maschinenraum wird von einem Hydraulikzylinder bewegt. Die Bordhydraulik ist tot, aber es gibt eine Handpumpe. Typenschild: <b>Kolbendurchmesser 50 mm</b>, nötige Losbrechkraft <b>9,8 kN</b>.',
    steps: [
      number('Berechne die Kolbenfläche A in cm².', 'cm²', 19.63, 0.15, v => Math.abs(v - 78.5) < 1 ? 'Du hast mit dem Radius als Durchmesser gerechnet? A = π · d² / 4.' : Math.abs(v - 1963) < 20 ? 'Das sind mm². Umrechnen: 100 mm² = 1 cm².' : 'A = π · d² / 4, mit d = 5 cm.'),
      number('Welcher Druck p ist nötig? (1 bar = 10 N/cm²)', 'bar', 50, 1.2, v => Math.abs(v - 500) < 15 ? 'Das sind N/cm². Noch in bar umrechnen.' : 'p = F / A mit F = 9800 N.'),
      pumpSim,
      choice('Du willst danach den Schlauch der Handpumpe abschrauben. Was musst du vorher tun?', ['Die Anlage drucklos machen (Ablassventil öffnen).', 'Nichts, Hydrauliköl ist ungefährlich.', 'Den Druck noch erhöhen, damit der Schlauch fest sitzt.'], 0, { 1: 'Unter Druck stehendes Öl kann als Strahl in die Haut eindringen – lebensgefährlich!', 2: 'Im Gegenteil – nie an druckbeaufschlagten Leitungen arbeiten.' }),
    ],
  },
  p4: {
    title: 'Das Solarfeld', lf: 'LF 3 · LF 1 – Systemparameter (englische Datenblätter)', place: 'Energiestation am Lager',
    intro: 'Vier Solarmodule, ein MPPT-Laderegler und der 24-V-Akku. Lies die <b>englischen Datenblätter</b> (Rucksack → Dokumente) und verschalte die Module passend zum Regler.',
    steps: [
      choice('Datenblatt: „Open circuit voltage V<sub>oc</sub> = 22.0 V“. Was bedeutet das?', ['Leerlaufspannung – Spannung ohne angeschlossene Last', 'Spannung im Kurzschluss', 'Spannung bei maximaler Leistung'], 0, { 1: 'Im Kurzschluss ist die Spannung null – dafür fließt der Kurzschlussstrom I_sc.', 2: 'Das ist V_mp („voltage at maximum power“).' }),
      pvConfig,
      number('Welche Leistung liefert das Solarfeld bei Volllast (STC)?', 'W', 400, 6),
    ],
  },
  p5: {
    title: 'Absicherung des Antriebs', lf: 'LF 3 – Leitungsschutz', place: 'Energiestation am Lager',
    intro: 'Der Bootsmotor hat <b>1000 W bei 24 V</b>. Zwischen Akku und Motor brauchst du eine Sicherung und eine passende Leitung. Das Tabellenbuch-Blatt aus dem Wrack hilft (Dokumente).',
    steps: [
      number('Wie groß ist der Betriebsstrom I<sub>B</sub>?', 'A', 41.67, 0.4, v => Math.abs(v - 24000) < 100 ? 'Nicht malnehmen: I = P / U.' : 'I = P / U.'),
      choice('Welche Sicherung wählst du?', ['50 A', '32 A', '80 A', '125 A'], 0, { 1: '32 A liegt unter dem Betriebsstrom – die Sicherung löst ständig aus.', 2: 'Zu groß – die Leitung wäre bei Überlast nicht mehr geschützt.', 3: 'Viel zu groß – das schützt praktisch nichts.' }),
      choice('Welcher Leitungsquerschnitt ist mindestens nötig?', ['10 mm² (I<sub>z</sub> = 57 A)', '6 mm² (I<sub>z</sub> = 41 A)', '4 mm² (I<sub>z</sub> = 32 A)', '16 mm² (I<sub>z</sub> = 76 A)'], 0, { 1: 'I_z = 41 A ist kleiner als der Sicherungsnennstrom 50 A – die Leitung könnte überhitzen, bevor die Sicherung auslöst.', 2: 'Viel zu dünn.', 3: 'Würde funktionieren, ist aber nicht der Mindestquerschnitt – dicker = teurer und schwerer.' }),
      choice('Wo baust du die Sicherung ein?', ['Möglichst nah am Pluspol des Akkus', 'Direkt am Motor', 'In die Minusleitung', 'Egal, Hauptsache im Stromkreis'], 0, { 1: 'Dann wäre die ganze Leitung vom Akku bis zum Motor bei einem Kurzschluss ungeschützt.', 2: 'Die Sicherung gehört in die Plusleitung, direkt an die Quelle.', 3: 'Nein – die Leitung zwischen Akku und Sicherung wäre ungeschützt.' }),
    ],
  },
  p6: {
    title: 'Gleichrichter fürs Windrad', lf: 'LF 3 – Bauteile im Wechselstromkreis', place: 'Energiestation am Lager',
    intro: 'Der Sturm kommt – perfekt für die Kleinwindanlage. Aber der Generator liefert <b>Wechselspannung</b>, der Akku braucht <b>Gleichspannung</b>. Baue aus vier Dioden einen Brückengleichrichter.',
    steps: [
      bridge,
      choice('Henrik: „Die Spannung pulsiert noch ziemlich.“ Was hilft?', ['Ein Ladekondensator parallel zum Ausgang', 'Eine fünfte Diode in Reihe', 'Ein Widerstand in Reihe zum Akku'], 0, { 1: 'Eine weitere Diode verursacht nur zusätzlichen Spannungsfall.', 2: 'Ein Widerstand verheizt Energie, glättet aber kaum.' }),
    ],
  },
  p7: {
    title: 'Der nasse Motor', lf: 'LF 3 – Elektrische Messverfahren', place: 'Bootsbauplatz',
    intro: 'Der Gleichstrommotor lag im Salzwasser. Bevor du ihn an den Akku hängst, prüfst du ihn mit dem Multimeter.',
    steps: [
      choice('Welche Einstellung wählst du, um die Wicklung zu prüfen? (Motor ist abgeklemmt)', ['Ω – Widerstand', 'V⎓ – Gleichspannung', 'A⎓ – Gleichstrom', 'V~ – Wechselspannung'], 0, { 1: 'Am abgeklemmten Motor liegt keine Spannung an – du willst den Zustand der Wicklung wissen.', 2: 'Strommessung im Ω-freien Kreis? Ohne Spannung fließt kein Strom.', 3: 'Der Motor ist abgeklemmt – da ist keine Spannung.' }),
      meterSim,
      choice('Welcher Messwert zeigt einen Fehler?', ['A1 – Gehäuse: 2,1 kΩ', 'A1 – A2: 0,18 Ω', 'Keiner, alles in Ordnung'], 0, { 1: 'Eine Kupferwicklung ist sehr niederohmig – 0,18 Ω ist normal.', 2: 'Schau genau: Zwischen Wicklung und Gehäuse muss der Widerstand riesig sein.' }),
      choice('Was tust du?', ['Mit Süßwasser aus der Quelle spülen, am Feuer trocknen, erneut messen', 'Motor sofort anschließen, das trocknet im Betrieb', 'Gehäuse mit Klebeband isolieren'], 0, { 1: 'Bei einem Isolationsfehler kann das Gehäuse Spannung führen und das Salz zerstört die Wicklung.', 2: 'Das ändert nichts an der feuchten, salzigen Wicklung.' }),
      (el, c) => { el.append(h('div', { class: 'pz-q' }, 'Ein paar Stunden später … Der Motor ist trocken. Miss erneut:')); meterSim(el, c, { flags: { motorDry: true } }, false); const go = h('button', { class: 'btn primary' }, 'Motor ist in Ordnung'); go.onclick = () => { go.disabled = true; c.ok(); }; el.append(go); },
    ],
  },
  p8: {
    title: 'Der Rumpf', lf: 'LF 2 – Werkstoffe und Verbindungen', place: 'Bootsbauplatz',
    intro: 'Zwei Schwimmkörper, Aluprofile und eine Kiste voller Schrauben. Der Katamaran-Rahmen muss Salzwasser, Sonne und Vibrationen aushalten.',
    steps: [
      choice('Welche Schrauben nimmst du für den Rahmen?', ['Edelstahl A4-70', 'Stahl verzinkt 8.8', 'Stahl blank 10.9', 'Messing'], 0, { 1: 'Die Verzinkung hält im Salzwasser nicht lange – dann rostet der Stahl.', 2: 'Hochfest, aber blanker Stahl rostet im Meerwasser in kürzester Zeit.', 3: 'Messing ist weich und neigt im Meerwasser zur Entzinkung.' }),
      choice('Edelstahlschraube direkt im Aluprofil, dazu Salzwasser – was droht?', ['Kontaktkorrosion: das Aluminium löst sich auf', 'Nichts, beide Metalle sind korrosionsbeständig', 'Die Edelstahlschraube rostet'], 0, { 1: 'Einzeln ja – aber zwei verschiedene Metalle plus Elektrolyt bilden ein galvanisches Element.', 2: 'Nein: das unedlere Metall – Aluminium – wird angegriffen.' }),
      choice('Wie verhinderst du das?', ['Kunststoffscheiben und -hülsen zwischen Schraube und Profil', 'Mehr Schrauben verwenden', 'Die Schrauben besonders fest anziehen'], 0),
      sort('Ordne die Verbindungen am Boot zu:', ['Kraftschluss', 'Formschluss', 'Stoffschluss'], [
        { t: 'Rahmen verschraubt (Vorspannung)', c: 0 }, { t: 'Passfeder zwischen Welle und Propeller', c: 1 }, { t: 'Schwimmerhalter geklebt', c: 2 },
        { t: 'Rohrschelle um den Mast', c: 0 }, { t: 'Splint in der Ruderachse', c: 1 }, { t: 'Geschweißte Motorkonsole', c: 2 },
      ]),
      choice('Der Motor vibriert. Wie sicherst du die Muttern gegen Losdrehen?', ['Selbstsichernde Muttern (mit Polyamidring)', 'Federringe', 'Gar nicht, fest ist fest'], 0, { 1: 'Federringe haben bei hochfesten Verbindungen kaum Wirkung und sind nicht mehr genormt.', 2: 'Vibrationen lösen auch fest angezogene Schrauben.' }),
    ],
  },
  p9: {
    title: 'Der Riemenantrieb', lf: 'LF 2 – Maschinenelemente', place: 'Bootsbauplatz',
    intro: 'Der Motor dreht mit <b>n<sub>1</sub> = 3000 1/min</b>, der Propeller arbeitet am besten bei <b>n<sub>2</sub> = 1000 1/min</b>. Am Motor sitzt eine Riemenscheibe mit <b>z<sub>1</sub> = 20</b> Zähnen.',
    steps: [
      number('Welche Übersetzung i brauchst du?', '', 3, 0.01, v => Math.abs(v - 0.333) < 0.01 ? 'Umgekehrt: i = n₁ / n₂ (Antrieb durch Abtrieb).' : 'i = n₁ / n₂'),
      choice('Welche Riemenscheibe kommt auf die Propellerwelle?', ['z₂ = 60', 'z₂ = 30', 'z₂ = 72', 'z₂ = 15'], 0, { 1: 'Damit wäre i = 1,5.', 2: 'Damit wäre i = 3,6 – der Propeller dreht zu langsam.', 3: 'Kleiner als am Motor: der Propeller würde schneller drehen als der Motor!' }),
      number('Der Motor gibt M<sub>1</sub> = 3,2 N·m ab. Welches Drehmoment liegt am Propeller an (verlustfrei)?', 'N·m', 9.6, 0.05, v => Math.abs(v - 1.07) < 0.05 ? 'Umgekehrt: Bei Übersetzung ins Langsame steigt das Drehmoment.' : 'M₂ = M₁ · i'),
      choice('Die Propellernabe hat die Bohrung „Ø25 H7“. Was bedeutet das?', ['Bohrung mit Grundabmaß H (unteres Abmaß 0) und Toleranzgrad IT7', 'Welle mit Härte 7', 'Gewinde M25 mit Steigung 7', 'Bohrung, die 7 mm tief ist'], 0, { 1: 'Großbuchstaben stehen für Bohrungen, Kleinbuchstaben für Wellen.' }),
    ],
  },
  p10: {
    title: 'Vorwärts, rückwärts, Not-Halt', lf: 'LF 4 – Grundschaltungen der Steuerungstechnik', place: 'Bootsbauplatz',
    intro: 'Zwei Relais polen den Motor um: K1 = vorwärts, K2 = rückwärts. Ziehen beide gleichzeitig an, gibt es einen Kurzschluss. Die Reißleine (S0) am Handgelenk soll den Motor sofort stoppen, wenn du über Bord gehst.',
    steps: [
      relayLogic,
      choice('Warum steckt der Öffner von K2 im Strompfad von K1?', ['Gegenseitige Verriegelung: K1 kann nur anziehen, wenn K2 abgefallen ist', 'Selbsthaltung: K1 bleibt nach dem Loslassen an', 'Damit der Motor schneller dreht'], 0, { 1: 'Selbsthaltung bräuchte einen Schließer von K1 parallel zu S1.' }),
      choice('Welche Schutzart braucht der Steuerkasten auf dem Boot?', ['IP67', 'IP20', 'IP44', 'IP43'], 0, { 1: 'IP20 schützt nur gegen Fingerberührung – kein Wasserschutz.', 2: 'IP44 schützt nur gegen Spritzwasser. Auf dem Boot schwappt richtig Wasser.', 3: 'Nur Sprühwasserschutz.' }),
    ],
  },
  p11: {
    title: 'Reicht die Energie?', lf: 'LF 1 – Funktionszusammenhänge, Energiefluss', place: 'Bootsbauplatz',
    intro: 'Bis zur Schifffahrtsroute sind es laut Seekarte etwa <b>45 km</b>. Bevor du ablegst, prüfst du das Gesamtsystem.',
    steps: [
      order('Bring die Baugruppen in die Reihenfolge des Energieflusses:', ['Solarmodule', 'Laderegler', 'Akku', 'Sicherung', 'Relais-Steuerung', 'Motor', 'Zahnriemen', 'Propeller']),
      number('Wie viel Energie speichert der Akku (24 V, 100 Ah)?', 'Wh', 2400, 1, v => Math.abs(v - 2.4) < 0.01 ? 'Richtig gerechnet – aber gefragt ist die Einheit Wh, nicht kWh.' : 'W = U · Q'),
      number('Der Motor braucht bei Marschfahrt 600 W, die Sonne liefert im Schnitt 300 W nach. Wie viele Stunden kannst du fahren?', 'h', 8, 0.05, v => Math.abs(v - 4) < 0.05 ? 'Du hast die Solarleistung vergessen: netto fehlen nur 600 W − 300 W.' : 't = W / P_netto'),
      number('Mit 7 km/h – wie weit kommst du?', 'km', 56, 0.5),
      choice('Wann legst du ab?', ['Früh am Morgen – dann scheint die Sonne den ganzen Tag', 'Am Abend, wenn es kühler ist', 'Nachts, dann sieht man Schiffslichter'], 0, { 1: 'Nachts liefern die Module nichts – die Rechnung mit 300 W Solarleistung geht dann nicht auf.', 2: 'Ohne Sonne nur 4 h Fahrzeit = 28 km. Zu wenig!' }),
    ],
  },
  p12: {
    title: 'Die Notfunkbake', lf: 'LF 5 – Kommunikation, Datenverarbeitung', place: 'Lagune',
    intro: 'In der Rettungsinsel-Kiste steckt eine AIS-SART-Bake. Henrik funkt: „Unsere Gruppen-ID ist <b>178</b>. Die Anleitung ist auf Englisch – steht in deinen Dokumenten.“',
    steps: [
      dipSwitch,
      text('Das Display zeigt die ID hexadezimal. Was steht dort? (zwei Zeichen)', ['B2'], 'Teile die Dualzahl in zwei Vierergruppen: 1011 | 0010.'),
      choice('Laut Handbuch reicht das Signal nur etwa 9 km weit. Warum?', ['UKW breitet sich quasi-optisch aus – die Erdkrümmung begrenzt die Reichweite', 'Die Batterie ist zu schwach', 'Funkwellen werden von Salzwasser verschluckt'], 0, { 1: 'Die Sendeleistung ist nicht der begrenzende Faktor.', 2: 'Über Wasser breitet sich Funk eher gut aus – das Problem ist die Sichtlinie.' }),
    ],
  },
};

// ---------- Ablauf eines Rätsels im Modal ----------
export function runPuzzle(id, G, ui, hooks) {
  const P = PUZZLES[id];
  let step = 0, mistakes = 0;
  const panel = ui.openModal('puzzle');
  panel.innerHTML = '';
  const head = h('div', { class: 'pz-head' }, `<div class="pz-lf">${P.lf}</div><h2>${P.title}</h2><div class="pz-place">📍 ${P.place}</div>`);
  const intro = h('div', { class: 'pz-intro' }, P.intro);
  const prog = h('div', { class: 'pz-prog' });
  const body = h('div', { class: 'pz-body' });
  const fb = h('div', { class: 'pz-fb' });
  const foot = h('div', { class: 'pz-foot' });
  const hintBtn = h('button', { class: 'btn ghost' }, G.flags.radio ? '📻 Henrik fragen' : '💭 Nachdenken');
  const docBtn = h('button', { class: 'btn ghost' }, '📄 Dokumente');
  const close = h('button', { class: 'btn ghost' }, 'Später');
  foot.append(hintBtn, docBtn, close);
  panel.append(head, intro, prog, body, fb, foot);
  let hintLvl = 0;
  hintBtn.onclick = () => {
    const hs = (hooks.hints || {})[id] || [];
    const t = hs[Math.min(hintLvl, hs.length - 1)];
    if (!t) return;
    G.hintsUsed = (G.hintsUsed || 0) + 1;
    hintLvl = Math.min(hintLvl + 1, hs.length - 1);
    fb.className = 'pz-fb hint';
    fb.innerHTML = (G.flags.radio ? '<b>Henrik:</b> ' : '<b>Jana denkt:</b> ') + t;
    hooks.sound && hooks.sound(G.flags.radio ? 'radio' : 'click');
  };
  docBtn.onclick = () => hooks.openDocs();
  close.onclick = () => { ui.closeModal(); hooks.onClose && hooks.onClose(); };
  const ctx = {
    ok: (silent) => {
      if (silent === true) return;
      hooks.sound && hooks.sound('ok');
      fb.className = 'pz-fb good'; fb.innerHTML = '✓ Richtig!';
      const nb = h('button', { class: 'btn primary next' }, step < P.steps.length - 1 ? 'Weiter →' : 'Abschließen');
      nb.onclick = () => { step++; renderStep(); };
      fb.append(' ', nb);
      setTimeout(() => nb.focus(), 30);
    },
    wrong: (msg) => {
      mistakes++; G.mistakes = (G.mistakes || 0) + 1;
      G.pm[id] = (G.pm[id] || 0) + 1;
      hooks.sound && hooks.sound('err');
      fb.className = 'pz-fb bad'; fb.innerHTML = '✗ ' + msg;
      panel.classList.remove('shake'); void panel.offsetWidth; panel.classList.add('shake');
    },
    info: (msg) => { fb.className = 'pz-fb'; fb.innerHTML = msg; },
  };
  const renderStep = () => {
    prog.innerHTML = P.steps.map((_, i) => `<span class="${i < step ? 'done' : i === step ? 'cur' : ''}"></span>`).join('');
    fb.className = 'pz-fb'; fb.innerHTML = '';
    body.innerHTML = '';
    if (step >= P.steps.length) {
      ui.closeModal();
      hooks.onSolve(id, mistakes);
      return;
    }
    if (step > 0) intro.classList.add('small');
    P.steps[step](body, ctx, G);
  };
  renderStep();
}
