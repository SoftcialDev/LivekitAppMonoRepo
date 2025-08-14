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

output "snapshot_container_name" {
  description = "Name of the Blob container for snapshots"
  value       = azurerm_storage_container.snapshots.name
}

output "recordings_container_name" {
  description = "Name of the Blob container for LiveKit recordings"
  value       = azurerm_storage_container.recordings.name
}

output "recordings_container_url" {
  description = "Full URL of the Blob container for LiveKit recordings"
  value       = "https://${azurerm_storage_account.storage_account.name}.blob.core.windows.net/${azurerm_storage_container.recordings.name}"
}
