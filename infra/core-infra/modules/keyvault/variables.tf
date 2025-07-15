variable "name_prefix" {
  description = "Prefix for naming resources"
  type        = string
}

variable "resource_group_name" {
  description = "Resource Group name to place the Key Vault"
  type        = string
}

variable "location" {
  description = "Region for Key Vault"
  type        = string
}

variable "key_vault_sku_name" {
  type = string
  description = "Key vault sku name"
}

variable "webpubsub_connection_string" {
  type = string
  description = "webpubsub connection string"
}


variable "livekit_api_key" {
  description = "LiveKit API key"
  type        = string
  sensitive   = true
}

variable "livekit_api_secret" {
  description = "LiveKit API secret"
  type        = string
  sensitive   = true
}

variable "azure_client_secret" {
  description = "Azure AD client secret for Graph or other"
  type        = string
  sensitive   = true
}

variable "service_bus_connection" {
  description = "Service Bus connection string"
  type        = string
  sensitive   = true
}

variable "webpubsub_key" {
  description = "Azure Web PubSub key"
  type        = string
  sensitive   = true
}


variable "postgres_database_url" {
    type = string
    sensitive = true
}
