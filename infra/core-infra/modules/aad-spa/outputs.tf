# Outputs the Client (Application) ID for the API App Registration in Azure AD.
output "api_application_id" {
  description = "Client ID of the API App Registration"
  value       = azuread_application.api_app.id
}

# Outputs the Client ID (GUID) of the API App Registration.
output "api_application_client_id" {
  description = "Client ID of the API App Registration"
  value       = azuread_application.api_app.client_id
}

# Outputs the UUID for the custom OAuth2 permission scope named “access_as_user”.
output "api_scope_id" {
  description = "OAuth2 permission scope ID (access_as_user)"
  value       = random_uuid.api_scope_id.result
}

# Outputs the Client (Application) ID for the Single-Page Application (SPA) registration.
output "spa_application_id" {
  description = "Client ID of the SPA App Registration"
  value       = azuread_application.spa_app.id
}

# Exposes the Tenant (Directory) ID of your Azure AD tenant.
output "tenant_id" {
  description = "Azure AD Tenant (Directory) ID"
  value       = data.azuread_client_config.current.tenant_id
}

# Provides a map of defined App Role names in the SPA and their corresponding UUID values.
output "spa_app_role_ids" {
  description = "Map of SPA App Role values to their UUIDs"
  value       = azuread_application.spa_app.app_role_ids
}

# Admin role ID
output "spa_app_role_admin_id" {
  description = "UUID for the SPA App Role: Admin"
  value       = azuread_application.spa_app.app_role_ids["Admin"]
}

# Supervisor role ID
output "spa_app_role_supervisor_id" {
  description = "UUID for the SPA App Role: Supervisor"
  value       = azuread_application.spa_app.app_role_ids["Supervisor"]
}

# Contact Manager role ID
output "spa_app_role_contact_manager_id" {
  description = "UUID for the SPA App Role: Contact Manager"
  value       = azuread_application.spa_app.app_role_ids["ContactManager"]
}

output "spa_app_role_super_admin_id" {
  description = "UUID for the SPA App Role: Super Admin"
  value       = azuread_application.spa_app.app_role_ids["SuperAdmin"]
}

# Employee role ID
output "spa_app_role_employee_id" {
  description = "UUID for the SPA App Role: Employee"
  value       = azuread_application.spa_app.app_role_ids["Employee"]
}


# Constructs and outputs the full URI for the API scope (used as the audience in JWT tokens).
output "api_scope_uri" {
  value = "api://${data.azuread_client_config.current.tenant_id}/${var.aad_app_name}-API/access_as_user"
}

# Object ID of the “Admins” security group in Azure AD.
output "admins_group_id" {
  description = "Object ID of the Admins security group"
  value       = azuread_group.admins_group.object_id
}

# Object ID of the “Employees” security group in Azure AD.
output "employees_group_id" {
  description = "Object ID of the Employees security group"
  value       = azuread_group.employees_group.object_id
}

output "contact_manager_group_id" {
  description = "Object ID of the Employees security group"
  value       = azuread_group.contact_manager_group.object_id
}

# Object ID of the “Supervisors” security group in Azure AD.
output "supervisors_groups_id" {
  description = "Object ID of the Supervisors security group"
  value       = azuread_group.supervisors_group.object_id
}

# Service Principal object ID for the API application.
output "api_sp_object_id" {
  description = "Object ID of the service principal for the API application"
  value       = azuread_service_principal.api_sp.id
}

# Service Principal object ID for the SPA application.
output "spa_sp_object_id" {
  description = "Object ID of the service principal for the SPA application"
  value       = azuread_service_principal.spa_sp.id
}

# Duplicate output of the UUID for the “access_as_user” scope on the API app.
output "api_scope_uuid" {
  description = "UUID of the OAuth2 permission scope (access_as_user) on the API app"
  value       = random_uuid.api_scope_id.result
}

# Secret (password) for the API app registration, used by confidential clients.
output "azure_client_secret_api_app" {
  description = "Azure API app secret password"
  value       = azuread_application_password.api_app_secret.value
}

# Client ID of the SPA’s service principal.
output "spa_app_client_id" {
  value = azuread_service_principal.spa_sp.client_id
}

# Object ID of the Service Principal for the API, for Graph API operations.
output "SERVICE_PRINCIPAL_OBJECT_ID" {
  description = "Object ID of the Service Principal used in Graph API operations"
  value       = azuread_application.spa_app.client_id
}

# The primary identifier URI of the registered API application (used as the JWT audience).
output "AZURE_AD_API_IDENTIFIER_URI" {
  description = "The identifier URI of the registered API app (used as audience in JWT)"
  value       = tolist(azuread_application.api_app.identifier_uris)[0]
}
