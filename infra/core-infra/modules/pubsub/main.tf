# Defines an Azure Web PubSub service instance
resource "azurerm_web_pubsub" "web_pubsub" {
  # The base name for this Web PubSub instance, suffixed with "-pubsub"
  # It ensures uniqueness by pulling from the variable `name`
  name = "${var.name}-pubsub"

  # Azure region where the service will be deployed (e.g., "eastus")
  location = var.location

  # The name of the Resource Group in which to create this service
  resource_group_name = var.resource_group_name

  # The pricing tier (SKU) for the service, such as "Standard_S1"
  sku = var.sku

  # Number of units allocated to this service for scaling capacity
  capacity = var.unit_count
}
