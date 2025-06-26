# The name of the existing Resource Group where Web PubSub will be deployed
variable "resource_group_name" {
  type        = string
  description = "Resource group name"
}

# Azure region (e.g., "eastus", "westeurope") where the Web PubSub service will be created
variable "location" {
  type        = string
  description = "Azure region"
}

# Base identifier for the Web PubSub instance (used to construct the resource name)
variable "name" {
  type        = string
  description = "Web PubSub resource name"
}

# Pricing tier for the Web PubSub service (for example, "Standard_S1")
variable "sku" {
  type        = string
  description = "SKU name, e.g., Standard_S1"
  default     = "Standard_S1"
}

# Number of units to allocate under the chosen SKU for scaling capacity
variable "unit_count" {
  type        = number
  description = "Unit count for the SKU"
  default     = 1
}
