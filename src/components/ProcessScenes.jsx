import React, { useEffect, useRef, useState } from 'react';
import { Arrow, Eyebrow } from './UI.jsx';
import { filmChapters } from '../data/process-film.js';

export default function ProcessScenes() {
  const host = useRef(null), video = useRef(null);
  const sceneFromHash = () => {
    const match = typeof window !== 'undefined' ? /^#film-(understand|architect|build|evolve)$/.exec(window.location.hash) : null;
    return match ? filmChapters.findIndex(item => item.title.toLowerCase() === match[1]) : 0;
  };
  const [scene, setScene] = useState(sceneFromHash), [visible, setVisible] = useState(false), [hidden, setHidden] = useState(false);
  const [paused, setPaused] = useState(false), [reduced, setReduced] = useState(() => typeof window !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches), [requested, setRequested] = useState(false);
  const [blocked, setBlocked] = useState(false), [failed, setFailed] = useState(false);
  const current = filmChapters[scene], slug = current.title.toLowerCase();
  const wantsMotion = !paused && (!reduced || requested);
  const running = visible && !hidden && wantsMotion;

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: .05 });
    observer.observe(host.current);
    const preference = matchMedia('(prefers-reduced-motion: reduce)');
    const motion = () => { setReduced(preference.matches); setRequested(false); };
    const visibility = () => setHidden(document.hidden);
    motion(); visibility();
    preference.addEventListener('change', motion); document.addEventListener('visibilitychange', visibility);
    return () => { observer.disconnect(); preference.removeEventListener('change', motion); document.removeEventListener('visibilitychange', visibility); };
  }, []);

  useEffect(() => {
    const syncHash = () => setScene(sceneFromHash());
    window.addEventListener('hashchange', syncHash);
    return () => window.removeEventListener('hashchange', syncHash);
  }, []);

  useEffect(() => {
    const player = video.current;
    let disposed = false;
    if (running) {
      player.muted = true;
      player.play().then(() => { if (!disposed) setBlocked(false); }).catch(error => {
        if (!disposed && error.name !== 'AbortError') setBlocked(true);
      });
    } else player.pause();
    return () => { disposed = true; player.pause(); };
  }, [scene, running]);

  function select(index) {
    setFailed(false); setBlocked(false);
    history.replaceState(null, '', `/about#film-${filmChapters[index].title.toLowerCase()}`);
    if (index === scene) {
      video.current.currentTime = 0;
      return;
    }
    setScene(index);
  }
  function toggleMotion() {
    if (wantsMotion && !blocked) { setPaused(true); video.current.pause(); return; }
    setPaused(false); setRequested(true);
    const player = video.current;
    // Keep this call inside the click event for browsers requiring a user gesture.
    player.play().then(() => { if (video.current === player) setBlocked(false); }).catch(error => {
      if (video.current === player && error.name !== 'AbortError') setBlocked(true);
    });
  }
  function navigate(event, index) {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? 3 : (index + (event.key === 'ArrowRight' ? 1 : 3)) % 4;
    select(next); document.getElementById(`film-scene-${next}`).focus();
  }

  return <section className="systems-film page-wrap" aria-labelledby="film-title">
    <div className="film-heading"><div><Eyebrow>Meet our way of working</Eyebrow><h2 id="film-title">From first idea.<br/><em>To real-world use.</em></h2></div><p>Four stages, one close collaboration. Choose a step and see how we turn complex work into useful software.</p></div>
    <div className="process-film-frame process-scenes">
      <div ref={host} id="film-scene-panel" role="tabpanel" aria-labelledby={`film-scene-${scene}`} className="process-film-screen" tabIndex={0}>
        <video key={slug} ref={video} src={`/assets/film/${slug}.mp4`} poster={`/assets/film/${slug}.webp`} muted loop playsInline autoPlay={running} controls={false} disablePictureInPicture preload="none" width="1280" height="720" aria-label={`${current.title}: ${current.visual}`} onCanPlay={() => { if (running) video.current?.play().catch(() => setBlocked(true)); }} onError={() => setFailed(true)}/>
      </div>
      <div className="scene-caption"><span role="status" aria-live="polite">0{scene + 1} / {current.title}</span><button className="scene-motion-toggle" onClick={toggleMotion} aria-label={wantsMotion && !blocked ? 'Pause process animation' : 'Play process animation'}><span aria-hidden="true">{wantsMotion && !blocked ? 'Ⅱ' : '▷'}</span>{wantsMotion && !blocked ? 'Pause motion' : 'Play motion'}</button></div>
      <div className="film-chapters" role="tablist" aria-label="Explore our process">{filmChapters.map((item, i) => <button id={`film-scene-${i}`} key={item.title} role="tab" aria-selected={scene === i} aria-controls="film-scene-panel" tabIndex={scene === i ? 0 : -1} onClick={() => select(i)} onKeyDown={event => navigate(event, i)}><span>0{i + 1}</span><strong>{item.title}</strong><Arrow/></button>)}</div>
    </div>
    {failed && <p className="film-error" role="status">This animation could not load. <a href={`/assets/film/${slug}.mp4`}>Open this scene</a> or read about our approach below.</p>}
    <div className="film-afterword"><p>Each scene loops through one part of our process. Select any stage to explore it.</p><a className="link-action" href={`/process#step-${scene}`}>Open this stage in the process <Arrow/></a></div>
    <details className="film-transcript"><summary>Read about the four stages <span aria-hidden="true">+</span></summary><ol>{filmChapters.map(item => <li key={item.title}><h3>{item.title}</h3><p>{item.description}</p><p className="film-visual-description">{item.visual} <strong>{item.output}</strong></p></li>)}</ol></details>
  </section>;
}
