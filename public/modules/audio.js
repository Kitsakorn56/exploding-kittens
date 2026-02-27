/**
 * audio.js - เสียงและเพลง
 */

let audioCtx = null;

function getAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

function playSound(type) {
  try {
    const ctx = getAudio(), now = ctx.currentTime;
    const osc = ctx.createOscillator(), gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    if (type === 'click') {
      osc.frequency.setValueAtTime(680, now); osc.type = 'sine';
      gain.gain.setValueAtTime(0.12, now); gain.gain.exponentialRampToValueAtTime(0.01, now+0.04);
      osc.start(now); osc.stop(now+0.04);
    } else if (type === 'explode') {
      osc.type = 'sawtooth';
      gain.gain.setValueAtTime(0.3, now); gain.gain.exponentialRampToValueAtTime(0.01, now+0.6);
      osc.frequency.setValueAtTime(200, now); osc.frequency.exponentialRampToValueAtTime(30, now+0.6);
      osc.start(now); osc.stop(now+0.6);
    } else if (type === 'win') {
      [0,0.1,0.2,0.35,0.5].forEach((t,i) => {
        const o2 = ctx.createOscillator(), g2 = ctx.createGain();
        o2.connect(g2); g2.connect(ctx.destination);
        o2.type = 'sine'; o2.frequency.setValueAtTime([523,659,784,1047,1319][i], now+t);
        g2.gain.setValueAtTime(0.22, now+t); g2.gain.exponentialRampToValueAtTime(0.01, now+t+0.28);
        o2.start(now+t); o2.stop(now+t+0.3);
      });
    } else if (type === 'nope') {
      osc.type = 'square';
      gain.gain.setValueAtTime(0.2, now); gain.gain.exponentialRampToValueAtTime(0.01, now+0.15);
      osc.frequency.setValueAtTime(220, now); osc.start(now); osc.stop(now+0.15);
    } else if (type === 'draw') {
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.1, now); gain.gain.exponentialRampToValueAtTime(0.01, now+0.08);
      osc.frequency.setValueAtTime(440, now); osc.start(now); osc.stop(now+0.08);
    } else if (type === 'shuffle') {
      const buf = ctx.createBuffer(1, ctx.sampleRate * 0.4, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (var i = 0; i < data.length; i++) data[i] = (Math.random()*2-1) * Math.pow(1 - i/data.length, 2);
      const src = ctx.createBufferSource(); src.buffer = buf;
      const g2 = ctx.createGain(); g2.gain.setValueAtTime(0.3, now);
      src.connect(g2); g2.connect(ctx.destination);
      src.start(now);
      [261, 329, 392].forEach((freq, idx) => {
        const o2 = ctx.createOscillator(), g3 = ctx.createGain();
        o2.connect(g3); g3.connect(ctx.destination);
        o2.type = 'sine'; o2.frequency.setValueAtTime(freq, now + idx*0.06);
        g3.gain.setValueAtTime(0.12, now+idx*0.06); g3.gain.exponentialRampToValueAtTime(0.01, now+idx*0.06+0.25);
        o2.start(now+idx*0.06); o2.stop(now+idx*0.06+0.3);
      });
    } else if (type === 'steal') {
      [0, 0.08, 0.16].forEach((t, i) => {
        const o2 = ctx.createOscillator(), g2 = ctx.createGain();
        o2.connect(g2); g2.connect(ctx.destination);
        o2.type = 'triangle';
        o2.frequency.setValueAtTime([660, 784, 1047][i], now+t);
        g2.gain.setValueAtTime(0.15, now+t); g2.gain.exponentialRampToValueAtTime(0.01, now+t+0.12);
        o2.start(now+t); o2.stop(now+t+0.15);
      });
    } else if (type === 'attack') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(120, now); osc.frequency.exponentialRampToValueAtTime(40, now+0.3);
      gain.gain.setValueAtTime(0.35, now); gain.gain.exponentialRampToValueAtTime(0.01, now+0.3);
      osc.start(now); osc.stop(now+0.3);
      const o2 = ctx.createOscillator(), g2 = ctx.createGain();
      o2.connect(g2); g2.connect(ctx.destination);
      o2.type = 'sine'; o2.frequency.setValueAtTime(880, now); o2.frequency.exponentialRampToValueAtTime(220, now+0.2);
      g2.gain.setValueAtTime(0.2, now); g2.gain.exponentialRampToValueAtTime(0.01, now+0.2);
      o2.start(now); o2.stop(now+0.2);
    } else if (type === 'skip') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now); osc.frequency.linearRampToValueAtTime(440, now+0.15);
      gain.gain.setValueAtTime(0.15, now); gain.gain.exponentialRampToValueAtTime(0.01, now+0.18);
      osc.start(now); osc.stop(now+0.2);
    } else if (type === 'deal') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600 + Math.random()*200, now);
      gain.gain.setValueAtTime(0.08, now); gain.gain.exponentialRampToValueAtTime(0.001, now+0.06);
      osc.start(now); osc.stop(now+0.07);
    } else if (type === 'turn') {
      [0, 0.12].forEach((t, i) => {
        const o2 = ctx.createOscillator(), g2 = ctx.createGain();
        o2.connect(g2); g2.connect(ctx.destination);
        o2.type = 'sine'; o2.frequency.setValueAtTime([523, 659][i], now+t);
        g2.gain.setValueAtTime(0.12, now+t); g2.gain.exponentialRampToValueAtTime(0.01, now+t+0.15);
        o2.start(now+t); o2.stop(now+t+0.18);
      });
    }
  } catch (e) {}
}
