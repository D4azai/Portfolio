import React, { useEffect, useRef } from 'react';
import { createExperienceEffects } from '../effects/experience.js';

export default function ExperienceEffects() {
  const cursor = useRef(null), progress = useRef(null);
  useEffect(() => createExperienceEffects(cursor.current, progress.current), []);
  return <>
    <div ref={progress} className="reading-progress" aria-hidden="true"/>
    <div ref={cursor} className="experience-cursor" aria-hidden="true">
      <span className="cursor-dot"/><span className="cursor-ring"><span className="cursor-label"/></span>
    </div>
  </>;
}
