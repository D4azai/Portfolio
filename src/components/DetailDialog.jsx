import React, { useEffect, useRef, useState } from 'react';
import { Arrow } from './UI.jsx';
import { images } from '../../js/image-manifest.js';
import { pillars } from '../../js/pillars.js';
import { email } from '../data/portfolio.js';

export default function DetailDialog({ detail, onClose, onPillar }) {
  const ref = useRef(null);
  const [slide, setSlide] = useState(0);
  useEffect(() => {
    if (!detail) return;
    const dialog = ref.current;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.showModal();
    dialog.querySelector('button').focus();
    document.dispatchEvent(new Event('aynko:dialog'));
    return () => { dialog.close(); document.body.style.overflow = previous; detail.trigger?.focus({ preventScroll: true }); };
  }, [Boolean(detail)]);
  useEffect(() => { setSlide(0); if (ref.current) ref.current.scrollTop = 0; }, [detail?.item?.title, detail?.pillar]);
  if (!detail) return null;
  const item = detail.item;
  const pillar = detail.pillar ? pillars[detail.pillar] : null;
  const gallery = item?.gallery || [];
  const selected = gallery[slide] || gallery[0];
  const photo = selected && images[selected[0]];
  function trap(event) {
    if (event.key !== 'Tab') return;
    const controls = [...ref.current.querySelectorAll('button,a[href]')].filter(e => !e.disabled && e.getClientRects().length);
    if (event.shiftKey && document.activeElement === controls[0]) { event.preventDefault(); controls.at(-1).focus(); }
    if (!event.shiftKey && document.activeElement === controls.at(-1)) { event.preventDefault(); controls[0].focus(); }
  }
  return <dialog ref={ref} className={`detail-dialog case-dialog ${pillar ? 'pillar-dialog' : ''}`} aria-labelledby="detail-title" data-project={item?.id} onCancel={e => { e.preventDefault(); onClose(); }} onKeyDown={trap} onClick={e => { if (e.target === ref.current) onClose(); }}>
    <div className="detail-header sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-line px-6 py-4"><span className="eyebrow">AYNKO / {pillar ? 'SYSTEM THINKING' : 'PROJECT NOTES'}</span><button className="round-action" onClick={onClose} aria-label="Close project details">×</button></div>
    <div className="p-6 md:p-12">{pillar ? <><div className="mb-10 grid grid-cols-4 gap-2" role="group" aria-label="System pillars">{Object.entries(pillars).map(([key,p]) => <button key={key} className="filter-button justify-center" aria-pressed={key === detail.pillar} onClick={() => onPillar(key, detail.trigger)}>{p.label}</button>)}</div><p className="eyebrow text-lime">{pillar.number} / {pillar.category}</p><h2 id="detail-title" className="dialog-title mt-5">{pillar.title}</h2><p className="mt-6 max-w-3xl leading-8 text-muted">{pillar.intro}</p><div className="mt-10 grid gap-4 md:grid-cols-3">{pillar.steps.map(([title,body,output],i) => <article className="rounded-xl border border-line p-6" key={title}><span className="eyebrow text-lime">0{i+1}</span><h3 className="mt-6 text-xl">{title}</h3><p className="mt-4 text-sm leading-7 text-muted">{body}</p><p className="mt-6 border-t border-line pt-4 text-xs leading-6">{output}</p></article>)}</div><p className="my-8 rounded-xl bg-lime/5 p-6 leading-8">{pillar.outcome}</p></> : <><p className="eyebrow text-lime">{item.kicker}</p><h2 id="detail-title" className="dialog-title mt-5">{item.title}</h2><p className="mt-6 max-w-3xl leading-8 text-muted">{item.lede}</p><div className="my-7 flex flex-wrap gap-2">{item.tags.map(tag => <span className="tag" key={tag}>{tag}</span>)}</div>{selected && <div className="gallery"><figure className="overflow-hidden rounded-xl border border-line bg-white/5 p-3 md:p-5"><img key={selected[0]} src={photo?.src || selected[0]} srcSet={photo?.srcset} width={photo?.width} height={photo?.height} alt={selected[1]} className="mx-auto max-h-[60vh] w-full object-contain"/><figcaption className="pt-4 text-xs text-muted">{selected[1]}</figcaption></figure>{gallery.length > 1 && <div className="my-4 flex flex-wrap gap-2" role="group" aria-label="Project screenshots">{gallery.map((g,i) => <button key={g[0]} onClick={() => setSlide(i)} aria-pressed={slide === i} className="gallery-tab">{String(i+1).padStart(2,'0')} / {g[1]}</button>)}</div>}</div>}<div className="case-sections mt-10 grid gap-8 md:grid-cols-2">{item.sections.map(([title,body]) => <article key={title} className="border-t border-line pt-6"><h3 className="text-xl">{title}</h3><p className="mt-4 text-sm leading-7 text-muted">{body}</p></article>)}</div>{item.live && <a className="link-action mt-8" href={item.live} target="_blank" rel="noopener noreferrer">Visit the live project <Arrow/></a>}</>}
      <div className="mt-10 flex flex-col justify-between gap-5 border-t border-line pt-8 sm:flex-row sm:items-center"><p className="text-lg">Let’s make your next system work.</p><a className="action action-lime" href={`mailto:${email}?subject=${encodeURIComponent(`Project enquiry — ${item?.title || pillar.label}`)}`}>Discuss your project <Arrow/></a></div>
    </div>
  </dialog>;
}
