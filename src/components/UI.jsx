import React from 'react';

export function Arrow({ diagonal = true, className = '' }) {
  return <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d={diagonal ? 'M5 19 19 5M5 5h14v14' : 'M4 12h16m-6-6 6 6-6 6'} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
export function Mark({ className = '' }) {
  return <svg className={className} width="33" height="33" viewBox="0 0 40 40" fill="none" aria-hidden="true"><path d="m5 33 13-26h5l13 26h-8l-7-16-8 16H5Z" fill="currentColor"/><path d="M17 29h8l-4-8-4 8Z" fill="currentColor"/></svg>;
}
export function Icon({ type }) {
  return <svg width="30" height="30" viewBox="0 0 32 32" fill="none" aria-hidden="true" stroke="currentColor" strokeWidth="1.3">{type === 'grid' ? <><rect x="4" y="4" width="10" height="10" rx="2"/><rect x="18" y="4" width="10" height="10" rx="2"/><rect x="4" y="18" width="10" height="10" rx="2"/><rect x="18" y="18" width="10" height="10" rx="2"/></> : type === 'connect' ? <><circle cx="7" cy="7" r="4"/><circle cx="25" cy="25" r="4"/><path d="M11 7h9a5 5 0 0 1 0 10h-8a4 4 0 0 0 0 8h9"/></> : <path d="m16 2 4 10 10 4-10 4-4 10-4-10-10-4 10-4 4-10Z"/>}</svg>;
}
export function Eyebrow({ children, light = false }) {
  return <p className={`eyebrow flex items-center gap-3 ${light ? 'text-ink/65' : 'text-muted'}`}><span className="h-1.5 w-1.5 rounded-full bg-current"/>{children}</p>;
}
export function SectionHeading({ number, label, title, children, light = false }) {
  return <div className="section-heading mb-12 flex flex-col justify-between gap-8 md:mb-16 md:flex-row md:items-end" data-reveal><div><Eyebrow light={light}>{number} / {label}</Eyebrow><h2 className="section-title mt-5">{title}</h2></div>{children && <p className={`max-w-sm text-sm leading-7 ${light ? 'text-ink/65' : 'text-muted'}`}>{children}</p>}</div>;
}
export function ProjectImage({ name, alt, className = '', eager = false }) {
  return <img src={`/assets/optimized/${name}-1280.webp`} srcSet={`/assets/optimized/${name}-640.webp 640w, /assets/optimized/${name}-1280.webp 1280w`} sizes="(max-width: 700px) 92vw, (max-width: 1100px) 80vw, 55vw" width="1280" height="900" alt={alt} loading={eager ? 'eager' : 'lazy'} decoding="async" className={className} />;
}
