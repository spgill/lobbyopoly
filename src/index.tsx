import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './components/App';
import { StateManager } from './components/StateManager';

// Typeface imports
import '@ibm/plex/css/ibm-plex.min.css';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement,
);

root.render(
  <StateManager>
    <App />
  </StateManager>,
);
