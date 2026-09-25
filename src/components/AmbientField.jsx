import React, { useEffect, useRef, useState } from 'react';

// One small, capped canvas shared by every page. Nothing updates React per frame.
export default function AmbientField() {
  const canvas = useRef(null), [paused, setPaused] = useState(false);
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
      const glow = context.createRadialGradient(pointer.x * width, pointer.y * height, 0, pointer.x * width, pointer.y * height, width * .6);
      glow.addColorStop(0, 'rgba(130,177,111,.07)'); glow.addColorStop(1, 'rgba(130,177,111,0)');
      context.fillStyle = glow; context.fillRect(0, 0, width, height);
      const positions = points.slice(0, width < 600 ? 18 : 36).map((point, i) => ({ x: point.x * width + Math.sin(time * .12 + i) * 20, y: point.y * height + Math.cos(time * .1 + i) * 18 }));
      positions.forEach((point, i) => {
        context.fillStyle = 'rgba(199,231,175,.3)'; context.beginPath(); context.arc(point.x, point.y, 1.2, 0, Math.PI * 2); context.fill();
        positions.slice(i + 1).forEach(other => {
          const distance = Math.hypot(point.x - other.x, point.y - other.y);
          if (distance > 155) return;
          context.strokeStyle = `rgba(177,211,158,${(1 - distance / 155) * .12})`;
          context.beginPath(); context.moveTo(point.x, point.y); context.lineTo(other.x, other.y); context.stroke();
        });
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
