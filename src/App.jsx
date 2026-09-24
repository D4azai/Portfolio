import React, { useEffect, useRef, useState } from 'react';
import Hero from './components/Hero.jsx';
import Projects from './components/Projects.jsx';
import DetailDialog from './components/DetailDialog.jsx';
import { Arrow, Mark, Icon, Eyebrow, SectionHeading } from './components/UI.jsx';
import { email, services, steps, questions } from './data/portfolio.js';

function Header() {
  const [active, setActive] = useState('home');
  const menu = useRef(null);
  useEffect(() => {
    const sections = [...document.querySelectorAll('main > section[id]')];
    const observer = new IntersectionObserver(entries => entries.forEach(e => { if (e.isIntersecting) setActive(e.target.id); }), { rootMargin: '-10% 0px -65% 0px' });
    sections.forEach(e => observer.observe(e));
    const escape = e => { if (e.key === 'Escape' && menu.current?.open) { menu.current.open = false; menu.current.querySelector('summary').focus(); } };
    document.addEventListener('keydown', escape);
    return () => { observer.disconnect(); document.removeEventListener('keydown', escape); };
  }, []);
  const links = [['work','Work'],['expertise','Expertise'],['method','Process'],['about','About']];
  return <header className="site-header"><div className="page-wrap flex h-full items-center justify-between gap-6"><a href="#home" className="brand flex items-center gap-2" aria-label="AYNKO home"><Mark className="text-lime"/><span className="text-lg font-extrabold tracking-wider">AYNKO<span className="text-lime" aria-hidden="true">•</span></span></a><nav className="desktop-nav items-center gap-8" aria-label="Primary navigation">{links.map(([id,label]) => <a key={id} href={`#${id}`} aria-current={active === id ? 'location' : undefined}>{label}</a>)}</nav><a href="#contact" className="header-cta hidden items-center gap-4 sm:flex">Let’s build something <Arrow className="h-4 w-4"/></a><details className="mobile-nav" ref={menu}><summary aria-label="Toggle navigation"><span/><span/></summary><nav aria-label="Mobile navigation">{[...links, ['contact','Let’s talk']].map(([id,label]) => <a href={`#${id}`} key={id} onClick={() => { menu.current.open = false; }}>{label}<Arrow/></a>)}</nav></details></div></header>;
}

function Expertise() {
  return <section id="expertise" className="light-section section-space"><div className="page-wrap"><SectionHeading number="02" label="What I bring" light title={<>Good design.<br/>Serious <em>engineering.</em></>}>The interface is the beginning. I build the systems underneath it, and connect the details that make it all work.</SectionHeading><div className="service-list">{services.map((s,i) => <article key={s.title} className="service-row grid gap-6 border-t border-ink/15 py-9 md:grid-cols-[.2fr_1fr_1fr] md:gap-12" data-reveal><div className="flex items-center justify-between gap-4 md:block"><span className="eyebrow">0{i+1}</span><div className="mt-0 md:mt-7"><Icon type={s.icon}/></div></div><h3 className="text-3xl font-semibold tracking-[-.05em] lg:text-4xl">{s.title}</h3><div><p className="text-sm leading-7 text-ink/70">{s.body}</p><div className="mt-5 flex flex-wrap gap-2">{s.tags.map(t => <span key={t} className="tag">{t}</span>)}</div></div></article>)}</div><div className="mt-8 flex flex-wrap items-center justify-between gap-6 border-t border-ink/15 pt-8"><p className="text-sm text-ink/65">One person who sees the whole picture.</p><a href="#contact" className="link-action">Find the right starting point <Arrow/></a></div></div></section>;
}

