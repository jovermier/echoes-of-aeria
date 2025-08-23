// Main Entry Point - React + Phaser Integration
// Following Game Architect specifications for modern architecture

import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './ui/App.js';
import './style.css';

// Initialize the application
function initializeApp() {
  const container = document.getElementById('app');
  
  if (!container) {
    throw new Error('App container not found');
  }

  // Create React root and render app
  const root = createRoot(container);
  root.render(<App />);

  console.log('Echoes of Aeria - Application initialized');
}

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}

// Handle any unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  event.preventDefault();
});

// Handle any uncaught errors
window.addEventListener('error', (event) => {
  console.error('Uncaught error:', event.error);
});

export {};