variable "function_app_name" {
  description = "Name of the Azure Function App"
  type        = string
}

variable "resource_group_name" {
  description = "Resource Group where the Function App will be deployed"
  type        = string
}

variable "location" {
  description = "Azure region for the Function App"
  type        = string
}

variable "app_service_plan_id" {
  description = "Resource ID of an existing App Service Plan for the Function App"
  type        = string
}

variable "storage_account_name" {
  description = "Name of an existing Storage Account for the Function App"
  type        = string
}

variable "storage_account_access_key" {
  description = "Access key of the Storage Account"
  type        = string
  sensitive   = true
}

variable "api_application_id" {
  description = "Client ID of the API App Registration (used as audience in Easy Auth)"
  type        = string
}

variable "app_insights_instrumentation_key" {
  description = "Instrumentation Key for Application Insights (optional)"
  type        = string
  default     = ""
}
