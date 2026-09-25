import React, { useEffect, useRef, useState } from 'react';

export default function Hologram({ active = 'data', action = 0, phase = 'idle', suspended = false, onSettled, interactive = false }) {
  const host = useRef(null), engine = useRef(null), settled = useRef(onSettled);
  const [ready, setReady] = useState(false), [paused, setPaused] = useState(false), [reduced, setReduced] = useState(false);
  // A suspended stage (the hero behind the intro) keeps the illustration and only builds its WebGL scene once revealed.
  const [started, setStarted] = useState(!suspended);
  useEffect(() => { if (!suspended) setStarted(true); }, [suspended]);
  useEffect(() => {
    const preference = matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(preference.matches);
    update(); preference.addEventListener('change', update);
    return () => preference.removeEventListener('change', update);
  }, []);
  useEffect(() => {
    if (!started) return;
    let disposed = false;
    const finish = () => { if (!disposed) settled.current?.(); };
    const timeout = setTimeout(finish, 4500);
    import('../graphics/hologram.js').then(({ createHologram }) => {
      if (disposed) return;
      try {
        engine.current = createHologram(host.current, () => { if (!disposed) { setReady(true); finish(); } }, () => { if (!disposed) setReady(false); });
      } catch { finish(); }
    }).catch(finish);
    return () => { disposed = true; clearTimeout(timeout); engine.current?.dispose(); engine.current = null; };
  }, [started]);
  useEffect(() => { engine.current?.setPaused(paused || reduced || suspended); }, [paused, reduced, suspended, ready]);
  useEffect(() => { engine.current?.setLayer(active); }, [active, ready]);
  useEffect(() => { if (action) engine.current?.perform(active); }, [action, ready]);
  useEffect(() => { engine.current?.setPhase(phase); }, [phase, ready]);
  return <div className={`hologram-stage ${ready ? 'hologram-ready' : ''}`} data-layer={active} data-phase={phase} data-action={`${active}-${action}`} data-paused={paused || reduced || suspended}>
    <div className="hologram-ambient" aria-hidden="true"/>
    <div className="hologram-stage-top"><span className="eyebrow"><span className="holo-dot"/> A—01 / THE SYSTEMS OPERATOR</span>{ready && !reduced && <button className="hologram-pause" aria-label={paused ? 'Resume character animation' : 'Pause character animation'} aria-pressed={paused} onClick={() => setPaused(!paused)}>{paused ? 'PLAY' : 'PAUSE'} <span aria-hidden="true">{paused ? '▷' : 'Ⅱ'}</span></button>}</div>
    <div className="hologram-viewport" ref={host} role="img" aria-label="A sculptural ceramic and silver robot with a glass visor, articulated limbs, and a luminous miniature ring sculpture above its hand."><img className="hologram-fallback" src="/assets/operator-still.webp" width="621" height="510" alt=""/></div>
    <div className="robot-annotation annotation-left" aria-hidden="true"><span>01 / INTELLIGENCE</span><i/></div><div className="robot-annotation annotation-right" aria-hidden="true"><i/><span>BUILT TO CONNECT</span></div>
    {interactive && ready && !reduced && <button className="robot-greet" disabled={paused || suspended} onClick={() => engine.current?.perform('wave')}>Say hello <span aria-hidden="true">↗</span></button>}
    <div className="hologram-stage-bottom"><span className="eyebrow">HUMAN INTENT. MACHINE PRECISION.</span><span className="eyebrow holo-layer-label">{active.toUpperCase()} / 0{['data', 'flow', 'ai', 'edge'].indexOf(active) + 1}</span></div>
  </div>;
}
