variable "bootstrap_rg_name" {
  description = "Name of the resource group for storing Terraform state"
  type        = string
  default     = "tfstate-rg-in-contact-app"
}

variable "bootstrap_rg_location" {
  description = "Azure region for the bootstrap resource group"
  type        = string
  default     = "eastus"
}

variable "storage_account_base_name" {
  description = "Base name of the storage account (must be 3–11 lowercase alphanumeric)"
  type        = string
  default     = "tfstateaccount"
}

variable "storage_account_tier" {
  description = "The account tier for the storage account (Standard or Premium)"
  type        = string
  default     = "Standard"
}

variable "storage_account_replication_type" {
  description = "The replication type for the storage account (LRS, ZRS, GRS, etc.)"
  type        = string
  default     = "LRS"
}

variable "container_name" {
  description = "Name of the blob container for Terraform state files"
  type        = string
  default     = "tfstate"
}
