import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { setupWebVitalsMonitoring } from './utils/performance';

// Setup performance monitoring
if (import.meta.env.DEV) {
  setupWebVitalsMonitoring();
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
