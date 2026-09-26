import React, { useEffect, useRef, useState } from 'react';

export default function Hologram({ active = 'data', action = 0, phase = 'idle', suspended = false, powered = true, prewarm = false, onSettled, interactive = false }) {
  const host = useRef(null), engine = useRef(null), settled = useRef(onSettled);
  const returning = typeof document !== 'undefined' && document.documentElement.classList.contains('intro-seen');
  const initialPower = useRef(powered && (!suspended || returning));
  settled.current = onSettled;
  const [ready, setReady] = useState(false), [paused, setPaused] = useState(false), [reduced, setReduced] = useState(false);
  // Prepare the first GPU frame behind the intro; keep motion off until the reveal.
  const [started, setStarted] = useState(!suspended);
  useEffect(() => { if (!suspended || prewarm) setStarted(true); }, [suspended, prewarm]);
  useEffect(() => {
    const preference = matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(preference.matches);
    update(); preference.addEventListener('change', update);
    return () => preference.removeEventListener('change', update);
  }, []);
  useEffect(() => {
    if (!started || (host.current.closest('.intro-dialog') && document.documentElement.classList.contains('intro-seen'))) return;
    let disposed = false, finished = false;
    const finish = () => { if (!disposed && !finished) { finished = true; clearTimeout(timeout); settled.current?.(); } };
    const timeout = setTimeout(finish, 4500);
    import('../graphics/hologram.js').then(({ createHologram }) => {
      if (disposed) return;
      try {
        engine.current = createHologram(host.current, () => { if (!disposed) { setReady(true); finish(); } }, () => { if (!disposed) setReady(false); }, { powered: initialPower.current });
      } catch { finish(); }
    }).catch(finish);
    return () => { disposed = true; clearTimeout(timeout); engine.current?.dispose(); engine.current = null; };
  }, [started]);
  useEffect(() => { engine.current?.setPaused(paused || reduced || suspended); }, [paused, reduced, suspended, ready]);
  useEffect(() => { engine.current?.setPowered(powered && !suspended); }, [powered, suspended, ready]);
  useEffect(() => { engine.current?.setLayer(active); }, [active, ready]);
  useEffect(() => { if (action) engine.current?.perform(active); }, [action, ready]);
  useEffect(() => { engine.current?.setPhase(phase); }, [phase, ready]);
  return <div className={`hologram-stage ${ready ? 'hologram-ready' : ''}`} data-power={powered && !suspended ? 'on' : 'off'} data-layer={active} data-phase={phase} data-action={`${active}-${action}`} data-paused={paused || reduced || suspended}>
    <div className="hologram-ambient" aria-hidden="true"/>
    <div className="hologram-stage-top"><span className="eyebrow"><span className="holo-dot"/> A—01 / THE SYSTEMS OPERATOR</span>{powered && ready && !reduced && <button className="hologram-pause" aria-label={paused ? 'Resume character animation' : 'Pause character animation'} aria-pressed={paused} onClick={() => setPaused(!paused)}>{paused ? 'PLAY' : 'PAUSE'} <span aria-hidden="true">{paused ? '▷' : 'Ⅱ'}</span></button>}</div>
    <div className="hologram-viewport" ref={host} role="img" aria-label={powered && !suspended ? "A ceramic and silver robot powering up, then responding with articulated movement and illuminated eyes." : "A powered-down ceramic and silver robot resting with its head bowed and lights off."}><img className="hologram-fallback" src="/assets/operator-still.webp" width="621" height="510" alt=""/></div>
    <div className="robot-annotation annotation-left" aria-hidden="true"><span>01 / INTELLIGENCE</span><i/></div><div className="robot-annotation annotation-right" aria-hidden="true"><i/><span>BUILT TO CONNECT</span></div>
    {interactive && ready && !reduced && <button className="robot-greet" disabled={paused || suspended || !powered} onClick={() => engine.current?.perform('wave')}>Say hello <span aria-hidden="true">↗</span></button>}
    <div className="hologram-stage-bottom"><span className="eyebrow">HUMAN INTENT. MACHINE PRECISION.</span><span className="eyebrow holo-layer-label">{active.toUpperCase()} / 0{['data', 'flow', 'ai', 'edge'].indexOf(active) + 1}</span></div>
  </div>;
}
