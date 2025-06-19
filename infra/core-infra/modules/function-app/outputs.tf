output "function_app_id" {
  description = "Resource ID of the Function App"
  value       = azurerm_function_app.this.id
}

output "function_default_hostname" {
  description = "Default hostname of the Function App (e.g., <name>.azurewebsites.net)"
  value       = azurerm_function_app.this.default_hostname
}

output "function_identity_principal_id" {
  description = "Principal ID of the system-assigned identity"
  value       = azurerm_function_app.this.identity.principal_id
}