function Process() {
  const [step, setStep] = useState(0);
  const current = steps[step];
  function navigate(event, index) {
    if (!['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return;
    event.preventDefault();
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? 3 : (index + (event.key === 'ArrowRight' ? 1 : 3)) % 4;
    setStep(next); document.getElementById(`step-${next}`).focus();
  }
  return <section id="method" className="page-wrap section-space"><SectionHeading number="03" label="The working process" title={<>Clarity at<br/><em>every step.</em></>}>From the first conversation to the release, the process stays close to the people and the problem.</SectionHeading><div className="process-tabs grid grid-cols-4" role="tablist" aria-label="Working process">{steps.map((s,i) => <button id={`step-${i}`} key={s.title} role="tab" aria-selected={step === i} aria-controls="process-panel" tabIndex={step === i ? 0 : -1} onClick={() => setStep(i)} onKeyDown={e => navigate(e,i)}><span className="eyebrow">0{i+1}</span><span>{s.title}</span></button>)}</div><div id="process-panel" role="tabpanel" aria-labelledby={`step-${step}`} tabIndex="0" className="process-panel mt-5 grid overflow-hidden rounded-2xl border border-line md:grid-cols-2"><div className="p-7 md:p-12"><p className="eyebrow text-lime">STEP 0{step+1} / {current.title}</p><h3 className="mt-7 max-w-sm text-3xl leading-tight tracking-tight md:text-4xl">{current.subtitle}</h3><p className="mt-5 text-sm leading-7 text-muted">{current.description}</p><p className="mt-7 border-t border-line pt-5 text-xs leading-6"><span className="eyebrow mb-2 block text-muted">WHAT YOU LEAVE WITH</span>{current.output}</p></div><div className="process-diagram flex flex-col items-center justify-center p-8" aria-hidden="true"><div className="diagram-core"><Mark className="h-12 w-12"/></div><div className="diagram-stem"/><div className="diagram-branches grid w-full grid-cols-3 gap-3">{current.diagram.map((label,i) => <div key={label}><span className="eyebrow text-muted">0{i+1}</span><p className="mt-3 text-xs">{label}</p></div>)}</div><span className="mt-10 eyebrow text-muted">A CONSIDERED PROCESS. A USEFUL OUTCOME.</span></div></div><noscript><div className="mt-8 grid gap-6">{steps.slice(1).map(s => <article key={s.title}><h3>{s.title}</h3><p>{s.description}</p></article>)}</div></noscript></section>;
}

function About() {
  return <section id="about" className="page-wrap pb-24 md:pb-36"><div className="about-panel grid overflow-hidden rounded-2xl border border-line md:grid-cols-[.8fr_1.2fr]" data-reveal><div className="about-art relative flex min-h-80 flex-col justify-between p-8 md:p-10"><p className="eyebrow relative z-10">THE PERSON BEHIND THE SYSTEMS</p><div className="about-letter" aria-hidden="true">A<span>c.</span></div><div className="relative z-10"><p className="text-xl font-semibold">Aymane Chellak</p><p className="mt-2 text-xs text-muted">Morocco · Independent · Working worldwide</p></div></div><div className="p-8 md:p-12 lg:p-16"><Eyebrow>04 / A little about me</Eyebrow><h2 className="mt-7 text-4xl leading-[1.06] tracking-[-.05em] lg:text-5xl">A direct line from<br/>the problem to<br/><em className="font-serif text-lime">the build.</em></h2><p className="mt-7 text-sm leading-7 text-muted">AYNKO is my independent software engineering practice. I work with founders and operations teams on the products, internal tools, and connected workflows behind their day-to-day work.</p><p className="mt-4 text-sm leading-7 text-muted">I care about the whole experience: how it looks, how it works, and how it holds up when the operation grows. You work directly with the person designing and building your system.</p><a className="link-action mt-7" href={`mailto:${email}`}>Start a conversation <Arrow/></a></div></div></section>;
}

function FAQ() {
  return <section id="faq" className="page-wrap faq-section grid gap-10 border-t border-line py-20 lg:grid-cols-[.8fr_1.2fr]"><div><Eyebrow>A few things, answered</Eyebrow><h2 className="mt-5 text-4xl tracking-[-.05em] md:text-5xl">Before we<br/><em className="font-serif text-lime">get started.</em></h2></div><div>{questions.map(([q,a],i) => <details key={q} className="faq-item border-b border-line"><summary className="flex cursor-pointer items-center justify-between gap-5 py-6 text-sm font-medium"><span><span className="mr-4 text-xs text-muted">0{i+1}</span>{q}</span><span className="faq-plus text-xl text-lime" aria-hidden="true">+</span></summary><p className="max-w-xl pb-6 pl-8 text-sm leading-7 text-muted">{a}</p></details>)}</div></section>;
}

function Contact() {
  return <section id="contact" className="contact-section relative overflow-hidden"><div className="page-wrap relative z-10 py-16 md:py-24"><div className="flex flex-wrap items-center justify-between gap-5"><Eyebrow light>Open to the right collaboration</Eyebrow><span className="eyebrow">GOOD WORK STARTS WITH A CONVERSATION.</span></div><div className="mt-10 flex items-end justify-between gap-5"><h2 className="contact-title">Your next<br/>big <em>thing.</em></h2><a className="contact-arrow" href={`mailto:${email}`} aria-label="Email Aymane about your project"><Arrow/></a></div><div className="mt-12 flex flex-col justify-between gap-7 border-t border-ink/25 pt-8 md:flex-row md:items-center"><p className="max-w-sm text-sm leading-6 text-ink/75">A product to launch. A workflow to fix. An idea worth exploring. Let’s find the useful first step.</p><div className="flex flex-wrap gap-4"><button className="action action-dark" data-contact aria-haspopup="dialog">Tell me about it <Arrow/></button><a className="contact-email" href={`mailto:${email}`}>Email me directly ↗</a></div></div></div></section>;
}

function Footer() {
  return <footer className="page-wrap py-9"><div className="flex flex-wrap items-center justify-between gap-6"><a href="#home" className="flex items-center gap-2 text-lg font-bold tracking-widest" aria-label="AYNKO home"><Mark className="text-lime"/>AYNKO</a><p className="text-xs text-muted">Thoughtful software. Real-world impact.</p><a href="#home" className="link-action text-xs">Back to top ↑</a></div><div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-6 text-[10px] text-muted"><p>© 2026 AYNKO / Aymane Chellak</p><div className="flex flex-wrap gap-5"><a href="/privacy.html" className="underline underline-offset-4">Privacy</a><button type="button" data-analytics-toggle aria-pressed="false">Anonymous analytics: off</button></div></div><p id="analytics-note" role="status" className="mt-3 text-[10px] text-muted">Optional measurement. No tracking until you opt in.</p></footer>;
}

export default function App() {
  const [detail, setDetail] = useState(null);
  useEffect(() => {
    document.documentElement.classList.add('react-ready');
    const observer = new IntersectionObserver(entries => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-revealed'); observer.unobserve(e.target); } }), { threshold: .08 });
    document.querySelectorAll('[data-reveal]').forEach(e => observer.observe(e));
    const art = document.querySelector('.hero-art');
    const artObserver = new IntersectionObserver(([e]) => art.classList.toggle('art-visible', e.isIntersecting));
    artObserver.observe(art);
    // The existing secure enquiry API and consent layer initialize after hydration.
    import('../js/contact.js').catch(() => {});
    import('../js/analytics.js').catch(() => {});
    return () => { observer.disconnect(); artObserver.disconnect(); };
  }, []);
  const openCase = (item, trigger) => setDetail({ item, trigger });
  const openPillar = (pillar, trigger) => setDetail({ pillar, trigger });
  return <><a className="skip-link" href="#main">Skip to content</a><Header/><main id="main" tabIndex="-1"><Hero onPillar={openPillar}/><div className="practice-strip border-y border-line" aria-label="Practice areas"><div className="page-wrap flex flex-wrap items-center justify-between gap-5 py-6">{['PRODUCT ENGINEERING','SYSTEMS ARCHITECTURE','THOUGHTFUL INTERFACES','HUMAN-CENTERED AUTOMATION'].map(t => <span key={t} className="eyebrow flex items-center gap-4"><span className="text-lime" aria-hidden="true">✳</span>{t}</span>)}</div></div><Projects onOpen={openCase}/><Expertise/><Process/><About/><FAQ/><Contact/></main><Footer/><DetailDialog detail={detail} onClose={() => setDetail(null)} onPillar={openPillar}/></>;
}
