output "postgres_server_fqdn" {
  description = "Fully qualified domain name of the PostgreSQL Flexible Server."
  value       = azurerm_postgresql_flexible_server.postgres_server.fqdn
}

output "postgres_server_admin_username" {
  description = "Administrator username for PostgreSQL Flexible Server."
  value       = azurerm_postgresql_flexible_server.postgres_server.administrator_login
}

output "postgres_database_name" {
  description = "Name of the default database created."
  value       = azurerm_postgresql_flexible_server_database.postgres_database.name
}

output "postgres_server_id" {
  description = "Resource ID of the PostgreSQL Flexible Server."
  value       = azurerm_postgresql_flexible_server.postgres_server.id
}


output "postgres_server_password" {
  description = "Resource ID of the PostgreSQL Flexible Server."
  value       = azurerm_postgresql_flexible_server.postgres_server.administrator_password
  sensitive = true
}

output "database_url" {
  description = "URL de conexión a la base de datos PostgreSQL"
  value = "postgresql://${azurerm_postgresql_flexible_server.postgres_server.administrator_login}:${azurerm_postgresql_flexible_server.postgres_server.administrator_password}@${azurerm_postgresql_flexible_server.postgres_server.fqdn}:5432/${azurerm_postgresql_flexible_server_database.postgres_database.name}?schema=public&sslmode=require"
  sensitive = true
}