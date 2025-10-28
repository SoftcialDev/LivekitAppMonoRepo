terraform {
  backend "azurerm" {
    resource_group_name   = "in-contact-app-daniel"
    storage_account_name  = "tfstateaccountdh7sbp"
    container_name        = "tfstate"
    key                   = "core-infra-prod.tfstate"
  }
}
