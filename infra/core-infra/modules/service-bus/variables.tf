variable "resource_group_name" {
  type        = string
  description = "Name of the resource group"
}
variable "location" {
  type        = string
  description = "Azure region"
}
variable "name_prefix" {
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


variable "spa_sp_object_id" {
  description = "Service principal object ID of the SPA app"
  type        = string
}
variable "api_sp_object_id" {
  description = "Service principal object ID of the API app"
  type        = string
}
variable "api_scope_value" {
  description = "UUID of the API OAuth2 scope"
  type        = string
}