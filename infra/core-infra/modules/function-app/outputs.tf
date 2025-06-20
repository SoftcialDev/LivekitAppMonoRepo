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
