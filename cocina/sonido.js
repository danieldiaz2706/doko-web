/* ==========================================================================
   DOKO Cocina — Aviso sonoro
   La misma campanita de dos notas (sol → do) de siempre, pero al volumen
   máximo y con un armónico para que se oiga por encima del ruido de la cocina.
   Un compresor la deja lo más fuerte posible sin que se distorsione.
   ========================================================================== */

// Salida con compresor/limitador: permite subir el volumen sin que "rasque"
export function crearSalida(ctx) {
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -10;
  comp.knee.value = 4;
  comp.ratio.value = 20;
  comp.attack.value = 0.002;
  comp.release.value = 0.15;
  const volumen = ctx.createGain();
  volumen.gain.value = 1.3; // recupera lo que baja el compresor sin pasar del máximo
  comp.connect(volumen).connect(ctx.destination);
  return comp;
}

function nota(ctx, salida, t, frecuencia, duracion) {
  // tono principal + una octava arriba (más presencia, misma melodía)
  for (const [tipo, mult, vol] of [['sine', 1, 1], ['triangle', 2, 0.45]]) {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = tipo;
    o.frequency.value = frecuencia * mult;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.012);
    g.gain.setValueAtTime(vol, t + duracion * 0.55);
    g.gain.exponentialRampToValueAtTime(0.0001, t + duracion);
    o.connect(g).connect(salida);
    o.start(t);
    o.stop(t + duracion + 0.02);
  }
}

// Toca la campanita `veces` veces seguidas. Devuelve cuánto dura en segundos.
export function campanita(ctx, salida, veces = 1, inicio = ctx.currentTime + 0.02) {
  const PASO = 0.72;
  for (let i = 0; i < veces; i++) {
    const t = inicio + i * PASO;
    nota(ctx, salida, t, 784, 0.3); // sol
    nota(ctx, salida, t + 0.28, 1046.5, 0.4); // do
  }
  return veces * PASO;
}
