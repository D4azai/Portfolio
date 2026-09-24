import React, { useEffect, useRef, useState } from 'react';
import { Mark } from './UI.jsx';

export default function ProcessDiagram({ step, labels }) {
  const host = useRef(null);
  const [paused, setPaused] = useState(false), [visible, setVisible] = useState(false), [hidden, setHidden] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting)); observer.observe(host.current);
    const visibility = () => setHidden(document.hidden); document.addEventListener('visibilitychange', visibility);
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', visibility); };
  }, []);
  const reset = () => { host.current?.style.removeProperty('--diagram-x'); host.current?.style.removeProperty('--diagram-y'); };
  function move(event) {
    if (event.pointerType !== 'mouse' || paused || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const box = host.current.getBoundingClientRect();
    host.current.style.setProperty('--diagram-y', `${(event.clientX - box.left) / box.width * 18 - 9}deg`);
    host.current.style.setProperty('--diagram-x', `${9 - (event.clientY - box.top) / box.height * 18}deg`);
  }
  return <div ref={host} className="process-diagram diagram-3d" data-step={step} data-paused={paused || !visible || hidden} onPointerMove={move} onPointerLeave={reset}>
    <div className="diagram-toolbar"><span className="eyebrow">SYSTEM BLUEPRINT / 0{step + 1}</span><button aria-label={paused ? 'Resume diagram animation' : 'Pause diagram animation'} aria-pressed={paused} onClick={() => { setPaused(!paused); reset(); }}>{paused ? 'PLAY' : 'PAUSE'}</button></div>
    <div className="diagram-perspective" aria-hidden="true"><div className="diagram-world">
      <div className="diagram-plane plane-bottom"/><div className="diagram-plane plane-middle"/><div className="diagram-plane plane-top"/>
      <div className="diagram-orbit orbit-one"><i/></div><div className="diagram-orbit orbit-two"><i/></div>
      <div className="diagram-beacon"><Mark className="h-10 w-10"/></div>
      <svg className="diagram-circuits" viewBox="0 0 360 280"><path d="M180 90 L180 145 L55 200 M180 145 L180 235 M180 145 L305 200"/><path className="diagram-packets" d="M180 90 L180 145 L55 200 M180 145 L180 235 M180 145 L305 200"/></svg>
      {labels.map((label, i) => <div key={label} className={`diagram-node node-${i}`}><span>0{i + 1}</span><strong>{label}</strong><i/></div>)}
    </div></div>
    <ol className="sr-only">{labels.map(label => <li key={label}>{label}</li>)}</ol>
    <div className="diagram-caption"><span className="status-dot"/><span>One system. Every detail connected.</span><span className="diagram-coordinate" aria-hidden="true">X / Y / Z</span></div>
  </div>;
}
