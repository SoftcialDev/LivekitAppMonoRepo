# In Contact Web - Frontend Application

React-based web application for Personnel Safety Officer (PSO) monitoring and management system with real-time video streaming, user management, and administrative features.

## Architecture Overview

This application follows **Screaming Architecture** principles, organizing code by feature/domain rather than technical layers. Each module is self-contained with its own API clients, components, hooks, pages, routes, stores, types, and utilities.

### Module Structure

Each module in `modules/` follows a consistent structure:

```
modules/{module-name}/
├── api/                    # API clients for module endpoints
├── components/             # Module-specific React components
│   └── types/             # Component type definitions
├── constants/             # Module constants (retry intervals, etc.)
├── contexts/              # React contexts (if needed)
├── enums/                 # Module enumerations
├── errors/                # Module-specific error classes
├── hooks/                 # Custom React hooks
├── interfaces/            # Module interfaces (contracts)
├── pages/                 # Page components
│   ├── constants/         # Page-specific constants
│   └── {PageName}.tsx
├── routes.tsx             # Route definitions (returns RouteObject[])
├── services/              # Services (localStorage, API wrappers)
├── stores/                # Module-specific Zustand stores
│   └── {store-name}/
│       ├── constants/
│       ├── types/
│       ├── hooks/
│       └── use{Store}Store.ts
├── types/                 # Module type definitions (data structures)
├── utils/                 # Module utilities
└── index.ts               # Barrel export (public API)
```

### Application Structure

```
src/
├── app/                    # Application configuration and bootstrap
│   ├── layouts/           # Layout components (DashboardLayout)
│   ├── routing/           # Router configuration (AppRouter, routes)
│   ├── providers/         # Global providers (WebSocketProvider)
│   └── stores/            # App-level Zustand stores
│       └── {store-name}/
│           ├── constants/
│           ├── types/
│           ├── hooks/
│           └── use{Store}Store.ts
├── modules/               # Feature modules (Screaming Architecture)
│   └── {module-name}/     # Self-contained modules
├── shared/                # Shared utilities and infrastructure
│   ├── api/              # API client base (apiClient.ts)
│   ├── config/           # Configuration management
│   ├── errors/           # Shared error classes
│   ├── enums/            # Shared enumerations
│   ├── services/         # Shared services (WebSocket)
│   ├── types/            # Shared type definitions
│   └── utils/            # Shared utilities (logger, time, etc.)
└── ui-kit/               # Reusable UI components (generic, feature-agnostic)
    └── {component-name}/
        ├── components/   # Sub-components (if needed)
        ├── types/        # Component type definitions
        └── {Component}.tsx
```

## Core Principles

### Screaming Architecture

Code is organized by feature/domain, not by technical layer:
- Each module contains everything it needs (API, components, hooks, stores)
- Modules are self-contained and can be understood independently
- Technical details (React, Zustand, etc.) are implementation details

### Type Organization

Separate `enums`, `types`, and `interfaces` into different directories:

- **`enums/`**: Fixed sets of constant values (e.g., `UserRole`, `ErrorSeverity`)
- **`types/`**: Data structures and type definitions (e.g., `UserInfo`, request/response types)
- **`interfaces/`**: Contracts/ports that define behavior (e.g., `IAuthContextValue`)

### Routing Pattern

Use React Router Data API with `createBrowserRouter`:

```typescript
// modules/auth/routes.tsx
import type { RouteObject } from 'react-router-dom';
import { LoginPage, LoadingPage } from './pages';

export function authRoutes(): RouteObject[] {
  return [
    { path: '/login', element: <LoginPage /> },
    { path: '/loading', element: <LoadingPage /> },
  ];
}

// app/routing/AppRouter.tsx
import { createBrowserRouter } from 'react-router-dom';
import { authRoutes } from '@/modules/auth/routes';

const router = createBrowserRouter([
  {
    element: <AppProviders />,
    children: [
      ...authRoutes(),
      // ... other routes
    ],
  },
]);
```

### State Management

Use Zustand for frequently updated state, Context API for provider configuration:

- **Zustand**: Global state that updates frequently (e.g., header info, user info)
- **Context API**: Provider configuration (e.g., `AuthProvider`, `ToastProvider`)

Store organization:

```
stores/{store-name}/
├── constants/
│   └── {store}Constants.ts
├── types/
│   └── {store}StoreTypes.ts
├── hooks/
│   └── use{HookName}.ts
├── use{Store}Store.ts
└── index.ts
```

### Error Handling

Use domain-specific error classes, never generic `Error`:

```typescript
import { ContextError } from '@/shared/errors';

if (!context) {
  throw new ContextError('useAuth must be used within an AuthProvider');
}
```

### Logging

Use structured logging functions, never `console.*`:

```typescript
import { logInfo, logError, logDebug, logWarn } from '@/shared/utils/logger';

logError('Failed to load user data', { error, attempt: 1 });
logDebug('Scheduling retry', { delayMs: 5000 });
```

### Configuration Access

Access configuration through `config` module, never `import.meta.env` directly:

