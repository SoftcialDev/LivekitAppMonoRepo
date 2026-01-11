# InContact Application

A comprehensive real-time communication and monitoring system for Personnel Safety Officer (PSO) monitoring. The system integrates video streaming, command processing, presence tracking, and administration across multiple frontend clients, serverless APIs, and Azure infrastructure.

## System Overview

The InContact Application is a monorepo containing three main applications that work together to provide a complete monitoring and management solution:

1. **API Functions**: Azure Functions backend implementing Domain-Driven Design (DDD) architecture
2. **In Contact Web**: React web application following Screaming Architecture principles
3. **Electron Desktop App**: Desktop wrapper for the React application using Electron framework

### Architecture Practices

**Backend (API Functions)**:
- Domain-Driven Design with clear separation: Domain, Application, and Infrastructure layers
- Repository pattern for data access abstraction
- Dependency injection for service resolution
- Domain-specific error handling with structured error classes
- Structured logging (never using `console.*`)
- Configuration management through centralized config module

**Frontend (In Contact Web)**:
- Screaming Architecture organizing code by feature/domain
- Self-contained modules with their own API clients, components, hooks, and stores
- React Router Data API for routing
- Zustand for state management, Context API for providers
- Separate organization of enums, types, and interfaces
- React hooks best practices to prevent infinite loops and optimize performance
- Centralized API client with automatic token injection

**Electron Desktop App**:
Electron is a framework that enables building desktop applications using web technologies (HTML, CSS, JavaScript/TypeScript). It combines Chromium and Node.js to create native desktop apps. In this project, Electron serves as a desktop wrapper for the React web application, providing:
- Native desktop application experience
- Windows service integration capabilities
- System tray functionality
- Controlled runtime environment without browser dependencies

---

## 📁 Repository Structure

```
/
├── apps/
│   ├── api-functions/       ← Azure Functions backend API (DDD architecture)
│   ├── in-contact-web/      ← React Web Application (Screaming Architecture)
│   └── electron/            ← Electron desktop client wrapper
├── infra/
│   ├── bootstrap-backend/   ← Terraform bootstrap for remote state
│   ├── core-infra/          ← Terraform modules and configurations
│   └── environment/         ← Environment-specific tfvars
│   └── scripts/             ← Helper scripts (e.g. Generate-TerraformEnv.ps1)
└── manifests/               ← Kubernetes/LiveKit YAML manifests
```

Each application contains its own detailed `README.md` with architecture, setup, and development guidelines.

---

## 📝 Documentation Standards

All code must be documented using **JSDoc/TSDoc** format. The documentation standards are strictly enforced across all applications.

### File Documentation

Every file must start with file-level documentation:

```typescript
/**
 * @fileoverview Brief description of the file's purpose
 * @description Detailed description of what the file contains and its role in the system
 */
```

### Function Documentation

All functions, methods, and class methods must include:

```typescript
/**
 * Description of what the function does
 * @param paramName - Description of the parameter
 * @returns Description of the return value
 * @throws ErrorType if condition that causes the error
 */
```

### Required Tags

- **`@fileoverview`**: Brief description at the file level (required)
- **`@description`**: Detailed description (required for files and functions)
- **`@param`**: Parameter descriptions (required for all parameters)
- **`@returns`**: Return value description (required for all functions that return a value)
- **`@throws`**: Exception descriptions (required when function can throw errors)

### Prohibited Tags

- **`@example`**: Never use `@example` tags in documentation

### Documentation Examples

#### File Documentation

```typescript
/**
 * @fileoverview GetCurrentUserDomainService - Domain service for current user operations
 * @description Handles business logic for getting current user with auto-provisioning
 */
```

#### Function Documentation

```typescript
/**
 * Gets current user information, creating the user if they don't exist
 * @param request - Get current user request value object
 * @param jwtPayload - JWT token payload with user information from Azure AD
 * @returns Promise that resolves to GetCurrentUserResponse with user information
 * @throws ValidationError if email is not found in JWT token
 */
async getCurrentUser(
  request: GetCurrentUserRequest,
  jwtPayload: JwtPayload
): Promise<GetCurrentUserResponse> {
  // Implementation
}
```

#### Class Documentation

```typescript
/**
 * Domain service for current user operations
 * @description Orchestrates getting current user information with auto-provisioning logic
 */
export class GetCurrentUserDomainService {
  // Class implementation
}
```

### Documentation Checklist

When creating or updating code:

- [ ] File has `@fileoverview` and `@description` at the top
- [ ] All functions have `@description`
- [ ] All parameters have `@param` tags
- [ ] All return values have `@returns` tags
- [ ] All exceptions have `@throws` tags
- [ ] No `@example` tags are used
- [ ] Documentation is in English
- [ ] Documentation accurately describes the code's behavior

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

### 4. Run the Web Application

```bash
cd apps/in-contact-web
npm ci
npm run dev
```

Open `http://localhost:5173` to access the Web UI.

*For full details, see* **apps/in-contact-web/README.md**

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

