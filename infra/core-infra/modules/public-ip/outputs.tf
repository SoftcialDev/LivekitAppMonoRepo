output "public_ip_address" {
  description = "La dirección IP pública estática"
  value       = azurerm_public_ip.public_ip.ip_address
}

output "public_ip_id" {
  description = "El ID del recurso Public IP"
  value       = azurerm_public_ip.public_ip.id
}

