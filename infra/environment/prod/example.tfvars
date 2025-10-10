########################################
# REQUIRED: General deployment settings
########################################

# Prefix used for naming all resources.
# Must be 3–24 lowercase alphanumeric, no special chars.
name_prefix                    = "in-contact-app-prod"

# Azure region where resources will be deployed (e.g. "eastus").
region                         = "eastus"

########################################
# AKS cluster settings
########################################

# VM size for your AKS node pool (e.g. "Standard_B4ms").
vm_sku                         = "Standard_B4ms"


# Pricing tier for AKS (usually "Standard").
aks_price_tier                 = "Standard"

########################################
# Virtual network settings
########################################

#The following setting is recommended to not modify them, as they are need for livekit server

# Base network address for your VNet (CIDR block without mask).
vnet_ip                        = "10.26.0.0"

# CIDR mask for the entire VNet (e.g. "/16").
vnet_mask                      = "/16"

# CIDR mask for each subnet (e.g. "/20").
subnet_mask                    = "/20"


########################################
# Redis Cache settings
########################################

# Redis SKU family (e.g. "C").
redis_family                   = "C"

# Redis SKU name (e.g. "Standard").
redis_sku_name                 = "Standard"

# Number of capacity units for Redis (integer).
redis_capacity                 = 0

########################################
# Azure AD / SPA settings
########################################

# Base name for your Azure AD application registrations.
aad_app_name                   = "in-contact-app-develop"

# Redirect URIs for your Single-Page App (list of strings).
aad_redirect_uris              = [
  "http://localhost:5173/",
  "http://localhost:3000/",
]

aad_desktop_redirect_uris = [
    "myapp://auth",
]

# Logout URIs for your Single-Page App.
aad_logout_uris                = [
    "http://localhost:5173/",
    "http://localhost:3000/"
]


github_repo ="InContactApplication"
# Emails of users to assign the Admin role.
aad_admins_group_members       = ["marco.vargas@collettehealth.com"]


# Enable automatic assignment of Azure Directory roles for invited users.
aad_enable_directory_role_assignment = true


########################################
# Static Web App (SWA) settings
########################################

# SKU tier for Static Web App (e.g. "Free", "Standard").
swa_sku_tier                   = "Standard"

########################################
# Tagging
########################################

# Key/value tags to apply to all resources.
tags = {
  environment = "prod"
  project     = "in-contact"
}


########################################
# PostgreSQL Flexible Server settings
########################################

# PostgreSQL administrator username (avoid special characters)
postgres_admin_username        = "livekit"

# PostgreSQL administrator password (store securely and rotate regularly)
postgres_admin_password        = "ADcc2030.."

# Major version of PostgreSQL to deploy
postgres_version               = "16"

# SKU name for PostgreSQL Flexible Server (modest size; adjust as needed)
postgres_sku_name              = "B_Standard_B1ms"

# Allocated storage in MB for the PostgreSQL server (32 GB)
postgres_storage_mb            = 32768

# Subnet ID for private network integration; leave empty for public access
postgres_vnet_subnet_id        = ""

# Control public network access ("Enabled" or "Disabled")
postgres_public_network_access = "Enabled"

# List of IP addresses or CIDR blocks allowed when public access is enabled
postgres_allowed_ips           = ["your ip or app funcions ip, either way the function ip will be set by terraform automatically, just add your ip"]

########################################
# Simple Storage module overrides 
########################################

simple_storage_account_tier    = "Standard"
simple_storage_replication_type = "LRS"
simple_storage_access_tier     = "Hot"

# Name prefix for the storage account (3–24 lowercase alphanumeric, unique).
storage_name_prefix            = "incontact-403"

########################################
# Function App (Consumption plan) settings
########################################

function_plan_sku_tier         = "Dynamic"
function_plan_sku_size         = "Y1"

########################################
# Web PubSub settings
########################################

# SKU tier for Web PubSub (e.g. "Free_F1", "Standard_S1").
web_pubsub_sku                 = "Standard_S1"

# Number of units for scaling Web PubSub.
web_pubsub_capacity            = 1

########################################
# Service Bus settings
########################################

# SKU tier for Service Bus (e.g. "Basic", "Standard", "Premium").
servicebus_sku_name            = "Standard"

# Topic name within the namespace for your messages.
servicebus_topic_name          = "commands"

# SAS rule name for Service Bus namespace.
servicebus_auth_rule_name      = "sb-policy"

########################################
# LiveKit integration
########################################

#### All this variables must match with your values in infra\manifests\livekit.yaml

# WebSocket endpoint URL for LiveKit signaling.
# This must be a secure WebSocket (wss://) pointing to your LiveKit subdomain.
livekit_url = "wss://livekit.mydomain.com"

# API key for authenticating with LiveKit.
# Create this in your LiveKit server or dashboard—name it as you like.
livekit_api_key = "livekit"

# API secret corresponding to your API key.
# Store this securely (e.g., in a secrets manager), and never commit to source control.
livekit_api_secret = "ADC2030."


########################################
# Key Vault settings
########################################

# SKU tier for your Azure Key Vault (e.g. "standard").
key_vault_sku_name             = "standard"

########################################
# Application environment
########################################

# Node environment flag passed to your function code (e.g. "development", "production").
node_env                       = "production"
