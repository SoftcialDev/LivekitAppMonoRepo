import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

/**
 * Entry point for the React application.
 *
 * - Selects the HTML element with ID 'root' as the mount node.
 * - Creates a React root using ReactDOM.createRoot.
 * - Renders the <App /> component wrapped in <React.StrictMode>.
 *
 * React.StrictMode activates additional checks and warnings for its children
 * during development (no effect in production builds).
 */
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Root element with ID 'root' not found in HTML.");
}

/**
 * Create the React application root.
 * 
 * React 18+ uses createRoot instead of the older ReactDOM.render.
 * The generic type parameter is inferred from the JSX element rendered.
 */
const root = ReactDOM.createRoot(rootElement);

/**
 * Render the application.
 * 
 * - <React.StrictMode> is a wrapper that activates extra checks and warnings
 *   for its descendants during development mode. It does not render any UI itself
 *   and has no effect in production.
 * - <App /> is the root component of the application, containing routing, context providers, etc.
 */
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
