# Host endpoint to which clients connect (without the wss:// prefix)
output "host" {
  description = "Web PubSub endpoint host (without wss:// prefix)"
  value       = azurerm_web_pubsub.web_pubsub.hostname
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
  value       = azurerm_web_pubsub.web_pubsub.name
}
