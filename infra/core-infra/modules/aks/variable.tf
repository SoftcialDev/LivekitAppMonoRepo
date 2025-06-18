variable "name_prefix" {
  description = "Prefix for the name of the resources"
  type        = string
  default     = "livekit-agent-azure" 
}

variable "resource_group" {
    type = string
}

variable "region" {
  description = "The region in which the resources will be deployed"
  type        = string
  default     = "eastus" 
}

variable "vm_sku" {
  description = "The size of the Virtual Machine"
  type        = string
  default     = "Standard_B4ms" 
}

variable "aks_node_count" {
  description = "The number of nodes in the AKS cluster"
  type        = number
  default     = 2  
}

variable "aks_price_tier" {
  description = "The pricing tier for the AKS cluster"
  type        = string
  default     = "Standard"
}

variable "vnet_subnet_id" {
    type = string
}