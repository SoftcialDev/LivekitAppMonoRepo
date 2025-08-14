###############################################
# 1) AKS Cluster - fixed default system pool
###############################################
resource "azurerm_kubernetes_cluster" "aks-cluster" {
  # Basic cluster details
  name                = "${var.name_prefix}-k8s"   # Cluster name
  location            = var.region                 # Azure region
  resource_group_name = var.resource_group         # Resource Group
  dns_prefix          = var.name_prefix            # DNS prefix for AKS API
  sku_tier            = var.aks_price_tier         # e.g. "Free" or "Paid"

  # Default system node pool (non-autoscaling)
  default_node_pool {
    name           = "systempool"                  # Node pool name
    vm_size        = var.vm_sku             # Small SKU for system components
    node_count     = 1                              # Always 1 node for system workloads
    vnet_subnet_id = var.vnet_subnet_id

    # Rolling upgrade settings
    upgrade_settings {
      drain_timeout_in_minutes      = 0
      max_surge                     = "10%"
      node_soak_duration_in_minutes = 0
    }
  }

  # Ignore internal Azure image cleaner settings
  lifecycle {
    ignore_changes = [
      image_cleaner_enabled,
      image_cleaner_interval_hours,
    ]
  }

  # Managed identity for the control plane
  identity {
    type = "SystemAssigned"
  }

  # Networking configuration (Azure CNI)
  network_profile {
    network_plugin = "azure"
  }
}

#####################################################
# 2) User node pool for workloads (with autoscaling)
#####################################################
resource "azurerm_kubernetes_cluster_node_pool" "livekit-pool" {
  name                  = "livekit"                               # Pool name
  kubernetes_cluster_id = azurerm_kubernetes_cluster.aks-cluster.id
  vm_size               = var.vm_sku                      # VM SKU for LiveKit workloads
  min_count             = 1                                       # Minimum nodes
  max_count             = 3                                       # Maximum nodes
  auto_scaling_enabled = true
  vnet_subnet_id        = var.vnet_subnet_id
  mode                  = "User"                                  # User workloads

  # Optional: labels to target pods in YAML
  node_labels = {
    workload = "livekit"
  }


}
