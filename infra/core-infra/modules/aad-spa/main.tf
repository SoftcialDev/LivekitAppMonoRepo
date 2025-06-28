###########################################################
# 0) Prerequisites
# - Ensure you have privileges to register AAD apps and grant admin consent.
###########################################################
# Generate stable UUIDs for custom App Roles and the API scope
resource "random_uuid" "app_role_admin"      {}
resource "random_uuid" "app_role_supervisor" {}
resource "random_uuid" "app_role_employee"   {}
resource "random_uuid" "api_scope_id"        {}

###########################################################
# 1) Get the current tenant info (used for building identifier_uris)
###########################################################
data "azuread_client_config" "current" {}

###########################################################
# 2) Define static mappings for Microsoft Graph permissions
###########################################################
locals {
  # Well-known client ID for the Microsoft Graph API
  graph_client_id = "00000003-0000-0000-c000-000000000000"

  # Application-only permissions your backend API will request
  required_graph_app_permissions = [
    "Group.Read.All",
    "Group.ReadWrite.All",
    "User.Read.All",
    "User.ReadWrite.All",
    "Directory.Read.All",
    "Directory.ReadWrite.All",
  ]
  # Map each permission name to its role-ID GUID
  graph_app_role_map = {
    "Group.Read.All"          = "7ab1d382-f21e-4acd-a863-ba3e13f7da61"
    "Group.ReadWrite.All"     = "62a82d76-70ea-41e2-9197-370581804d09"
    "User.Read.All"           = "df021288-bdef-4463-88db-98f22de89214"
    "User.ReadWrite.All"      = "741f803b-c850-494e-b5df-cde7c675a1ca"
    "Directory.Read.All"      = "7ab1d382-f21e-4acd-a863-ba3e13f7da61"
    "Directory.ReadWrite.All" = "19dbc75e-c2e2-444c-a770-ec69d8559fc7"
  }
  # Build a list of GUIDs for the app-only permissions
  graph_app_role_ids = [
    for perm_name in local.required_graph_app_permissions : (
      contains(keys(local.graph_app_role_map), perm_name)
        ? local.graph_app_role_map[perm_name]
        : format("ERROR: Missing GUID for Graph app permission '%s'", perm_name)
    )
  ]

  # Delegated permissions your SPA will request from Graph
  required_graph_delegated_scopes = [
    "User.Read.All",
    "User.ReadWrite.All",
    "Group.Read.All",
  ]
  graph_delegated_scope_map = {
    "Group.Read.All"      = "7ab1d382-f21e-4acd-a863-ba3e13f7da61"
    "Group.ReadWrite.All" = "62a82d76-70ea-41e2-9197-370581804d09"
    "User.Read.All"       = "df021288-bdef-4463-88db-98f22de89214"
    "User.ReadWrite.All"  = "741f803b-c850-494e-b5df-cde7c675a1ca"
  }
  # Build a list of GUIDs for the delegated scopes
  graph_delegated_scope_ids = [
    for scope_name in local.required_graph_delegated_scopes : (
      contains(keys(local.graph_delegated_scope_map), scope_name)
        ? local.graph_delegated_scope_map[scope_name]
        : format("ERROR: Missing GUID for Graph delegated scope '%s'", scope_name)
    )
  ]
}

###########################################################
# 3) Create API App Registration (backend service)
#    - Defines an OAuth2 permission scope for the SPA
#    - Requests Graph application permissions (app-only)
###########################################################
resource "azuread_application" "api_app" {
  display_name     = "${var.aad_app_name}-API"
  sign_in_audience = "AzureADMyOrg"

  # Build the identifier URI using tenant ID and app name
  identifier_uris = [
    "api://${data.azuread_client_config.current.tenant_id}/${var.aad_app_name}-API"
  ]

  api {
    oauth2_permission_scope {
      admin_consent_description  = "Allows the SPA to call this API on behalf of the signed-in user"
      admin_consent_display_name = "Access API as signed-in user"
      enabled                    = true
      id                         = random_uuid.api_scope_id.result
      type                       = "User"
      user_consent_description   = "Allows you to call this API on your behalf"
      user_consent_display_name  = "Access API as signed-in user"
      value                      = "access_as_user"
    }
  }

  # Request application-only Graph permissions by role ID
  required_resource_access {
    resource_app_id = local.graph_client_id
    dynamic "resource_access" {
      for_each = local.graph_app_role_ids
      content {
        id   = resource_access.value
        type = "Role"
      }
    }
  }
}

# Create the service principal for the API app so it can be granted roles
resource "azuread_service_principal" "api_sp" {
  client_id = azuread_application.api_app.client_id
}

