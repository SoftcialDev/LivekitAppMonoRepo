output "namespace_name" {
  description = "Service Bus namespace name"
  value       = azurerm_servicebus_namespace.serviceBus.name
}
output "topic_name" {
  description = "Service Bus topic name"
  value       = azurerm_servicebus_topic.commands.name
}
output "connection_string" {
  description = "Primary connection string for Service Bus"
  value       = azurerm_servicebus_namespace_authorization_rule.rule.primary_connection_string
}


output "commands_subscription_name" {
  description = "Service Bus subscription name for commands topic"
  value       = azurerm_servicebus_subscription.commands_sub.name
}