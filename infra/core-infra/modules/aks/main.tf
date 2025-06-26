# Create an Azure Kubernetes Service (AKS) cluster with system-assigned identity
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
    vnet_subnet_id = var.vnet_subnet_id

    # Control upgrade behavior for the node pool
    upgrade_settings {
      # Time to wait for node drains (minutes)
      drain_timeout_in_minutes      = 0
      # Maximum surge of nodes during upgrade
      max_surge                     = "10%"
      # Time nodes remain in ready state before upgrades
      node_soak_duration_in_minutes = 0
    }
  }

  # Prevent Terraform from resetting the image cleaner settings
  lifecycle {
    ignore_changes = [
      image_cleaner_enabled,
      image_cleaner_interval_hours,
    ]
  }

  # Use a system-assigned managed identity for cluster control plane
  identity {
    type = "SystemAssigned"
  }

  # Use Azure CNI networking for pod IP assignment
  network_profile {
    network_plugin = "azure"
  }
}
