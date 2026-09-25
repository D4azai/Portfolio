import React, { useEffect, useRef, useState } from 'react';
import { Arrow, SectionHeading } from './UI.jsx';
import { projects } from '../data/portfolio.js';
import ProjectAtmosphere from './ProjectAtmosphere.jsx';

function ProjectVisual({ project, onOpen }) {
  return <button className={`project-media showcase-media tone-${project.tone}`} data-cursor="VIEW PROJECT" data-project-art={project.id} data-explore-case={project.id} onClick={e => onOpen(project, e.currentTarget)} aria-label={`Preview ${project.title}`}>
    <span className="showcase-media-grid" aria-hidden="true"/>
    <span className="mac-window-bar" aria-hidden="true">
      <span className="mac-window-controls"><i/><i/><i/></span>
      <span className="mac-window-title">{project.title} / project view</span>
      <span className="mac-window-spacer"/>
    </span>
    <ProjectAtmosphere id={project.id}/>
    <span className="showcase-media-label eyebrow">{project.label}<span aria-hidden="true">↗</span></span>
    <div className="project-depth">
    <div className="project-cover-photo" data-showcase-reveal="image"><img src={`/assets/covers/${project.id}-1280.webp`} srcSet={`/assets/covers/${project.id}-640.webp 640w, /assets/covers/${project.id}-1280.webp 1280w`} sizes="(max-width: 760px) 100vw, 55vw" width="1536" height="1024" loading="lazy" decoding="async" alt={project.coverAlt}/><span className="cover-photo-caption">{project.title}<small>CONCEPT COVER / {project.category.toUpperCase()}</small></span></div>
    </div>
    <span className="showcase-view"><span className="eyebrow">EXPLORE THE EXPERIENCE</span><span className="showcase-view-arrow"><Arrow/></span></span>
  </button>;
}

