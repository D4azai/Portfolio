import React, { useEffect, useRef, useState } from 'react';

export default function Hologram({ active }) {
  const host = useRef(null), engine = useRef(null);
  const [ready, setReady] = useState(false), [paused, setPaused] = useState(false), [reduced, setReduced] = useState(false);
  useEffect(() => {
    let disposed = false;
    const preference = matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(preference.matches);
    update(); preference.addEventListener('change', update);
    import('../graphics/hologram.js').then(({ createHologram }) => {
      if (disposed) return;
      try { engine.current = createHologram(host.current, () => { if (!disposed) setReady(true); }, () => { if (!disposed) setReady(false); }); }
      catch { setReady(false); }
    }).catch(() => setReady(false));
    return () => { disposed = true; preference.removeEventListener('change', update); engine.current?.dispose(); engine.current = null; };
  }, []);
  useEffect(() => { engine.current?.setPaused(paused || reduced); }, [paused, reduced, ready]);
  useEffect(() => { engine.current?.setLayer(active); }, [active, ready]);
  return <div className={`hologram-stage ${ready ? 'hologram-ready' : ''}`} data-layer={active}>
    <div className="hologram-ambient" aria-hidden="true"/>
    <div className="hologram-stage-top"><span className="eyebrow"><span className="holo-dot"/>THE SYSTEMS OPERATOR</span>{ready && !reduced && <button className="hologram-pause" aria-label={paused ? 'Resume character animation' : 'Pause character animation'} aria-pressed={paused} onClick={() => setPaused(!paused)}><span aria-hidden="true">{paused ? '▷' : 'Ⅱ'}</span>{paused ? 'RESUME' : 'PAUSE'}</button>}</div>
    <div className="hologram-viewport" ref={host} role="img" aria-label="Mint holographic character with curly hair, round glasses, and a floating globe above its hand, standing on an illuminated platform."><img className="hologram-fallback" src="/assets/hologram-reference.png" width="486" height="598" alt="" fetchPriority="high"/></div>
    <div className="hologram-stage-bottom"><span className="eyebrow">HUMAN IDEAS. CONNECTED SYSTEMS.</span><span className="eyebrow holo-layer-label">{active.toUpperCase()} / 0{['data', 'flow', 'ai', 'edge'].indexOf(active) + 1}</span></div>
  </div>;
}
