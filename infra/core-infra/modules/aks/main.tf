
# Create AKS Clusters
resource "azurerm_kubernetes_cluster" "aks-cluster" {
    name                = "${var.name_prefix}-k8s"
    location            = var.region
    resource_group_name = var.resource_group
    dns_prefix          = var.name_prefix
    sku_tier            = var.aks_price_tier

    default_node_pool {
        name           = "default"
        node_count     = var.aks_node_count
        vm_size        = var.vm_sku
        vnet_subnet_id =  var.vnet_subnet_id

        # these settings seems to be defults that constantly bother me during applys...
        upgrade_settings {
            drain_timeout_in_minutes      = 0
            max_surge                     = "10%"
            node_soak_duration_in_minutes = 0
        }
    }
  lifecycle {
    ignore_changes = [
      image_cleaner_enabled,
      image_cleaner_interval_hours,
    ]
  }
    identity {
        type = "SystemAssigned"
    }

    network_profile {
        network_plugin = "azure"
    }
}