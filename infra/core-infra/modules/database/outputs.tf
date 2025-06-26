# Output the fully qualified domain name for client connections
output "postgres_server_fqdn" {
  description = "Fully qualified domain name of the PostgreSQL Flexible Server."
  value       = azurerm_postgresql_flexible_server.postgres_server.fqdn
}

# Output the admin login name for scripting or tooling purposes
output "postgres_server_admin_username" {
  description = "Administrator username for the PostgreSQL Flexible Server."
  value       = azurerm_postgresql_flexible_server.postgres_server.administrator_login
}

# Output the name of the default database created on the server
output "postgres_database_name" {
  description = "Name of the default database created on the PostgreSQL server."
  value       = azurerm_postgresql_flexible_server_database.postgres_database.name
}

# Output the resource ID of the PostgreSQL Flexible Server
output "postgres_server_id" {
  description = "Resource ID of the PostgreSQL Flexible Server."
  value       = azurerm_postgresql_flexible_server.postgres_server.id
}

# Output the administrator password (marked sensitive so it won't be shown in logs)
output "postgres_server_password" {
  description = "Administrator password for the PostgreSQL Flexible Server."
  value       = azurerm_postgresql_flexible_server.postgres_server.administrator_password
  sensitive   = true
}

# Build and output a full connection string for applications to consume
output "database_url" {
  description = "PostgreSQL connection URL with SSL required (sensitive)."
  value       = "postgresql://${azurerm_postgresql_flexible_server.postgres_server.administrator_login}:${azurerm_postgresql_flexible_server.postgres_server.administrator_password}@${azurerm_postgresql_flexible_server.postgres_server.fqdn}:5432/${azurerm_postgresql_flexible_server_database.postgres_database.name}?schema=public&sslmode=require"
  sensitive   = true
}
