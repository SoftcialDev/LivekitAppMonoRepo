variable "name_prefix" {
  description = "Prefix for the storage account name. Must be 3–24 characters, lowercase letters and numbers, globally unique."
  type        = string
}

variable "resource_group_name" {
  description = "Name of the existing Resource Group in which to create the Storage Account"
  type        = string
}

variable "location" {
  description = "Azure region for the Storage Account, for example 'eastus'"
  type        = string
}

variable "account_tier" {
  description = "The account tier: 'Standard' or 'Premium'. For general-purpose v2, typically 'Standard'."
  type        = string
  default     = "Standard"
}

variable "account_replication_type" {
  description = "The replication type: 'LRS', 'ZRS', 'GRS', 'RA-GRS', 'GZRS', or 'RA-GZRS'."
  type        = string
  default     = "LRS"
}

variable "access_tier" {
  description = "The access tier for Blob Storage: 'Hot' or 'Cool'. Ignored for Premium accounts."
  type        = string
  default     = "Hot"
}