// ui/src/index.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { MsalProvider } from '@azure/msal-react';
import { msalInstance } from './config/msalConfig';
import App from './App';

async function bootstrap(): Promise<void> {
  try {
    // 1) Initialize the PublicClientApplication
    await msalInstance.initialize();

    // 2) Process any redirect response (#code=…) from loginRedirect()
    await msalInstance.handleRedirectPromise();

    // 3) Now that MSAL is ready, mount React
    const rootElement = document.getElementById('root');
    if (!rootElement) throw new Error("Root element not found");

    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <MsalProvider instance={msalInstance}>
          <App />
        </MsalProvider>
      </React.StrictMode>
    );
  } catch (e) {
    console.error('❌ Failed to initialize MSAL or handle redirect:', e);
  }
}

bootstrap();
