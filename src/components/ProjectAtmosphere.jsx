import React from 'react';

// Decorative motifs drawn for each subject, not mock product data or metrics.
export default function ProjectAtmosphere({ id }) {
  return <div className={`project-atmosphere atmosphere-${id}`} aria-hidden="true">
    <svg viewBox="0 0 720 540" preserveAspectRatio="xMidYMid slice">
      {id === 'affiliate' && <g className="route-network">
        <path className="effect-trace" pathLength="1" d="M-20 420H100Q150 420 150 370V160Q150 115 200 115H510Q555 115 555 160V370Q555 420 600 420H750"/>
        <path d="M50 50H250V485H485V50H665M15 280H705" strokeDasharray="3 8"/>
        {[[150,180],[250,115],[485,280],[555,370]].map(([x,y]) => <g key={x}><circle cx={x} cy={y} r="17"/><circle className="network-node" cx={x} cy={y} r="5"/></g>)}
      </g>}
      {id === 'studioNorth' && <g className="finance-waves">
        {[0,1,2,3,4].map(i => <path key={i} className="effect-trace" pathLength="1" style={{'--trace-delay':`${i * 100}ms`}} d={`M-20 ${460-i*20}C160 ${500-i*20} 180 ${80-i*10} 380 ${210-i*10}S590 ${380-i*20} 750 ${60+i*10}`}/>)}
        <circle cx="590" cy="112" r="90"/><circle cx="590" cy="112" r="110" strokeDasharray="2 8"/>
      </g>}
      {id === 'erp' && <g className="blueprint-lines">
        <path className="effect-trace" pathLength="1" d="M80 490V100H585V450H420V300H240V490ZM80 205H585M350 100V300M420 205V80M240 300H80"/>
        <path d="M55 100V490M80 75H585M40 100H70M40 490H70M80 60V90M585 60V90" strokeDasharray="3 5"/>
        <circle cx="580" cy="445" r="62"/><path d="M500 445H660M580 365V525"/>
      </g>}
      {id === 'crm' && <g className="relationship-lines">
        <path className="effect-trace" pathLength="1" d="M100 105H280Q330 105 330 155V250Q330 300 380 300H625M330 230H175Q130 230 130 275V455M410 300V420H570"/>
        {[[100,105],[625,300],[130,455],[570,420],[330,195]].map(([x,y]) => <g key={x}><rect x={x-18} y={y-18} width="36" height="36" rx="12"/><circle className="network-node" cx={x} cy={y} r="4"/></g>)}
      </g>}
      {id === 'northstar' && <g className="celestial-lines">
        <circle cx="385" cy="250" r="165"/><circle cx="385" cy="250" r="220" strokeDasharray="2 12"/>
        <ellipse className="effect-trace" pathLength="1" cx="385" cy="250" rx="315" ry="110" transform="rotate(-32 385 250)"/>
        <path d="M585 48V88M565 68H605M130 435V455M120 445H140"/>
      </g>}
    </svg>
    <span className="project-sheen"/>
  </div>;
}
