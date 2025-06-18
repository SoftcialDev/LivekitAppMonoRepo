resource "azurerm_static_web_app" "static_web_app" {
  name                = "${var.name_prefix}-swa"
  resource_group_name = var.resource_group_name
  location            = var.location
  sku_tier            = var.sku_tier

  tags = var.tags
}

data "azurerm_static_web_app" "app" {
  name                = azurerm_static_web_app.static_web_app.name
  resource_group_name = azurerm_static_web_app.static_web_app.resource_group_name
}
