# LiveKit App MonoRepo

A comprehensive real-time communication and monitoring system for Personnel Safety Officer (PSO) monitoring. It integrates video streaming, command processing, presence tracking, and administration across multiple frontend clients, serverless APIs, and Azure infrastructure.

---

## 📁 Repository Structure

```
/
├── apps/
│   ├── admin-web/           ← React Admin Web Application
│   ├── api-functions/       ← Azure Functions backend API
│   └── electron/            ← Electron desktop client for PSOs
├── infra/
│   ├── bootstrap-backend/   ← Terraform bootstrap for remote state
│   ├── core-infra/          ← Terraform modules and configurations
│   └── environment/         ← Environment-specific tfvars
│   └── scripts/             ← Helper scripts (e.g. Generate-TerraformEnv.ps1)
└── manifests/               ← Kubernetes/LiveKit YAML manifests
```

Each subfolder contains its own detailed `README.md`—see below for links.

---

## 🚀 Getting Started

### Prerequisites

* **Node.js** 18.x or higher
* **npm** or **yarn**
* **Terraform** ≥ 1.0
* **Azure CLI** ≥ 2.0
* **PowerShell** (for Windows scripts)
* An **Azure** subscription (Owner/Contributor + AD Global Administrator)
* A **PostgreSQL** database (for local development or production)

---

### 1. Clone the Repository

```bash
git clone https://github.com/SoftcialDev/InContactApplication.git
cd LiveKitAppMonoRepo
```

---

### 2. Deploy Infrastructure

1. **Bootstrap remote state**

   ```bash
   cd infra/bootstrap-backend
   terraform init
   terraform apply
   ```
2. **Configure core-infra backend**
   Go to `infra/core-infra/backend.tf`  and point at the storage account/container you just created.
3. **Populate `*.tfvars`**
   Copy and edit `infra/core-infra/variables.tf` into `infra/environment/{dev,prod}/terraform.tfvars`.
4. **Apply core infrastructure**

   ```bash
   cd infra/core-infra
   terraform init
   terraform plan -var-file=../environment/dev/terraform.tfvars
   terraform apply -var-file=../environment/dev/terraform.tfvars
   ```
5. **Generate environment variables**

   ```powershell
   cd infra/scripts
   .\Generate-TerraformEnv.ps1 -Environment "dev" -TfVarsPath "../environment/dev/terraform.tfvars"
   ```

*For full details, see* **infra/core-infra/README.md**

---

### 3. Run the Backend API

```bash
cd apps/api-functions
npm ci
npm run build
npm run prisma:generate
npm start
```

This starts the Azure Functions runtime locally on `http://localhost:7071`.

*For full details, see* **apps/api-functions/README.md**

---

### 4. Run the Admin Web App

```bash
cd apps/admin-web
npm ci
npm run dev
```

Open `http://localhost:5173` to access the Admin UI.

*For full details, see* **apps/admin-web/README.md**

---

### 5. Run the Electron Desktop Client

```bash
cd apps/electron
npm ci
npm run start
```

This launches the PSO desktop application.

*For full details, see* **apps/electron/README.md**

---

## 🔄 CI/CD Pipelines

* **Admin Web** — GitHub Actions deploying to Azure Static Web Apps
  \[`.github/workflows/deploy-admin-web.yml`]
* **API Functions** — CI pipeline building & deploying Azure Functions
  \[`.github/workflows/main_livekit-agent-azure-func.yml`]

---

## 🔐 Role-Based Access Control

Three primary roles managed via Azure AD security groups:

* **Admin** — Full system access & user management
* **Supervisor** — Manage assigned employees & monitor streams
* **Employee** — Personal dashboard & camera streaming

Roles are enforced in both API and UI layers.

---

## 📡 Real-Time Architecture

* **Web PubSub** — Instant command delivery & presence updates
* **Service Bus** — Reliable fallback queuing for commands
* **LiveKit Server** — Video streaming infrastructure
* **Redis Cache** — Session storage and performance optimization
* **PostgreSQL + Prisma** — Primary relational datastore

---

## 🛡 Security Considerations

* All APIs secured with **Azure AD JWT** authentication
* Secrets managed in **Azure Key Vault**
* Network isolation via **VNet integration** and **private endpoints**
* CORS configured for allowed origins only

---

