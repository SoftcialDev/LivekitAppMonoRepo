# Admin Web Application — README

This directory (`apps/admin-web`) contains the React + Vite frontend that provides administrative and monitoring views for the LiveKit streaming system.

---

## 📋 Prerequisites

* **Node.js** 18.x or higher
* **npm** or **yarn**
* An **Azure AD** App Registration for your SPA (with appropriate redirect URIs)
* A running backend API (Azure Functions) accessible at your configured `VITE_API_URL`

---

## 🚀 Running the Project

From the repository root:

1. **Navigate to the admin-web folder**

   ```bash
   cd apps/admin-web
   ```

2. **Install dependencies**

   ```bash
   npm ci
   ```

3. **Start dev server** (hot-reload)

   ```bash
   npm run dev
   ```

   The app runs at `http://localhost:5173/`

4. **Build for production**

   ```bash
   npm run build
   ```

   Artifacts output to `dist/`

5. **Preview production build locally**

   ```bash
   npm run preview
   ```

---

## ⚙️ Environment Configuration

Create a file named `.env.local` in `apps/admin-web/`:

```env
VITE_AZURE_AD_CLIENT_ID=your-spa-client-id
VITE_AZURE_AD_TENANT_ID=your-tenant-id
VITE_AZURE_AD_REDIRECT_URI=http://localhost:5173/
VITE_AZURE_AD_POST_LOGOUT_REDIRECT_URI=http://localhost:5173/
VITE_AZURE_AD_API_CLIENT_ID=your-api-client-id
VITE_AZURE_AD_API_SCOPE_URI=api://your-api-scope
VITE_API_URL=https://your-function-app.azurewebsites.net
```

> **Note:**
>
> * MSAL configuration is in `src/msalConfig.ts`.
> * Redirect URIs **must** include the trailing slash.

---

## 🏗 Application Architecture

* **Entry:** `src/App.tsx`
* **Auth:** `src/auth/AuthContext.tsx` (`@azure/msal-react`)
* **Routing:** Role-based protected routes in `App.tsx`
* **Layout:** Dashboard + Sidebar (`src/components/Sidebar.tsx`)
* **State:** Zustand
* **HTTP:** Axios
* **Styling:** Tailwind CSS

### Key Features

* **User Management** (Admins, Supervisors, PSOs)
* **Real-time Presence** via `@azure/web-pubsub-client`
* **LiveKit Video Streams** via `livekit-client`
* **Role-Based Access** (Admin, Supervisor, Employee)

---

## 💻 Technology Stack

* **React 18** + **TypeScript**
* **Vite** (dev server & build)
* **@azure/msal-browser/react** (Azure AD)
* **@azure/web-pubsub-client** (WebSocket updates)
* **Zustand** (state)
* **Axios** (API)
* **Tailwind CSS** (styles)
* **livekit-client** (video)

---

## 🚢 Deployment Configuration

We deploy to **Azure Static Web Apps** via an existing GitHub Actions workflow (`.github/workflows/deploy-admin-web.yml`). To enable it:

1. **Ensure the workflow triggers** on pushes affecting `apps/admin-web/**` and the workflow file itself:

   ```yaml
   on:
     push:
       branches: [ main ]
       paths:
         - 'apps/admin-web/**'
         - '.github/workflows/deploy-admin-web.yml'
   ```

2. **Define these GitHub Secrets** in your repository settings:

   * `VITE_AZURE_AD_CLIENT_ID`
   * `AZURE_TENANT_ID`
   * `VITE_AZURE_AD_REDIRECT_URI`
   * `VITE_AZURE_AD_POST_LOGOUT_REDIRECT_URI`
   * `VITE_AZURE_AD_API_CLIENT_ID`
   * `VITE_AZURE_AD_API_SCOPE_URI`
   * `VITE_API_URL`
   * `AZURE_STATIC_APP_DEPLOY_KEY`
   * `PERSONAL_TOKEN` (for repo comments/status, if used)

3. **Verify the deploy step** uses the Azure Static Web Apps action:

   ```yaml
   - name: Deploy to Azure Static Web Apps
     uses: Azure/static-web-apps-deploy@v1
     with:
       azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_APP_DEPLOY_KEY }}
       repo_token:                     ${{ secrets.PERSONAL_TOKEN }}
       action:                         upload
       app_location:                   apps/admin-web
       api_location:                   ''
       app_artifact_location:          dist
   ```

---

## ⚠️ Azure AD Redirect URI Configuration

* **Local Dev:** `http://localhost:5173/`
* **Production:** `https://yourdomain.com/`

> Redirect URIs must match exactly (including trailing slash) in Azure AD App Registration.

If you provision your SPA via Terraform, these URIs are set automatically.

---

## 📜 Development Scripts

* `npm run dev` — start dev server
* `npm run build` — build for production
* `npm run preview` — preview production build

---

**Notes:**

* Ensure your backend API is live at `VITE_API_URL` before logging in.
* Redirect URIs ending in `/` prevent MSAL hash errors.


---
