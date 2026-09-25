import React, { useEffect, useState } from 'react';

const phases = [
  { title: 'Ship the approval flow.', label: 'A CONTROLLED RELEASE', body: 'Publish the tested workflow, check permissions, and keep a recovery path ready.', artifact: 'Release checklist', items: ['Permissions checked', 'Rollback prepared', 'Team briefed'], status: 'Ready for the team', version: 'v1.0' },
  { title: 'Listen to the people using it.', label: 'REAL-WORLD FEEDBACK', body: 'A reviewer needs to know who owns a request. That feedback gives the next improvement a clear purpose.', artifact: 'A useful observation', items: ['“Who owns this request?”', 'Find the missing context', 'Agree the next priority'], status: 'Feedback collected', version: 'v1.0' },
  { title: 'Make the next action clear.', label: 'A FOCUSED IMPROVEMENT', body: 'Add a visible owner and next action. Test the change, release it, and keep learning from the team.', artifact: 'The next release', items: ['Owner visible on each request', 'Next action made explicit', 'Ready for another feedback loop'], status: 'A clearer handoff', version: 'v1.1' },
];

export default function EvolutionCycle({ labels, running, reduced }) {
  const [selected, setSelected] = useState(0), [playing, setPlaying] = useState(false), [complete, setComplete] = useState(false);
  const phase = phases[selected];
  useEffect(() => {
    if (!playing || !running) return;
    if (reduced) { setSelected(2); setComplete(true); setPlaying(false); return; }
    const timer = setTimeout(() => {
      if (selected < 2) setSelected(value => value + 1);
      else { setPlaying(false); setComplete(true); }
    }, 2400);
    return () => clearTimeout(timer);
  }, [selected, playing, running, reduced]);
  function select(index) { setSelected(index); setPlaying(false); setComplete(false); }
  return <div className="release-lab" data-phase={selected} data-playing={playing && running}>
    <div className="cycle-stations" role="group" aria-label="Explore a release cycle">{labels.map((label, i) => <button key={label} aria-pressed={selected === i} onClick={() => select(i)}><span>0{i + 1}</span>{label}<i aria-hidden="true">{i < selected || complete ? '✓' : '↗'}</i></button>)}</div>
    <div className="cycle-stage scene-surface">
      <svg className="cycle-orbit" viewBox="0 0 360 270" aria-hidden="true"><ellipse cx="180" cy="142" rx="155" ry="101"/><ellipse className="cycle-orbit-inner" cx="180" cy="142" rx="137" ry="84"/><ellipse className="cycle-orbit-progress" cx="180" cy="142" rx="155" ry="101" pathLength="100" strokeDasharray={`${(selected + 1) / 3 * 100} 100`}/></svg>
      <span className="cycle-example">AN EXAMPLE / REQUEST APPROVALS</span>
      <div className="cycle-product"><div className="cycle-product-header"><span><i/> Requests</span><small>{phase.version}</small></div><div className="cycle-request"><span>REQUEST #024</span><strong>Ready for review</strong><div className="cycle-request-line"/><div className="cycle-request-line short"/></div><div className="cycle-owner" data-improved={selected === 2}><span className="cycle-avatar" aria-hidden="true">{selected === 2 ? 'A' : '?'}</span><span>{selected === 2 ? 'Owner assigned' : selected === 1 ? 'Who owns this?' : 'Awaiting review'}<small>{selected === 2 ? 'Next: review and approve' : 'A handoff worth looking at'}</small></span><span aria-hidden="true">{selected === 2 ? '✓' : '→'}</span></div></div>
      <span className="cycle-status"><i/>{playing && !running ? 'Walkthrough paused' : phase.status}</span>
    </div>
    <div className="cycle-explanation" role="status" aria-live="polite" aria-atomic="true"><span className="eyebrow">{phase.label}</span><h4>{phase.title}</h4><p>{phase.body}</p><div className="cycle-artifact"><strong>{phase.artifact}</strong><ul>{phase.items.map(item => <li key={item}><span aria-hidden="true">{selected === 1 ? '↗' : '✓'}</span>{item}</li>)}</ul></div></div>
    <div className="diagram-controls"><p>{complete ? 'A better release. Then the loop begins again.' : 'Select a stage or follow the whole example.'}</p><button className="diagram-small-button diagram-primary" onClick={() => { if (playing) setPlaying(false); else { setSelected(0); setComplete(false); setPlaying(true); } }}>{playing ? 'Stop walkthrough' : complete ? 'Replay walkthrough' : 'Run walkthrough'} <span aria-hidden="true">{playing ? 'Ⅱ' : '↗'}</span></button></div>
  </div>;
}
