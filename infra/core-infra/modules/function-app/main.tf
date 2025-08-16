data "azuread_client_config" "current" {}


data "azuread_service_principal" "api_sp" {
  client_id  = var.SERVICE_PRINCIPAL_OBJECT_ID
}


resource "azurerm_app_service_plan" "function_plan" {
  name                = "${var.name_prefix}-func-plan"
  location            = var.location
  resource_group_name = var.resource_group_name
  kind                = "FunctionApp"

  sku {
    tier = var.function_plan_sku_tier
    size = var.function_plan_sku_size
  }
}


resource "azurerm_function_app" "function_app" {
  name                       = "${var.name_prefix}-func"
  location                   = var.location
  resource_group_name        = var.resource_group_name
  app_service_plan_id        = azurerm_app_service_plan.function_plan.id
  storage_account_name       = var.storage_account_name
  storage_account_access_key = var.storage_account_access_key
  version                    = "~4"

  identity {
    type = "SystemAssigned"
  }

  auth_settings {
    enabled                       = true
    default_provider              = "AzureActiveDirectory"
    issuer                        = "https://login.microsoftonline.com/${data.azuread_client_config.current.tenant_id}/v2.0"
    unauthenticated_client_action = "RedirectToLoginPage"

    active_directory {
      client_id = var.aad_app_client_id
    }
  }

    site_config {
    cors {
      allowed_origins = var.cors_allowed_origins
    }
  }

  app_settings = {
    FUNCTIONS_WORKER_RUNTIME    = "node"
    WEBSITE_RUN_FROM_PACKAGE    = "1"
    AzureWebJobsStorage         = var.storage_account_connection_string

    # Plain (non-sensitive)
    AZURE_TENANT_ID             = var.azure_tenant_id
    AZURE_CLIENT_ID             = var.azure_client_id
    LIVEKIT_API_URL             = var.livekit_api_url
    WEBPUBSUB_ENDPOINT          = var.webpubsub_endpoint
    SERVICE_BUS_TOPIC_NAME      = var.service_bus_topic_name
    WEBPUBSUB_NAME              = var.webpubsub_hub_name
    NODE_ENV                    = var.node_env
    ADMINS_GROUP_ID              = var.admins_group_id
    EMPLOYEES_GROUP_ID          = var.employees_group_id
    SUPERVISORS_GROUP_ID        = var.supervisors_group_id
    SUPER_ADMINS_GROUP_ID      = var.super_admin_group_id
    CONTACT_MANAGER_GROUP_ID    = var.contact_manager_group_id
    RECORDINGS_CONTAINER_NAME    = var.storage_account_recordings_container_name
    RECORDINGS_CONTAINER_URL     = var.storage_account_recordings_container_url
    AZURE_STORAGE_ACCOUNT = var.storage_account_name
    FUNCTIONS_EXTENSION_VERSION = "~4"
    WEBSITE_NODE_DEFAULT_VERSION = "~20"
    AZURE_STORAGE_CONNECTION_STRING = var.storage_account_connection_string
    SNAPSHOT_CONTAINER_NAME     = var.storage_account_snapshot_container_name
    LIVEKIT_API_KEY        = "@Microsoft.KeyVault(SecretUri=${var.secret_uris["livekit_api_key"]})"
    LIVEKIT_API_SECRET     = "@Microsoft.KeyVault(SecretUri=${var.secret_uris["livekit_api_secret"]})"
    AZURE_CLIENT_SECRET    = "@Microsoft.KeyVault(SecretUri=${var.secret_uris["azure_client_secret"]})"
    SERVICE_BUS_CONNECTION = "@Microsoft.KeyVault(SecretUri=${var.secret_uris["service_bus_connection"]})"
    WEBPUBSUB_KEY          = "@Microsoft.KeyVault(SecretUri=${var.secret_uris["webpubsub_key"]})"
    DATABASE_URL           = "@Microsoft.KeyVault(SecretUri=${var.secret_uris["postgres_connection"]})"
    WEBPUBSUB_CONNECTION = "@Microsoft.KeyVault(SecretUri=${var.secret_uris["webpubsub_connection_string"]})"
    AZURE_AD_API_IDENTIFIER_URI = var.AZURE_AD_API_IDENTIFIER_URI
    SERVICE_PRINCIPAL_OBJECT_ID = data.azuread_service_principal.api_sp.object_id
    COMMANDS_SUBSCRIPTION_NAME  = var.commands_subscription_name
    WEBPUBSUB_HUB = var.webpubsub_hub
  }
}

resource "azurerm_key_vault_access_policy" "func" {
  key_vault_id = var.key_vault_id
  tenant_id    = data.azuread_client_config.current.tenant_id
  object_id = azurerm_function_app.function_app.identity[0].principal_id

  secret_permissions = [
    "Get",
    "List",
    "Set"
  ]
}
