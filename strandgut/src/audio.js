// Prozeduraler Sound über WebAudio – keine Audiodateien nötig
export class Audio {
  constructor() { this.ctx = null; this.muted = false; this.vol = 0.8; }

  init() {
    if (this.ctx) { this.ctx.resume(); return; }
    const C = window.AudioContext || window.webkitAudioContext;
    if (!C) return;
    const ctx = this.ctx = new C();
    this.master = ctx.createGain(); this.master.gain.value = this.muted ? 0 : this.vol; this.master.connect(ctx.destination);
    const len = ctx.sampleRate * 3, buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
    let b = 0; for (let i = 0; i < len; i++) { const w = Math.random() * 2 - 1; b = (b + 0.02 * w) / 1.02; d[i] = w * 0.5 + b * 4; }
    this.noise = buf;
    const loop = (filterType, freq, q, gain) => {
      const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
      const f = ctx.createBiquadFilter(); f.type = filterType; f.frequency.value = freq; f.Q.value = q;
      const g = ctx.createGain(); g.gain.value = gain;
      src.connect(f); f.connect(g); g.connect(this.master); src.start();
      return { f, g };
    };
    this.surf = loop('lowpass', 500, 0.7, 0);
    this.wind = loop('bandpass', 700, 0.6, 0);
    this.rain = loop('highpass', 2500, 0.5, 0);
    this.fire = loop('bandpass', 1800, 3, 0);
    this.room = loop('lowpass', 160, 1, 0);
    // Motorbrummen
    const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = 60;
    const of = ctx.createBiquadFilter(); of.type = 'lowpass'; of.frequency.value = 400;
    const og = ctx.createGain(); og.gain.value = 0;
    o.connect(of); of.connect(og); og.connect(this.master); o.start();
    this.motor = { o, g: og };
    // Musik: ruhige Flächenklänge
    this.music = ctx.createGain(); this.music.gain.value = 0.0; this.music.connect(this.master);
    this._chord = 0; this._nextChord = 0;
  }

  setMuted(m) { this.muted = m; if (this.master) this.master.gain.value = m ? 0 : this.vol; }

