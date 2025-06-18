output "bootstrap_rg_name" {
  description = "Resource Group for Terraform state backend"
  value       = azurerm_resource_group.bootstrap.name
}

output "storage_account_name" {
  description = "Actual name of the storage account created"
  value       = azurerm_storage_account.bootstrap.name
}

output "container_name" {
  description = "Blob container for Terraform state files"
  value       = azurerm_storage_container.bootstrap.name
}

output "storage_account_suffix" {
  description = "Random suffix appended to base name"
  value       = random_string.sa_suffix.result
}