```typescript
import { config } from '@/shared/config';
const apiUrl = config.apiUrl;
```

## React Hooks Best Practices

### Preventing Infinite Loops

Never include functions from hooks or Zustand stores directly in dependency arrays:

```typescript
// Incorrect - causes infinite loops
useEffect(() => {
  loadUserInfo();
}, [loadUserInfo]); // loadUserInfo changes on every render

// Correct - use getState() for stable references
useEffect(() => {
  const loadUserInfo = useUserInfoStore.getState().loadUserInfo;
  loadUserInfo();
}, [account]); // Only depend on primitive values

// Correct - use refs to track if already called
const hasTriggeredRef = useRef<boolean>(false);
useEffect(() => {
  if (!hasTriggeredRef.current && account) {
    hasTriggeredRef.current = true;
    retryLoadUserInfo();
  }
}, [account]);
```

### useCallback Dependencies

Avoid including state values that change frequently in `useCallback` dependencies:

```typescript
// Incorrect - causes function to be recreated constantly
const retryLoadUserInfo = useCallback(async () => {
  if (isRetrying) return;
  await loadUserInfo();
}, [isRetrying, loadUserInfo]); // Both change frequently

// Correct - use refs for checking state, no dependencies
const isRetryingRef = useRef<boolean>(false);
const retryLoadUserInfo = useCallback(async () => {
  if (isRetryingRef.current) return;
  const loadUserInfo = useUserInfoStore.getState().loadUserInfo;
  await loadUserInfo();
}, []); // No dependencies - use refs and getState()
```

### Preventing Multiple API Calls

Always use refs to prevent multiple concurrent calls:

```typescript
const hasTriggeredRef = useRef<boolean>(false);
const accountIdRef = useRef<string | null>(null);

useEffect(() => {
  if (!account) return;
  
  const currentAccountId = account.localAccountId;
  
  // Only trigger once per account
  if (!hasTriggeredRef.current && accountIdRef.current !== currentAccountId) {
    hasTriggeredRef.current = true;
    accountIdRef.current = currentAccountId;
    retryLoadUserInfo();
  }
}, [account]);
```

### Zustand Store Selectors

Always use `getState()` for functions to avoid recreating them:

```typescript
// Incorrect - selector returns new function reference each time
const { loadUserInfo } = useUserInfoStore((state) => ({
  loadUserInfo: state.loadUserInfo,
})); // Returns new object, causes re-renders

// Correct - use getState() when calling inside callbacks/hooks
const retryLoadUserInfo = useCallback(async () => {
  const loadUserInfo = useUserInfoStore.getState().loadUserInfo;
  await loadUserInfo();
}, []); // Stable function

// Correct - use single selector if you need state + methods
const { userInfo, isLoading } = useUserInfoStore((state) => ({
  userInfo: state.userInfo,
  isLoading: state.isLoading,
})); // OK for reading state
```

## API Client

All API requests use the centralized `apiClient` from `shared/api/apiClient.ts`:

```typescript
import { apiClient } from '@/shared/api/apiClient';

// GET request
const response = await apiClient.get<UserInfo>('/api/GetCurrentUser');

// POST request
const response = await apiClient.post<CreateUserResponse>('/api/CreateUser', data);

// Error handling
try {
  const response = await apiClient.get('/api/Users');
} catch (error) {
  if (error instanceof UnauthorizedError) {
    // Handle unauthorized
  } else if (error instanceof NotFoundError) {
    // Handle not found
  }
}
```

The API client automatically:
- Injects Bearer tokens from registered token getter
- Transforms HTTP errors into typed error classes
- Handles request timeouts
- Preserves original API error messages

## Adding a New Module

Follow these steps to add a new feature module:

### 1. Create Module Structure

Create the module directory structure:

```bash
modules/new-module/
├── api/
├── components/
│   └── types/
├── constants/
├── enums/
├── errors/
├── hooks/
├── interfaces/
├── pages/
│   └── constants/
├── routes.tsx
├── services/
├── stores/
├── types/
├── utils/
└── index.ts
```

### 2. Create Types

Define types, enums, and interfaces:

```typescript
// modules/new-module/enums/Status.ts
export enum Status {
  Active = 'Active',
  Inactive = 'Inactive',
}

// modules/new-module/types/newModuleTypes.ts
export interface Item {
  id: string;
  name: string;
  status: Status;
}

// modules/new-module/interfaces/newModuleInterfaces.ts
export interface IUseItemsReturn {
  items: Item[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}
```

### 3. Create API Client

Create API client functions:

```typescript
// modules/new-module/api/itemsClient.ts
import { apiClient } from '@/shared/api/apiClient';
import type { Item } from '../types/newModuleTypes';

export async function getItems(): Promise<Item[]> {
  const response = await apiClient.get<Item[]>('/api/Items');
  return response.data;
}
```

### 4. Create Store (if needed)

Create Zustand store:

