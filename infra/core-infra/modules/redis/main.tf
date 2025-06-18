resource "azurerm_redis_cache" "redis_cache" {
  name                = "${var.name_prefix}-redis"
  location            = var.region
  resource_group_name = var.resource_group
  family   = var.family
  capacity = var.capacity
  sku_name = var.sku_name

  minimum_tls_version = "1.2"
}

resource "azurerm_redis_firewall_rule" "allow_aks" {
  name                = "allow_aks"
  resource_group_name = var.resource_group
  redis_cache_name    = azurerm_redis_cache.redis_cache.name
  start_ip            = var.egress_public_ip
  end_ip              = var.egress_public_ip
}