###########################################################
# 4) Create SPA App Registration (frontend)
#    - Defines custom App Roles for RBAC
#    - Requests access to backend API scope and delegated Graph scopes
###########################################################
resource "azuread_application" "spa_app" {
  display_name     = "${var.aad_app_name}-SPA"
  sign_in_audience = "AzureADMyOrg"

  # Configure it as a single-page application
  single_page_application {
    redirect_uris = var.aad_redirect_uris
  }

    public_client {
    redirect_uris = [
      "com.mycompany.myapp://auth",            # esquema personalizado
      "msauth://com.mycompany.myapp/XYZabc123" # esquema MSAL/Android
    ]
  }

  # Define three custom App Roles for Admin, Supervisor, and Employee
  app_role {
    id                   = random_uuid.app_role_admin.result
    allowed_member_types = ["User"]
    display_name         = "Admin"
    description          = "Users in this role have full administrative privileges"
    value                = "Admin"
    enabled              = true
  }
  app_role {
    id                   = random_uuid.app_role_supervisor.result
    allowed_member_types = ["User"]
    display_name         = "Supervisor"
    description          = "Users in this role can manage assigned employees"
    value                = "Supervisor"
    enabled              = true
  }
  app_role {
    id                   = random_uuid.app_role_employee.result
    allowed_member_types = ["User"]
    display_name         = "Employee"
    description          = "Users in this role have standard access"
    value                = "Employee"
    enabled              = true
  }

  # Grant the SPA access to the backend API scope
  required_resource_access {
    resource_app_id = azuread_application.api_app.object_id
    resource_access {
      id   = random_uuid.api_scope_id.result
      type = "Scope"
    }
  }

  # Grant delegated Graph permissions for user and group reads/writes
  required_resource_access {
    resource_app_id = local.graph_client_id
    dynamic "resource_access" {
      for_each = local.graph_delegated_scope_ids
      content {
        id   = resource_access.value
        type = "Scope"
      }
    }
  }
}

# Create the service principal for the SPA
resource "azuread_service_principal" "spa_sp" {
  client_id = azuread_application.spa_app.client_id
}

###########################################################
# 5) Create Security Groups to mirror App Roles
###########################################################
resource "azuread_group" "admins_group" {
  display_name     = "${var.aad_app_name}-Admins"
  security_enabled = true
  mail_enabled     = false
}

resource "azuread_group" "supervisors_group" {
  display_name     = "${var.aad_app_name}-Supervisors"
  security_enabled = true
  mail_enabled     = false
}

resource "azuread_group" "employees_group" {
  display_name     = "${var.aad_app_name}-Employees"
  security_enabled = true
  mail_enabled     = false
}

###########################################################
# 6) Assign existing users to the security groups
###########################################################
# Fetch all users in the tenant
data "azuread_users" "all_users" {
  return_all = true
}

locals {
  all_user_emails   = [for u in data.azuread_users.all_users.users : u.user_principal_name]
  non_admins        = setsubtract(local.all_user_emails, var.aad_admins_group_members)
  non_admins_supers = setsubtract(local.non_admins, var.aad_supervisors_group_members)
}

# Lookup each admin user by their principal name
data "azuread_user" "admins" {
  for_each            = toset(var.aad_admins_group_members)
  user_principal_name = each.value
}
resource "azuread_group_member" "admins_members" {
  for_each         = data.azuread_user.admins
  group_object_id  = azuread_group.admins_group.object_id
  member_object_id = each.value.object_id
}

# Lookup each supervisor user
data "azuread_user" "supervisors" {
  for_each            = toset(var.aad_supervisors_group_members)
  user_principal_name = each.value
}
resource "azuread_group_member" "supervisors_members" {
  for_each         = data.azuread_user.supervisors
  group_object_id  = azuread_group.supervisors_group.object_id
  member_object_id = each.value.object_id
}

###########################################################
# 7) Assign App Roles to the security groups
###########################################################
resource "azuread_app_role_assignment" "admins_assignment" {
  principal_object_id = azuread_group.admins_group.object_id
  app_role_id         = azuread_application.spa_app.app_role_ids["Admin"]
  resource_object_id  = azuread_service_principal.spa_sp.object_id
}

resource "azuread_app_role_assignment" "supervisors_assignment" {
  principal_object_id = azuread_group.supervisors_group.object_id
  app_role_id         = azuread_application.spa_app.app_role_ids["Supervisor"]
  resource_object_id  = azuread_service_principal.spa_sp.object_id
}

resource "azuread_app_role_assignment" "employees_assignment" {
  principal_object_id = azuread_group.employees_group.object_id
  app_role_id         = azuread_application.spa_app.app_role_ids["Employee"]
  resource_object_id  = azuread_service_principal.spa_sp.object_id
}

########################################################### 
#Client secret for the API App
###########################################################
resource "azuread_application_password" "api_app_secret" {
  application_id = azuread_application.api_app.id
  display_name   = "client-secret-for-Graph-calls"
}
