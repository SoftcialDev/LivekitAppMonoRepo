########################################
# Outputs from the aad-spa module
########################################

# Client ID (Application ID) of the API App Registration
output "api_application_id" {
  description = "Client ID (Application ID) of the API App Registration from aad-spa module"
  value       = module.aad_spa.api_application_id
}

# Client ID of the API App Registration (alias)
output "api_application_client_id" {
  description = "Client ID of the API App Registration from aad-spa module"
  value       = module.aad_spa.api_application_client_id
}

# OAuth2 permission scope ID for 'access_as_user'
output "api_scope_id" {
  description = "OAuth2 permission scope ID (access_as_user) from aad-spa module"
  value       = module.aad_spa.api_scope_id
}

# Client ID (Application ID) of the SPA App Registration
output "spa_application_id" {
  description = "Client ID (Application ID) of the SPA App Registration from aad-spa module"
  value       = module.aad_spa.spa_application_id
}

# Azure AD Tenant (Directory) ID
output "tenant_id" {
  description = "Azure AD Tenant (Directory) ID retrieved in aad-spa module"
  value       = module.aad_spa.tenant_id
}

# Map of SPA App Role values to their UUIDs
output "spa_app_role_ids" {
  description = "Map of SPA App role values to their GUIDs from aad-spa module"
  value       = module.aad_spa.spa_app_role_ids
}

# Full scope URI for access_as_user
output "api_scope_uri" {
  description = "OAuth2 scope URI for access_as_user (api://<tenant>/<app>-API/access_as_user) from aad-spa module"
  value       = module.aad_spa.api_scope_uri
}

# Object ID of the Admins security group
output "admins_group_id" {
  description = "Object ID of the Admins group created in aad-spa module"
  value       = module.aad_spa.admins_group_id
}

# Object ID of the Employees security group
output "employees_group_id" {
  description = "Object ID of the Employees group created in aad-spa module"
  value       = module.aad_spa.employees_group_id
}

# Object ID of the Employees security group
output "contact_manager_group_id" {
  description = "Object ID of the Employees group created in aad-spa module"
  value       = module.aad_spa.contact_manager_group_id
}


output "supervisors_groups_id" {
  description = "Object ID of the Supervisors group created in aad-spa module"
  value       = module.aad_spa.supervisors_groups_id
}

output "aks_kubeconfig" {
  description = "Raw kubeconfig content for the AKS cluster. Marked sensitive."
  value       = module.aks.kubeconfig
  sensitive   = true
}

output azure_client_secret {
  description = "Azure client secret value"
  value = module.aad_spa.azure_client_secret_api_app
  sensitive = true
}

output SERVICE_PRINCIPAL_OBJECT_ID {
  description = "Object ID of the Service Principal for the API App"
  value       = module.aad_spa.SERVICE_PRINCIPAL_OBJECT_ID
}


output AZURE_AD_API_IDENTIFIER_URI {
  description = "Identifier URI for the API App"
  value       = module.aad_spa.AZURE_AD_API_IDENTIFIER_URI
}
########################################
# PostgreSQL Module Outputs in Root

# Fully qualified domain name of the PostgreSQL Flexible Server
/*
output "postgres_server_fqdn" {
  description = "FQDN of the PostgreSQL Flexible Server from the database module"
  value       = module.postgres.postgres_server_fqdn
}
*/
# Administrator username for PostgreSQL Flexible Server
/*
output "postgres_server_admin_username" {
  description = "Admin username for PostgreSQL Flexible Server from the database module"
  value       = module.postgres.postgres_server_admin_username
}
*/
# Name of the default database created
output "postgres_database_name" {
  description = "Default database name created by the database module"
  value       = module.postgres.postgres_database_name
}
/*
output "postgres_database_password" {
  description = "Default database name created by the database module"
  value       = module.postgres.postgres_server_password
  sensitive = true
}
*/
# Resource ID of the PostgreSQL Flexible Server
/*
output "postgres_server_id" {
  description = "Resource ID of the PostgreSQL Flexible Server from the database module"
  value       = module.postgres.postgres_server_id
}
*/
# Resource ID of the PostgreSQL Flexible Server
/*
output "postgres_database_url" {
  description = "Resource ID of the PostgreSQL Flexible Server from the database module"
  value       = module.postgres.database_url
  sensitive = true
}
*/

########################################
# Function App Module Outputs in Root
########################################

# Resource ID of the Function App
output "api_url" {
  description = "Resource ID of the Function App from the function-app module"
  value       = module.function_app.function_app_url
}

# Resource ID of the Function App
output "function_app_id" {
  description = "Resource ID of the Function App from the function-app module"
  value       = module.function_app.function_app_id
}

# Default hostname of the Function App (e.g., <name>.azurewebsites.net)
output "function_default_hostname" {
  description = "Default hostname of the Function App from the function-app module"
  value       = module.function_app.function_default_hostname
}

