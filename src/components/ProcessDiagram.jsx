import React, { useEffect, useRef, useState } from 'react';
import { Mark } from './UI.jsx';

const scenes = [
  ['UNDERSTAND THE WORK', 'Map the people, decisions, and constraints before choosing a solution.', 'discovery'],
  ['DEFINE THE SYSTEM', 'Connect the data, interfaces, and integrations that support the real workflow.', 'architecture'],
  ['BUILD THE SLICE', 'Turn the plan into a focused release and test the full journey end to end.', 'build'],
  ['LEARN AND IMPROVE', 'Release with care, observe the result, and refine the next version from evidence.', 'evolution'],
];
const initialNodes = [{ x: 24, y: 27 }, { x: 75, y: 36 }, { x: 48, y: 78 }];
const notes = [
  ['People define the purpose. Start with the decisions they need to make.', 'Workflows reveal the handoffs. Follow information from input to outcome.', 'Constraints shape the plan. Surface the limits before choosing the technology.'],
  ['A shared data model gives every part of the system a consistent source of truth.', 'Interfaces translate the system into useful tools for each person and role.', 'Integrations carry information between services without repeated manual entry.'],
  ['Implement a focused slice of the product around a real workflow.', 'Test the complete journey, including permissions and failure paths.', 'Validate the result with the people who will use it.'],
  ['Release a useful improvement with a clear recovery path.', 'Observe how the system behaves in day-to-day work.', 'Improve the next release using evidence from real use.'],
];
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
function Insight({ title, children }) {
  return <div className="diagram-insight" role="status" aria-live="polite" aria-atomic="true"><span>{title}</span><p>{children}</p></div>;
}

function Discovery({ labels }) {
  const [nodes, setNodes] = useState(initialNodes), [selected, setSelected] = useState(0), [dragging, setDragging] = useState(false);
  const area = useRef(null), drag = useRef(null);
  function start(event, index) {
    if (event.button !== 0) return;
    drag.current = { index, start: nodes[index], x: event.clientX, y: event.clientY, rect: area.current.getBoundingClientRect() };
    event.currentTarget.setPointerCapture(event.pointerId); setSelected(index); setDragging(true);
  }
  function move(event) {
    if (!drag.current) return;
    const { index, start, x, y, rect } = drag.current;
    setNodes(values => values.map((node, i) => i === index ? { x: clamp(start.x + (event.clientX - x) / rect.width * 100, 18, 82), y: clamp(start.y + (event.clientY - y) / rect.height * 100, 17, 83) } : node));
  }
  function stop(event, cancel = false) {
    if (!drag.current) return;
    if (cancel) { const { index, start } = drag.current; setNodes(values => values.map((node, i) => i === index ? start : node)); }
    drag.current = null; setDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  }
  function keyboard(event, index) {
    const directions = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
    if (!directions[event.key]) return;
    event.preventDefault(); event.stopPropagation();
    const [x, y] = directions[event.key], distance = event.shiftKey ? 8 : 3; setSelected(index);
    setNodes(values => values.map((node, i) => i === index ? { x: clamp(node.x + x * distance, 18, 82), y: clamp(node.y + y * distance, 17, 83) } : node));
  }
  return <>
    <div ref={area} className="discovery-field scene-surface" data-dragging={dragging}>
      <div className="discovery-radar" aria-hidden="true"/><div className="discovery-center" aria-hidden="true"><Mark/></div>
      <svg className="discovery-links" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        {nodes.map((node, i) => <g key={i} className={selected === i ? 'is-selected' : ''}><path d={`M50 49 Q${node.x} 49 ${node.x} ${node.y}`}/><path className="connection-packet" d={`M50 49 Q${node.x} 49 ${node.x} ${node.y}`}/></g>)}
        <path className="discovery-perimeter" d={`M${nodes.map(node => `${node.x} ${node.y}`).join(' L')} Z`}/>
      </svg>
      {nodes.map((node, i) => <button key={labels[i]} className="discovery-node" style={{ left: `${node.x}%`, top: `${node.y}%` }} aria-pressed={selected === i} aria-describedby="discovery-help" onClick={() => setSelected(i)} onPointerDown={event => start(event, i)} onPointerMove={move} onPointerUp={event => stop(event)} onPointerCancel={event => stop(event, true)} onLostPointerCapture={event => stop(event, true)} onKeyDown={event => keyboard(event, i)}><span>0{i + 1} / DISCOVER</span><strong>{labels[i]}</strong><i aria-hidden="true">↗</i></button>)}
      <span className="scene-corner" aria-hidden="true">CONTEXT → CLARITY</span>
    </div>
    <div className="diagram-controls"><p id="discovery-help">Drag a node, or focus it and use arrow keys.</p><button className="diagram-small-button" onClick={() => { setNodes(initialNodes); setSelected(0); }}>Reset map</button></div>
    <Insight title={labels[selected]}>{notes[0][selected]}</Insight>
  </>;
}

