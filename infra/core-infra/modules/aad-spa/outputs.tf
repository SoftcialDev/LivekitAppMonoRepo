# Client ID of the API App Registration
output "api_application_id" {
  description = "Client ID of the API App Registration"
  value       = azuread_application.api_app.application_id
}

# OAuth2 permission scope ID for access_as_user
output "api_scope_id" {
  description = "OAuth2 permission scope ID (access_as_user)"
  value       = random_uuid.api_scope_id.result
}

# Client ID of the SPA App Registration
output "spa_application_id" {
  description = "Client ID of the SPA App Registration"
  value       = azuread_application.spa_app.application_id
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
  value       = azuread_group.admins_group.id
}

# Object ID of Employees group
output "employees_group_id" {
  description = "Object ID of the Employees security group"
  value       = azuread_group.employees_group.id
}
