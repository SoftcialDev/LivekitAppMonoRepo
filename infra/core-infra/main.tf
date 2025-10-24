############################################################
# Terraform configuration for a complete Azure environment #
############################################################

# 1. Create Resource Group inline
resource "azurerm_resource_group" "main-rg" {
  # Use a consistent prefix for naming, supplied by var.name_prefix
  name     = var.name_prefix
  # Deploy the resource group in the region provided by var.region
  location = var.region
}

# Retrieve details about the current Azure AD tenant and client,
# so we can reference the tenant ID and object ID in later modules.
data "azuread_client_config" "current" {}

# 2. Invoke network module for VNet + Subnet
module "network" {
  source      = "./modules/network"
  # Prefix used by the network module for naming VNet, subnets, etc.
  name_prefix = var.name_prefix
  # Region to deploy the VNet and subnets
  region      = var.region
  # Associate this network with the resource group we just created
  resource_group  = azurerm_resource_group.main-rg.name
}

# 3. Static Web App module
module "static_web_app" {
  source              = "./modules/static-web-app"
  # Prefix for naming the Static Web App resource
  name_prefix         = var.name_prefix
  # Deploy into the same Resource Group
  resource_group_name = azurerm_resource_group.main-rg.name
  # Static Web Apps availability varies by region; specify eastus2 here
  location            = "eastus2"
  # Optional pricing tier for the Static Web App, default is Free
  sku_tier            = var.swa_sku_tier

  # Environment variables to configure Azure AD integration and API endpoint
  env_vars = {
    VITE_AZURE_AD_CLIENT_ID     = module.aad_spa.spa_app_client_id
    VITE_AZURE_AD_TENANT_ID     = data.azuread_client_config.current.tenant_id
    VITE_AZURE_AD_API_CLIENT_ID = module.aad_spa.api_application_client_id
    VITE_AZURE_AD_API_SCOPE_URI = module.aad_spa.api_scope_uri
    VITE_API_URL                = "https://livekit-agent-azure-func.azurewebsites.net"
  }

  # Apply any tags defined in the root variables for consistent tagging
  tags = var.tags
}


# 5. Redis module, currently is not necessary
/*module "redis" {
  source         = "./modules/redis"
  # Naming prefix for the Redis instance
  name_prefix    = var.name_prefix
  # Region where Redis will be deployed
  region         = var.region
  # Attach Redis to the main resource group
  resource_group = azurerm_resource_group.main-rg.name
  # SKU family, name, and capacity to define performance tier
  family         = var.redis_family
  sku_name       = var.redis_sku_name
  capacity       = var.redis_capacity
  # Use the egress public IP if Redis requires outbound connectivity
  egress_public_ip = module.pip_egress.public_ip_address
}*/

# 6. AAD SPA (Single Page App) registration module
module "aad_spa" {
  source                        = "./modules/aad-spa"
  # Name for the Azure AD application
  aad_app_name                  = var.aad_app_name
  # Redirect URIs for authentication flows
  aad_redirect_uris = concat(
    var.aad_redirect_uris
  )
  aad_logout_uris               = var.aad_logout_uris
  # Reuse the same URIs for the API application
  aad_api_redirect_uris         = var.aad_redirect_uris
  # Group object IDs granted admin rights to manage the app
  aad_admins_group_members      = var.aad_admins_group_members
  aad_supervisors_group_members = var.aad_admins_group_members
  aad_desktop_redirect_uris = var.aad_desktop_redirect_uris
 github_repo                 =               var.github_repo
}

# 7. AKS cluster module
module "aks" {
  source              = "./modules/aks"
  # Naming prefix for the AKS cluster
  name_prefix         = var.name_prefix
  # Region for the AKS deployment
  region              = var.region
  # Resource Group to contain the cluster
  resource_group      = azurerm_resource_group.main-rg.name
  # Subnet ID provided by the network module for VNet integration
  vnet_subnet_id      = module.network.subnet_id
  # Node pool size and VM SKU for cluster nodes
  vm_sku              = var.vm_sku
  aks_price_tier      = var.aks_price_tier

  # Ensure the VNet and subnet exist before creating AKS
  depends_on = [ module.network ]
}

# 8. Web PubSub service module
module "web_pubsub" {
  source              = "./modules/pubsub"
  # Use the main resource group
  resource_group_name = azurerm_resource_group.main-rg.name
  location            = var.region
  # Prefix used to construct the Web PubSub resource name
  name                = var.name_prefix
  # SKU and capacity to tier the PubSub service
  sku                 = var.web_pubsub_sku
  unit_count          = var.web_pubsub_capacity
}

# 9. Storage account module
module "storage" {
  source              = "./modules/storage"
  # Storage account names must be 3–24 lowercase alphanumeric characters
  name_prefix         = var.name_prefix
  # Deploy into the main resource group
  resource_group_name = azurerm_resource_group.main-rg.name
  location            = var.region
  # Tier, replication, and access tier for Blob storage
  account_tier             = var.simple_storage_account_tier
  account_replication_type = var.simple_storage_replication_type
  access_tier              = var.simple_storage_access_tier
}

# 10. Function App module
module "function_app" {
  source = "./modules/function-app"
  # Naming prefix and target resource group
  name_prefix             = var.name_prefix
  resource_group_name     = azurerm_resource_group.main-rg.name
  location                = var.region
  

  # Link to the Storage Account for function code and state
  storage_account_name           = module.storage.storage_account_name
  storage_account_access_key     = module.storage.storage_account_primary_access_key
  storage_account_connection_string = module.storage.storage_account_primary_connection_string
  storage_account_snapshot_container_name = module.storage.snapshot_container_name

