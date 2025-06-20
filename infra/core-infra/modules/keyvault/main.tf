# Fetch tenant ID for access policies
data "azuread_client_config" "current" {}

resource "azurerm_key_vault" "keyvault" {
  name                       = "${var.name_prefix}-kv"
  location                   = var.location
  resource_group_name        = var.resource_group_name
  tenant_id                  = data.azuread_client_config.current.tenant_id
  sku_name                   = var.key_vault_sku_name
  purge_protection_enabled   = false
  soft_delete_retention_days = 7

}

# Each secret stored in Key Vault
resource "azurerm_key_vault_secret" "livekit_api_key" {
  name         = "LIVEKIT-API-KEY"
  value        = var.livekit_api_key
  key_vault_id = azurerm_key_vault.keyvault.id
}

resource "azurerm_key_vault_secret" "livekit_api_secret" {
  name         = "LIVEKIT-API-SECRET"
  value        = var.livekit_api_secret
  key_vault_id = azurerm_key_vault.keyvault.id
}

resource "azurerm_key_vault_secret" "azure_client_secret" {
  name         = "AZURE-CLIENT-SECRET"
  value        = var.azure_client_secret
  key_vault_id = azurerm_key_vault.keyvault.id
}

resource "azurerm_key_vault_secret" "service_bus_connection" {
  name         = "SERVICE-BUS-CONNECTION"
  value        = var.service_bus_connection
  key_vault_id = azurerm_key_vault.keyvault.id
}

resource "azurerm_key_vault_secret" "webpubsub_key" {
  name         = "WEBPUBSUB-KEY"
  value        = var.webpubsub_key
  key_vault_id = azurerm_key_vault.keyvault.id
}


