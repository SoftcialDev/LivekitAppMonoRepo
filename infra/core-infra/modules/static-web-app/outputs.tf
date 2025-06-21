# outputs.tf

output "static_web_app_id" {
  description = "ID del recurso Static Web App"
  value       = azurerm_static_web_app.static_web_app.id
}

output "default_hostname" {
  description = "Hostname asignado a la Static Web App (sin https://)"
  value       = azurerm_static_web_app.static_web_app.default_host_name
}

output "url" {
  description = "URL completa de la Static Web App"
  value       = "https://${azurerm_static_web_app.static_web_app.default_host_name}"
}


output "static_web_app_deployment_token" {
  description = "Token de despliegue (API key) para Azure Static Web App"
  value       = data.azurerm_static_web_app.app.api_key
  sensitive   = true
}


output "name" {
  description = "Static web app name"
  value = azurerm_static_web_app.static_web_app.name
}