  # Authentication and identity configuration
  aad_app_client_id           = module.aad_spa.api_application_client_id
  azure_tenant_id             = data.azuread_client_config.current.tenant_id
  azure_client_id             = module.aad_spa.api_application_client_id
  storage_account_recordings_container_name  = module.storage.recordings_container_name
  storage_account_recordings_container_url   = module.storage.recordings_container_url

  # Key Vault integration for secrets
  key_vault_id                = module.keyvault.key_vault_id
  secret_uris                 = module.keyvault.secret_uris

  # Assign Azure AD group IDs for role-based access
  admins_group_id             = module.aad_spa.spa_app_role_admin_id
  employees_group_id          = module.aad_spa.spa_app_role_employee_id
  supervisors_group_id        = module.aad_spa.spa_app_role_supervisor_id
  contact_manager_group_id    = module.aad_spa.spa_app_role_contact_manager_id
  super_admin_group_id       = module.aad_spa.spa_app_role_super_admin_id

  # External service endpoints and configuration
  livekit_api_url             = var.livekit_url
  webpubsub_endpoint          = module.web_pubsub.host
  AZURE_AD_API_IDENTIFIER_URI = module.aad_spa.AZURE_AD_API_IDENTIFIER_URI
  SERVICE_PRINCIPAL_OBJECT_ID = module.aad_spa.SERVICE_PRINCIPAL_OBJECT_ID
  webpubsub_hub_name          = module.web_pubsub.webpubsub_hub_name
  service_bus_topic_name      = var.servicebus_topic_name
  commands_subscription_name   = module.service_bus.commands_subscription_name
  webpubsub_hub                = module.web_pubsub.webpubsub_hub_name

  # CORS settings for the Static Web App and local development
  cors_allowed_origins        = [
    "https://${module.static_web_app.default_hostname}",
    "http://localhost:5173",
    "http://localhost:3000"
  ]

  # Consumption-based Function App plan settings
  function_plan_sku_tier      = "Dynamic"
  function_plan_sku_size      = "Y1"
  # Node environment for function runtime
  node_env                    = var.node_env

  # Ensure Key Vault exists before deploying the Function App
  depends_on = [ module.keyvault,
  module.aad_spa ]
}

data "azurerm_role_definition" "contributor" {
  name = "Contributor"
}

resource "azurerm_role_assignment" "pubsub_to_function" {
  scope              = module.function_app.function_app_id
  role_definition_id = data.azurerm_role_definition.contributor.id
  principal_id       = module.web_pubsub.system_identity_principal_id
}

data "azurerm_function_app_host_keys" "host_keys" {
  name                = module.function_app.function_app_name
  resource_group_name = module.function_app.function_app_resource_group_name

  depends_on = [ module.function_app ]
}  


resource "azurerm_web_pubsub_hub" "with_handler" {
  name          = module.web_pubsub.webpubsub_hub_name
  web_pubsub_id = module.web_pubsub.webpubsub_hub_id

  event_handler {
    url_template = "https://${module.function_app.function_default_hostname}/runtime/webhooks/webpubsub?code=${data.azurerm_function_app_host_keys.host_keys.webpubsub_extension_key}"
    system_events                 = ["connect", "connected", "disconnected"]
  }
  depends_on = [ 
    module.function_app,
    module.web_pubsub
   ]

}

# 11. PostgreSQL database module
module "postgres" {
  source = "./modules/database"
  # Naming prefix and resource group for the database
  name_prefix         = var.name_prefix
  resource_group_name = azurerm_resource_group.main-rg.name
  # Deploy the DB in westus3 for isolation or latency reasons
  location            = "westus3"
  # Admin credentials and version for PostgreSQL
  admin_username      = var.postgres_admin_username
  admin_password      = var.postgres_admin_password
  postgres_version    = var.postgres_version
  sku_name            = var.postgres_sku_name
  storage_mb          = var.postgres_storage_mb
  # Optional VNet integration for private DB access
  vnet_subnet_id      = var.postgres_vnet_subnet_id
  public_network_access = var.postgres_public_network_access
  # Restrict public access to specific IP ranges
  allowed_ips         = var.postgres_allowed_ips
}

# 12. Service Bus module
module "service_bus" {
  source = "./modules/service-bus"
  # Resource group and region for Service Bus
  resource_group_name = azurerm_resource_group.main-rg.name
  location            = var.region
  # Naming prefix for the namespace and topic
  name_prefix         = var.name_prefix
  sku_name            = var.servicebus_sku_name
  topic_name          = var.servicebus_topic_name
  auth_rule_name      = var.servicebus_auth_rule_name
  # Integrate Azure AD service principals for RBAC
  spa_sp_object_id    = module.aad_spa.spa_sp_object_id
  api_sp_object_id    = module.aad_spa.api_sp_object_id
  api_scope_value     = module.aad_spa.api_scope_uuid
}

# 13. Key Vault module
module "keyvault" {
  source              = "./modules/keyvault"
  name_prefix         = var.name_prefix
  resource_group_name = azurerm_resource_group.main-rg.name
  location            = var.region
  livekit_api_key       = var.livekit_api_key
  livekit_api_secret    = var.livekit_api_secret
  azure_client_secret   = module.aad_spa.azure_client_secret_api_app
  service_bus_connection= module.service_bus.connection_string
  webpubsub_key         = module.web_pubsub.primary_key
  key_vault_sku_name = var.key_vault_sku_name 
  postgres_database_url = module.postgres.database_url
  webpubsub_connection_string = module.web_pubsub.primary_connection_string
  depends_on = [ module.aad_spa , module.web_pubsub ,module.postgres]
}