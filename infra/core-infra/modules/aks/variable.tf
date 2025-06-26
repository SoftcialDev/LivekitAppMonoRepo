# Prefix applied to all resource names (defaults to "livekit-agent-azure")
variable "name_prefix" {
  description = "Prefix for the name of the resources"
  type        = string
  default     = "livekit-agent-azure"
}

# Name of the existing resource group where resources will be created
variable "resource_group" {
  description = "Name of the Azure resource group"
  type        = string
}

# Azure region where the AKS cluster and other resources will be deployed
variable "region" {
  description = "The region in which the resources will be deployed"
  type        = string
  default     = "eastus"
}

# Size of the VMs in the AKS node pool (e.g., Standard_B4ms)
variable "vm_sku" {
  description = "The size of the Virtual Machine"
  type        = string
  default     = "Standard_B4ms"
}

# Number of nodes to provision in the AKS default node pool
variable "aks_node_count" {
  description = "The number of nodes in the AKS cluster"
  type        = number
  default     = 2
}

# SKU tier for the AKS control plane (Standard or Free)
variable "aks_price_tier" {
  description = "The pricing tier for the AKS cluster"
  type        = string
  default     = "Standard"
}

# Resource ID of the subnet where AKS nodes will be placed
variable "vnet_subnet_id" {
  description = "ID of the virtual network subnet for AKS nodes"
  type        = string
}
