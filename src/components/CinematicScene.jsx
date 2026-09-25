import React, { useEffect, useRef, useState } from 'react';
import { Arrow, Eyebrow } from './UI.jsx';

export default function CinematicScene() {
  const host = useRef(null), engine = useRef(null);
  const [started, setStarted] = useState(false), [ready, setReady] = useState(false);
  const [expanded, setExpanded] = useState(false), [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setStarted(true); observer.disconnect(); }
    }, { rootMargin: '150px' });
    observer.observe(host.current);
    const preference = matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(preference.matches);
    update(); preference.addEventListener('change', update);
    return () => { observer.disconnect(); preference.removeEventListener('change', update); };
  }, []);
  useEffect(() => {
    if (!started) return;
    let disposed = false;
    import('../graphics/cinematic.js').then(({ createCinematic }) => {
      if (disposed) return;
      try { engine.current = createCinematic(host.current, () => setReady(true), () => setReady(false)); }
      catch { setReady(false); }
    }).catch(() => { if (!disposed) setReady(false); });
    return () => { disposed = true; engine.current?.dispose(); engine.current = null; };
  }, [started]);
  useEffect(() => { engine.current?.setExpanded(expanded); }, [expanded, ready]);
  useEffect(() => { engine.current?.setPaused(paused || reduced); }, [paused, reduced, ready]);
  return <section className="cinematic-section page-wrap" aria-labelledby="cinematic-title">
    <div className="cinematic-heading"><div><Eyebrow>A study in connection</Eyebrow><h2 id="cinematic-title">Beautiful on the surface.<br/><em>Considered at the core.</em></h2></div><p>Design, engineering, and human intent.<br/>Separate disciplines. A coherent whole.</p></div>
    <div className={`cinematic-frame ${ready ? 'cinematic-ready' : ''}`} data-expanded={expanded}>
      <div className="cinematic-topline"><span className="eyebrow">AYNKO / Objects of intention</span><span className="eyebrow">Study No. 01</span></div>
      <div className="cinematic-viewport" ref={host} role="img" tabIndex={ready ? 0 : undefined} aria-label="A cinematic sculpture of interlocking silver and sage rings around a luminous core on a dark stone plinth. Drag or use Left and Right arrow keys to rotate. Home resets the view." onKeyDown={event => {
        if (!['ArrowLeft', 'ArrowRight', 'Home'].includes(event.key)) return;
        event.preventDefault();
        if (event.key === 'Home') engine.current?.resetView();
        else engine.current?.rotate(event.key === 'ArrowLeft' ? -1 : 1);
      }}>
        <img className="cinematic-poster" src="/assets/cinematic-still.webp" width="1311" height="600" alt="" loading="lazy"/>
      </div>
      <div className="cinematic-caption"><div aria-live="polite"><span className="eyebrow">{expanded ? '02 / The individual layers' : '01 / Everything in balance'}</span><p>{expanded ? 'Every part has a purpose.' : 'The whole is in the details.'}</p></div><span className="cinematic-drag-hint">{ready ? 'Drag or use arrow keys to explore' : 'Form follows intention'}</span></div>
      {ready && <div className="cinematic-controls"><button aria-pressed={expanded} onClick={() => setExpanded(value => !value)}><span aria-hidden="true">{expanded ? '−' : '+'}</span>{expanded ? 'Bring it together' : 'Explore the layers'}</button><button onClick={() => engine.current?.resetView()} aria-label="Reset sculpture view">Reset view <span aria-hidden="true">↺</span></button>{!reduced && <button onClick={() => setPaused(value => !value)} aria-pressed={paused} aria-label={paused ? 'Play cinematic motion' : 'Pause cinematic motion'}>{paused ? 'Play motion' : 'Pause motion'}<span aria-hidden="true">{paused ? '▷' : 'Ⅱ'}</span></button>}</div>}
    </div>
    <div className="cinematic-afterword"><p>A small expression of how we build: each detail working with the next.</p><a href="/about" className="link-action">Meet the minds behind it <Arrow/></a></div>
  </section>;
}
