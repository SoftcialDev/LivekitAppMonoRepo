variable "resource_group_name" {
  type        = string
  description = "Name of the resource group"
}
variable "location" {
  type        = string
  description = "Azure region"
}
variable "namespace_name" {
  type        = string
  description = "Service Bus namespace name"
}
variable "sku_name" {
  type        = string
  description = "SKU for Service Bus Namespace (e.g., Standard)"
  default     = "Standard"
}
variable "topic_name" {
  type        = string
  description = "Service Bus topic name for commands"
  default     = "commands"
}
variable "auth_rule_name" {
  type        = string
  description = "SAS rule name for accessing Service Bus"
  default     = "sb-policy"
}
