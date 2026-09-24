import React, { useEffect, useRef, useState } from 'react';
import Hologram from './Hologram.jsx';
import { Arrow, Mark } from './UI.jsx';

export default function Intro({ onClose, returnFocus }) {
  const dialog = useRef(null), enter = useRef(null), closing = useRef(false);
  const [assets, setAssets] = useState(0), [sceneReady, setSceneReady] = useState(false), [leaving, setLeaving] = useState(false);
  const progress = Math.round((assets + Number(sceneReady)) / 3 * 100);
  useEffect(() => {
    const element = dialog.current;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.classList.add('intro-open');
    element.showModal();
    enter.current.focus({ preventScroll: true });
    let disposed = false;
    const timers = [];
    const settled = () => { if (!disposed) setAssets(value => value + 1); };
    const image = new Image(); image.src = '/assets/optimized/affiliate-640.webp';
    const bounded = promise => Promise.race([promise, new Promise(resolve => timers.push(setTimeout(resolve, 4500)))]);
    bounded(document.fonts.ready).then(settled, settled);
    bounded(image.decode()).then(settled, settled);
    return () => {
      disposed = true; timers.forEach(clearTimeout); element.close(); document.body.style.overflow = previous;
      document.documentElement.classList.remove('intro-open');
      document.documentElement.classList.add('experience-entered');
      (returnFocus?.current || document.querySelector('#main'))?.focus({ preventScroll: true });
    };
  }, []);
  useEffect(() => {
    if (!leaving) return;
    const timeout = setTimeout(onClose, matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 550);
    return () => clearTimeout(timeout);
  }, [leaving, onClose]);
  function leave() { if (!closing.current) { closing.current = true; setLeaving(true); } }
  return <dialog ref={dialog} className={`intro-dialog ${leaving ? 'intro-leaving' : ''}`} aria-labelledby="intro-title" aria-describedby="intro-description" onCancel={event => { event.preventDefault(); leave(); }}>
    <div className="intro-shell">
      <header className="intro-header"><span className="intro-brand"><Mark/> AYNKO<span>26</span></span><span className="eyebrow intro-edition">INDEPENDENT MIND / CONNECTED WORLD</span><button onClick={leave} className="intro-skip" aria-label="Skip intro">Skip intro <span aria-hidden="true">↗</span></button></header>
      <div className="intro-layout">
        <div className="intro-copy"><p className="eyebrow"><span className="status-dot"/> A SMALL INTRODUCTION TO WHAT’S POSSIBLE</p><h2 id="intro-title">Good things<br/>begin with<br/><em>curiosity.</em></h2><p id="intro-description">Welcome to our corner of the internet.<br/>A place for thoughtful software and ambitious ideas.</p><button ref={enter} className="action action-lime intro-enter" onClick={leave}>Enter portfolio <Arrow/></button><p className="intro-stay">Take your time. Enter whenever you’re ready.</p></div>
        <div className="intro-robot"><Hologram onSettled={() => setSceneReady(true)}/></div>
      </div>
      <footer className="intro-footer"><div className="intro-loading"><div><span className="eyebrow" role="status">{progress === 100 ? 'YOUR EXPERIENCE IS READY' : 'PREPARING THE EXPERIENCE'}</span><span className="eyebrow">{String(progress).padStart(3, '0')} / 100</span></div><div className="intro-progress" role="progressbar" aria-label="Experience preparation" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}><span style={{ width: `${progress}%` }}/></div></div><span className="eyebrow intro-credit">AYMANE CHELLAK & ZAKARIA BAK<br/><span>ENGINEERS. THINKERS. MAKERS.</span></span></footer>
    </div>
  </dialog>;
}
