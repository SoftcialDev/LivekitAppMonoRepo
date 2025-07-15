output "key_vault_uri" {
  description = "URI of the Key Vault, e.g. https://{vault-name}.vault.azure.net/"
  value       = azurerm_key_vault.keyvault.vault_uri
}

output "secret_uris" {
  description = "Map of secret URIs in Key Vault"
  value = {
    livekit_api_key     = azurerm_key_vault_secret.livekit_api_key.id
    livekit_api_secret  = azurerm_key_vault_secret.livekit_api_secret.id
    azure_client_secret = azurerm_key_vault_secret.azure_client_secret.id
    service_bus_connection = azurerm_key_vault_secret.service_bus_connection.id
    webpubsub_key       = azurerm_key_vault_secret.webpubsub_key.id
    postgres_connection = azurerm_key_vault_secret.postgres_connection.id
    webpubsub_connection_string = azurerm_key_vault_secret.webpubsub_connection.id
  }
}

output "key_vault_id" {
  description = "Key Vault resource ID"
  value       = azurerm_key_vault.keyvault.id
}