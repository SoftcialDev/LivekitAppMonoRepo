/**
 * @fileoverview Main entry point for the application
 * @summary React application bootstrap
 * @description Entry point that renders the React application.
 * Initializes React DOM and mounts the AppRouter component.
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { AppRouter } from './app/routing';
import { BootstrapError } from './shared/errors';
import './shared/styles/tailwind.css';

/**
 * Gets the root DOM element for mounting the React tree
 * 
 * @returns The root HTML element
 * @throws {BootstrapError} if the element with ID 'root' is not present
 */
function getRootElement(): HTMLElement {
  const el = document.getElementById('root');
  if (!el) {
    throw new BootstrapError(
      "Root element with ID 'root' not found in HTML. " +
        "Make sure your index.html includes a <div id='root'></div> element."
    );
  }
  return el;
}

/**
 * Bootstraps the React application
 */
function bootstrap(): void {
  const root = ReactDOM.createRoot(getRootElement());
  root.render(
    <React.StrictMode>
      <AppRouter />
    </React.StrictMode>
  );
}

// Initialize the application
bootstrap();

