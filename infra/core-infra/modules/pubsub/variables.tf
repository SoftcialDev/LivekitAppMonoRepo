variable "resource_group_name" {
  type        = string
  description = "Resource group name"
}
variable "location" {
  type        = string
  description = "Azure region"
}
variable "name" {
  type        = string
  description = "Web PubSub resource name"
}
variable "sku" {
  type        = string
  description = "SKU name, e.g., Standard_S1"
  default     = "Standard_S1"
}
variable "unit_count" {
  type        = number
  description = "Unit count for the SKU"
  default     = 1
}
