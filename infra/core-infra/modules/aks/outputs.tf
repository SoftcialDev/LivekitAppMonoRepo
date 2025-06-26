# Export the raw kubeconfig for the AKS cluster (marked sensitive)
output "kubeconfig" {
  description = "Raw kubeconfig file for accessing the AKS cluster"
  value       = azurerm_kubernetes_cluster.aks-cluster.kube_config_raw
  sensitive   = true
}
