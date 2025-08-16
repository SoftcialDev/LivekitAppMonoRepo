variable "name_prefix" {
  description = "Prefix to use for naming Function App and related resources"
  type        = string
}

variable "resource_group_name" {
  description = "Name of the existing Resource Group where Function App will be deployed"
  type        = string
}

variable "location" {
  description = "Azure region for the Function App"
  type        = string
}


variable "storage_account_recordings_container_name" {
  description = "Name of the Blob container for LiveKit recordings"
  type        = string
}
variable "storage_account_recordings_container_url" {
  description = "Full URL of the Blob container for LiveKit recordings"
  type        = string
}
variable "commands_subscription_name" {
  description = "Name of the Service Bus subscription for commands topic"
  type        = string
  default     = "commands-sub"
}

variable "function_plan_sku_tier" {
  description = "App Service Plan SKU tier for Functions. For Consumption use 'Dynamic'; for Elastic Premium use 'ElasticPremium'; for dedicated use 'PremiumV2', etc."
  type        = string
  default     = "Dynamic"
}

variable "function_plan_sku_size" {
  description = "App Service Plan SKU size. For Consumption use 'Y1'; for ElasticPremium use 'EP1', etc.; for dedicated use 'P1v2', etc."
  type        = string
  default     = "Y1"
}

variable "storage_account_snapshot_container_name" {
  type = string
}
variable "storage_account_name" {
  description = "Name of an existing Storage Account for the Function App"
  type        = string
}

variable "storage_account_access_key" {
  description = "Access key of the Storage Account for Function App"
  type        = string
  sensitive   = true
}

variable "storage_account_connection_string" {
  description = "Connection string of the Storage Account for AzureWebJobsStorage"
  type        = string
  sensitive   = true
}

variable SERVICE_PRINCIPAL_OBJECT_ID {
  description = "Object ID of the service principal for the Function App"
  type        = string
}

variable AZURE_AD_API_IDENTIFIER_URI {
  description = "Identifier URI for the Azure AD API app registration"
  type        = string
}

variable "aad_app_client_id" {
  description = "Client ID of an existing Azure AD App Registration used for Function App auth"
  type        = string
}

# Key Vault info
variable "key_vault_id" {
  description = "Resource ID of the Key Vault where secrets are stored"
  type        = string
}

variable "secret_uris" {
  description = "Map of secret URIs from Key Vault, e.g. { livekit_api_key = <uri>, ... }"
  type        = map(string)
}

variable "webpubsub_hub" {
  description = "webpusub hub name"
  type = string
}
# Non-sensitive settings
variable "azure_tenant_id" {
  description = "Azure AD Tenant ID"
  type        = string
}

variable "azure_client_id" {
  description = "Azure AD Application (client) ID for backend calls"
  type        = string
}

variable "livekit_api_url" {
  description = "LiveKit API URL endpoint"
  type        = string
}

variable "webpubsub_endpoint" {
  description = "Azure Web PubSub endpoint (e.g. https://<your>.webpubsub.azure.com)"
  type        = string
}

variable "webpubsub_hub_name" {
  description = "Azure Web PubSub hub name"
  type        = string
}

variable "service_bus_topic_name" {
  description = "Service Bus topic name"
  type        = string
}

variable "node_env" {
  description = "NODE_ENV value"
  type        = string
  default     = "production"
}


variable "cors_allowed_origins" {
  description = "Allowed origins for our API"
  type        = list(string)
  default     = []  
}

variable "admins_group_id" {
  description = "Azure AD object ID of the Admins group"
  type        = string
}

variable "employees_group_id" {
  description = "Azure AD object ID of the Employees group"
  type        = string
}

variable "contact_manager_group_id" {
  description = "Azure AD object ID of the contact manager group"
  type        = string
}

variable "supervisors_group_id" {
  description = "Azure AD object ID of the Supervisors group"
  type        = string
}

variable "super_admin_group_id" {
  description = "Azure AD object ID of the Super Admins group"
  type        = string
}