terraform {
  backend "azurerm" {
    resource_group_name   = "tfstate-rg-in-contact-app-421"
    storage_account_name  = "tfstateaccountai7iyp"
    container_name        = "tfstate"
    key                   = "core-infra-prod.tfstate"
  }
}