```typescript
// modules/new-module/stores/items-store/types/itemsStoreTypes.ts
export interface IItemsStore {
  items: Item[];
  isLoading: boolean;
  error: Error | null;
  loadItems: () => Promise<void>;
  setItems: (items: Item[]) => void;
}

// modules/new-module/stores/items-store/useItemsStore.ts
import { create } from 'zustand';
import type { IItemsStore } from './types/itemsStoreTypes';
import { getItems } from '../../api/itemsClient';

export const useItemsStore = create<IItemsStore>((set) => ({
  items: [],
  isLoading: false,
  error: null,
  loadItems: async () => {
    set({ isLoading: true, error: null });
    try {
      const items = await getItems();
      set({ items, isLoading: false });
    } catch (error) {
      set({ error: error as Error, isLoading: false });
    }
  },
  setItems: (items) => set({ items }),
}));
```

### 5. Create Custom Hooks

Create hooks for consuming the store:

```typescript
// modules/new-module/hooks/useItems.ts
import { useEffect } from 'react';
import { useItemsStore } from '../stores/items-store/useItemsStore';

export function useItems() {
  const { items, isLoading, error, loadItems } = useItemsStore();
  
  useEffect(() => {
    const load = useItemsStore.getState().loadItems;
    load();
  }, []);
  
  return { items, isLoading, error };
}
```

### 6. Create Components

Create React components:

```typescript
// modules/new-module/components/ItemList.tsx
import React from 'react';
import { useItems } from '../hooks/useItems';

export const ItemList: React.FC = () => {
  const { items, isLoading, error } = useItems();
  
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return (
    <ul>
      {items.map((item) => (
        <li key={item.id}>{item.name}</li>
      ))}
    </ul>
  );
};
```

### 7. Create Pages

Create page components:

```typescript
// modules/new-module/pages/ItemsPage.tsx
import React from 'react';
import { ItemList } from '../components/ItemList';

export const ItemsPage: React.FC = () => {
  return (
    <div>
      <h1>Items</h1>
      <ItemList />
    </div>
  );
};
```

### 8. Create Routes

Create route definitions:

```typescript
// modules/new-module/routes.tsx
import type { RouteObject } from 'react-router-dom';
import { ItemsPage } from './pages/ItemsPage';

export function newModuleRoutes(): RouteObject[] {
  return [
    {
      path: '/items',
      element: <ItemsPage />,
    },
  ];
}
```

### 9. Register Routes

Add routes to `AppRouter`:

```typescript
// app/routing/AppRouter.tsx
import { newModuleRoutes } from '@/modules/new-module/routes';

const router = createBrowserRouter([
  {
    element: <AppProviders />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          ...newModuleRoutes(),
          // ... other routes
        ],
      },
    ],
  },
]);
```

### 10. Create Barrel Export

Create `index.ts` for public API:

```typescript
// modules/new-module/index.ts
export * from './pages';
export * from './components';
export * from './hooks';
export * from './stores';
export * from './types';
export * from './routes';
```

## Prerequisites

Before running this project, ensure the following are installed:

- **Node.js 18.x** or higher
- **npm** or **yarn**
- Azure AD App Registration configured for SPA
- Backend API running and accessible

## Installation

```bash
cd apps/in-contact-web
npm ci
```

## Configuration

Create `.env.local` file:

```env
VITE_AZURE_AD_CLIENT_ID=your-client-id
VITE_AZURE_AD_TENANT_ID=your-tenant-id
VITE_AZURE_AD_REDIRECT_URI=http://localhost:5173/
VITE_AZURE_AD_POST_LOGOUT_REDIRECT_URI=http://localhost:5173/
VITE_AZURE_AD_API_CLIENT_ID=your-api-client-id
VITE_AZURE_AD_API_SCOPE_URI=api://your-api-id/access_as_user
VITE_API_URL=http://localhost:7071
```

## Running Locally

```bash
npm run dev
```

This launches the application on `http://localhost:5173`.

## Building for Production

```bash
npm run build
```

Build output is generated in `dist/` directory.

## Key Scripts

| Script              | Description                      |
| ------------------- | -------------------------------- |
| `npm run dev`       | Starts development server        |
| `npm run build`     | Builds for production            |
| `npm run preview`   | Previews production build        |
| `npm run lint`      | Runs ESLint                      |

## Dependencies

| Package              | Purpose                    |
| -------------------- | -------------------------- |
| `react`              | UI framework               |
| `react-router-dom`   | Routing                    |
| `zustand`            | State management           |
| `axios`              | HTTP client                |
| `@azure/msal-react`  | Azure AD authentication    |
| `livekit-client`     | Real-time video streaming  |
| `tailwindcss`        | CSS framework              |

## Notes

- All modules follow Screaming Architecture principles
- Each module is self-contained with its own API, components, hooks, and stores
- Routes use React Router Data API (`createBrowserRouter`)
- State management uses Zustand for frequently updated state, Context API for providers
- All errors extend domain-specific error classes
- All logging uses structured logging functions
- Configuration accessed through `config` module, never `import.meta.env` directly
- Use `getState()` for Zustand functions in callbacks to prevent infinite loops
- Use refs to prevent multiple API calls and track state without causing re-renders
