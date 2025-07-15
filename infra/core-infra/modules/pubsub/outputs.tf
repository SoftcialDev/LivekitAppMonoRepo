# Host endpoint to which clients connect (without the wss:// prefix)
output "host" {
  description = "Web PubSub endpoint host (with https:// prefix)"
  value       = "https://${azurerm_web_pubsub.web_pubsub.hostname}"
}

# Primary connection string for server-to-service communication
output "primary_connection_string" {
  description = "Primary connection string for server to send messages"
  value       = azurerm_web_pubsub.web_pubsub.primary_connection_string
}

# Primary access key used when generating client tokens
output "primary_key" {
  description = "Primary key for client token generation"
  value       = azurerm_web_pubsub.web_pubsub.primary_access_key
}

# The name of the Web PubSub hub
output "webpubsub_hub_name" {
  description = "Name of the Web PubSub hub"
  value       = azurerm_web_pubsub_hub.default_hub.name
}


# The resource ID of the Web PubSub hub (useful for RBAC or other references)
output "webpubsub_hub_id" {
  description = "Resource ID of the Web PubSub hub"
  value       = azurerm_web_pubsub_hub.default_hub.web_pubsub_id
}

output "system_identity_principal_id" {
  description = "System identity principal id assigned to this resource"
  value = azurerm_web_pubsub.web_pubsub.identity[0].principal_id
}