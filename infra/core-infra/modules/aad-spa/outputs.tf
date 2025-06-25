# Client ID of the API App Registration
output "api_application_id" {
  description = "Client ID of the API App Registration"
  value       = azuread_application.api_app.id
}

output "api_application_client_id" {
  description = "Client ID of the API App Registration"
  value       = azuread_application.api_app.client_id
}

# OAuth2 permission scope ID for access_as_user
output "api_scope_id" {
  description = "OAuth2 permission scope ID (access_as_user)"
  value       = random_uuid.api_scope_id.result
}

# Client ID of the SPA App Registration
output "spa_application_id" {
  description = "Client ID of the SPA App Registration"
  value       = azuread_application.spa_app.id
}


output "tenant_id" {
  description = "Azure AD Tenant (Directory) ID"
  value       = data.azuread_client_config.current.tenant_id
}


# Map of SPA App Role values to their GUIDs
output "spa_app_role_ids" {
  description = "Map of SPA App Role values to their UUIDs"
  value       = azuread_application.spa_app.app_role_ids
}


output "api_scope_uri" {
  value = "api://${data.azuread_client_config.current.tenant_id}/${var.aad_app_name}-API/access_as_user"
}


# Object ID of Admins group
output "admins_group_id" {
  description = "Object ID of the Admins security group"
  value       = azuread_group.admins_group.object_id
}

# Object ID of Employees group
output "employees_group_id" {
  description = "Object ID of the Employees security group"
  value       = azuread_group.employees_group.object_id
}

# Object ID of Supervisor group
output "supervisors_groups_id" {
  description = "Object ID of the Employees security group"
  value       = azuread_group.supervisors_group.object_id
}

# Service Principal object ID for the API app
output "api_sp_object_id" {
  description = "Object ID of the service principal for the API application"
  value       = azuread_service_principal.api_sp.id
}

# Service Principal object ID for the SPA app
output "spa_sp_object_id" {
  description = "Object ID of the service principal for the SPA application"
  value       = azuread_service_principal.spa_sp.id
}

# OAuth2 permission scope UUID for access_as_user
output "api_scope_uuid" {
  description = "UUID of the OAuth2 permission scope (access_as_user) on the API app"
  value       = random_uuid.api_scope_id.result
}

output "azure_client_secret_api_app" {
  description = "Azure api app secret password"
  value = azuread_application_password.api_app_secret.value
}

output "spa_app_client_id" {
value = azuread_service_principal.spa_sp.client_id
}

output "SERVICE_PRINCIPAL_OBJECT_ID" {
  value       = azuread_service_principal.api_sp.object_id
  description = "Object ID of the Service Principal used in Graph API operations"
}

output "AZURE_AD_API_IDENTIFIER_URI" {
  value       = azuread_application.api_app.identifier_uris
  description = "The identifier URI(s) of the API app"
}