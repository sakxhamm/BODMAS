/**
 * Background: pseudo-3D "math rain" — symbols fall with depth, drift, and soft motion.
 * pointer-events: none; does not affect gameplay.
 */
(function initMathRain() {
  const canvas = document.getElementById("math-rain-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const SYMBOLS = "0123456789+-×÷=()%π√∑∞±·";
  const COLORS = [
    "rgba(147, 197, 253, ",
    "rgba(167, 139, 250, ",
    "rgba(56, 189, 248, ",
    "rgba(244, 244, 255, "
  ];

  let w = 0;
  let h = 0;
  let dpr = 1;
  let particles = [];
  let raf = 0;
  let running = true;

  const MAX_PARTICLES = 110;

  function rand(min, max) {
    return min + Math.random() * (max - min);
  }

  function pickChar() {
    return SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
  }

  function spawnParticle(initialY) {
    const depth = rand(0.15, 1);
    const scale = 0.35 + depth * 0.85;
    return {
      x: rand(-w * 0.05, w * 1.05),
      y: initialY !== undefined ? initialY : rand(-h, 0),
      char: pickChar(),
      vy: rand(0.55, 2.4) * (0.4 + depth * 0.9),
      vx: rand(0.15, 1.35) + depth * 0.4,
      driftPhase: rand(0, Math.PI * 2),
      driftAmp: rand(8, 38) * (0.5 + depth),
      rot: rand(0, Math.PI * 2),
      rotSpeed: rand(-0.012, 0.012),
      depth,
      scale,
      opacity: rand(0.12, 0.42) * (0.5 + depth * 0.5),
      colorIdx: Math.floor(Math.random() * COLORS.length),
      fontBase: rand(11, 26)
    };
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const target = Math.min(MAX_PARTICLES, Math.floor((w * h) / 12000));
    while (particles.length < target) particles.push(spawnParticle(rand(-h, h * 0.5)));
    while (particles.length > target) particles.pop();
  }

  function drawParticle(p) {
    const fontSize = p.fontBase * p.scale;
    const alpha = p.opacity * (0.55 + p.depth * 0.45);
    ctx.save();
    const sway = Math.sin(p.driftPhase + p.y * 0.008) * (p.driftAmp * 0.02);
    const x = p.x + sway;
    const y = p.y;
    ctx.translate(x, y);
    ctx.rotate(p.rot);
    const skew = (1 - p.depth) * 0.12;
    ctx.transform(1, skew, -skew * 0.35, 1, 0, 0);
    ctx.font = `600 ${fontSize}px Poppins, "Segoe UI", system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = `${COLORS[p.colorIdx]}${alpha})`;
    if (p.depth > 0.65) {
      ctx.shadowColor = "rgba(56, 189, 248, 0.35)";
      ctx.shadowBlur = 8 * p.depth;
    } else {
      ctx.shadowBlur = 0;
    }
    ctx.fillText(p.char, 0, 0);
    ctx.restore();
  }

  function tick() {
    if (!running) return;
    ctx.clearRect(0, 0, w, h);

    for (let i = 0; i < particles.length; i += 1) {
      const p = particles[i];
      p.y += p.vy;
      p.x += p.vx * 0.35 + Math.sin(p.driftPhase + p.y * 0.01) * 0.25;
      p.rot += p.rotSpeed * (0.6 + p.depth);
      p.driftPhase += 0.012;

      if (p.y > h + 40 || p.x > w + 60) {
        particles[i] = spawnParticle(rand(-120, -10));
        continue;
      }

      drawParticle(p);
    }

    raf = requestAnimationFrame(tick);
  }

  function onVisibility() {
    if (document.hidden) {
      running = false;
      cancelAnimationFrame(raf);
    } else {
      running = true;
      raf = requestAnimationFrame(tick);
    }
  }

  window.addEventListener("resize", () => {
    resize();
  });
  document.addEventListener("visibilitychange", onVisibility);

  resize();
  raf = requestAnimationFrame(tick);
})();
