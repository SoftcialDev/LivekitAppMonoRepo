output "server_fqdn" {
  description = "Fully qualified domain name of PostgreSQL server"
  value       = azurerm_postgresql_flexible_server.this.fqdn
}
output "database_name" {
  description = "Default database name"
  value       = azurerm_postgresql_flexible_database.default_db.name
}
output "admin_username" {
  description = "Admin username"
  value       = azurerm_postgresql_flexible_server.this.administrator_login
}
