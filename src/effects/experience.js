// Event-driven effects: no React renders on pointer movement and no idle RAF loop.
export function createExperienceEffects(cursor, progress) {
  const root = document.documentElement;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const contrast = matchMedia('(forced-colors: active)');
  const label = cursor.querySelector('.cursor-label');
  const ring = cursor.querySelector('.cursor-ring');
  const dot = cursor.querySelector('.cursor-dot');
  const observed = [...document.querySelectorAll('.section-heading,.service-row,.project-showcase,.process-panel,.about-panel,.faq-item,.contact-section,.profile-desk,.challenge-result,.cinematic-section,.home-section-heading,.home-directory,.page-next')];
  let raf = 0, scrollFrame = 0, shown = false, x = 0, y = 0, targetX = 0, targetY = 0;
  let field = null, fieldRect = null, magnetic = null, magneticRect = null;
  let mode = '', enabled = false, modal = false;
  const cleanField = () => {
    if (!field) return;
    field.removeAttribute('data-pointer-active');
    ['--pointer-x','--pointer-y','--tilt-x','--tilt-y'].forEach(key => field.style.removeProperty(key));
    field = fieldRect = null;
  };
  const cleanMagnet = () => {
    if (!magnetic) return;
    magnetic.style.removeProperty('--magnet-x'); magnetic.style.removeProperty('--magnet-y');
    magnetic = magneticRect = null;
  };
  function hide() {
    shown = false; cursor.classList.remove('is-visible'); root.classList.remove('cursor-active');
    cancelAnimationFrame(raf); raf = 0; cleanField(); cleanMagnet();
  }
  function draw() {
    raf = 0;
    if (!shown || document.hidden) return;
    x += (targetX - x) * .24; y += (targetY - y) * .24;
    ring.style.transform = `translate3d(${x}px,${y}px,0)`;
    if (Math.abs(targetX - x) + Math.abs(targetY - y) > .15) raf = requestAnimationFrame(draw);
  }
  function move(event) {
    if (!enabled || event.pointerType !== 'mouse' || modal) { hide(); return; }
    const target = event.target instanceof Element ? event.target : null;
    if (!target || target.closest('input,textarea,select,[contenteditable="true"],iframe') || event.clientX >= root.clientWidth) { hide(); return; }
    targetX = event.clientX; targetY = event.clientY;
    if (!shown) { x = targetX; y = targetY; shown = true; cursor.classList.add('is-visible'); root.classList.add('cursor-active'); }
    dot.style.transform = `translate3d(${targetX}px,${targetY}px,0)`;
    const custom = target.closest('[data-cursor]');
    const nextMode = custom ? 'label' : target.closest('a,button,summary,[role="tab"]') ? 'link' : 'default';
    const nextLabel = custom?.dataset.cursor || '';
    if (mode !== nextMode || label.textContent !== nextLabel) {
      mode = nextMode; cursor.dataset.mode = mode; label.textContent = nextLabel;
    }
    cursor.dataset.theme = target.closest('.light-section,.contact-section,.studio-profile,.solution-sheet,.brief-note') ? 'dark' : 'light';
    const nextField = target.closest('.showcase-media,.service-row,.about-art,.contact-section,.profile-desk,.challenge-result');
    if (nextField !== field) {
      cleanField(); field = nextField; fieldRect = field?.getBoundingClientRect();
    }
    if (field && fieldRect?.width) {
      const px = Math.max(0, Math.min(1, (targetX - fieldRect.left) / fieldRect.width));
      const py = Math.max(0, Math.min(1, (targetY - fieldRect.top) / fieldRect.height));
      field.dataset.pointerActive = 'true';
      field.style.setProperty('--pointer-x', `${(px * 100).toFixed(2)}%`);
      field.style.setProperty('--pointer-y', `${(py * 100).toFixed(2)}%`);
      field.style.setProperty('--tilt-x', `${((.5 - py) * 7).toFixed(2)}deg`);
      field.style.setProperty('--tilt-y', `${((px - .5) * 9).toFixed(2)}deg`);
    }
    const nextMagnet = target.closest('.action,.header-cta,.contact-arrow,.showcase-controls button');
    if (nextMagnet !== magnetic) {
      cleanMagnet(); magnetic = nextMagnet; magneticRect = magnetic?.getBoundingClientRect();
    }
    if (magnetic && magneticRect?.width) {
      const mx = Math.max(-5, Math.min(5, (targetX - magneticRect.left - magneticRect.width / 2) * .13));
      const my = Math.max(-4, Math.min(4, (targetY - magneticRect.top - magneticRect.height / 2) * .13));
      magnetic.style.setProperty('--magnet-x', `${mx}px`); magnetic.style.setProperty('--magnet-y', `${my}px`);
    }
    if (!raf) raf = requestAnimationFrame(draw);
  }
  function updateScroll() {
    scrollFrame = 0;
    const max = root.scrollHeight - innerHeight;
    const ratio = max > 0 ? Math.max(0, Math.min(1, scrollY / max)) : 0;
    progress.style.transform = `scaleX(${ratio})`;
    if (!enabled || modal) return;
    for (const [element, property, amount] of [
      [document.querySelector('.about-art'), '--about-shift', 24],
      [document.querySelector('.contact-section'), '--contact-shift', 35],
    ]) {
      if (!element) continue;
      const rect = element.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > innerHeight) continue;
      const value = (rect.top + rect.height / 2 - innerHeight / 2) / innerHeight;
      element.style.setProperty(property, `${Math.max(-1, Math.min(1, value)) * amount}px`);
    }
  }
  function scroll() {
    // Scrolling changes the element under a stationary mouse. Reset stale hit targets.
    hide();
    if (!scrollFrame) scrollFrame = requestAnimationFrame(updateScroll);
  }
  function configure() {
    enabled = fine.matches && !motion.matches && !contrast.matches;
    root.dataset.effects = motion.matches ? 'reduced' : 'full';
    if (!enabled) {
      hide();
      document.querySelector('.about-art')?.style.removeProperty('--about-shift');
      document.querySelector('.contact-section')?.style.removeProperty('--contact-shift');
    }
    updateScroll();
  }
  function visibility() { root.dataset.pageHidden = String(document.hidden); if (document.hidden) hide(); else updateScroll(); }
  function keydown(event) { if (['Tab','Escape'].includes(event.key)) hide(); }
  function pressed() { cursor.classList.add('is-pressed'); }
  function released() { cursor.classList.remove('is-pressed'); }
  function syncModal() { modal = !!document.querySelector('dialog[open]'); if (modal) hide(); }
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
    entry.target.classList.toggle('effect-visible', entry.isIntersecting);
    if (entry.isIntersecting) entry.target.classList.add('effect-entered');
  }), { threshold: .12 });
  observed.forEach((element, index) => {
    element.style.setProperty('--entry-delay', `${element.matches('.service-row,.faq-item') ? (index % 3) * 65 : 0}ms`);
    observer.observe(element);
  });
  const dialogs = new MutationObserver(syncModal);
  dialogs.observe(document.body, {subtree:true, attributes:true, attributeFilter:['open'], childList:true});
  root.classList.add('effects-ready'); configure(); syncModal(); visibility();
  document.addEventListener('pointermove', move, {passive:true});
  document.addEventListener('pointerdown', pressed, {passive:true});
  document.addEventListener('pointerup', released, {passive:true});
  document.addEventListener('pointercancel', hide);
  document.addEventListener('pointerleave', hide);
  document.addEventListener('keydown', keydown);
  document.addEventListener('visibilitychange', visibility);
  window.addEventListener('blur', hide);
  window.addEventListener('scroll', scroll, {passive:true});
  window.addEventListener('resize', scroll);
  motion.addEventListener('change', configure); fine.addEventListener('change', configure); contrast.addEventListener('change', configure);
  return () => {
    hide(); cancelAnimationFrame(scrollFrame); observer.disconnect(); dialogs.disconnect();
    root.classList.remove('effects-ready'); delete root.dataset.effects; delete root.dataset.pageHidden;
    observed.forEach(element => { element.classList.remove('effect-entered','effect-visible'); element.style.removeProperty('--entry-delay'); });
    document.removeEventListener('pointermove', move); document.removeEventListener('pointerdown', pressed);
    document.removeEventListener('pointerup', released); document.removeEventListener('pointercancel', hide);
    document.removeEventListener('pointerleave', hide); document.removeEventListener('keydown', keydown);
    document.removeEventListener('visibilitychange', visibility); window.removeEventListener('blur', hide);
    window.removeEventListener('scroll', scroll); window.removeEventListener('resize', scroll);
    motion.removeEventListener('change', configure); fine.removeEventListener('change', configure); contrast.removeEventListener('change', configure);
  };
}