function Architecture({ labels }) {
  const [spread, setSpread] = useState(40), [selected, setSelected] = useState(0), [connected, setConnected] = useState(true);
  return <>
    <div className="architecture-field scene-surface" data-connected={connected} style={{ '--layer-spread': `${spread * .6}px` }}>
      <div className="architecture-ruler" aria-hidden="true"><span>03</span><i/><span>02</span><i/><span>01</span></div>
      <div className="architecture-stack"><div className="architecture-spine" aria-hidden="true"/>
        {[2,1,0].map(i => <button key={labels[i]} className={`architecture-layer architecture-layer-${i}`} aria-pressed={selected === i} onClick={() => setSelected(i)}><span className="architecture-layer-label"><small>0{i + 1}</small><strong>{labels[i]}</strong><span aria-hidden="true">{['▦','◫','⌘'][i]}</span></span><span className="layer-traces" aria-hidden="true"><i/><i/><i/></span></button>)}
      </div><span className="scene-corner">{connected ? 'BRIDGES CONNECTED' : 'LAYERS ISOLATED'}</span>
    </div>
    <div className="diagram-controls architecture-controls"><label htmlFor="layer-spacing">Layer spacing <output>{spread}%</output><input id="layer-spacing" type="range" min="0" max="100" value={spread} onChange={event => setSpread(Number(event.target.value))}/></label><button className="diagram-small-button" aria-pressed={connected} onClick={() => setConnected(!connected)}>{connected ? 'Disconnect bridges' : 'Connect bridges'}</button></div>
    <Insight title={labels[selected]}>{connected ? notes[1][selected] : 'The layers are isolated. Connect the bridges to let information move between them.'}</Insight>
  </>;
}

function Build({ labels, running, reduced }) {
  const [completed, setCompleted] = useState(-1), [selected, setSelected] = useState(0), [playing, setPlaying] = useState(false);
  useEffect(() => {
    if (!playing || !running) return;
    if (reduced) { setCompleted(2); setSelected(2); setPlaying(false); return; }
    const timer = setTimeout(() => { const next = completed + 1; setCompleted(next); setSelected(Math.min(next + 1, 2)); if (next >= 2) setPlaying(false); }, 1000);
    return () => clearTimeout(timer);
  }, [playing, running, reduced, completed]);
  const start = () => { setCompleted(-1); setSelected(0); setPlaying(true); };
  return <>
    <div className="build-field scene-surface" data-playing={playing && running}>
      <div className="build-grid-floor" aria-hidden="true"/><div className="build-track" aria-hidden="true"><span style={{ width: `${(completed + 1) / 3 * 100}%` }}/></div>
      <div className="build-stages">{labels.map((label, i) => <button key={label} className="build-stage" data-complete={completed >= i} data-current={playing && completed + 1 === i} aria-pressed={selected === i} onClick={() => setSelected(i)}><span className="build-stage-glyph" aria-hidden="true">{completed >= i ? '✓' : ['⌘','⌁','◇'][i]}</span><small>0{i + 1}</small><strong>{label}</strong><span className="build-stage-status">{completed >= i ? 'Complete' : playing && completed + 1 === i ? (running ? 'Running' : 'Paused') : 'Ready'}</span></button>)}</div>
      <div className="build-result"><span className="build-result-dot"/><span>{completed === 2 ? 'Demo complete. Ready for real-world feedback.' : playing ? `${running ? 'Running' : 'Paused at'}: ${labels[completed + 1]}` : 'One idea. Three checks. A useful release.'}</span><strong>{Math.round((completed + 1) / 3 * 100)}%</strong></div>
      <span className="scene-corner">INTERACTIVE PROCESS DEMO</span>
    </div>
    <div className="diagram-controls"><p>Inspect a stage, or run the whole sequence.</p><button className="diagram-small-button diagram-primary" onClick={playing ? () => setPlaying(false) : start}>{playing ? 'Stop demo' : completed === 2 ? 'Run again ↗' : 'Run build ↗'}</button></div>
    <Insight title={labels[selected]}>{notes[2][selected]}{completed === 2 ? ' Demo complete.' : ''}</Insight>
  </>;
}

