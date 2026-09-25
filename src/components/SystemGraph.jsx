import React, { useEffect, useRef, useState } from 'react';
import { Eyebrow } from './UI.jsx';

const nodes = [
  { name: 'People', type: 'THE STARTING POINT', x: 14, y: 50, detail: 'A customer request or a team decision starts the workflow. Every system begins with a person.' },
  { name: 'Interface', type: 'A CLEAR WAY IN', x: 38, y: 25, detail: 'A focused interface collects the right information and makes the next action clear.' },
  { name: 'Shared data', type: 'ONE SOURCE OF TRUTH', x: 63, y: 50, detail: 'Validated information connects the product, internal tools, and the people using them.' },
  { name: 'Automation', type: 'LESS REPETITION', x: 38, y: 77, detail: 'Routine handoffs happen automatically, with people staying in control of important decisions.' },
  { name: 'Outcome', type: 'USEFUL WORK, DONE', x: 87, y: 50, detail: 'The request reaches a useful result. Feedback returns to the team and shapes the next improvement.' },
];
const connections = [[0,1],[1,2],[0,3],[3,2],[2,4]];
const mobileNodes = [{x:20,y:15},{x:75,y:30},{x:75,y:65},{x:20,y:48},{x:40,y:86}];
const journeys = { product: { label: 'Product experience', nodes: [0,1,2,4], copy: 'From a person’s request to a useful product experience.' }, operations: { label: 'Connected operations', nodes: [0,3,2,4], copy: 'From a manual handoff to a connected, repeatable workflow.' } };

export default function SystemGraph() {
  const [journey, setJourney] = useState('product'), [selected, setSelected] = useState(0), [signals, setSignals] = useState(false);
  const graph = useRef(null), [visible, setVisible] = useState(false), [hidden, setHidden] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting)); observer.observe(graph.current);
    const visibility = () => setHidden(document.hidden); visibility(); document.addEventListener('visibilitychange', visibility);
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', visibility); };
  }, []);
  const current = journeys[journey], node = nodes[selected];
  const active = (a, b) => current.nodes.includes(a) && current.nodes.includes(b);
  return <section className="system-lab page-wrap section-space" aria-labelledby="system-lab-title">
    <div className="home-section-heading"><div><Eyebrow>Explore the connections</Eyebrow><h2 id="system-lab-title">The parts are good.<br/><em>The system is better.</em></h2></div><p className="system-lab-intro">Follow a request through a connected system. Choose a journey, then select a node to look inside.</p></div>
    <div className="system-lab-shell">
      <div className="system-lab-toolbar"><div role="group" aria-label="Choose a system journey">{Object.entries(journeys).map(([key, item]) => <button key={key} aria-pressed={key === journey} onClick={() => { setJourney(key); setSelected(0); }}>{item.label}</button>)}</div><span className="eyebrow">INTERACTIVE SYSTEM MAP</span></div>
      <div ref={graph} className="system-graph" data-signals={signals} data-running={visible && !hidden}>
        {[nodes, mobileNodes].map((positions, index) => <svg key={index} className={index ? 'graph-paths-mobile' : 'graph-paths-desktop'} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">{connections.map(([a,b]) => { const path = `M${positions[a].x} ${positions[a].y} C${(positions[a].x + positions[b].x) / 2} ${positions[a].y}, ${(positions[a].x + positions[b].x) / 2} ${positions[b].y}, ${positions[b].x} ${positions[b].y}`; return <g key={`${a}-${b}`} data-active={active(a,b)}><path d={path}/><path className="graph-signal" pathLength="100" d={path}/></g>; })}</svg>)}
        {nodes.map((item, i) => <button key={item.name} className="system-graph-node" style={{ '--node-x': `${item.x}%`, '--node-y': `${item.y}%`, '--node-mobile-x': `${mobileNodes[i].x}%`, '--node-mobile-y': `${mobileNodes[i].y}%` }} aria-pressed={selected === i} data-on-path={current.nodes.includes(i)} onClick={() => setSelected(i)}><span aria-hidden="true">{['↗','◫','▦','⌘','✓'][i]}</span><strong>{item.name}</strong><small>0{i + 1}</small></button>)}
        <span className="graph-caption">CONCEPTUAL WORKFLOW / SELECT A NODE</span>
      </div>
      <div className="system-lab-bottom"><div className="system-node-detail" role="status" aria-live="polite" aria-atomic="true"><span className="eyebrow">{node.type}</span><h3>{node.name}</h3><p>{node.detail}</p></div><div className="system-journey"><p>{current.copy}</p><ol aria-label="Selected journey">{current.nodes.map(i => <li key={i}><button aria-current={selected === i ? 'step' : undefined} onClick={() => setSelected(i)}>{nodes[i].name}</button></li>)}</ol><button className="diagram-small-button" aria-pressed={signals} onClick={() => setSignals(!signals)}>{signals ? 'Pause signal flow' : 'Animate signal flow'} <span aria-hidden="true">{signals ? 'Ⅱ' : '↗'}</span></button></div></div>
    </div>
  </section>;
}
