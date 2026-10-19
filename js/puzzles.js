'use strict';
// ------------------------------------------------------------
//  Rätsel (Lernfeldbezug Mechatroniker/-in, 1. Ausbildungsjahr)
// ------------------------------------------------------------
function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function fb(p, msg, good) {
  const el = p.querySelector('.fb');
  el.innerHTML = msg; el.className = 'fb ' + (good ? 'good' : 'bad');
  Snd.play(good ? 'ok' : 'err');
}
const num = s => parseFloat(String(s).replace(',', '.').replace(/[^\d.\-]/g, ''));

const PUZZLES = {
  // ---------------------------------------------------------------
  // 1) Die 5 Sicherheitsregeln (Irmgard)
  // ---------------------------------------------------------------
  sicherheit() {
    const rules = ['Freischalten', 'Gegen Wiedereinschalten sichern', 'Spannungsfreiheit feststellen', 'Erden und kurzschließen', 'Benachbarte, unter Spannung stehende Teile abdecken oder abschranken'];
    const fake = ['Kurz mit dem Finger prüfen, ob’s kribbelt', 'Defekte Sicherung mit Draht überbrücken'];
    const cards = shuffle(rules.concat(fake));
    let seq = [], fails = 0;
    const p = Game.modal(`<h2>Die 5 Sicherheitsregeln</h2>
      <p class="who">Irmgard: „Na los. In der richtigen Reihenfolge. Und erzähl mir keinen Schmarrn.“</p>
      <p class="note">Klicke die Regeln in der richtigen Reihenfolge an.</p>
      <div class="cards">${cards.map((c, i) => `<button class="card" data-i="${i}">${c}</button>`).join('')}</div>
      <ol class="seq"></ol>
      <div class="fb"></div>
      <div class="row"><button class="btn reset">Zurücksetzen</button><button class="btn go">Fertig</button></div>`);
    const render = () => {
      p.querySelector('.seq').innerHTML = seq.map(i => `<li>${cards[i]}</li>`).join('');
      p.querySelectorAll('.card').forEach(b => b.disabled = seq.includes(+b.dataset.i));
    };
    p.querySelectorAll('.card').forEach(b => b.onclick = () => { Snd.play('select'); seq.push(+b.dataset.i); render(); });
    p.querySelector('.reset').onclick = () => { seq = []; render(); };
    p.querySelector('.go').onclick = () => {
      const chosen = seq.map(i => cards[i]);
      if (chosen.some(c => fake.includes(c))) { Game.mistake(); fails++; fb(p, 'Irmgard: „' + (chosen.find(c => fake.includes(c)).startsWith('Kurz') ? 'Mit dem FINGER?! Willst du mich veräppeln?' : 'Draht überbrücken?! So brennen Hallen ab!') + ' Nochmal von vorn.“'); seq = []; render(); return; }
      if (chosen.length < 5) { fb(p, 'Irmgard: „Fünf. Hab ich gesagt. Fünf.“'); return; }
      const ok = chosen.every((c, i) => c === rules[i]);
      if (!ok) {
        Game.mistake(); fails++;
        let firstWrong = chosen.findIndex((c, i) => c !== rules[i]);
        fb(p, 'Irmgard: „Falsche Reihenfolge.' + (fails >= 2 ? ` Bis Regel ${firstWrong} stimmt’s, ab Regel ${firstWrong + 1} nicht mehr.` : '') + ' Denk nach: Was muss passieren, BEVOR du prüfen kannst?“');
        seq = []; render(); return;
      }
      Game.closeModal(true);
      Game.set('gotKey');
      Game.say([['Irmgard', '…'], ['Irmgard', 'Fehlerfrei. Der Brandl hat recht gehabt mit dir.'], ['Irmgard', 'Da. Der Schaltraumschlüssel. Und wenn du LS-Schalter oder sonst was brauchst – nimm dir aus den Regeln. Ich schreib’s auf den Brandl.']], () => Game.give('schluessel'));
    };
  },

  // ---------------------------------------------------------------
  // 2) Leitungsschutzschalter auswählen (LF3)
  // ---------------------------------------------------------------
  sicherung() {
    const p = Game.modal(`<h2>Unterverteilung Halle 3 – Stromkreis F3</h2>
      <table class="tb"><tr><th>Stromkreis</th><th>Verbraucher</th><th>Leitung</th><th>LS</th></tr>
      <tr><td>F1</td><td>Steckdosen Werkstatt</td><td>NYM-J 3×2,5 mm²</td><td>B16</td></tr>
      <tr><td>F2</td><td>Kompressor</td><td>NYM-J 5×2,5 mm²</td><td>C16</td></tr>
      <tr class="hl"><td>F3</td><td>Hallenbeleuchtung: <b>12 Leuchten à 250 W</b>, parallel, 230 V</td><td>NYM-J 3×2,5 mm²<br><small>zulässig I<sub>z</sub> = 20 A</small></td><td><b>???</b></td></tr>
      <tr><td>F4</td><td>Umkleide</td><td>NYM-J 3×1,5 mm²</td><td>B10</td></tr></table>
      <div class="step"><label>1. Betriebsstrom von F3 berechnen: &nbsp; I = <input class="inp" id="iI" size="6"> A</label> <small>(auf eine Nachkommastelle)</small></div>
      <div class="step"><p>2. Passenden LS aus dem Sortiment einsetzen:</p>
        <div class="choices">${['B6', 'B10', 'B16', 'B32'].map(x => `<button class="btn ch" data-v="${x}">${x}</button>`).join('')}</div></div>
      <div class="fb"></div>`);
    p.querySelectorAll('.ch').forEach(b => b.onclick = () => {
      const I = num(p.querySelector('#iI').value);
      if (!(I >= 12.9 && I <= 13.1)) {
        Game.mistake();
        fb(p, isNaN(I) ? 'Erst rechnen, dann einbauen! Trag den Betriebsstrom ein.' : `I = ${I} A? Das stimmt nicht. Tipp: P<sub>ges</sub> = 12 · 250 W, dann I = P / U.`);
        return;
      }
      const v = b.dataset.v;
      if (v === 'B6' || v === 'B10') { Game.mistake(); Snd.play('breaker'); fb(p, `Du setzt den ${v} ein … KLACK – beim Einschalten der Lampen löst er sofort aus. ${v.slice(1)} A &lt; 13 A: zu klein!`); return; }
      if (v === 'B32') { Game.mistake(); fb(p, 'Halt! Ein B32 würde bei 32 A erst auslösen – die 2,5-mm²-Leitung verträgt aber nur 20 A. Bei Überlast würde die Leitung heiß werden: Brandgefahr. Der LS muss die <b>Leitung</b> schützen!'); return; }
      Game.closeModal(true);
      Game.take('ls');
      Snd.play('clank');
      Game.say(['I = 3000 W / 230 V ≈ 13,0 A. Der B16 liegt darüber und schützt die 2,5-mm²-Leitung (I<sub>z</sub> = 20 A).', 'Du rastest den B16 auf die Hutschiene, klemmst die Leitung an und ziehst die Klemme nach. Abdeckung drauf.', 'Jetzt: Schloss ab, Hauptschalter ein.'], () => Game.fix('licht'));
    });
  },

  // ---------------------------------------------------------------
  // 3) Kernloch bohren (LF2)
  // ---------------------------------------------------------------
  bohren() {
    const p = Game.modal(`<h2>Säulenbohrmaschine – Kernloch für M10</h2>
      <div class="step s1"><p><b>1. Vorbereitung – was machst du?</b></p>
        <label class="cb"><input type="checkbox" id="brille"> Schutzbrille aufsetzen</label>
        <label class="cb"><input type="checkbox" id="hand"> Arbeitshandschuhe anziehen</label>
        <label class="cb"><input type="checkbox" id="spann"> Platte im Maschinenschraubstock spannen</label>
        <label class="cb"><input type="checkbox" id="halt"> Platte zur Sicherheit mit der Hand festhalten</label></div>
      <div class="step"><p><b>2. Bohrer wählen</b> (Platte bekommt ein Gewinde M10, Steigung P = 1,5 mm)</p>
        <select id="bohrer"><option value="">– Bohrer –</option>${['8,0', '8,5', '9,0', '10,0', '10,5'].map(x => `<option>${x} mm</option>`).join('')}</select></div>
      <div class="step"><p><b>3. Drehzahl einstellen</b> (Werkstoff S235, HSS-Bohrer)</p>
        <select id="n"><option value="">– Drehzahl –</option>${[280, 450, 710, 900, 1400, 2240].map(x => `<option value="${x}">${x} 1/min</option>`).join('')}</select></div>
      <div class="fb"></div>
      <div class="row"><button class="btn go">Bohren!</button></div>`);
    p.querySelector('.go').onclick = () => {
      const q = id => p.querySelector('#' + id);
      if (q('hand').checked) {
        Game.mistake(); Game.closeModal(true);
        if (!Game.hurt(30, 'Der Handschuh wurde von der rotierenden Spindel erfasst. An Bohrmaschinen niemals Handschuhe tragen!'))
          Game.say(['Der Bohrer erfasst den Handschuh – ein Ruck reißt deine Hand mit!', 'Du kannst gerade noch den Not-Aus schlagen. Deine Hand pocht.', 'An Bohrmaschinen: KEINE Handschuhe! Einzugsgefahr.']);
        return;
      }
      if (q('halt').checked) { Game.mistake(); fb(p, 'Mit der Hand festhalten?! Wenn der Bohrer hakt, reißt es dir die Platte aus der Hand und sie dreht sich mit – wie ein Messer. Werkstück immer spannen!'); return; }
      if (!q('spann').checked) { Game.mistake(); fb(p, 'Das Werkstück liegt lose auf dem Tisch. Werkstück immer im Maschinenschraubstock spannen!'); return; }
      if (!q('brille').checked) { Game.mistake(); fb(p, 'Ohne Schutzbrille? Heiße Späne fliegen dir ins Auge. Erst Schutzbrille auf!'); return; }
      const d = q('bohrer').value;
      if (!d) { fb(p, 'Welchen Bohrer nimmst du?'); return; }
      if (d !== '8,5 mm') {
        Game.mistake();
        const dv = num(d);
        fb(p, dv < 8.5 ? `Mit ${d} wird das Kernloch zu klein – der Gewindebohrer würde klemmen und abbrechen.` : `Mit ${d} wird das Loch zu groß – das Gewinde hätte kaum Flanken und würde wieder ausreißen.` + ' Tipp: Kernloch-Ø ≈ Nenndurchmesser − Steigung.');
        return;
      }
      const n = +q('n').value;
      if (!n) { fb(p, 'Welche Drehzahl stellst du ein?'); return; }
      if (n !== 900) {
        Game.mistake();
        fb(p, (n > 900 ? `Bei ${n} 1/min läuft der Bohrer blau an – viel zu schnell für Stahl.` : `Bei ${n} 1/min schabt der Bohrer mehr, als er schneidet. Zu langsam.`) + ' Tipp: n = v<sub>c</sub> · 1000 / (π · d), dann die nächstliegende Stufe.');
        return;
      }
      Game.closeModal(true);
      Game.take('platte'); Game.give('platte_gebohrt', true);
      Snd.play('machine');
      Game.say(['n = 25 · 1000 / (π · 8,5) ≈ 936 1/min → Stufe 900.', 'Mit etwas Kühlschmierstoff frisst sich der 8,5er-Bohrer sauber durch den Stahl. Späne kringeln sich blau-silbern.', 'Kernloch fertig. Jetzt das Gewinde: Gewindebohrer ins Windeisen und am Schraubstock schneiden.'], () => { Snd.play('pickup'); Game.toast('Erhalten: ' + ITEMS.platte_gebohrt.name); });
    };
  },

  // ---------------------------------------------------------------
  // 4) Gewinde schneiden (LF2)
  // ---------------------------------------------------------------
  gewinde() {
    const taps = shuffle([{ id: 1, t: 'Gewindebohrer mit 1 Ring' }, { id: 2, t: 'Gewindebohrer mit 2 Ringen' }, { id: 3, t: 'Gewindebohrer mit 3 Ringen' }]);
    let seq = [];
    const p = Game.modal(`<h2>Innengewinde M10 schneiden</h2>
      <p>Die Platte ist im Schraubstock gespannt. Der Handgewindebohrer-Satz ist dreiteilig.</p>
      <div class="step"><p><b>1. In welcher Reihenfolge setzt du die Gewindebohrer ein?</b></p>
        <div class="cards">${taps.map(x => `<button class="card" data-i="${x.id}">${x.t}</button>`).join('')}</div><ol class="seq"></ol>
        <button class="btn small reset">Zurücksetzen</button></div>
      <div class="step"><p><b>2. Wie schneidest du?</b></p>
        <label class="cb"><input type="radio" name="tech" value="a"> Zügig in einem Rutsch durchdrehen, dann geht’s schneller</label>
        <label class="cb"><input type="radio" name="tech" value="b"> Gerade ansetzen, Schneidöl, nach ca. einer Umdrehung eine halbe zurück (Span brechen)</label>
        <label class="cb"><input type="radio" name="tech" value="c"> Wenn’s klemmt, mit dem Hammer auf das Windeisen klopfen</label></div>
      <div class="fb"></div><div class="row"><button class="btn go">Gewinde schneiden</button></div>`);
    const render = () => { p.querySelector('.seq').innerHTML = seq.map(i => `<li>${taps.find(x => x.id === i).t}</li>`).join(''); p.querySelectorAll('.card').forEach(b => b.disabled = seq.includes(+b.dataset.i)); };
    p.querySelectorAll('.card').forEach(b => b.onclick = () => { Snd.play('select'); seq.push(+b.dataset.i); render(); });
    p.querySelector('.reset').onclick = () => { seq = []; render(); };
    p.querySelector('.go').onclick = () => {
      if (seq.length < 3) { fb(p, 'Wähle die Reihenfolge aller drei Gewindebohrer.'); return; }
      if (seq.join('') !== '123') { Game.mistake(); fb(p, 'Der Gewindebohrer mit den meisten Ringen ist der Fertigschneider – mit dem fängt man nicht an, er würde überlastet und kann abbrechen. Erst Vorschneider (1 Ring), dann Mittelschneider (2), dann Fertigschneider (3).'); seq = []; render(); return; }
      const t = (p.querySelector('input[name=tech]:checked') || {}).value;
      if (!t) { fb(p, 'Wie gehst du beim Schneiden vor?'); return; }
      if (t === 'a') { Game.mistake(); fb(p, 'Knacks! Die Späne verstopfen die Nuten, der Gewindebohrer klemmt … zum Glück ist er nicht abgebrochen. Nochmal – diesmal mit Spanbrechen.'); return; }
      if (t === 'c') { Game.mistake(); fb(p, 'Hammer auf einen gehärteten Gewindebohrer? Der bricht wie Glas – und steckt dann für immer in der Platte. Lass das.'); return; }
      Game.closeModal(true);
      Game.take('platte_gebohrt'); Game.take('gewindeschneider'); Game.give('platte_fertig', true);
      Snd.play('ok');
      Game.say(['Vorschneider, Mittelschneider, Fertigschneider. Ein Tropfen Schneidöl, eine Umdrehung vor, eine halbe zurück.', 'Zum Schluss prüfst du mit einer M10-Schraube: Sie läuft satt und ohne Wackeln ins Gewinde.', 'Die Halteplatte ist fertig. Ab damit zum Bandantrieb in der Halle!'], () => { Snd.play('pickup'); Game.toast('Erhalten: ' + ITEMS.platte_fertig.name); });
    };
  },

  // ---------------------------------------------------------------
  // 5) Getriebeübersetzung (LF1)
  // ---------------------------------------------------------------
  getriebe() {
    const p = Game.modal(`<h2>Bandgetriebe – Ersatzrad auswählen</h2>
      <svg viewBox="0 0 300 120" class="fig">
        <circle cx="80" cy="60" r="22" class="gear"/><text x="80" y="64">z₁=18</text>
        <circle cx="170" cy="60" r="56" class="gear dash"/><text x="170" y="64">z₂ = ?</text>
        <text x="80" y="104" class="small">Motor: n₁ = 1400 1/min</text>
        <text x="230" y="16" class="small">Bandwelle: n₂ = 350 1/min</text>
      </svg>
      <div class="step"><label>Übersetzung i = <input class="inp" id="i" size="5"></label></div>
      <div class="step"><p>Welches Rad baust du ein?</p><div class="choices">${[36, 54, 72, 90].map(z => `<button class="btn ch" data-z="${z}">z = ${z}</button>`).join('')}</div></div>
      <div class="fb"></div>`);
    p.querySelectorAll('.ch').forEach(b => b.onclick = () => {
      const i = num(p.querySelector('#i').value);
      if (i !== 4) { Game.mistake(); fb(p, isNaN(i) ? 'Erst die Übersetzung ausrechnen: i = n₁ / n₂.' : `i = ${i}? Rechne nochmal: i = n₁ / n₂.`); return; }
      const z = +b.dataset.z;
      const n2 = Math.round(1400 * 18 / z);
      if (z !== 72) { Game.mistake(); fb(p, `Mit z₂ = ${z} wäre n₂ = 1400 · 18 / ${z} ≈ ${n2} 1/min. ${n2 > 350 ? 'Zu schnell – die Gehäuse fliegen vom Band!' : 'Zu langsam – so schaffst du die 2000 Stück nie bis Montag.'}`); return; }
      Game.closeModal(true);
      Game.take('zahnraeder');
      Snd.play('clank');
      Game.say(['i = 1400 / 350 = 4  →  z₂ = i · z₁ = 4 · 18 = 72.', 'Du setzt das Rad mit 72 Zähnen auf die Welle, sicherst es mit der Passfeder und stellst das Flankenspiel ein. Ein Klecks Fett drauf.'], () => Game.fix('getriebe'));
    });
  },

  // ---------------------------------------------------------------
  // 6) Pneumatik-Presse (LF4)
  // ---------------------------------------------------------------
  pneumatik() {
    const ports = ['1', '2', '3', '4', '5'];
    const sel = (id, label) => `<label class="pl">${label}<select id="${id}"><option value="">–</option>${ports.map(x => `<option>${x}</option>`).join('')}</select></label>`;
    const p = Game.modal(`<h2>Pneumatik-Presse – Verschlauchung</h2>
      <div class="cols"><svg viewBox="0 0 260 220" class="fig pneu">
        <rect x="60" y="10" width="140" height="34" class="body"/><rect x="100" y="12" width="6" height="30" class="piston"/><rect x="106" y="24" width="94" height="6" class="piston"/>
        <text x="130" y="8" class="small">Zylinder (doppeltwirkend) · Stempel nach rechts = AB</text>
        <line x1="70" y1="44" x2="70" y2="70" class="pipe"/><text x="56" y="62" class="lbl">A</text>
        <line x1="190" y1="44" x2="190" y2="70" class="pipe"/><text x="200" y="62" class="lbl">B</text>
        <rect x="60" y="100" width="70" height="50" class="valve"/><rect x="130" y="100" width="70" height="50" class="valve"/>
        <path d="M200 112 l10 6 l-10 6 l10 6 l-10 6" class="spring"/>
        <text x="165" y="96" class="small">5/2-Wegeventil (Federrückstellung)</text>
        <text x="148" y="117" class="port">4</text><text x="182" y="117" class="port">2</text>
        <text x="142" y="146" class="port">5</text><text x="165" y="146" class="port">1</text><text x="188" y="146" class="port">3</text>
        <line x1="148" y1="106" x2="144" y2="138" class="flow"/><line x1="166" y1="138" x2="181" y2="106" class="flow"/><text x="95" y="130" class="small">betätigt</text>
        <text x="130" y="168" class="small">Grundstellung (rechtes Feld): 1→2 · 4→5</text>
        <rect x="20" y="182" width="60" height="26" class="body"/><text x="50" y="199" class="small">Wartungseinheit</text>
        <text x="50" y="216" class="small lbl">P</text>
        <text x="200" y="198" class="small">Schalldämpfer S1, S2</text>
      </svg>
      <div class="side">
        <p><b>1. Schläuche an welchen Ventil-Anschluss?</b></p>
        ${sel('pP', 'P – Druckluft von der Wartungseinheit')}
        ${sel('pA', 'A – Kolbenseite (Stempel fährt AB)')}
        ${sel('pB', 'B – Kolbenstangenseite (Stempel fährt AUF)')}
        ${sel('pS1', 'Schalldämpfer S1')}
        ${sel('pS2', 'Schalldämpfer S2')}
        <p class="note">Typenschild: „In Ruhestellung muss der Stempel OBEN (eingefahren) stehen.“</p>
      </div></div>
      <div class="step"><p><b>2. Zweihand-Sicherheitssteuerung:</b> Die zwei Taster links und rechts sollen das Ventil nur schalten, wenn <u>beide</u> gedrückt sind. Welches Ventil kommt dazwischen?</p>
        <label class="cb"><input type="radio" name="zh" value="w"> Wechselventil</label>
        <label class="cb"><input type="radio" name="zh" value="z"> Zweidruckventil</label>
        <label class="cb"><input type="radio" name="zh" value="d"> Drosselrückschlagventil</label></div>
      <div class="step"><p><b>3. Druckregler einstellen</b> (Typenschild Presse: Betriebsdruck p = 6 bar)</p>
        <input type="range" id="bar" min="0" max="10" step="0.5" value="2"> <b><span id="barv">2,0</span> bar</b></div>
      <div class="fb"></div><div class="row"><button class="btn go">Druckluft aufschalten</button></div>`, { cls: 'wide' });
    const bar = p.querySelector('#bar');
    bar.oninput = () => p.querySelector('#barv').textContent = (+bar.value).toFixed(1).replace('.', ',');
    p.querySelector('.go').onclick = () => {
      const v = id => p.querySelector('#' + id).value;
      const P = v('pP'), A = v('pA'), B = v('pB'), S1 = v('pS1'), S2 = v('pS2');
      if (!P || !A || !B || !S1 || !S2) { fb(p, 'Erst alle Schläuche anschließen.'); return; }
      if (new Set([P, A, B, S1, S2]).size < 5) { Game.mistake(); fb(p, 'An einem Anschluss stecken zwei Schläuche. Jeder Anschluss bekommt genau einen.'); return; }
      if (P === '3' || P === '5') {
        Game.mistake(); Snd.play('hiss'); Game.closeModal(true);
        if (!Game.hurt(15, 'Ein abgesprungener Druckluftschlauch hat dich getroffen.')) Game.say(['FFFSSSSST! Die Druckluft schießt aus dem Entlüftungsanschluss, der Schlauch springt ab und peitscht dir gegen den Unterarm.', '3 und 5 sind Entlüftungen – die Versorgung gehört an Anschluss 1.']);
        return;
      }
      if (P !== '1') { Game.mistake(); Snd.play('hiss'); fb(p, `Anschluss ${P} ist ein Arbeitsanschluss. Die Druckluftversorgung gehört an <b>1</b>.`); return; }
      if (A === '2' && B === '4') {
        Game.mistake(); Snd.play('whoosh'); Game.closeModal(true);
        if (!Game.hurt(15, 'Der Stempel ist in Ruhestellung heruntergefahren.')) Game.say(['Kaum ist Luft drauf, kracht der Stempel herunter – ohne dass jemand einen Taster gedrückt hat! Du ziehst die Hand gerade noch weg und schrammst dir den Arm auf.', 'In Grundstellung ist 1 mit 2 verbunden. Also muss an 2 die Seite, die den Stempel OBEN hält: die Kolbenstangenseite.']);
        return;
      }
      if (!((A === '4' && B === '2') && new Set([S1, S2]).has('3') && new Set([S1, S2]).has('5'))) { Game.mistake(); fb(p, 'So stimmt die Verschlauchung nicht. Arbeitsanschlüsse sind 2 und 4, Entlüftungen 3 und 5.'); return; }
      const zh = (p.querySelector('input[name=zh]:checked') || {}).value;
      if (!zh) { fb(p, 'Welches Ventil für die Zweihandsteuerung?'); return; }
      if (zh === 'w') { Game.mistake(); fb(p, 'Ein Wechselventil ist ein ODER: Dann reicht EIN Taster – und die andere Hand ist vielleicht gerade unter dem Stempel. Zweihand heißt UND!'); return; }
      if (zh === 'd') { Game.mistake(); fb(p, 'Ein Drosselrückschlagventil regelt die Geschwindigkeit, aber es verknüpft keine Signale.'); return; }
      const b = +bar.value;
      if (b < 5.5) { Game.mistake(); fb(p, `Mit ${b.toString().replace('.', ',')} bar drückt der Stempel zu schwach – die Gehäuse werden nicht sauber geprägt.`); return; }
      if (b > 6.5) { Game.mistake(); Snd.play('hiss'); fb(p, `Bei ${b.toString().replace('.', ',')} bar zischt das Sicherheitsventil. Über dem zulässigen Betriebsdruck!`); return; }
      Game.closeModal(true);
      Game.take('schlauch');
      Snd.play('hiss');
      Game.say(['Du schaltest die Druckluft auf. Kurzes Zischen – dann ist alles dicht.', 'Linker Taster: nichts. Rechter Taster: nichts. Beide zusammen: WUMMS. Der Stempel fährt herunter und federt sauber zurück.', 'Zweidruckventil = UND. So bleiben beide Hände außerhalb der Gefahrenzone.'], () => Game.fix('presse'));
    };
  },

  // ---------------------------------------------------------------
  // 7) LED-Vorwiderstand (LF3)
  // ---------------------------------------------------------------
  widerstand() {
    const C = { schwarz: '#000', braun: '#6b3b1a', rot: '#c22', orange: '#e67a00', gelb: '#e6d200', violett: '#839', gold: '#c9a227' };
    const opts = shuffle([
      { id: 'a', b: ['braun', 'braun', 'braun'], r: 110 },
      { id: 'b', b: ['braun', 'braun', 'rot'], r: 1100 },
      { id: 'c', b: ['braun', 'braun', 'orange'], r: 11000 },
      { id: 'd', b: ['braun', 'schwarz', 'rot'], r: 1000 },
      { id: 'e', b: ['gelb', 'violett', 'braun'], r: 470 },
    ]);
    const res = o => `<svg viewBox="0 0 120 30" class="res"><line x1="0" y1="15" x2="120" y2="15" stroke="#aaa" stroke-width="2"/><rect x="30" y="6" width="60" height="18" rx="7" fill="#d8c49a"/>
      ${o.b.map((c, i) => `<rect x="${38 + i * 9}" y="6" width="5" height="18" fill="${C[c]}"/>`).join('')}<rect x="78" y="6" width="5" height="18" fill="${C.gold}"/></svg>`;
    const p = Game.modal(`<h2>Meldeleuchte „BEREIT“ – Vorwiderstand</h2>
      <svg viewBox="0 0 300 90" class="fig">
        <text x="20" y="20" class="small">+24 V DC</text><line x1="20" y1="28" x2="80" y2="28" class="pipe"/>
        <rect x="80" y="20" width="50" height="16" class="body"/><text x="105" y="14" class="small">R<tspan font-size="6">V</tspan> = ?</text>
        <line x1="130" y1="28" x2="170" y2="28" class="pipe"/><polygon points="170,18 170,38 190,28" class="led"/><line x1="190" y1="18" x2="190" y2="38" class="pipe"/>
        <text x="180" y="54" class="small">LED: U<tspan font-size="6">F</tspan> = 2,0 V · I<tspan font-size="6">F</tspan> = 20 mA</text>
        <line x1="190" y1="28" x2="260" y2="28" class="pipe"/><text x="270" y="31" class="small">0 V</text>
      </svg>
      <div class="step"><label>1. Vorwiderstand berechnen: &nbsp; R<sub>V</sub> = <input class="inp" id="R" size="7"> Ω</label></div>
      <div class="step"><p>2. Welchen Widerstand aus der Schachtel lötest du ein? <small>(Farbcode-Aufkleber an der Schranktür!)</small></p>
        <div class="resgrid">${opts.map(o => `<button class="resbtn" data-id="${o.id}">${res(o)}</button>`).join('')}</div></div>
      <div class="fb"></div>`);
    p.querySelectorAll('.resbtn').forEach(btn => btn.onclick = () => {
      const R = num(p.querySelector('#R').value);
      if (!(R >= 1090 && R <= 1110)) { Game.mistake(); fb(p, isNaN(R) ? 'Erst rechnen: Welche Spannung bleibt für den Widerstand übrig?' : `R = ${R} Ω? Tipp: U<sub>R</sub> = U<sub>ges</sub> − U<sub>F</sub>, dann R = U<sub>R</sub> / I.`); return; }
      const o = opts.find(x => x.id === btn.dataset.id);
      if (o.r !== 1100) {
        Game.mistake();
        const I = Math.round(22 / o.r * 1000);
        fb(p, `Dieser Widerstand hat ${o.r >= 1000 ? (o.r / 1000).toString().replace('.', ',') + ' kΩ' : o.r + ' Ω'} (${o.b.join('-')}). Damit flössen ca. ${I} mA durch die LED – ` + (I > 20 ? 'viel zu viel, PLOPP, die LED wäre sofort durchgebrannt.' : 'zu wenig, sie würde kaum glimmen.'));
        return;
      }
      Game.closeModal(true);
      Snd.play('ok');
      Game.say(['U<sub>R</sub> = 24 V − 2 V = 22 V;  R = 22 V / 0,02 A = 1100 Ω = 1,1 kΩ  →  braun-braun-rot.', 'Du klemmst den 1,1-kΩ-Widerstand anstelle des verkohlten auf die Klemmleiste.', 'Wenn der Hauptschalter wieder an ist, sollte die Meldeleuchte grün leuchten.'], () => Game.fix('meldung'));
    });
  },

  // ---------------------------------------------------------------
  // 8) Messschieber ablesen (LF2) – Code fürs Büro
  // ---------------------------------------------------------------
  messschieber() {
    const px = 10, x0 = 20, val = 27.4;
    let main = '', vern = '';
    for (let mm = 0; mm <= 50; mm++) {
      const x = x0 + mm * px, h = mm % 10 === 0 ? 18 : mm % 5 === 0 ? 13 : 9;
      main += `<line x1="${x}" y1="40" x2="${x}" y2="${40 + h}" />`;
      if (mm % 10 === 0) main += `<text x="${x}" y="34">${mm}</text>`;
    }
    for (let k = 0; k <= 10; k++) {
      const x = x0 + (val + k * 0.9) * px, h = k % 5 === 0 ? 16 : 10;
      vern += `<line x1="${x}" y1="${78 - h}" x2="${x}" y2="78" />`;
      if (k % 5 === 0) vern += `<text x="${x}" y="90">${k}</text>`;
    }
    const jaw = x0 + val * px;
    const p = Game.modal(`<h2>Prüfstück mit Messschieber</h2>
      <p class="note">Am Messschieber klebt ein Zettel in Brandls Schrift: „Büro-Code = dieses Maß in Zehntelmillimetern, ohne Komma.“</p>
      <svg viewBox="0 0 540 130" class="fig caliper">
        <rect x="0" y="22" width="540" height="40" class="beam"/>
        <rect x="${jaw - 20}" y="58" width="${10 * px + 30}" height="38" class="slider"/>
        <rect x="0" y="62" width="14" height="60" class="jaw"/><rect x="${jaw - 4}" y="96" width="14" height="26" class="jaw2"/>
        <rect x="14" y="100" width="${jaw - 18}" height="16" class="work"/>
        <g class="mscale">${main}</g><g class="vscale">${vern}</g>
        <text x="500" y="16" class="small">Hauptskala in mm</text><text x="${jaw + 50}" y="126" class="small">Nonius (1/10 mm)</text>
      </svg>
      <div class="step"><label>Abgelesener Wert: <input class="inp" id="mv" size="6"> mm</label> <button class="btn small go">Prüfen</button></div>
      <div class="fb"></div>`, { cls: 'wide' });
    p.querySelector('.go').onclick = () => {
      const v = num(p.querySelector('#mv').value);
      if (Math.abs(v - 27.4) < 0.001) { Game.set('codeKnown'); fb(p, 'Richtig: 27 mm + 4 × 0,1 mm = <b>27,4 mm</b>. Der Code fürs Meisterbüro lautet also <b>274</b>.', true); }
      else { Game.mistake(); fb(p, isNaN(v) ? 'Gib den Messwert in mm ein, z. B. 12,7.' : `${p.querySelector('#mv').value} mm stimmt nicht. Nullstrich des Nonius → ganze mm; fluchtender Noniusstrich → Zehntel.`); }
    };
  },

  // ---------------------------------------------------------------
  // 9) Zahlenschloss Meisterbüro
  // ---------------------------------------------------------------
  keypad() {
    let code = '';
    const p = Game.modal(`<h2>Meisterbüro – Zahlenschloss</h2>
      <p class="note">Auf einem Klebezettel: „Code = Ist-Maß des Prüfstücks (Werkstatt) in 1/10 mm. – B.“</p>
      <div class="keypad"><div class="disp">___</div>${[1, 2, 3, 4, 5, 6, 7, 8, 9, 'C', 0, 'OK'].map(k => `<button class="key" data-k="${k}">${k}</button>`).join('')}</div>
      <div class="fb"></div>`, { cls: 'narrow' });
    const disp = p.querySelector('.disp');
    const show = () => disp.textContent = (code + '___').slice(0, 3);
    const press = k => {
      Snd.play('select');
      if (k === 'C') code = '';
      else if (k === 'OK') {
        if (code === '274') {
          Game.closeModal(true); Game.set('officeOpen'); Snd.play('ok');
          Game.say('Grünes Licht. Das Schloss schnappt auf.', () => Game.goto('buero', 0.06, 0.26, 'R'));
          return;
        }
        Game.mistake(); Snd.play('err'); fb(p, 'Rotes Licht. Falscher Code.'); code = '';
      } else if (code.length < 3) code += k;
      show();
    };
    p.querySelectorAll('.key').forEach(b => b.onclick = () => press(b.dataset.k));
    p.tabIndex = -1; p.focus();
    p.onkeydown = e => { if (/^\d$/.test(e.key)) press(e.key); if (e.key === 'Enter') press('OK'); if (e.key === 'Backspace') press('C'); };
  },

  // ---------------------------------------------------------------
  // 10) Steuerungslogik mit Selbsthaltung (LF4)
  // ---------------------------------------------------------------
  logik() {
    const opts = { g1: ['UND', 'ODER'], g2: ['DIREKT', 'NICHT'], g3: ['UND', 'ODER'] };
    const sym = { UND: '&', ODER: '≥1', NICHT: '1', DIREKT: '=' };
    const g = { g1: 'UND', g2: 'DIREKT', g3: 'ODER' };
    const inp = { S1: 0, B1: 1, S0: 0 };
    let Q = 0;
    const evalQ = (s1, k1, b1, s0) => {
      const a = g.g1 === 'UND' ? (s1 && k1) : (s1 || k1);
      const n = g.g2 === 'NICHT' ? !s0 : !!s0;
      return +(g.g3 === 'UND' ? (a && b1 && n) : (a || b1 || n));
    };
    const p = Game.modal(`<h2>Kleinsteuerung FB-01 – Freigabelogik</h2>
      <p class="note">Klicke auf die Bausteine, um ihre Funktion zu ändern. Rechts kannst du live testen. (Funktionsbeschreibung: Dokument „Rückseite Schaltplan“.)</p>
      <div class="cols"><svg viewBox="0 0 300 170" class="fig logic">
        <text x="10" y="34">S1 Start</text><line x1="55" y1="30" x2="100" y2="30"/>
        <text x="10" y="64">K1 (Q1)</text><line x1="55" y1="60" x2="100" y2="60"/>
        <path d="M278 85 L292 85 L292 160 L82 160 L82 60" class="fbk"/>
        <text x="10" y="104">B1 Tür zu</text><line x1="55" y1="100" x2="190" y2="100"/>
        <text x="10" y="134">S0 Not-Halt</text><line x1="55" y1="130" x2="100" y2="130"/>
        <g class="gate" data-g="g1"><rect x="100" y="18" width="50" height="54"/><text x="125" y="50" class="gt"></text></g>
        <g class="gate" data-g="g2"><rect x="100" y="115" width="50" height="30"/><text x="125" y="135" class="gt"></text><circle cx="153" cy="130" r="3" class="negc"/></g>
        <line x1="150" y1="45" x2="190" y2="45"/><line x1="156" y1="130" x2="170" y2="130"/><line x1="170" y1="130" x2="170" y2="118"/><line x1="170" y1="118" x2="190" y2="118"/>
        <g class="gate" data-g="g3"><rect x="190" y="35" width="50" height="95"/><text x="215" y="88" class="gt"></text></g>
        <line x1="240" y1="85" x2="262" y2="85"/><circle cx="270" cy="85" r="8" class="lamp"/><text x="270" y="70">Q1</text>
      </svg>
      <div class="side">
        <p><b>Live-Test</b></p>
        <button class="btn tgl" data-k="S1">S1 Start (Taster)</button>
        <button class="btn tgl" data-k="B1">B1 Tür</button>
        <button class="btn tgl" data-k="S0">S0 Not-Halt</button>
        <p>Band Q1: <b class="qv">AUS</b></p>
      </div></div>
      <div class="fb"></div>
      <div class="row"><button class="btn go">Programm übertragen &amp; prüfen</button></div>`, { cls: 'wide' });
    const render = () => {
      p.querySelectorAll('.gate').forEach(el => { el.querySelector('.gt').textContent = sym[g[el.dataset.g]]; const nc = el.querySelector('.negc'); if (nc) nc.style.display = g[el.dataset.g] === 'NICHT' ? '' : 'none'; });
      p.querySelector('[data-k=S1]').textContent = 'S1 Start: ' + (inp.S1 ? 'GEDRÜCKT' : 'los');
      p.querySelector('[data-k=B1]').textContent = 'B1 Tür: ' + (inp.B1 ? 'ZU' : 'OFFEN');
      p.querySelector('[data-k=S0]').textContent = 'S0 Not-Halt: ' + (inp.S0 ? 'BETÄTIGT' : 'frei');
      Q = evalQ(inp.S1, Q, inp.B1, inp.S0);
      Q = evalQ(inp.S1, Q, inp.B1, inp.S0);
      p.querySelector('.qv').textContent = Q ? 'LÄUFT' : 'AUS';
      p.querySelector('.lamp').classList.toggle('on', !!Q);
      p.querySelector('.fbk').classList.toggle('on', !!Q);
    };
    p.querySelectorAll('.gate').forEach(el => el.onclick = () => { const k = el.dataset.g, o = opts[k]; g[k] = o[(o.indexOf(g[k]) + 1) % o.length]; Q = 0; Snd.play('select'); render(); });
    p.querySelectorAll('.tgl').forEach(b => b.onclick = () => { const k = b.dataset.k; inp[k] = inp[k] ? 0 : 1; Snd.play('select'); render(); });
    render();
    p.querySelector('.go').onclick = () => {
      const tests = [
        { s1: 1, b1: 1, s0: 0, want: 1, t: 'START drücken (Tür zu)' },
        { s1: 0, b1: 1, s0: 0, want: 1, t: 'START loslassen → Band läuft weiter' },
        { s1: 0, b1: 1, s0: 1, want: 0, t: 'NOT-HALT drücken → Band steht' },
        { s1: 0, b1: 1, s0: 0, want: 0, t: 'NOT-HALT entriegeln → kein Selbstanlauf' },
        { s1: 1, b1: 0, s0: 0, want: 0, t: 'START bei offener Tür → kein Anlauf' },
        { s1: 1, b1: 1, s0: 0, want: 1, t: 'START (Tür zu)' },
        { s1: 0, b1: 0, s0: 0, want: 0, t: 'Tür im Betrieb öffnen → Band steht' },
      ];
      let q = 0, allOk = true;
      const rows = tests.map(tc => { q = evalQ(tc.s1, q, tc.b1, tc.s0); q = evalQ(tc.s1, q, tc.b1, tc.s0); const ok = q === tc.want; if (!ok) allOk = false; return `<tr class="${ok ? 'ok' : 'no'}"><td>${tc.t}</td><td>${q ? 'läuft' : 'steht'}</td><td>${ok ? '✔' : '✘'}</td></tr>`; });
      if (!allOk) { Game.mistake(); fb(p, `<table class="tb">${rows.join('')}</table>Das Programm erfüllt die Funktionsbeschreibung noch nicht.`); return; }
      Game.closeModal(true);
      Game.take('schaltplan');
      Snd.play('ok');
      Game.say(['Q1 = (S1 ODER K1) UND B1 UND NICHT S0.', 'Das Display springt von „ERR“ auf „RUN“. Alle Testfälle bestanden: Selbsthaltung, Tür-Überwachung, Not-Halt ohne Wiederanlauf.'], () => Game.fix('steuerung'));
    };
  },
};
