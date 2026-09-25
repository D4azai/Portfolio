import React, { useState } from 'react';
import { Arrow, Eyebrow } from './UI.jsx';
import { pillars } from '../../js/pillars.js';
import Hologram from './Hologram.jsx';
import RobotChat from './RobotChat.jsx';

const actions = { data: 'Scan the data', flow: 'Conduct the flow', ai: 'Spark an idea', edge: 'Launch the system' };

export default function Hero({ onPillar, suspended }) {
  const [active, setActive] = useState('data');
  const [action, setAction] = useState(0), [phase, setPhase] = useState('idle');
  return <section id="home" className="hero-section relative overflow-hidden" data-hero-layer={active}>
    <div className="hero-atmosphere" aria-hidden="true"><i/><i/><i/></div>
    <div className="hero-grid" aria-hidden="true"/>
    <div className="page-wrap relative">
      <div className="hero-topline"><span className="eyebrow">AYNKO / AYMANE CHELLAK & ZAKARIA BAK</span><span className="eyebrow"><span className="status-dot"/> BASED IN MOROCCO. BUILDING EVERYWHERE.</span></div>
      <div className="hero-layout">
        <div className="hero-copy">
          <Eyebrow>Software engineering, with intention.</Eyebrow>
          <h1 className="hero-title"><span>Human ideas.</span><span>Exceptional</span><span><em>systems.</em></span></h1>
          <p className="hero-description">We bring clarity to complex operations. Thoughtful products, connected workflows, and every detail in between.</p>
          <div className="hero-actions"><a href="/work" className="action action-lime">Explore our work <Arrow/></a><a href="/contact" className="link-action">Let’s talk <Arrow/></a></div>
          <div className="hero-signature"><span className="signature-stroke" aria-hidden="true">A.</span><div><p>Aymane Chellak & Zakaria Bak</p><span>Two minds. From first idea to final detail.</span></div></div>
        </div>
        <div className="system-field hero-art">
          <Hologram active={active} action={action} phase={phase} suspended={suspended} interactive/>
          <div className="system-selector"><div className="grid grid-cols-4" role="group" aria-label="Explore system layers">{Object.entries(pillars).map(([key, p]) => <button key={key} className="layer-button" aria-pressed={key === active} title={actions[key]} onClick={() => { setActive(key); setAction(value => value + 1); }}><span>{p.number}</span>{p.label}<small>{actions[key]}</small><span className="layer-indicator"/></button>)}</div><div className="layer-description"><p aria-live="polite">{action ? actions[active] + ' / Click again to replay' : 'Choose a layer. See it come alive.'}</p><button data-pillar={active} onClick={e => onPillar(active, e.currentTarget)}>Explore <Arrow className="h-4 w-4"/></button></div></div>
          <RobotChat onPhase={setPhase} suspended={suspended}/>
        </div>
      </div>
      <div className="hero-bottom"><span className="eyebrow">DESIGNED WITH CARE. BUILT TO MATTER.</span><a href="#cinematic-title" className="eyebrow hero-explore">STEP INSIDE OUR WORLD <span aria-hidden="true">↓</span></a></div>
    </div>
  </section>;
}
