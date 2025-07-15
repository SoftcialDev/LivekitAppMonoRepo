# Create a PostgreSQL Flexible Server instance
resource "azurerm_postgresql_flexible_server" "postgres_server" {
  # Constructed name using the prefix variable, e.g., "<prefix>-postgres-server-flexible"
  name                = "${var.name_prefix}-postgres-server-flexible"
  # Azure region for the server
  location            = var.location
  # Resource Group where the server will live
  resource_group_name = var.resource_group_name
  # PostgreSQL major version (e.g., "13")
  version             = var.postgres_version

  # Administrator credentials for the server
  administrator_login    = var.admin_username
  administrator_password = var.admin_password

  # Service tier and storage size
  sku_name   = var.sku_name     # e.g., "GP_Standard_D2s_v3"
  storage_mb = var.storage_mb   # total storage in megabytes

  # Enable or disable public access based on input variable
  public_network_access_enabled = var.public_network_access == "Enabled"

  # Keep backups for 7 days; adjust value as needed
  backup_retention_days = 7

  # Ignore changes to availability zones and HA standby zone
  lifecycle {
    ignore_changes = [
      zone,
      high_availability[0].standby_availability_zone,
    ]
  }

  # Apply a Name tag to the server resource
  tags = {
    Name = "${var.name_prefix}-postgres"
  }
}

resource "azurerm_postgresql_flexible_server_firewall_rule" "allow_azure_services" {
  name      = "${var.name_prefix}-fw-azure-services"
  server_id = azurerm_postgresql_flexible_server.postgres_server.id

  # "0.0.0.0" to "0.0.0.0" is the special range for Azure services
  start_ip_address = "0.0.0.0"
  end_ip_address   = "0.0.0.0"
}


# Define firewall rules to allow public access from specific IPs
resource "azurerm_postgresql_flexible_server_firewall_rule" "postgres_firewall" {
  # Only create rules when public access is enabled
  count = var.public_network_access == "Enabled" ? length(var.allowed_ips) : 0

  # Names follow the pattern "<prefix>-fw-0", "<prefix>-fw-1", etc.
  name      = "${var.name_prefix}-fw-${count.index}"
  # Associate with the PostgreSQL server
  server_id = azurerm_postgresql_flexible_server.postgres_server.id

  # Each rule opens a single IP (start == end)
  //start_ip_address = var.allowed_ips[count.index]
  //end_ip_address   = var.allowed_ips[count.index]
  start_ip_address = "0.0.0.0"
  end_ip_address   = "255.255.255.255"
}

# create a default database on the server
resource "azurerm_postgresql_flexible_server_database" "postgres_database" {
  # Database name using the naming prefix
  name      = "${var.name_prefix}-db"
  # Link to the parent server
  server_id = azurerm_postgresql_flexible_server.postgres_server.id
  # Character set and collation settings
  charset   = "UTF8"
  collation = "en_US.utf8"
}
