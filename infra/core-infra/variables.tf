########################################
# Global Configuration (shared across modules)
########################################

variable "name_prefix" {
  description = "Prefix used for naming all provisioned resources. Must comply with Azure naming rules."
  type        = string
  default     = "livekit-agent-azure"
}

variable "region" {
  description = "Azure region where all resources will be deployed, for example 'eastus'."
  type        = string
  default     = "eastus"
}

variable "database_url" {
  description = "Database connection URL"
  type        = string
}

variable "github_repo" {
  description = "GitHub repo for OIDC: format ORG/REPO"
  type        = string
}

variable "github_branch" {
  description = "Branch name to trust for OIDC"
  type        = string
  default     = "main"
}

variable "aad_desktop_redirect_uris" {
  description = "List of redirect URIs for the SPA (e.g., http://localhost:5173, https://prod-domain/.../auth)"
  type        = list(string)
}

variable "tags" {
  description = "Map of tags to apply to all Azure resources."
  type        = map(string)
  default     = {}
}

variable "livekit_api_key" {
  description = "Livekit api key"
  type = string
  sensitive = true
}

variable "livekit_api_secret" {
  description = "Livekit api secret"
  type = string
  sensitive = true
}


variable "livekit_url" {
  description = "Livekit url"
  type = string
  sensitive = true
}

variable "node_env" {
  type = string
  description = "Environment"
}

########################################
# AKS (Azure Kubernetes Service) Module
########################################


variable "aks_price_tier" {
  description = "Pricing tier for the AKS cluster nodes, e.g., 'Standard'."
  type        = string
  default     = "Standard"
}

variable "vm_sku" {
  description = "The SKU (size) of the virtual machines used for AKS nodes, e.g., 'Standard_B4ms'."
  type        = string
  default     = "Standard_B4ms"
}


########################################
# Redis Module
########################################

variable "redis_sku_name" {
  description = "SKU name of the Azure Cache for Redis instance, e.g., 'Basic', 'Standard', or 'Premium'."
  type        = string
}

variable "redis_family" {
  description = "Redis cache family type, e.g., 'C' for basic workloads."
  type        = string
}

variable "redis_capacity" {
  description = "Capacity tier for the Redis instance; numeric value representing size within the family."
  type        = number
}


########################################
# Networking Module
########################################

variable "vnet_ip" {
  description = "Base IP address range of the Virtual Network, for example '10.26.0.0'."
  type        = string
  default     = "10.26.0.0"
}

variable "vnet_mask" {
  description = "CIDR mask for the Virtual Network, for example '/16'."
  type        = string
  default     = "/16"
}

variable "subnet_mask" {
  description = "CIDR mask for subnets within the VNet, for example '/20'."
  type        = string
  default     = "/20"
}


########################################
# Azure Active Directory (AAD) Module
########################################

variable "aad_app_name" {
  description = "Name of the Azure AD application."
  type        = string
}

variable "aad_redirect_uris" {
  description = "List of redirect URIs allowed for the Azure AD application."
  type        = list(string)
}

variable "aad_logout_uris" {
  description = "List of post-logout redirect URIs for the Azure AD application."
  type        = list(string)
}

variable "aad_admins_group_members" {
  description = "List of user principal names (UPNs) to add to the Admins group."
  type        = list(string)
}


variable "aad_enable_directory_role_assignment" {
  description = "Whether to assign directory roles (e.g., 'User Administrator') to the Admins group."
  type        = bool
  default     = false
}

########################################
# Static Web App (SWA) Module
########################################


variable "swa_sku_tier" {
  description = "SKU tier for the Static Web App, e.g., 'Free' or 'Standard'."
  type        = string
}


########################################
# Web PubSub Module
########################################

variable "web_pubsub_sku" {
  description = "SKU for Azure Web PubSub service, for example 'Free_F1' or 'Standard_S1'."
  type        = string
}

variable "web_pubsub_capacity" {
  description = "Unit count (capacity) for Azure Web PubSub service."
  type        = number
}


########################################
# Simple Storage Module
########################################

variable "simple_storage_account_tier" {
  description = "Storage account tier: 'Standard' or 'Premium'. Use 'Standard' for most scenarios."
  type        = string
  default     = "Standard"
}

variable "simple_storage_replication_type" {
  description = "Replication type for the storage account: 'LRS', 'ZRS', 'GRS', 'RA-GRS', 'GZRS', or 'RA-GZRS'. Use 'LRS' for lower cost."
  type        = string
  default     = "LRS"
}

variable "simple_storage_access_tier" {
  description = "Access tier for Blob Storage: 'Hot' or 'Cool'. Ignored for Premium accounts. Use 'Hot' for frequently accessed data."
  type        = string
  default     = "Hot"
}


########################################
# PostgreSQL Module
########################################
/*

variable "postgres_admin_username" {
  description = "Administrator username for PostgreSQL Flexible Server."
  type        = string
}

variable "postgres_admin_password" {
  description = "Administrator password for PostgreSQL Flexible Server."
  type        = string
  sensitive   = true
}

variable "postgres_version" {
  description = "PostgreSQL major version, for example '13' or '14'."
  type        = string
  default     = "13"
}

variable "postgres_sku_name" {
  description = "SKU name for PostgreSQL Flexible Server, for example 'Standard_D2s_v3'."
  type        = string
  default     = "Standard_D2s_v3"
}

variable "postgres_storage_mb" {
  description = "Storage size in MB for PostgreSQL Flexible Server."
  type        = number
  default     = 32768
}

variable "postgres_vnet_subnet_id" {
  description = "Resource ID of a subnet delegated for private PostgreSQL access. Leave empty for public access."
  type        = string
  default     = ""
}

variable "postgres_public_network_access" {
  description = "Whether to allow public network access: 'Enabled' or 'Disabled'."
  type        = string
  default     = "Enabled"
}

variable "postgres_allowed_ips" {
  description = "List of client IP addresses or CIDRs to allow when public access is enabled, e.g. ['203.0.113.5/32']. Empty list means no public IP allowed."
  type        = list(string)
  default     = []
}
*/

########################################
# Function App Module
########################################



variable "function_plan_sku_tier" {
  description = "App Service Plan SKU tier for Function App: 'Dynamic' for Consumption or 'ElasticPremium' for Premium."
  type        = string
  default     = "Dynamic"
}

variable "function_plan_sku_size" {
  description = "App Service Plan SKU size for Function App: 'Y1' for Consumption or 'EP1' for Premium."
  type        = string
  default     = "Y1"
}

variable "function_vnet_subnet_id" {
  description = "Resource ID of the subnet for Function App VNet Integration, if needed for private resource access."
  type        = string
  default     = ""
}



########################################
# Service Bus
########################################

variable "servicebus_sku_name" {
  description = "SKU tier for the Service Bus namespace, e.g. 'Standard'."
  type        = string
  default     = "Standard"
}

variable "servicebus_topic_name" {
  description = "Name of the Service Bus topic, e.g. 'commands'."
  type        = string
  default     = "commands"
}

variable "servicebus_auth_rule_name" {
  description = "Name of the SAS authorization rule for Service Bus, e.g. 'sb-policy'."
  type        = string
  default     = "sb-policy"
}


variable "key_vault_sku_name" {
  type = string
  description = "Key vault sku name"
}