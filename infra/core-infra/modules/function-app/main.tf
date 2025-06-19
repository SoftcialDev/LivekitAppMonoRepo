
data "azuread_client_config" "current" {}

resource "azurerm_function_app" "this" {
  name                       = var.function_app_name
  location                   = var.location
  resource_group_name        = var.resource_group_name
  app_service_plan_id        = var.app_service_plan_id
  storage_account_name       = var.storage_account_name
  storage_account_access_key = var.storage_account_access_key
  version                    = "~4"

  identity {
    type = "SystemAssigned"
  }


  app_settings = {
    FUNCTIONS_WORKER_RUNTIME = "node"
    AzureWebJobsStorage      = "DefaultEndpointsProtocol=https;AccountName=${var.storage_account_name};AccountKey=${var.storage_account_access_key};EndpointSuffix=core.windows.net"
    WEBSITE_RUN_FROM_PACKAGE = "1"
  }

  auth_settings {
    enabled                       = true
    default_provider              = "AzureActiveDirectory"
    issuer                        = "https://login.microsoftonline.com/${data.azuread_client_config.current.tenant_id}/v2.0"
    unauthenticated_client_action = "RedirectToLoginPage"
  }
}
