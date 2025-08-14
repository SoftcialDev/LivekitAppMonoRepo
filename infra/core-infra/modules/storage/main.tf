resource "azurerm_storage_account" "storage_account" {
  name                     = "incontactstorage3425"
  resource_group_name      = var.resource_group_name
  location                 = var.location
  account_tier             = var.account_tier
  account_replication_type = var.account_replication_type

  # Blob settings
  access_tier              = var.access_tier


  tags = {
    CreatedBy = "terraform-simple-storage"
  }
}

resource "azurerm_storage_container" "snapshots" {
  name                  = "snapshots"
  storage_account_name  = azurerm_storage_account.storage_account.name
  container_access_type = "container"
}

resource "azurerm_storage_container" "recordings" {
  name                  = "recordings"
  storage_account_name  = azurerm_storage_account.storage_account.name
  container_access_type = "private" 
}