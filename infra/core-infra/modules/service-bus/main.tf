resource "azurerm_servicebus_namespace" "serviceBus" {
  name                = "${var.name_prefix}-service-bus"
  location            = var.location
  resource_group_name = var.resource_group_name
  sku                 = var.sku_name
}

resource "azurerm_servicebus_topic" "commands" {
  name         = var.topic_name
  namespace_id = azurerm_servicebus_namespace.serviceBus.id

}

resource "azurerm_servicebus_namespace_authorization_rule" "rule" {
  name         = var.auth_rule_name
    namespace_id = azurerm_servicebus_namespace.serviceBus.id
  listen       = true
  send         = true
  manage       = true
}
