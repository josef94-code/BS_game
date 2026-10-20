'use strict';
// ------------------------------------------------------------
//  Prozeduraler Sound (WebAudio) – keine Audiodateien nötig
// ------------------------------------------------------------
const Snd = (() => {
  let ctx = null, master = null, muted = false, noiseBuf = null;
  let droneGain = null, humGain = null, humOsc = null;

  function init() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
    master = ctx.createGain(); master.gain.value = muted ? 0 : 0.7; master.connect(ctx.destination);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    startDrone();
  }

  function startDrone() {
    droneGain = ctx.createGain(); droneGain.gain.value = 0; droneGain.connect(master);
    const n = ctx.createBufferSource(); n.buffer = noiseBuf; n.loop = true;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 140;
    const ng = ctx.createGain(); ng.gain.value = 0.6; n.connect(lp); lp.connect(ng); ng.connect(droneGain); n.start();
    const lfo = ctx.createOscillator(); lfo.frequency.value = 0.06;
    const lg = ctx.createGain(); lg.gain.value = 70; lfo.connect(lg); lg.connect(lp.frequency); lfo.start();
    const o1 = ctx.createOscillator(); o1.type = 'sine'; o1.frequency.value = 41.2;
    const g1 = ctx.createGain(); g1.gain.value = 0.35; o1.connect(g1); g1.connect(droneGain); o1.start();
    const o2 = ctx.createOscillator(); o2.type = 'triangle'; o2.frequency.value = 61.7; o2.detune.value = -18;
    const g2 = ctx.createGain(); g2.gain.value = 0.08; o2.connect(g2); g2.connect(droneGain); o2.start();
    droneGain.gain.linearRampToValueAtTime(0.45, ctx.currentTime + 4);
    // Maschinenbrummen (wird mit dem Fortschritt lauter)
    humOsc = ctx.createOscillator(); humOsc.type = 'sawtooth'; humOsc.frequency.value = 100;
    const hl = ctx.createBiquadFilter(); hl.type = 'lowpass'; hl.frequency.value = 260;
    humGain = ctx.createGain(); humGain.gain.value = 0;
    humOsc.connect(hl); hl.connect(humGain); humGain.connect(master); humOsc.start();
  }

  function setMood(r, running) {
    if (!ctx) return;
    const t = ctx.currentTime;
    humGain.gain.setTargetAtTime(running ? 0.06 : r * 0.018, t, 1.5);
    droneGain.gain.setTargetAtTime(0.45 * (1 - r * 0.75), t, 2);
  }

  function noise(dur, freq, q, vol, type, when, sweepTo) {
    const t = ctx.currentTime + (when || 0);
    const s = ctx.createBufferSource(); s.buffer = noiseBuf;
    const f = ctx.createBiquadFilter(); f.type = type || 'bandpass'; f.frequency.setValueAtTime(freq, t); f.Q.value = q;
    if (sweepTo) f.frequency.exponentialRampToValueAtTime(sweepTo, t + dur);
    const g = ctx.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    s.connect(f); f.connect(g); g.connect(master);
    s.start(t, Math.random()); s.stop(t + dur + 0.05);
  }
  function tone(freq, dur, type, vol, when, slideTo, attack) {
    const t = ctx.currentTime + (when || 0);
    const o = ctx.createOscillator(); o.type = type || 'sine'; o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + (attack || 0.01));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.05);
  }

  const sfx = {
    step() { noise(0.07, 160 + Math.random() * 90, 1.4, 0.22, 'bandpass'); },
    clank() { const f = 700 + Math.random() * 900; noise(0.9, f, 25, 0.25); noise(0.6, f * 1.47, 30, 0.12); tone(f / 4, 0.4, 'triangle', 0.05); },
    drip() { tone(1500 + Math.random() * 500, 0.12, 'sine', 0.05, 0, 500); },
    creak() { tone(70, 1.2, 'sawtooth', 0.03, 0, 95, 0.3); noise(1.2, 900, 12, 0.05, 'bandpass', 0, 600); },
    pickup() { [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.25, 'square', 0.05, i * 0.07)); },
    door() {
      tone(55, 1.4, 'sawtooth', 0.05, 0, 80, 0.4);
      noise(1.3, 700, 10, 0.09, 'bandpass', 0, 420);
      noise(0.35, 120, 1, 0.5, 'lowpass', 1.35);
    },
    zap() { noise(0.5, 3000, 0.7, 0.4, 'highpass'); tone(60, 0.5, 'square', 0.15); tone(120, 0.4, 'sawtooth', 0.08); },
    ok() { tone(660, 0.18, 'square', 0.06); tone(990, 0.35, 'square', 0.06, 0.12); },
    fix() { [392, 523, 659, 784, 1046].forEach((f, i) => tone(f, 0.5, 'triangle', 0.08, i * 0.09)); },
    err() { tone(110, 0.35, 'square', 0.08); tone(104, 0.35, 'square', 0.06); },
    select() { tone(1200, 0.04, 'square', 0.03); },
    hurt() { noise(0.25, 300, 2, 0.4, 'lowpass'); tone(90, 0.4, 'sawtooth', 0.12, 0, 50); },
    sting() { [233, 247, 349].forEach(f => tone(f, 2.2, 'sawtooth', 0.025, 0, f * 0.97, 0.05)); noise(1.8, 400, 3, 0.06, 'bandpass', 0, 180); },
    whoosh() { noise(0.5, 400, 1, 0.3, 'bandpass', 0, 3000); },
    machine() { tone(40, 2.5, 'sawtooth', 0.08, 0, 100, 0.5); noise(2.5, 200, 2, 0.15, 'lowpass', 0, 900); },
    type() { noise(0.03, 2500, 3, 0.05, 'bandpass'); },
    heartbeat() { tone(60, 0.15, 'sine', 0.25); tone(55, 0.15, 'sine', 0.2, 0.2); },
    breaker() { noise(0.08, 2000, 2, 0.4, 'bandpass'); tone(300, 0.05, 'square', 0.05); },
    hiss() { noise(1.2, 5000, 0.5, 0.25, 'highpass'); },
    rat() { for (let i = 0; i < 4; i++) tone(3000 + Math.random() * 1500, 0.05, 'square', 0.015, i * 0.09); },
  };

  return {
    init,
    setMood,
    play(name) { if (ctx && !muted && sfx[name]) try { sfx[name](); } catch (e) { /* ignorieren */ } },
    toggleMute() { muted = !muted; if (master) master.gain.value = muted ? 0 : 0.7; return muted; },
    get muted() { return muted; },
  };
})();
