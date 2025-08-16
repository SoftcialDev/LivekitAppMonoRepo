/**
 * @file Unified React entrypoint for **Web** and **Electron** builds.
 *
 * @overview
 * This file supports two bootstrapping paths, selected via an environment flag:
 *
 *  1) **Electron mode** (desktop renderer):
 *     - Initializes MSAL (Azure AD) **before** rendering.
 *     - Handles a pending `loginRedirect()` (Auth Code + PKCE) via `handleRedirectPromise()`.
 *     - Renders the app wrapped in `<MsalProvider>`.
 *
 *  2) **Web mode** (browser):
 *     - Renders the app directly (no MSAL bootstrap here), matching the existing web entrypoint.
 *
 * @env
 * Set the flag below to choose the mode:
 *   - Primary (Vite):  `VITE_IS_ELECTRON=true`
 *   - Fallback (Node): `IS_ELECTRON=true`
 * If the variable is **absent**, it defaults to **false** (i.e., Web mode).
 *
 * @notes
 * - MSAL must call `initialize()` **before** `handleRedirectPromise()`, and both must happen
 *   **before** rendering to ensure redirect responses are processed correctly.
 * - React 18+ is assumed (`ReactDOM.createRoot`).
 */

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./app/App";

/**
 * Resolves the Electron mode strictly from environment variables.
 *
 * @remarks
 * - Uses `import.meta.env.VITE_IS_ELECTRON` in Vite builds, or `process.env.IS_ELECTRON` if inlined.
 * - Any missing/unknown value resolves to `false`.
 *
 * @returns `true` iff the flag is explicitly the string `"true"`; otherwise `false`.
 */
function isElectronFlagStrict(): boolean {
  // 1) Vite-style env (string-based)
  const viteFlag =
    typeof import.meta !== "undefined" &&
    (import.meta as any)?.env?.VITE_IS_ELECTRON;

  if (typeof viteFlag === "string") {
    return viteFlag.toLowerCase() === "true";
  }

  // 2) Node-style env (may be inlined by bundler)
  if (typeof process !== "undefined" && typeof process.env?.IS_ELECTRON === "string") {
    return process.env.IS_ELECTRON.toLowerCase() === "true";
  }

  // Default: false when flag is absent
  return false;
}

/**
 * Returns the root DOM element for mounting the React tree.
 *
 * @throws If the element with ID `root` is not present in the HTML.
 */
function getRootElement(): HTMLElement {
  const el = document.getElementById("root");
  if (!el) {
    throw new Error("Root element with ID 'root' not found in HTML.");
  }
  return el;
}

/**
 * Bootstraps the **Electron** renderer:
 * - Dynamically imports MSAL dependencies to avoid bundling them in Web mode.
 * - Initializes MSAL and processes any pending redirect response.
 * - Renders the app wrapped with `<MsalProvider>`.
 *
 * @throws Propagates initialization errors to the console for diagnostics.
 */
async function bootstrapElectron(): Promise<void> {
  try {
    // Dynamic imports so Web mode doesn't include MSAL in its bundle.
    const [{ MsalProvider }, { msalInstance }] = await Promise.all([
      import("@azure/msal-react"),
      import("./shared/auth/msalConfig"),
    ]);

    // 1) Initialize the PublicClientApplication (loads cache, prepares storage, etc.)
    await msalInstance.initialize();

    /**
     * 2) Process any pending redirect response (#code=…) from a previous `loginRedirect()`.
     *    - Returns an AuthenticationResult when a response is found and processed; otherwise null.
     *    - Must run before the UI tries to read accounts/tokens.
     */
    await msalInstance.handleRedirectPromise();

    // 3) With MSAL ready, mount the React tree.
    const root = ReactDOM.createRoot(getRootElement());
    root.render(
      <React.StrictMode>
        {/* Provide the MSAL instance to React via context. */}
        <MsalProvider instance={msalInstance}>
          <App />
        </MsalProvider>
      </React.StrictMode>
    );
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("❌ Failed to initialize MSAL or handle redirect (Electron mode):", e);
  }
}

/**
 * Bootstraps the **Web** app:
 * - Renders the app directly (no explicit MSAL bootstrap here).
 */
function bootstrapWeb(): void {
  const root = ReactDOM.createRoot(getRootElement());
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

/**
 * Main dispatcher:
 * - If `VITE_IS_ELECTRON`/`IS_ELECTRON` is `"true"`, run Electron bootstrap.
 * - Otherwise, default to Web bootstrap.
 */
(function main() {
  const IS_ELECTRON = isElectronFlagStrict(); // missing flag ⇒ false
  if (IS_ELECTRON) {
    void bootstrapElectron();
  } else {
    bootstrapWeb();
  }
})();
