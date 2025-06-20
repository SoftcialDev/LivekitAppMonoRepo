# Host endpoint to which clients connect
output "host" {
  description = "Web PubSub endpoint host (without wss:// prefix)"
  value       = azurerm_web_pubsub.web_pubsub.hostname
}
# Primary and secondary keys
output "primary_connection_string" {
  description = "Primary connection string for server to send messages"
  value       = azurerm_web_pubsub.web_pubsub.primary_connection_string
}
output "primary_key" {
  description = "Primary key for client token generation"
  value       = azurerm_web_pubsub.web_pubsub.primary_access_key
}


output "webpubsub_hub_name" {
  description = "webpubsub_hub_name"
  value       = azurerm_web_pubsub.web_pubsub.name
}