export default function Projects({ onOpen }) {
  const [active, setActive] = useState(0), [direction, setDirection] = useState(1);
  const stage = useRef(null), initialized = useRef(false), tabs = useRef([]);
  useEffect(() => {
    const index = projects.findIndex(project => project.id === location.hash.slice(1));
    if (index >= 0) setActive(index);
  }, []);
  function select(next, focus = false) {
    const index = (next + projects.length) % projects.length;
    if (index === active) return;
    setDirection(next >= active ? 1 : -1); setActive(index);
    if (focus) tabs.current[index]?.focus();
  }
  function keydown(event, index) {
    const target = { ArrowRight: index + 1, ArrowLeft: index - 1, Home: 0, End: projects.length - 1 }[event.key];
    if (target !== undefined) { event.preventDefault(); select(target, true); }
  }
  useEffect(() => {
    const tab = tabs.current[active], rail = tab?.parentElement;
    if (!rail) return;
    let previousWidth = rail.clientWidth;
    const observer = new ResizeObserver(() => {
      if (rail.clientWidth === previousWidth) return;
      previousWidth = rail.clientWidth;
      if (rail.scrollWidth <= rail.clientWidth) return;
      const delta = tab.getBoundingClientRect().left - rail.getBoundingClientRect().left;
      rail.scrollTo({ left: rail.scrollLeft + delta - (rail.clientWidth - tab.clientWidth) / 2, behavior: 'instant' });
    });
    observer.observe(rail);
    return () => observer.disconnect();
  }, [active]);
  useEffect(() => {
    const preference = matchMedia('(prefers-reduced-motion: reduce)');
    const tab = tabs.current[active], rail = tab?.parentElement;
    if (rail && rail.scrollWidth > rail.clientWidth) {
      const delta = tab.getBoundingClientRect().left - rail.getBoundingClientRect().left;
      rail.scrollTo({ left: rail.scrollLeft + delta - (rail.clientWidth - tab.clientWidth) / 2, behavior: preference.matches ? 'instant' : 'smooth' });
    }
    if (!initialized.current) { initialized.current = true; return; }
    if (preference.matches) return;
    const elements = stage.current.querySelectorAll('.showcase-panel:not([hidden]) [data-showcase-reveal]');
    const animations = [...elements].map((el, index) => {
      const isImage = el.dataset.showcaseReveal === 'image';
      return el.animate(isImage ? [
        { opacity: .15, translate: `${direction * 28}px 0`, scale: '.985' },
        { opacity: 1, translate: '0 0', scale: '1' },
      ] : [
        { opacity: 0, transform: 'translateY(14px)' },
        { opacity: 1, transform: 'translateY(0)' },
      ], { duration: isImage ? 600 : 450, delay: isImage ? 0 : Math.min(index * 40, 160), easing: 'cubic-bezier(.16,1,.3,1)', fill: 'backwards' });
    });
    const cancel = () => animations.forEach(animation => animation.cancel());
    const change = () => { if (preference.matches) cancel(); };
    preference.addEventListener('change', change);
    return () => { cancel(); preference.removeEventListener('change', change); };
  }, [active]);
  return <section id="work" className="page-wrap section-space">
    <SectionHeading heading="h1" number="01" label="Selected work" title={<>Different challenges.<br/><em>One thoughtful approach.</em></>}>Five projects. One belief: the best digital experiences make complex work feel simple. Take a closer look.</SectionHeading>
    <div className="project-showcase" data-reveal>
      <div className="showcase-toolbar"><span className="eyebrow flex items-center gap-3"><span className="status-dot"/>SELECTED COLLECTION / 2026</span><div className="showcase-controls"><span className="showcase-counter" aria-live="polite" aria-atomic="true"><strong>0{active + 1}</strong><span>/ 0{projects.length}</span></span><button className="showcase-prev" aria-label="Previous project" onClick={() => select(active - 1)}><Arrow diagonal={false}/></button><button aria-label="Next project" onClick={() => select(active + 1)}><Arrow diagonal={false}/></button></div></div>
      <div className="showcase-stage" data-direction={direction} ref={stage}><span key={active} className={`project-transition tone-${projects[active].tone}`} aria-hidden="true"/>{projects.map((project, i) => <article key={project.id} className="showcase-panel featured-project" id={`project-panel-${project.id}`} role="tabpanel" aria-labelledby={`project-tab-${project.id}`} hidden={active !== i} tabIndex={0}>
        <ProjectVisual project={project} onOpen={onOpen}/>
        <div className="showcase-copy">
          <div className="showcase-kicker" data-showcase-reveal><span className="eyebrow text-lime">0{i + 1} / {project.category}</span><span className="showcase-status">{project.status}</span></div>
          <div data-showcase-reveal><h3 className="showcase-title">{project.title}<span className="text-lime">.</span></h3><p className="showcase-summary">{project.summary}</p></div>
          <div className="showcase-tags" data-showcase-reveal>{project.tags.slice(0, 3).map(tag => <span className="tag" key={tag}>{tag}</span>)}</div>
          <div className="showcase-insight" data-showcase-reveal><p className="eyebrow">THE THINKING BEHIND IT</p><p>{project.sections[0][1]}</p></div>
          <div className="showcase-actions" data-showcase-reveal><button className="link-action" data-case={project.id} onClick={e => onOpen(project, e.currentTarget)}>Inside the project <Arrow/></button>{project.live && <a className="showcase-live" href={project.live} target="_blank" rel="noopener noreferrer">Visit live ↗</a>}</div>
        </div>
      </article>)}</div>
      <div className="showcase-rail" role="tablist" aria-label="Choose a project">{projects.map((project, i) => <button key={project.id} ref={node => { tabs.current[i] = node; }} className="project-tab" role="tab" id={`project-tab-${project.id}`} aria-controls={`project-panel-${project.id}`} aria-selected={active === i} tabIndex={active === i ? 0 : -1} onClick={() => select(i)} onKeyDown={e => keydown(e, i)}><span className={`project-tab-art tone-${project.tone}`} aria-hidden="true"><img src={`/assets/covers/${project.id}-640.webp`} alt="" loading="lazy" width="80" height="58"/></span><span className="project-tab-copy"><small>0{i + 1} / {project.category}</small><strong>{project.title}</strong></span><span className="project-tab-indicator" aria-hidden="true"/></button>)}</div>
    </div>
    <noscript><div className="project-fallback-list">{projects.map(project => <article key={project.id}><h3>{project.title}</h3><p>{project.lede}</p><img src={`/assets/covers/${project.id}-640.webp`} alt={project.coverAlt} width="640" height="427" loading="lazy"/><p>{project.status}</p>{project.live && <a href={project.live}>Visit project ↗</a>}</article>)}</div></noscript>
  </section>;
}
