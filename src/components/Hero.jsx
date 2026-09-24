import React, { useState } from 'react';
import { Arrow, Eyebrow } from './UI.jsx';
import { pillars } from '../../js/pillars.js';
import Hologram from './Hologram.jsx';

function CoreArtwork({ active }) {
  return <div className={`core-art core-${active}`} aria-hidden="true">
    <div className="core-halo"/><div className="orbital-ring orbit-one"/><div className="orbital-ring orbit-two"/>
    <svg className="core-sculpture" viewBox="0 0 600 600" fill="none">
      <defs>
        <linearGradient id="metal" x1="150" y1="130" x2="430" y2="480" gradientUnits="userSpaceOnUse"><stop stopColor="#f2f3df"/><stop offset=".18" stopColor="#868d73"/><stop offset=".35" stopColor="#252d21"/><stop offset=".52" stopColor="#a8b594"/><stop offset=".65" stopColor="#e4edd1"/><stop offset=".82" stopColor="#4b5740"/><stop offset="1" stopColor="#11190e"/></linearGradient>
        <linearGradient id="innerMetal" x1="180" y1="240" x2="360" y2="380" gradientUnits="userSpaceOnUse"><stop stopColor="#131b10"/><stop offset=".5" stopColor="#555f40"/><stop offset="1" stopColor="#d3ec9b"/></linearGradient>
        <radialGradient id="centerLight"><stop stopColor="#d0fd73" stopOpacity=".3"/><stop offset="1" stopColor="#d0fd73" stopOpacity="0"/></radialGradient>
        <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="16"/></filter>
      </defs>
      <ellipse cx="320" cy="492" rx="148" ry="24" fill="#000" opacity=".65" filter="url(#shadow)"/>
      <g transform="rotate(-30 300 300)">
        <ellipse cx="308" cy="314" rx="183" ry="160" stroke="#080e06" strokeWidth="72"/>
        <ellipse cx="300" cy="295" rx="180" ry="155" stroke="url(#metal)" strokeWidth="70"/>
        <ellipse cx="300" cy="295" rx="144" ry="119" stroke="url(#innerMetal)" strokeWidth="5"/>
        <ellipse cx="300" cy="295" rx="213" ry="188" stroke="#e9f2d5" strokeOpacity=".45" strokeWidth="1"/>
        <ellipse cx="300" cy="295" rx="182" ry="157" stroke="#f2ffcd" strokeOpacity=".3" strokeWidth="1" strokeDasharray="1 5"/>
        <ellipse cx="300" cy="295" rx="172" ry="149" stroke="#11180c" strokeOpacity=".4" strokeWidth="1"/>
      </g>
      <circle cx="300" cy="290" r="125" fill="url(#centerLight)"/>
      <path d="m259 322 37-75h12l37 75h-22l-21-47-22 47h-21Z" fill="#d3fb85"/>
      <path d="M289 312h24l-12-23-12 23Z" fill="#d3fb85"/>
    </svg>
    <div className="core-coordinate coordinate-top">01 — CONNECTED BY DESIGN</div>
    <div className="core-coordinate coordinate-bottom">A / SYSTEM CORE <span>↗</span></div>
    <div className="core-badge"><span className="status-dot"/> {active.toUpperCase()} LAYER</div>
  </div>;
}

export default function Hero({ onPillar }) {
  const [active, setActive] = useState('data');
  return <section id="home" className="hero-section relative overflow-hidden">
    <div className="hero-grid" aria-hidden="true"/>
    <div className="page-wrap relative">
      <div className="hero-topline flex items-center justify-between gap-4 border-b border-line pb-5"><span className="eyebrow">INDEPENDENT ENGINEERING / AYMane CHELLAK</span><span className="eyebrow hidden items-center gap-2 sm:flex"><span className="status-dot"/>MOROCCO · WORKING WORLDWIDE</span></div>
      <div className="hero-layout grid items-center gap-4 lg:grid-cols-[1.15fr_1fr]">
        <div className="hero-copy relative z-10">
          <Eyebrow>Software engineer & systems architect</Eyebrow>
          <h1 className="hero-title mt-7"><span>Complexity,</span><span>made <em>useful.</em></span></h1>
          <p className="mt-8 max-w-md text-base leading-7 text-muted">I turn complex operations into thoughtful digital products. Clear interfaces. Connected systems. Software that earns its place.</p>
          <div className="hero-actions mt-9 flex flex-wrap items-center gap-5"><a href="#work" className="action action-lime">Explore selected work <Arrow/></a><a href="#contact" className="link-action">Let’s talk <Arrow/></a></div>
          <div className="hero-signature mt-11 flex items-center gap-3"><span className="signature-stroke" aria-hidden="true">Ac.</span><div><p className="text-xs font-semibold">Aymane Chellak</p><p className="mt-1 text-[11px] text-muted">Independent mind. End-to-end delivery.</p></div></div>
        </div>
        <div className="system-field hero-art relative"><Hologram active={active}/><div className="system-selector"><div className="grid grid-cols-4 gap-1" role="group" aria-label="Explore system layers">{Object.entries(pillars).map(([key, p]) => <button key={key} className="layer-button" aria-pressed={key === active} onClick={() => setActive(key)}><span>{p.number}</span>{p.label}<span className="layer-indicator"/></button>)}</div><div className="flex min-h-16 items-center justify-between gap-5 border-t border-line px-4 py-3"><p className="text-xs text-muted" aria-live="polite">{pillars[active].category}</p><button className="text-xs text-lime flex items-center gap-3" data-pillar={active} onClick={e => onPillar(active, e.currentTarget)}>Explore the layer <Arrow className="h-4 w-4"/></button></div></div></div>
      </div>
      <div className="hero-bottom flex items-center justify-between gap-4 border-t border-line py-6"><span className="eyebrow">STRATEGY → SYSTEMS → SOFTWARE</span><a href="#work" className="eyebrow flex items-center gap-3 text-paper">SCROLL TO EXPLORE <span aria-hidden="true">↓</span></a></div>
    </div>
  </section>;
}
