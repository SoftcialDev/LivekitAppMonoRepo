# 1. Create Resource Group inline
resource "azurerm_resource_group" "main-rg" {
  # Use a name prefix from variables to keep naming consistent
  name     = var.name_prefix
  # Region/location comes from a variable
  location = var.region
}

data "azuread_client_config" "current" {}

# 2. Invoke network module for VNet + Subnet
module "network" {
  source      = "./modules/network"
  # Prefix used by the module for naming VNet, subnets, etc.
  name_prefix = var.name_prefix
  region      = var.region
  # Pass the resource group name we just created
  resource_group  = azurerm_resource_group.main-rg.name
  # Supply the NAT gateway ID from the pip_egress module
  nat_gateway_id = module.pip_egress.nat_gateway_id

  # Ensure pip_egress runs before network (so the NAT gateway exists when needed)
  depends_on = [ module.pip_egress ]
}

# 3. Static Web App module
module "static_web_app" {
  source              = "./modules/static-web-app"  
  # Prefix for naming the Static Web App
  name_prefix         = var.name_prefix             
  # Use the same RG
  resource_group_name = azurerm_resource_group.main-rg.name
  # Static Web Apps aren’t available in every region—eastus2 in this case
  location            = "eastus2" 
  # Optional SKU tier, default could be “Free”
  sku_tier            = var.swa_sku_tier            
  # Repo details for deployment
  env_vars = {
    VITE_AZURE_AD_CLIENT_ID     = module.aad_spa.spa_app_client_id
    VITE_AZURE_AD_TENANT_ID     = data.azuread_client_config.current.tenant_id
    VITE_AZURE_AD_API_CLIENT_ID = module.aad_spa.api_application_client_id
    VITE_AZURE_AD_API_SCOPE_URI = module.aad_spa.api_scope_uri
    VITE_API_URL                = module.function_app.function_app_url
  }
  # Tags map for resource tagging
  tags                = var.tags                    
}


# 4. Public IP for egress traffic (used by NAT gateway, Redis egress, etc.)
module "pip_egress" {
  source              = "./modules/public-ip"
  name_prefix         = var.name_prefix
  # Label this IP for egress use
  purpose             = "egress"
  resource_group_name = azurerm_resource_group.main-rg.name
  region              = var.region
}

# 5. Redis module
module "redis" {
  source         = "./modules/redis"
  name_prefix    = var.name_prefix
  region         = var.region
  resource_group = azurerm_resource_group.main-rg.name
  # Redis SKU/family/capacity come from variables
  family         = var.redis_family      
  sku_name       = var.redis_sku_name
  capacity       = var.redis_capacity          
  # If Redis needs outbound internet, assign the egress public IP
  egress_public_ip = module.pip_egress.public_ip_address
}

# 6. AAD SPA (Single Page App) registration module
module "aad_spa" {
  source                = "./modules/aad-spa"
  # Application name in AAD
  aad_app_name          = var.aad_app_name
  # Redirect URIs for sign-in and sign-out
  aad_redirect_uris     = var.aad_redirect_uris
  aad_logout_uris       = var.aad_logout_uris
  # If the API redirects need to match the SPA URIs, reuse that variable
  aad_api_redirect_uris = var.aad_redirect_uris
  # Group-of-admins Object IDs allowed to manage or administer the app
  aad_admins_group_members = var.aad_admins_group_members

  aad_superadmins_group_members = var.aad_superadmins_group_members
}

# 7. AKS cluster module
module "aks" {
  source              = "./modules/aks"
  name_prefix         = var.name_prefix
  region              = var.region
  resource_group      = azurerm_resource_group.main-rg.name
  # Provide the subnet ID from the network module
  vnet_subnet_id      = module.network.subnet_id
  # Node count and VM SKU for the cluster nodes
  aks_node_count      = var.aks_node_count
  vm_sku              = var.vm_sku
  aks_price_tier      = var.aks_price_tier

  # Ensure the network (VNet/subnet) is ready before creating AKS
  depends_on = [ module.network ]
}

# 8. Web PubSub service module
module "web_pubsub" {
  source              = "./modules/pubsub"
  resource_group_name = azurerm_resource_group.main-rg.name
  location            = var.region
  # Name prefix to construct the service name
  name                = var.name_prefix
  sku                 = var.web_pubsub_sku
  unit_count          = var.web_pubsub_capacity
}

# 9. Storage account module
module "storage" {
  source              = "./modules/storage"
  name_prefix         = var.name_prefix               # must be 3–24 lowercase alphanumeric and unique
  resource_group_name = azurerm_resource_group.main-rg.name
  location            = var.region

  # Tier, replication, access tier for blob storage, set via variables
  account_tier             = var.simple_storage_account_tier
  account_replication_type = var.simple_storage_replication_type
  access_tier              = var.simple_storage_access_tier
}

# 10. Function App module
module "function_app" {
  source = "./modules/function-app"

  name_prefix                 = var.name_prefix
  resource_group_name         = azurerm_resource_group.main-rg.name
  location                    = var.region

  storage_account_name        = module.storage.storage_account_name
  storage_account_access_key  = module.storage.storage_account_primary_access_key
  storage_account_connection_string = module.storage.storage_account_primary_connection_string

  aad_app_client_id           = module.aad_spa.api_application_client_id

  key_vault_id                = module.keyvault.key_vault_id
  secret_uris                 = module.keyvault.secret_uris

  azure_tenant_id             = data.azuread_client_config.current.tenant_id
  azure_client_id             = module.aad_spa.api_application_client_id

  livekit_api_url             = var.livekit_url
  webpubsub_endpoint          = module.web_pubsub.host
  webpubsub_hub_name          = module.web_pubsub.webpubsub_hub_name
  service_bus_topic_name      = var.servicebus_topic_name

  function_plan_sku_tier      = "Dynamic"
  function_plan_sku_size      = "Y1"
  node_env                    = var.node_env

  depends_on = [ module.keyvault ]
}




# 11. PostgreSQL database module
module "postgres" {
  source = "./modules/database"

  name_prefix         = var.name_prefix
  resource_group_name = azurerm_resource_group.main-rg.name
  # Specific region for the DB
  location            = "westus3"
  admin_username      = var.postgres_admin_username
  admin_password      = var.postgres_admin_password
  postgres_version    = var.postgres_version
  sku_name            = var.postgres_sku_name
  storage_mb          = var.postgres_storage_mb
  # If deploying into a VNet/subnet, pass the subnet ID
  vnet_subnet_id      = var.postgres_vnet_subnet_id 
  # Control whether the DB is accessible from public network
  public_network_access = var.postgres_public_network_access
  # If public access is allowed, restrict by IPs
  allowed_ips         = var.postgres_allowed_ips     
}

# 12. Service Bus module
module "service_bus" {
  source = "./modules/service-bus"

  resource_group_name = azurerm_resource_group.main-rg.name
  location            = var.region

  name_prefix         = var.name_prefix       
  sku_name            = var.servicebus_sku_name          
  topic_name          = var.servicebus_topic_name        
  auth_rule_name      = var.servicebus_auth_rule_name     

  # Integrate with AAD: use service principal object IDs and scope
  spa_sp_object_id    = module.aad_spa.spa_sp_object_id
  api_sp_object_id    = module.aad_spa.api_sp_object_id
  api_scope_value     = module.aad_spa.api_scope_uuid
}


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
  depends_on = [ module.aad_spa , module.postgres]
}