function Evolution({ labels }) {
  const [angle, setAngle] = useState(0), [cycle, setCycle] = useState(1), [dragging, setDragging] = useState(false);
  const dial = useRef(null), pointer = useRef(null);
  const selected = Math.floor(((angle + 60) % 360) / 120);
  function rotate(event) {
    const rect = dial.current.getBoundingClientRect();
    const degrees = Math.atan2(event.clientY - rect.top - rect.height / 2, event.clientX - rect.left - rect.width / 2) * 180 / Math.PI + 90;
    setAngle(Math.round((degrees + 360) % 360) % 360);
  }
  function start(event) {
    if (event.button !== 0) return;
    pointer.current = { id: event.pointerId, angle }; event.currentTarget.setPointerCapture(event.pointerId); setDragging(true); rotate(event);
  }
  function stop(event, cancel = false) {
    if (!pointer.current) return;
    if (cancel) setAngle(pointer.current.angle); pointer.current = null; setDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  }
  return <>
    <div className="evolution-field scene-surface" data-dragging={dragging}>
      <div ref={dial} className="evolution-dial" role="slider" tabIndex={0} aria-label="Feedback orbit" aria-valuemin={0} aria-valuemax={359} aria-valuenow={angle} aria-valuetext={`${labels[selected]}, cycle ${cycle}`} aria-describedby="evolution-help" onPointerDown={start} onPointerMove={event => { if (pointer.current?.id === event.pointerId) rotate(event); }} onPointerUp={event => stop(event)} onPointerCancel={event => stop(event, true)} onLostPointerCapture={event => stop(event, true)} onKeyDown={event => {
        const change = { ArrowRight: 10, ArrowUp: 10, ArrowLeft: -10, ArrowDown: -10, PageUp: 120, PageDown: -120 }[event.key];
        if (change !== undefined || ['Home','End'].includes(event.key)) { event.preventDefault(); event.stopPropagation(); setAngle(value => event.key === 'Home' ? 0 : event.key === 'End' ? 359 : (value + change + 360) % 360); }
      }}>
        <div className="evolution-rings" aria-hidden="true"/><div className="evolution-hand" style={{ transform: `rotate(${angle}deg)` }} aria-hidden="true"><i/></div>
        <div className="evolution-core" aria-hidden="true"><small>ITERATION</small><strong>{String(cycle).padStart(2,'0')}</strong><span>{labels[selected]}</span></div>
      </div>
      <div className="evolution-stops" role="group" aria-label="Explore the feedback loop">{labels.map((label, i) => <button key={label} className={`evolution-stop stop-${i}`} aria-pressed={selected === i} onClick={() => setAngle(i * 120)}><span>0{i + 1}</span>{label}</button>)}</div>
      <span className="scene-corner">RELEASE → LEARN → REPEAT</span>
    </div>
    <div className="diagram-controls"><p id="evolution-help">Drag the dial, use arrow keys, or select a phase.</p><button className="diagram-small-button" onClick={() => { setCycle(value => value + 1); setAngle(0); }}>Next iteration ↗</button></div>
    <Insight title={`${labels[selected]} / Cycle ${cycle}`}>{notes[3][selected]}</Insight>
  </>;
}

export default function ProcessDiagram({ step, labels }) {
  const host = useRef(null);
  const [paused, setPaused] = useState(false), [visible, setVisible] = useState(false), [hidden, setHidden] = useState(false), [reduced, setReduced] = useState(false);
  const [name, hint, kind] = scenes[step];
  const reset = () => { ['--diagram-x','--diagram-y','--light-x','--light-y'].forEach(property => host.current?.style.removeProperty(property)); };
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting)); observer.observe(host.current);
    const visibility = () => setHidden(document.hidden); visibility(); document.addEventListener('visibilitychange', visibility);
    const preference = matchMedia('(prefers-reduced-motion: reduce)');
    const motion = () => { setReduced(preference.matches); reset(); }; motion(); preference.addEventListener('change', motion);
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', visibility); preference.removeEventListener('change', motion); };
  }, []);
  useEffect(reset, [step]);
  function move(event) {
    if (event.pointerType !== 'mouse' || paused || reduced || event.buttons) return;
    const box = host.current.getBoundingClientRect(), x = (event.clientX - box.left) / box.width, y = (event.clientY - box.top) / box.height;
    host.current.style.setProperty('--diagram-y', `${x * 12 - 6}deg`); host.current.style.setProperty('--diagram-x', `${6 - y * 12}deg`);
    host.current.style.setProperty('--light-x', `${x * 100}%`); host.current.style.setProperty('--light-y', `${y * 100}%`);
  }
  const running = !paused && visible && !hidden;
  return <div ref={host} className={`process-diagram diagram-3d diagram-playground scene-${kind}`} data-step={step} data-paused={!running} onPointerMove={move} onPointerLeave={reset}>
    <div className="diagram-toolbar"><span className="eyebrow">0{step + 1} / {name}</span><button aria-label={paused ? 'Resume diagram animation' : 'Pause diagram animation'} aria-pressed={paused} onClick={() => { setPaused(!paused); reset(); }}>{paused ? 'PLAY' : 'PAUSE'}</button></div>
    <p className="diagram-invitation">{hint}</p>
    <div className="diagram-experiment" key={step}>
      {step === 0 && <Discovery labels={labels}/>}{step === 1 && <Architecture labels={labels}/>}
      {step === 2 && <Build labels={labels} running={running} reduced={reduced}/>}{step === 3 && <Evolution labels={labels}/>}
    </div>
  </div>;
}
