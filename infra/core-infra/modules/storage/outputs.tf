output "storage_account_name" {
  description = "The name of the Storage Account created"
  value       = azurerm_storage_account.storage_account.name
}

output "storage_account_primary_connection_string" {
  description = "Primary connection string for the Storage Account"
  value       = azurerm_storage_account.storage_account.primary_connection_string
  sensitive   = true
}

output "storage_account_primary_access_key" {
  description = "Primary access key for the Storage Account"
  value       = azurerm_storage_account.storage_account.primary_access_key
  sensitive   = true
}