# Principal ID of the system-assigned Managed Identity for the Function App
output "function_principal_id" {
  description = "Principal ID of the system-assigned Managed Identity from the function-app module"
  value       = module.function_app.function_principal_id
}


########################################
# Redis Module Outputs in Root
########################################
/*
# Hostname endpoint of the Azure Cache for Redis instance
output "redis_hostname" {
  description = "Hostname of the Redis cache from the redis module"
  value       = module.redis.redis_hostname
}

# Primary access key for the Azure Cache for Redis
output "redis_primary_key" {
  description = "Primary access key of the Redis cache from the redis module"
  value       = module.redis.redis_primary_key
  sensitive = true
}
*/

########################################
# Service Bus Module Outputs in Root
########################################

# Name of the Service Bus namespace
output "servicebus_namespace_name" {
  description = "Name of the Service Bus namespace from the service-bus module"
  value       = module.service_bus.namespace_name
}

# Name of the Service Bus topic
output "servicebus_topic_name" {
  description = "Name of the Service Bus topic from the service-bus module"
  value       = module.service_bus.topic_name
}

# Primary connection string for the Service Bus namespace
output "servicebus_connection_string" {
  description = "Primary connection string for the Service Bus namespace from the service-bus module"
  value       = module.service_bus.connection_string
  sensitive = true
}

output "servicebus_commands_subscription_name" {
  description = "Name of the Service Bus subscription for commands topic from the service-bus module"
  value       = module.service_bus.commands_subscription_name
}

########################################
# Network Module Outputs
########################################

output "vnet_id" {
  description = "Resource ID of the Virtual Network from the network module"
  value       = module.network.vnet_id
}

output "subnet_id" {
  description = "Resource ID of the Subnet from the network module"
  value       = module.network.subnet_id
}

########################################
# Web PubSub Module Outputs (root module)
########################################

output "web_pubsub_host" {
  description = "Web PubSub endpoint URL (with https://) from the web_pubsub module"
  value       = "https://${module.web_pubsub.host}"
}

output "web_pubsub_primary_connection_string" {
  description = "Primary connection string for server-to-service messages from the web_pubsub module"
  value       = module.web_pubsub.primary_connection_string
  sensitive   = true
}

output "web_pubsub_primary_key" {
  description = "Primary access key for client token generation from the web_pubsub module"
  value       = module.web_pubsub.primary_key
  sensitive   = true
}

output "web_pubsub_hub_name" {
  description = "Name of the default Web PubSub hub from the web_pubsub module"
  value       = module.web_pubsub.webpubsub_hub_name
}

output "web_pubsub_hub_id" {
  description = "Resource ID of the default Web PubSub hub from the web_pubsub module"
  value       = module.web_pubsub.webpubsub_hub_id
}


########################################
# Public IP Module Outputs
########################################
/*
output "public_ip_address" {
  description = "Static public IP address from the public-ip module"
  value       = module.public_ip.public_ip_address
}

output "public_ip_id" {
  description = "Resource ID of the Public IP from the public-ip module"
  value       = module.public_ip.public_ip_id
}

output "nat_gateway_id" {
  description = "Resource ID of the NAT Gateway associated with the public IP from the public-ip module"
  value       = module.public_ip.nat_gateway_id
}
*/
########################################
# Static Web App Module Outputs (root)
########################################

# ID of the Static Web App
output "static_web_app_id" {
  description = "Resource ID of the Static Web App from the static-web-app module"
  value       = module.static_web_app.static_web_app_id
}

# Default hostname of the Static Web App (without https://)
output "static_web_app_default_hostname" {
  description = "Hostname assigned to the Static Web App from the static-web-app module"
  value       = module.static_web_app.default_hostname
}

# Full URL of the Static Web App
output "static_web_app_url" {
  description = "Full URL of the Static Web App from the static-web-app module"
  value       = "https://${module.static_web_app.default_hostname}"
}

# Deployment token (API key) for the Static Web App
output "static_web_app_deployment_token" {
  description = "Deployment token for Azure Static Web App from the static-web-app module"
  value       = module.static_web_app.static_web_app_deployment_token
  sensitive   = true
}


########################################
# Storage Account Module Outputs (root)
########################################

# Name of the Storage Account
output "storage_account_name" {
  description = "Name of the Storage Account from the storage module"
  value       = module.storage.storage_account_name
}

# Primary connection string for the Storage Account
output "storage_account_primary_connection_string" {
  description = "Primary connection string for the Storage Account from the storage module"
  value       = module.storage.storage_account_primary_connection_string
  sensitive   = true
}

# Primary access key for the Storage Account
output "storage_account_primary_access_key" {
  description = "Primary access key for the Storage Account from the storage module"
  value       = module.storage.storage_account_primary_access_key
  sensitive   = true
}
