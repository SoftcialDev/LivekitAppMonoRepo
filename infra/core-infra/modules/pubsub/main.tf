resource "azurerm_web_pubsub" "web_pubsub" {
  name                = "${var.name}-pubsub"
  location            = var.location
  resource_group_name = var.resource_group_name
  sku                 = var.sku
  capacity            = var.unit_count
}
