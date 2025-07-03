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

Copy the example configuration:

```bash
cp local.settings.example.json local.settings.json
```

Edit `local.settings.json` to include your secrets:

```json
{
  "IsEncrypted": false,
  "Values": {
    "AZURE_CLIENT_ID": "your-azure-client-id",
    "AZURE_CLIENT_SECRET": "your-azure-client-secret",
    "AZURE_TENANT_ID": "your-azure-tenant-id",

    "AzureWebJobsStorage": "your-azure-storage-connection-string",

    "DATABASE_URL": "postgresql://user:password@localhost:5432/yourdb",

    "FUNCTIONS_EXTENSION_VERSION": "~4",
    "FUNCTIONS_WORKER_RUNTIME": "node",

    "LIVEKIT_API_KEY": "your-livekit-api-key",
    "LIVEKIT_API_SECRET": "your-livekit-api-secret",
    "LIVEKIT_API_URL": "wss://your-livekit-server",

    "ADMINS_GROUP_ID": "your-admins-group-id",
    "EMPLOYEES_GROUP_ID": "your-employees-group-id",
    "SUPERVISORS_GROUP_ID": "your-supervisors-group-id",
    "SERVICE_PRINCIPAL_OBJECT_ID": "your-service-principal-id",

    "AZURE_AD_API_IDENTIFIER_URI": "api://your-app-id-uri",

    "NODE_ENV": "Development",

    "SERVICE_BUS_CONNECTION": "your-service-bus-connection-string",
    "SERVICE_BUS_TOPIC_NAME": "your-topic-name",
    "COMMANDS_SUBSCRIPTION_NAME": "your-subscription-name",
    "COMMAND_EXPIRY_MINUTES": "5",

    "WEBPUBSUB_ENDPOINT": "https://your-webpubsub-instance.webpubsub.azure.com",
    "WEBPUBSUB_KEY": "your-webpubsub-key",
    "WEBPUBSUB_NAME": "your-webpubsub-name",
    "WEBPUBSUB_HUB": "your-hub-name",
    "WEBPUBSUB_CONNECTION": "Endpoint=https://your-webpubsub-instance.webpubsub.azure.com;AccessKey=your-access-key;Version=1.0;"
  },
  "Host": {
    "CORS": "http://localhost:3000,http://localhost:4200,http://localhost:8080",
    "CORS_AllowedOrigins": "http://localhost:3000,http://localhost:4200,http://localhost:8080"
  }
}
```

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
│   └── function.json             ← Azure binding config
├── shared/
│   ├── middleware/               ← Auth, validation, error handler
│   ├── services/                 ← Prisma, Graph API, LiveKit, WebPubSub
│   ├── utils/                    ← Logger, response builders, UUID helpers
│   ├── handlers/                 ← Common business logic
│   └── config/                   ← Environment config
├── prisma/
│   ├── schema.prisma             ← Database schema
│   └── migrations/               ← Prisma SQL migrations
├── local.settings.json           ← Local env config
├── package.json                  ← Project dependencies and scripts
└── tsconfig.json                 ← TypeScript config
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

