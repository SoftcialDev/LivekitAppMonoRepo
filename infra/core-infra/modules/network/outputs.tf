output "vnet_id" {
  value       = azurerm_virtual_network.main-vnet.id
  description = "ID de la VNet creada"
}

output "subnet_id" {
  value       = azurerm_subnet.main-subnet.id
  description = "ID de la Subnet creada"
}
