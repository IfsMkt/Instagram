// Sons curtos e suaves gerados com Web Audio (sem arquivos externos).
let ctx;
function audio() {
  try {
    ctx ||= new (window.AudioContext || window.webkitAudioContext)();
    return ctx;
  } catch {
    return null;
  }
}

function tone(freq, start, dur, gain = 0.06) {
  const a = audio();
  if (!a) return;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = 'sine';
  o.frequency.value = freq;
  g.gain.setValueAtTime(0, a.currentTime + start);
  g.gain.linearRampToValueAtTime(gain, a.currentTime + start + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + start + dur);
  o.connect(g).connect(a.destination);
  o.start(a.currentTime + start);
  o.stop(a.currentTime + start + dur + 0.05);
}

export function playSound(kind, enabled) {
  if (!enabled) return;
  if (kind === 'certo') [523.25, 659.25].forEach((f, i) => tone(f, i * 0.09, 0.25));
  else if (kind === 'errado') tone(330, 0, 0.3, 0.04);
  else if (kind === 'concluiu') [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, i * 0.11, 0.35));
}
