# outputs.tf

output "function_app_id" {
  description = "Resource ID of the Function App"
  value       = azurerm_function_app.function_app.id
}

output "function_default_hostname" {
  description = "Default hostname of the Function App (e.g., <name>.azurewebsites.net)"
  value       = azurerm_function_app.function_app.default_hostname
}

output "function_principal_id" {
  description = "Principal ID of the System-assigned Managed Identity"
  value       = azurerm_function_app.function_app.identity
}


output "function_app_url" {
  description = "URL base de la Function App para invocar la API"
  value       = "https://${azurerm_function_app.function_app.default_hostname}/api"
}


output "function_app_name" {
  description = "The name of the Function App"
  value       = azurerm_function_app.function_app.name
}

output "function_app_resource_group_name" {
  description = "The resource group where the Function App lives"
  value       = azurerm_function_app.function_app.resource_group_name
}
