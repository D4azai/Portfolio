import React, { useEffect, useRef, useState } from 'react';
import { Arrow, SectionHeading, ProjectImage } from './UI.jsx';
import { projects } from '../data/portfolio.js';

function ProjectVisual({ project, onOpen }) {
  return <button className={`project-media showcase-media tone-${project.tone}`} data-explore-case={project.id} onClick={e => onOpen(project, e.currentTarget)} aria-label={`Preview ${project.title}`}>
    <span className="showcase-media-grid" aria-hidden="true"/>
    <span className="showcase-media-label eyebrow">{project.label}<span aria-hidden="true">↗</span></span>
    {project.cover ? <div className="showcase-browser" data-showcase-reveal="image"><div className="browser-bar"><span/><span/><span/><p>{project.title.toLowerCase().replaceAll(' ', '.')} / workspace</p><span className="browser-lock">↗</span></div><ProjectImage name={project.cover} alt={`${project.title} — actual project interface`} className="browser-image"/></div> : <div className="northstar-composition" data-showcase-reveal="image"><span className="northstar-orbit"/><span className="eyebrow">INDEPENDENT PERSPECTIVE.</span><strong>NORTH<br/><em>STAR.</em></strong><span className="eyebrow">STRATEGY / GROWTH / DIGITAL</span></div>}
    <span className="showcase-view"><span className="eyebrow">EXPLORE THE EXPERIENCE</span><span className="showcase-view-arrow"><Arrow/></span></span>
  </button>;
}

export default function Projects({ onOpen }) {
  const [active, setActive] = useState(0), [direction, setDirection] = useState(1);
  const stage = useRef(null), initialized = useRef(false), tabs = useRef([]);
  function select(next, focus = false) {
    const index = (next + projects.length) % projects.length;
    setDirection(next >= active ? 1 : -1); setActive(index);
    if (focus) tabs.current[index]?.focus();
  }
  function keydown(event, index) {
    const target = { ArrowRight: index + 1, ArrowLeft: index - 1, Home: 0, End: projects.length - 1 }[event.key];
    if (target !== undefined) { event.preventDefault(); select(target, true); }
  }
  useEffect(() => {
    if (!initialized.current) { initialized.current = true; return; }
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const elements = stage.current.querySelectorAll('.showcase-panel:not([hidden]) [data-showcase-reveal]');
    const animations = [...elements].map((el, index) => {
      const isImage = el.dataset.showcaseReveal === 'image';
      return el.animate([
        { opacity: isImage ? .2 : 0, transform: isImage ? `translateX(${direction * 44}px) scale(.94) rotateY(${-direction * 5}deg)` : 'translateY(18px)' },
        { opacity: 1, transform: 'translateX(0) translateY(0) scale(1) rotateY(0)' },
      ], { duration: isImage ? 700 : 500, delay: isImage ? 0 : Math.min(index * 55, 220), easing: 'cubic-bezier(.16,1,.3,1)', fill: 'backwards' });
    });
    return () => animations.forEach(animation => animation.cancel());
  }, [active]);
  return <section id="work" className="page-wrap section-space">
    <SectionHeading number="01" label="Selected work" title={<>Different challenges.<br/><em>One thoughtful approach.</em></>}>Five projects. One belief: the best digital experiences make complex work feel simple. Take a closer look.</SectionHeading>
    <div className="project-showcase" data-reveal>
      <div className="showcase-toolbar"><span className="eyebrow flex items-center gap-3"><span className="status-dot"/>SELECTED COLLECTION / 2026</span><div className="showcase-controls"><span className="showcase-counter" aria-live="polite" aria-atomic="true"><strong>0{active + 1}</strong><span>/ 0{projects.length}</span></span><button className="showcase-prev" aria-label="Previous project" onClick={() => select(active - 1)}><Arrow diagonal={false}/></button><button aria-label="Next project" onClick={() => select(active + 1)}><Arrow diagonal={false}/></button></div></div>
      <div className="showcase-stage" ref={stage}>{projects.map((project, i) => <article key={project.id} className="showcase-panel featured-project" id={`project-panel-${project.id}`} role="tabpanel" aria-labelledby={`project-tab-${project.id}`} hidden={active !== i} tabIndex={0}>
        <ProjectVisual project={project} onOpen={onOpen}/>
        <div className="showcase-copy">
          <div className="showcase-kicker" data-showcase-reveal><span className="eyebrow text-lime">0{i + 1} / {project.category}</span><span className="showcase-status">{project.status}</span></div>
          <div data-showcase-reveal><h3 className="showcase-title">{project.title}<span className="text-lime">.</span></h3><p className="showcase-summary">{project.summary}</p></div>
          <div className="showcase-tags" data-showcase-reveal>{project.tags.slice(0, 3).map(tag => <span className="tag" key={tag}>{tag}</span>)}</div>
          <div className="showcase-insight" data-showcase-reveal><p className="eyebrow">THE THINKING BEHIND IT</p><p>{project.sections[0][1]}</p></div>
          <div className="showcase-actions" data-showcase-reveal><button className="link-action" data-case={project.id} onClick={e => onOpen(project, e.currentTarget)}>Inside the project <Arrow/></button>{project.live && <a className="showcase-live" href={project.live} target="_blank" rel="noopener noreferrer">Visit live ↗</a>}</div>
        </div>
      </article>)}</div>
      <div className="showcase-rail" role="tablist" aria-label="Choose a project">{projects.map((project, i) => <button key={project.id} ref={node => { tabs.current[i] = node; }} className="project-tab" role="tab" id={`project-tab-${project.id}`} aria-controls={`project-panel-${project.id}`} aria-selected={active === i} tabIndex={active === i ? 0 : -1} onClick={() => select(i)} onKeyDown={e => keydown(e, i)}><span className={`project-tab-art tone-${project.tone}`} aria-hidden="true">{project.cover ? <img src={`/assets/optimized/${project.cover}-640.webp`} alt="" loading="lazy" width="80" height="58"/> : <span>✳</span>}</span><span className="project-tab-copy"><small>0{i + 1} / {project.category}</small><strong>{project.title}</strong></span><span className="project-tab-indicator" aria-hidden="true"/></button>)}</div>
    </div>
    <div className="showcase-footer"><span className="eyebrow">FROM THE FIRST IDEA TO THE LAST DETAIL.</span><span className="eyebrow">SELECT A PROJECT TO EXPLORE ↗</span></div>
    <noscript><div className="project-fallback-list">{projects.map(project => <article key={project.id}><h3>{project.title}</h3><p>{project.lede}</p>{project.cover && <ProjectImage name={project.cover} alt={`${project.title} interface`}/>}<p>{project.status}</p>{project.live && <a href={project.live}>Visit project ↗</a>}</article>)}</div></noscript>
  </section>;
}
