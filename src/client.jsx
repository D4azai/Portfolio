import React from 'react';
import { hydrateRoot } from 'react-dom/client';
import App, { introSeen } from './App.jsx';
import { pageForPath } from './data/pages.js';

// Flag returning visitors before hydration so the server-rendered intro never paints for them.
if (introSeen()) document.documentElement.classList.add('intro-seen');
const legacy = { work: 'work', expertise: 'expertise', method: 'process', about: 'about', contact: 'contact', faq: 'contact' };
if (location.pathname === '/' && legacy[location.hash.slice(1)]) location.replace('/' + legacy[location.hash.slice(1)]);
else hydrateRoot(document.getElementById('root'), <App page={pageForPath(location.pathname)} />);
