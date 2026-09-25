import React from 'react';
import { Arrow, Eyebrow } from './UI.jsx';
import CinematicScene from './CinematicScene.jsx';
import { projects } from '../data/portfolio.js';

export default function HomeOverview() {
  return <>
    <CinematicScene/>
    <section className="home-selection page-wrap section-space" aria-labelledby="selection-title">
      <div className="home-section-heading" data-reveal><div><Eyebrow>A glimpse of the work</Eyebrow><h2 id="selection-title">Complex work.<br/><em>Considered solutions.</em></h2></div><a className="link-action" href="/work">Explore all five projects <Arrow/></a></div>
      <div className="home-projects">{[projects[0], projects[2]].map((project, i) => <a key={project.id} className="home-project" href={`/work#${project.id}`} data-reveal><div className={`home-project-image tone-${project.tone}`}><img src={`/assets/covers/${project.id}-1280.webp`} width="1280" height="853" loading="lazy" alt={project.coverAlt}/><span className="home-project-open"><Arrow/></span></div><div className="home-project-caption"><div><span className="eyebrow">0{i + 1} / {project.category}</span><h3>{project.title}</h3></div><span>{project.status}</span></div></a>)}</div>
    </section>
    <section className="page-wrap home-directory" aria-labelledby="directory-title"><Eyebrow>A closer look</Eyebrow><h2 id="directory-title">Get to know <em>AYNKO.</em></h2><div>{[['expertise','01','What we do','Products, connected operations, and useful intelligence.'],['process','02','How we build','Explore the thinking and the process behind every release.'],['about','03','Who we are','Two people. A shared care for how things work.']].map(([path,number,title,copy]) => <a href={`/${path}`} key={path}><span className="eyebrow">{number}</span><h3>{title}</h3><p>{copy}</p><Arrow/></a>)}</div></section>
  </>;
}
