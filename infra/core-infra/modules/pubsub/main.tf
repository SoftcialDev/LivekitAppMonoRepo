# Defines an Azure Web PubSub service instance
resource "azurerm_web_pubsub" "web_pubsub" {
  # The base name for this Web PubSub instance, suffixed with "-pubsub"
  # It ensures uniqueness by pulling from the variable `name`
  name                = "${var.name}-pubsub"
  location            = var.location
  resource_group_name = var.resource_group_name
  sku                 = var.sku
  capacity            = var.unit_count

    identity {
    type = "SystemAssigned"
  }
}

# Defines a default hub under the Web PubSub service
resource "azurerm_web_pubsub_hub" "default_hub" {
  # The hub’s name must match exactly the parent service’s resource name (without “.webpubsub.azure.com”)
  name           = "livekit_agent_azure_pubsub"
  web_pubsub_id  = azurerm_web_pubsub.web_pubsub.id
}
