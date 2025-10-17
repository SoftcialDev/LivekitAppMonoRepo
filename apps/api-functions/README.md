# 📡 LiveKit Azure Serverless API

This repository contains an **Azure Functions backend** used in a LiveKit-based monitoring system. It provides APIs for:

* 🎥 Real-time video streaming with LiveKit
* 🔄 Camera command dispatch (via WebPubSub + Service Bus)
* 🟢 Presence tracking using WebSockets
* 👤 Role-based user access and Azure AD integration
* 🧭 Real-time WebSocket communication events

---

## 🧰 Prerequisites

Before running this project, ensure the following are installed:

* **Node.js 20.x**

* **Azure Functions Core Tools v4**
  Install with:

  ```bash
  npm install -g azure-functions-core-tools@4 --unsafe-perm true
  ```

* **PostgreSQL** (local or remote)

* **AWPS CLI (Azure Web PubSub Tunnel CLI)**
  [Install Guide](https://learn.microsoft.com/en-us/azure/azure-web-pubsub/howto-troubleshoot-localhost-websocket#use-awps-tunnel-cli)

* Azure Services Set Up:

  * Azure Web PubSub (with **event handler** configured)
  * Azure Service Bus (Topic + Subscription)
  * Azure AD App Registration + user groups

---

## 📦 Installation

```bash
cd apps/api-functions
npm ci
```

Build the TypeScript code:

```bash
npm run build
```

Generate Prisma client:

```bash
npm run prisma:generate
```

Apply database migrations:

```bash
npm run migrate:deploy
```

---

## ⚙️ Configuration

### 1. Copy the Configuration Template

```bash
cp local.settings.example.json local.settings.json
```

### 2. Fill Out Your Environment Variables

Edit `local.settings.json` with your actual values. Here's how to get each value:

#### Azure AD Configuration
- **AZURE_CLIENT_ID**: Your Azure AD app registration client ID
- **AZURE_CLIENT_SECRET**: Client secret from your Azure AD app
- **AZURE_TENANT_ID**: Your Azure AD tenant ID
- **AZURE_AD_API_IDENTIFIER_URI**: API identifier URI (e.g., `api://your-app-id/livekit-app-api`)

#### Azure AD Group IDs
- **ADMINS_GROUP_ID**: Azure AD group ID for admin users
- **EMPLOYEES_GROUP_ID**: Azure AD group ID for employee users  
- **SUPERVISORS_GROUP_ID**: Azure AD group ID for supervisor users
- **SERVICE_PRINCIPAL_OBJECT_ID**: Service principal object ID

#### Database Configuration
- **DATABASE_URL**: PostgreSQL connection string
  ```
  postgresql://username:password@host:5432/database?schema=public&sslmode=disable
  ```

#### Azure Storage
- **AzureWebJobsStorage**: Azure Storage connection string for Functions runtime
- **AzureWebJobsDashboard**: Azure Storage connection string for dashboard

#### LiveKit Configuration
- **LIVEKIT_API_KEY**: Your LiveKit API key
- **LIVEKIT_API_SECRET**: Your LiveKit API secret
- **LIVEKIT_API_URL**: LiveKit server WebSocket URL (e.g., `wss://your-livekit-server`)

#### Azure Service Bus
- **SERVICE_BUS_CONNECTION**: Service Bus connection string
- **SERVICE_BUS_TOPIC_NAME**: Topic name for commands
- **COMMANDS_SUBSCRIPTION_NAME**: Subscription name for commands
- **COMMAND_EXPIRY_MINUTES**: Command expiration time (default: "5")

#### Azure Web PubSub
- **WEBPUBSUB_ENDPOINT**: Your Web PubSub endpoint URL
- **WEBPUBSUB_KEY**: Web PubSub access key
- **WEBPUBSUB_NAME**: Web PubSub instance name
- **WEBPUBSUB_HUB**: Hub name for WebSocket connections
- **WEBPUBSUB_CONNECTION**: Full Web PubSub connection string

#### CORS Configuration
Update the CORS settings in the `Host` section to match your frontend URLs:

```json
"Host": {
  "CORS": "http://localhost:3000,http://localhost:4200,http://localhost:8080",
  "CORS_AllowedOrigins": "http://localhost:3000,http://localhost:4200,http://localhost:8080"
}
```

### 3. Example Configuration

The `local.settings.example.json` file contains a template with placeholder values. Replace all `your-*` placeholders with your actual configuration values.

---

## 🧪 Running the Project Locally

Start the Azure Functions runtime:

```bash
npm run build
npm start
```

This launches your API locally on `http://localhost:7071`.

---

## 🌐 Testing WebPubSub Event Handlers Locally

Azure Web PubSub triggers (like `OnWebsocketConnection`, `OnWebsocketDisconnection`, `PresenceUpdate`, etc.) require Azure to **push events to your local function app**. Since Azure can’t directly access `localhost`, you need to:

### ✅ Use AWPS Tunnel

```bash
export WebPubSubConnectionString="Endpoint=https://your-webpubsub-instance.webpubsub.azure.com;AccessKey=your-access-key;Version=1.0;"

awps-tunnel run \
  --hub your-hub-name \
  --upstream http://localhost:7071/runtime/webhooks/webpubsub
```

This command:

* Opens a tunnel between Azure and your local Azure Functions app
* Forwards incoming WebSocket events to `http://localhost:7071/runtime/webhooks/webpubsub`

---

### 🔧 Configuring Azure Web PubSub with Event Handler

To enable this connection, you must configure the **Event Handler** in your Azure Web PubSub resource:

1. Go to **Azure Portal** → your **Web PubSub** instance
2. Under **Settings**, click **Event Handlers**
3. Click **+ Add**
4. Fill in the handler like this:

   * **Hub**: `your-hub-name` (must match the one in `local.settings.json`)
   * **Event Types**: Check `connect`, `connected`, `disconnected`
   * **URL Template**:

     ```
     https://<your-ngrok-or-awps-tunnel-url>/runtime/webhooks/webpubsub?code=<function-key>
     ```

     (if local, AWPS tunnel handles this automatically)
   * **System Events**: Enable them for connect, connected and disconnected
   * **Auth**: Set to `Managed Identity` or skip auth for local testing
5. Save

When using the AWPS tunnel, Azure automatically knows where to route events. You don't need to configure anything extra **while the tunnel is running**.

---

## 📁 Folder Structure

```
api-functions/
├── [FunctionName]/               ← Each Azure Function in its own folder
│   ├── index.ts                  ← Entry point
│   ├── index.js                  ← Compiled JavaScript
│   └── function.json             ← Azure binding config
├── shared/                       ← Shared business logic and utilities
│   ├── middleware/               ← Authentication, validation, error handling
│   ├── services/                 ← Database, Graph API, LiveKit, WebPubSub
│   ├── utils/                    ← Logging, response builders, helpers
│   ├── handlers/                 ← Common business logic handlers
│   └── config/                   ← Environment configuration
├── __tests__/                    ← Test files and mocks
│   ├── handlers/                 ← Function handler tests
│   ├── mocks/                    ← Test mocks and fixtures
│   └── utils/                    ← Test utilities
├── prisma/
│   ├── schema.prisma             ← Database schema
│   └── migrations/               ← Database migration files
├── types/                        ← TypeScript type definitions
├── local.settings.json           ← Local environment configuration
├── local.settings.example.json   ← Configuration template
├── package.json                  ← Dependencies and scripts
└── tsconfig.json                 ← TypeScript configuration
```

---

## 📜 Key Scripts (`package.json`)

| Script                    | Description                                |
| ------------------------- | ------------------------------------------ |
| `npm run build`           | Compiles TypeScript                        |
| `npm run prisma:generate` | Generates Prisma client                    |
| `npm run migrate:deploy`  | Deploys latest DB schema                   |
| `npm start`               | Starts the Azure Functions runtime locally |

---

## 🧩 Dependencies Overview

| Package                    | Purpose                         |
| -------------------------- | ------------------------------- |
| `@azure/functions`         | Azure Functions SDK             |
| `@prisma/client`           | PostgreSQL ORM                  |
| `@azure/web-pubsub`        | Real-time messaging integration |
| `livekit-server-sdk`       | Video token management          |
| `jwks-rsa`, `jsonwebtoken` | JWT-based Azure AD auth         |

---

## 📌 Notes

* Each Azure Function uses an `index.ts` file and `function.json` for bindings.
* Common logic is centralized in `shared/`.
* The system supports **hybrid messaging**: WebPubSub (real-time) and Service Bus (fallback).
* Presence and streaming updates are handled by WebSocket triggers and `presenceAndStreamingHandler`.

