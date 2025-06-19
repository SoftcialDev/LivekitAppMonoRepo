resource "azurerm_servicebus_namespace" "serviceBus" {
  name                = var.namespace_name
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


resource "azuread_oauth2_permission_grant" "spa_to_api" {
  client_id                     = azuread_service_principal.spa_sp.id
  resource_service_principal_id = azuread_service_principal.api_sp.id
  consented_permission_ids      = [random_uuid.api_scope_id.result]
}