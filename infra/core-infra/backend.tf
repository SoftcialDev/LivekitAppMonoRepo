terraform {
  backend "azurerm" {
    resource_group_name   = "backend-livekit-rg"
    storage_account_name  = "backendlivekitstorage"
    container_name        = "tfstate"
    key                   = "core-infra-prod.tfstate"
  }
}
