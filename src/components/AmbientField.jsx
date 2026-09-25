import React, { useEffect, useRef, useState } from 'react';

// One small, capped canvas shared by every page. Nothing updates React per frame.
export default function AmbientField() {
  const canvas = useRef(null), [paused, setPaused] = useState(false);
  useEffect(() => {
    document.documentElement.dataset.ambientPaused = String(paused);
    return () => { delete document.documentElement.dataset.ambientPaused; };
  }, [paused]);
  useEffect(() => {
    try { setPaused(localStorage.getItem('aynko:ambient-paused') === '1'); } catch {}
  }, []);
  useEffect(() => {
    const element = canvas.current, context = element.getContext('2d');
    if (!context) return;
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    const contrast = matchMedia('(forced-colors: active)');
    let frame = 0, width = 0, height = 0, time = 0, last = 0;
    const pointer = { x: .65, y: .3 }, target = { ...pointer };
    const points = Array.from({ length: 36 }, (_, i) => ({ x: ((i * 37 + 13) % 101) / 101, y: ((i * 61 + 7) % 103) / 103 }));
    function paint() {
      context.clearRect(0, 0, width, height);
      // Broad moving light, with a few suspended grains, leaves the typography clear.
      for (let i = 0; i < 3; i++) {
        const x = (i === 0 ? pointer.x : .2 + i * .25 + Math.sin(time * .08 + i * 2) * .22) * width;
        const y = (i === 0 ? pointer.y : .5 + Math.cos(time * .07 + i) * .4) * height;
        const glow = context.createRadialGradient(x, y, 0, x, y, width * (i === 0 ? .55 : .48));
        glow.addColorStop(0, i === 1 ? 'rgba(109,148,164,.055)' : 'rgba(146,183,106,.085)');
        glow.addColorStop(1, 'rgba(130,177,111,0)');
        context.fillStyle = glow; context.fillRect(0, 0, width, height);
      }
      const positions = points.slice(0, width < 600 ? 12 : 26).map((point, i) => ({ x: point.x * width + Math.sin(time * .12 + i) * 28, y: point.y * height + Math.cos(time * .1 + i) * 24 }));
      positions.forEach((point, i) => {
        context.fillStyle = `rgba(199,231,175,${.12 + (Math.sin(time * .45 + i) + 1) * .065})`;
        context.beginPath(); context.arc(point.x, point.y, i % 4 === 0 ? 1.3 : .7, 0, Math.PI * 2); context.fill();
      });
      element.dataset.frame = String(Math.round(time * 1000));
    }
    function tick(now) {
      frame = requestAnimationFrame(tick);
      if (now - last < 32) return;
      time += last ? Math.min((now - last) / 1000, .06) : 0; last = now;
      pointer.x += (target.x - pointer.x) * .035; pointer.y += (target.y - pointer.y) * .035;
      paint();
    }
    function sync() {
      cancelAnimationFrame(frame); last = 0;
      const running = !paused && !motion.matches && !contrast.matches && !document.hidden;
      element.dataset.motion = running ? 'running' : 'paused';
      paint(); if (running) frame = requestAnimationFrame(tick);
    }
    function resize() {
      width = innerWidth; height = innerHeight;
      const ratio = Math.min(devicePixelRatio || 1, 1.5);
      element.width = Math.round(width * ratio); element.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0); paint();
    }
    function move(event) { if (event.pointerType === 'mouse') { target.x = event.clientX / width; target.y = event.clientY / height; } }
    resize(); sync();
    window.addEventListener('resize', resize); window.addEventListener('pointermove', move, { passive: true });
    document.addEventListener('visibilitychange', sync); motion.addEventListener('change', sync); contrast.addEventListener('change', sync);
    return () => {
      cancelAnimationFrame(frame); window.removeEventListener('resize', resize); window.removeEventListener('pointermove', move);
      document.removeEventListener('visibilitychange', sync); motion.removeEventListener('change', sync); contrast.removeEventListener('change', sync);
    };
  }, [paused]);
  return <><canvas ref={canvas} className="ambient-field" aria-hidden="true"/><button className="ambient-toggle" aria-pressed={paused} onClick={() => setPaused(value => { try { localStorage.setItem('aynko:ambient-paused', value ? '0' : '1'); } catch {} return !value; })}>{paused ? 'Resume background motion' : 'Pause background motion'}<span aria-hidden="true">{paused ? '▷' : 'Ⅱ'}</span></button></>;
}
