# 🌳 LiveKit Infra (Terraform)

This directory contains Terraform code to provision a complete Azure environment for the LiveKit monitoring system.

## 📋 Prerequisites

* **Terraform** ≥ 1.0
* **Azure CLI** ≥ 2.0
* **PowerShell** (for Windows deployment scripts)
* An **Azure** subscription where you have **Owner** or **Contributor** rights
* An **Azure AD** account with **Global Administrator** (or App Administrator) privileges

## 📁 Repo Layout

```
infra/
├── bootstrap-backend/      ← Creates RG & Storage for Terraform state
├── core-infra/             ← Main infra code (uses remote state backend)
│   ├── modules/            ← Reusable modules (network, aks, db, etc.)
│   ├── providers.tf
│   ├── main.tf
│   ├── outputs.tf
│   ├── variables.tf
│   └── backend.tf          ← (to be created in Step 2)
├── environment/
│   ├── dev/                ← dev.tfvars
│   └── prod/               ← prod.tfvars
├── scripts/
│   └── Generate-TerraformEnv.ps1  ← PowerShell script to emit env vars
└── manifests/              ← K8s/LiveKit YAMLs (optional)
```

---

## ▶️ 1. Bootstrap the Remote State Backend

First, create the Resource Group, Storage Account and Blob Container that will hold your Terraform state.

```bash
cd infra/bootstrap-backend

# (Optional) create terraform.tfvars with:
#   backend_rg_name               = "backend-livekit-rg"
#   backend_storage_account_name  = "backendlivekitstorage"
#   backend_container_name        = "tfstate"

terraform init
terraform apply
```

> **Outputs:**
>
> * RG: `backend-livekit-rg`
> * Storage Account: `backendlivekitstorage`
> * Blob container: `tfstate`

---

## ▶️ 2. Configure core-infra to Use That Backend

In `infra/core-infra`, create (or update) `backend.tf` with the same names:

```hcl
terraform {
  backend "azurerm" {
    resource_group_name   = "backend-livekit-rg"
    storage_account_name  = "backendlivekitstorage"
    container_name        = "tfstate"
    key                   = "core-infra-prod.tfstate"
  }
}
```

This points Terraform at your newly provisioned remote state.

---

## ▶️ 3. Populate Your Variable Files

Copy `variables.tf` examples into your environment-specific tfvars:

```bash
cp infra/core-infra/variables.tf infra/environment/prod/terraform.tfvars
```

Then edit `infra/environment/prod/terraform.tfvars` with your values:

```hcl
# General
name_prefix  = "livekit-prod"
region       = "eastus2"

# AKS
vm_sku         = "Standard_B4ms"
aks_node_count = 2
aks_price_tier = "Standard"

# Networking
vnet_ip     = "10.0.0.0"
vnet_mask   = "/16"
subnet_mask = "/20"

# Redis Cache
redis_family   = "C"
redis_sku_name = "Standard"
redis_capacity = 1

# Azure AD / SPA
aad_app_name      = "livekit-app"
aad_redirect_uris = [
  "https://app.yourdomain.com/auth/callback",
  "http://localhost:3000/auth/callback",
]
aad_logout_uris = ["https://app.yourdomain.com/auth/logout"]
aad_supervisors_group_members = ["user1@tenant.onmicrosoft.com"]
aad_admins_group_members      = ["admin1@tenant.onmicrosoft.com"]
aad_employees_group_members   = ["employee1@tenant.onmicrosoft.com"]
aad_enable_directory_role_assignment = true
redirect_url_for_invited_users = "https://app.yourdomain.com/login"

# Static Web App
swa_repository_url    = "https://github.com/your-org/your-frontend-repo"
swa_repository_branch = "main"
swa_repository_token  = "ghp_YourGitHubPAT"
swa_sku_tier          = "Standard"

# Database (PostgreSQL)
postgres_admin_username        = "dbadmin"
postgres_admin_password        = "SecurePassword123!"
postgres_version               = "13"
postgres_sku_name              = "B_Standard_B1ms"
postgres_storage_mb            = 32768
postgres_vnet_subnet_id        = ""            # leave empty for public
postgres_public_network_access = "Enabled"
postgres_allowed_ips           = ["203.0.113.5/32"]

# Storage overrides (optional)
storage_name_prefix = "livekitstore"

# Function App
function_plan_sku_tier = "ElasticPremium"
function_plan_sku_size = "EP1"

# Web PubSub
web_pubsub_sku      = "Standard_S1"
web_pubsub_capacity = 1

# Service Bus
servicebus_sku_name       = "Standard"
servicebus_topic_name     = "commands"
servicebus_auth_rule_name = "RootManageSharedAccessKey"

# LiveKit
livekit_url      = "wss://livekit.example.com"
livekit_api_key  = "your-livekit-api-key"
livekit_api_secret = "your-livekit-api-secret"

# Key Vault
key_vault_sku_name = "standard"

# App Environment
node_env = "production"
```

---

## ▶️ 4. Deploy the Core Infrastructure

```bash
cd infra/core-infra

# Initialize with remote backend
terraform init

# Preview
terraform plan -var-file=../environment/prod/terraform.tfvars

# Apply
terraform apply -var-file="../environment/prod/terraform.tfvars"
```

**On success**, you’ll see outputs for AD App IDs, connection strings, resource names, etc.

---

## ▶️ 5. Generate Environment Variable File

Once Terraform has finished, **you must** run the PowerShell helper to generate a `.env` (or equivalent) with all the outputs wired up:

```powershell
# From the repo root
cd infra/scripts
.\Generate-TerraformEnv.ps1 -Environment "prod" -TfVarsPath "../environment/prod/terraform.tfvars"
```

> **What it does:**
>
> * Reads your Terraform outputs
> * Emits all required env vars (e.g. `TF_VAR_webpubsub_connection`, `TF_VAR_servicebus_connection`, DB URL, LiveKit keys, etc.)
> * Writes them to a file you can `source` or import into your CI/CD

> **Note:** This script **requires** that you’ve already run `terraform apply` so that outputs exist.

---

## 🔒 Post-Deployment Steps

1. **Admin Consent**
   In Azure Portal → **App Registrations** → **API Permissions** → “Grant admin consent”
2. **Configure Function App**
   Copy the generated `.env` into your Function App settings (or CI/CD variable group)
3. **Assign Users**
   Add your users to the Azure AD groups (Admins, Supervisors, Employees)
4. **Deploy Application Code**
   Trigger your CI/CD pipelines for the frontend and backend

---

## ⚠️ Security Notes

* **Admin Consent** is required for Graph API permissions.
* Secrets are stored in **Azure Key Vault** and referenced via URIs in your Function App.
* VNet integration & private endpoints are configured for production resources.

---

You now have a fully automated, end-to-end Terraform workflow—complete with remote state bootstrap, backend configuration, var file generation, and a helper script to wire up your environment. 🚀
