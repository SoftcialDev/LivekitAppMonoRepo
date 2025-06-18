output "redis_hostname" {
  description = "Endpoint de Redis (host)"
  value       = azurerm_redis_cache.redis_cache.hostname
}

output "redis_primary_key" {
  description = "Primary access key de Redis"
  value       = azurerm_redis_cache.redis_cache.primary_access_key
}
