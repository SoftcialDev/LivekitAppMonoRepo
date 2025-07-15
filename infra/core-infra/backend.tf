terraform {
  backend "azurerm" {
    resource_group_name   = "tfstate-rg-in-contact-app"
    storage_account_name  = "tfstateaccountd53781"
    container_name        = "tfstate"
    key                   = "core-infra-prod.tfstate"
  }
}
