resource "azurerm_postgresql_flexible_server" "this" {
  name                = var.server_name
  location            = var.location
  resource_group_name = var.resource_group_name
  version             = var.version

  administrator_login          = var.admin_username
  administrator_password       = var.admin_password
  sku_name                     = var.sku_name
  storage_mb                   = var.storage_mb
  delegated_subnet_id          = var.vnet_subnet_id != "" ? var.vnet_subnet_id : null
  public_network_access_enabled = var.public_network_access == "Enabled"

  # Backup and high availability defaults; adjust if needed.
  backup_retention_days = 7
}

# If public_network_access_enabled, create firewall rules
resource "azurerm_postgresql_flexible_server_firewall_rule" "allow_ips" {
  count               = var.public_network_access == "Enabled" ? length(var.allowed_ips) : 0
  name                = "allow_ip_${count.index}"
  server_id           = azurerm_postgresql_flexible_server.this.id
  start_ip_address    = var.allowed_ips[count.index]
  end_ip_address      = var.allowed_ips[count.index]
}

# A default database can be created via azurerm_postgresql_flexible_database
resource "azurerm_postgresql_flexible_database" "default_db" {
  name                = "${var.server_name}-db"
  resource_group_name = var.resource_group_name
  server_name         = azurerm_postgresql_flexible_server.this.name
  charset             = "UTF8"
  collation           = "English_United States.1252"
}
