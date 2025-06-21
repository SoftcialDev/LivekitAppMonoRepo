# Create PostgreSQL Flexible Server
resource "azurerm_postgresql_flexible_server" "postgres_server" {
  # Name formed from prefix, for example "<prefix>-postgres-server"
  name                = "${var.name_prefix}-postgres-server-flexible"
  location            = var.location
  resource_group_name = var.resource_group_name
  version             = var.postgres_version

  administrator_login    = var.admin_username
  administrator_password = var.admin_password

  sku_name   = var.sku_name
  storage_mb = var.storage_mb

  # If a vnet_subnet_id is provided (non-empty), deploy in that subnet for private access.
  # Otherwise, allow public access according to public_network_access setting.
  delegated_subnet_id           = var.vnet_subnet_id != "" ? var.vnet_subnet_id : null
  public_network_access_enabled = var.public_network_access == "Enabled"

  # Backup retention in days; adjust as needed
  backup_retention_days = 7

  lifecycle {
    ignore_changes = [
      zone,
      high_availability[0].standby_availability_zone,
    ]
  }

  tags = {
    Name = "${var.name_prefix}-postgres"
  }
}

# Firewall rules for public access, only when public_network_access is 'Enabled'

resource "azurerm_postgresql_flexible_server_firewall_rule" "postgres_firewall" {
  count = var.public_network_access == "Enabled" ? length(var.allowed_ips) : 0

  # Name pattern: "<prefix>-fw-0", "<prefix>-fw-1", etc.
  name      = "${var.name_prefix}-fw-${count.index}"
  server_id = azurerm_postgresql_flexible_server.postgres_server.id

  start_ip_address = var.allowed_ips[count.index]
  end_ip_address   = var.allowed_ips[count.index]
}

# Default database creation; optional
resource "azurerm_postgresql_flexible_server_database" "postgres_database" {
  name      = "${var.name_prefix}-db"
  server_id = azurerm_postgresql_flexible_server.postgres_server.id
  charset   = "UTF8"
  collation           = "en_US.utf8"
}
