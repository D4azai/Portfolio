import React from 'react';
import { hydrateRoot } from 'react-dom/client';
import App, { introSeen } from './App.jsx';

// Flag returning visitors before hydration so the server-rendered intro never paints for them.
if (introSeen()) document.documentElement.classList.add('intro-seen');
hydrateRoot(document.getElementById('root'), <App />);
