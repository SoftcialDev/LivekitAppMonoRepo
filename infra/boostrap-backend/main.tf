# Generate a 6-character alphanumeric suffix to ensure global uniqueness
resource "random_string" "sa_suffix" {
  length           = 6
  upper            = false
  special          = false
  override_special = "-"
}

# 1) Create the Resource Group for the backend
resource "azurerm_resource_group" "bootstrap" {
  name     = var.bootstrap_rg_name
  location = var.bootstrap_rg_location
}

# 2) Create the Storage Account with random suffix
resource "azurerm_storage_account" "bootstrap" {
  name                     = "${var.storage_account_base_name}${random_string.sa_suffix.result}"
  resource_group_name      = azurerm_resource_group.bootstrap.name
  location                 = azurerm_resource_group.bootstrap.location
  account_tier             = var.storage_account_tier
  account_replication_type = var.storage_account_replication_type
}

# 3) Create the Blob Container for Terraform state
resource "azurerm_storage_container" "bootstrap" {
  name                  = var.container_name
  storage_account_name  = azurerm_storage_account.bootstrap.name
  container_access_type = "private"
}