  update(dt, s) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime, k = 0.15;
    const surfAmt = s.indoor ? 0.03 : Math.max(0, 1 - s.distSea / 60) * 0.35 + 0.06;
    this.surf.g.gain.setTargetAtTime(surfAmt * (0.7 + 0.3 * Math.sin(t * 0.45)) * (1 + s.storm), t, 0.3);
    this.surf.f.frequency.setTargetAtTime(380 + Math.sin(t * 0.45) * 160 + s.storm * 300, t, 0.3);
    this.wind.g.gain.setTargetAtTime((s.indoor ? 0.02 : 0.05 + s.storm * 0.4) * (0.7 + 0.3 * Math.sin(t * 0.21)), t, 0.5);
    this.wind.f.frequency.setTargetAtTime(500 + s.storm * 600 + Math.sin(t * 0.33) * 200, t, 0.5);
    this.rain.g.gain.setTargetAtTime(s.indoor ? s.storm * 0.03 : Math.max(0, s.storm - 0.35) * 0.35, t, 0.5);
    this.fire.g.gain.setTargetAtTime(s.fireNear ? 0.06 * (0.6 + Math.random() * 0.8) : 0, t, 0.05);
    this.room.g.gain.setTargetAtTime(s.indoor ? 0.25 : 0, t, 0.5);
    this.motor.g.gain.setTargetAtTime(s.motor > 0 ? 0.05 + s.motor * 0.06 : 0, t, 0.2);
    this.motor.o.frequency.setTargetAtTime(55 + s.motor * 90, t, 0.2);
    // Musik
    this.music.gain.setTargetAtTime(s.musicOn ? 0.05 : 0, t, 2);
    if (s.musicOn && t > this._nextChord) this._playChord(t);
  }

  _playChord(t) {
    const chords = [[57, 64, 69, 72], [53, 60, 65, 69], [55, 62, 67, 71], [52, 59, 64, 67]];
    const c = chords[this._chord++ % chords.length];
    for (const n of c) {
      const o = this.ctx.createOscillator(); o.type = 'triangle';
      o.frequency.value = 440 * Math.pow(2, (n - 69) / 12);
      const g = this.ctx.createGain(); g.gain.value = 0;
      g.gain.setTargetAtTime(0.18, t, 1.5); g.gain.setTargetAtTime(0, t + 6, 1.8);
      o.connect(g); g.connect(this.music); o.start(t); o.stop(t + 12);
    }
    this._nextChord = t + 8;
  }

  sfx(name) {
    if (!this.ctx || this.muted) return;
    const ctx = this.ctx, t = ctx.currentTime;
    const burst = (dur, type, freq, q, gain, attack = 0.005) => {
      const src = ctx.createBufferSource(); src.buffer = this.noise;
      const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
      const g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(gain, t + attack); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      src.connect(f); f.connect(g); g.connect(this.master); src.start(t, Math.random() * 2); src.stop(t + dur + 0.05);
      return f;
    };
    const tone = (freq, dur, type = 'sine', gain = 0.15, delay = 0) => {
      const o = ctx.createOscillator(); o.type = type; o.frequency.value = freq;
      const g = ctx.createGain(); g.gain.setValueAtTime(0, t + delay); g.gain.linearRampToValueAtTime(gain, t + delay + 0.01); g.gain.exponentialRampToValueAtTime(0.001, t + delay + dur);
      o.connect(g); g.connect(this.master); o.start(t + delay); o.stop(t + delay + dur + 0.05);
      return o;
    };
    switch (name) {
      case 'step': burst(0.12, 'bandpass', 900 + Math.random() * 500, 1.2, 0.07); break;
      case 'stepWater': burst(0.25, 'bandpass', 1400, 0.8, 0.09, 0.03); break;
      case 'stepMetal': burst(0.1, 'bandpass', 2500, 5, 0.05); tone(180 + Math.random() * 40, 0.12, 'triangle', 0.03); break;
      case 'pickup': tone(660, 0.12, 'triangle', 0.12); tone(990, 0.18, 'triangle', 0.1, 0.08); break;
      case 'ok': tone(523, 0.15, 'triangle', 0.14); tone(659, 0.15, 'triangle', 0.14, 0.1); tone(784, 0.3, 'triangle', 0.14, 0.2); break;
      case 'err': tone(180, 0.25, 'square', 0.06); tone(140, 0.3, 'square', 0.06, 0.12); break;
      case 'click': tone(1200, 0.04, 'square', 0.03); break;
      case 'solve': [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.5, 'triangle', 0.12, i * 0.11)); break;
      case 'radio': burst(0.35, 'bandpass', 2200, 0.7, 0.12); tone(1000, 0.08, 'sine', 0.05, 0.3); break;
      case 'thunder': { const f = burst(4, 'lowpass', 220, 0.5, 0.9, 0.05); f.frequency.setValueAtTime(400, t); f.frequency.exponentialRampToValueAtTime(80, t + 3); break; }
      case 'door': burst(0.8, 'lowpass', 300, 2, 0.4, 0.05); tone(70, 0.8, 'sawtooth', 0.05); break;
      case 'metal': burst(0.5, 'bandpass', 1800, 8, 0.2); tone(420, 0.6, 'triangle', 0.05); break;
      case 'build': for (let i = 0; i < 5; i++) { tone(300 + Math.random() * 200, 0.08, 'square', 0.03, i * 0.18); } break;
      case 'drink': for (let i = 0; i < 4; i++) tone(500 + i * 60, 0.08, 'sine', 0.06, i * 0.12); break;
      case 'eat': burst(0.2, 'bandpass', 1500, 2, 0.1); burst(0.2, 'bandpass', 1200, 2, 0.1); break;
      case 'splash': burst(0.6, 'bandpass', 900, 0.6, 0.25, 0.02); break;
      case 'horn': { const o = tone(98, 3.5, 'sawtooth', 0.12); const o2 = tone(131, 3.5, 'sawtooth', 0.08); o.frequency.setValueAtTime(98, t); o2.frequency.setValueAtTime(131, t); break; }
      case 'spark': burst(0.3, 'highpass', 4000, 1, 0.3); break;
    }
  }
}
