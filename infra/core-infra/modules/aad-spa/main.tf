########################################
# 0) Prerequisites
#
# - Make sure your AzureAD provider is configured (version >= 2.x).
# - You have the appropriate privileges to register applications and grant admin consent.
########################################

########################################
# 1) Generate stable UUIDs for your custom App Roles and API scope
########################################
resource "random_uuid" "app_role_admin"      {}
resource "random_uuid" "app_role_supervisor" {}
resource "random_uuid" "app_role_employee"   {}
resource "random_uuid" "api_scope_id"        {}

########################################
# 2) Get tenant info (used for identifier_uris)
########################################
data "azuread_client_config" "current" {}

########################################
# 3) Static maps for Microsoft Graph permissions
########################################
locals {
  # Client ID of Microsoft Graph (static, well-known)
  graph_client_id = "00000003-0000-0000-c000-000000000000"

  # Permisos de aplicación (app-only) para backend API
  required_graph_app_permissions = [
    "Group.Read.All",
    "Group.ReadWrite.All",
    "User.Read.All",
    "User.ReadWrite.All",
    "Directory.Read.All",
    "Directory.ReadWrite.All",
  ]
  graph_app_role_map = {
    "Group.Read.All"         = "7ab1d382-f21e-4acd-a863-ba3e13f7da61"
    "Group.ReadWrite.All"    = "62a82d76-70ea-41e2-9197-370581804d09"
    "User.Read.All"          = "df021288-bdef-4463-88db-98f22de89214"
    "User.ReadWrite.All"     = "741f803b-c850-494e-b5df-cde7c675a1ca"
    "Directory.Read.All"     = "7ab1d382-f21e-4acd-a863-ba3e13f7da61"
    "Directory.ReadWrite.All"= "19dbc75e-c2e2-444c-a770-ec69d8559fc7"
  }
  graph_app_role_ids = [
    for perm_name in local.required_graph_app_permissions : (
      contains(keys(local.graph_app_role_map), perm_name)
        ? local.graph_app_role_map[perm_name]
        : format("ERROR: Missing GUID for Graph app permission '%s'", perm_name)
    )
  ]

  # Permisos delegados para SPA
  required_graph_delegated_scopes = [
    "User.Read.All",
    "User.ReadWrite.All",
    "Group.Read.All",
  ]
  graph_delegated_scope_map = {
    "Group.Read.All"         = "7ab1d382-f21e-4acd-a863-ba3e13f7da61"
    "Group.ReadWrite.All"    = "62a82d76-70ea-41e2-9197-370581804d09"
    "User.Read.All"          = "df021288-bdef-4463-88db-98f22de89214"
    "User.ReadWrite.All"     = "741f803b-c850-494e-b5df-cde7c675a1ca"
  }
  graph_delegated_scope_ids = [
    for scope_name in local.required_graph_delegated_scopes : (
      contains(keys(local.graph_delegated_scope_map), scope_name)
        ? local.graph_delegated_scope_map[scope_name]
        : format("ERROR: Missing GUID for Graph delegated scope '%s'", scope_name)
    )
  ]
  
}

########################################
# 4) Create API App Registration (backend)
#    - Exposes OAuth2 permission scope "access_as_user" for SPA
#    - Declares required_resource_access for Graph application permissions (app-only)
########################################
resource "azuread_application" "api_app" {
  display_name     = "${var.aad_app_name}-API"
  sign_in_audience = "AzureADMyOrg"

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

  # Assign Graph application permissions (app-only)
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

resource "azuread_service_principal" "api_sp" {
  client_id = azuread_application.api_app.client_id
}

resource "null_resource" "set_access_token_version" {
  depends_on = [azuread_application.api_app]

  provisioner "local-exec" {
    command = "az rest --method PATCH --url https://graph.microsoft.com/v1.0/applications/${azuread_application.api_app.object_id} --headers Content-Type=application/json --body \"{\\\"api\\\":{\\\"requestedAccessTokenVersion\\\":2}}\""
  }
}

########################################
# 5) Create SPA App Registration (frontend)
#    - Define App Roles
#    - required_resource_access for backend API and Graph delegated permissions
########################################
resource "azuread_application" "spa_app" {
  display_name     = "${var.aad_app_name}-SPA"
  sign_in_audience = "AzureADMyOrg"

  single_page_application {
    redirect_uris = var.aad_redirect_uris
  }

  # App Roles internos
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

  # SPA calls backend API
  required_resource_access {
    resource_app_id = azuread_application.api_app.object_id
    resource_access {
      id   = random_uuid.api_scope_id.result
      type = "Scope"
    }
  }

  # SPA needs Graph delegated permissions
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

resource "azuread_service_principal" "spa_sp" {
  client_id = azuread_application.spa_app.client_id
}

########################################
# 6) Create Security Groups for RBAC
########################################
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

########################################
# 7) Assign existing Azure AD users to groups
########################################
data "azuread_users" "all_users" {
  return_all = true
}

locals {
  all_user_emails   = [for u in data.azuread_users.all_users.users : u.user_principal_name]
  non_admins        = setsubtract(local.all_user_emails, var.aad_admins_group_members)
  non_admins_supers = setsubtract(local.non_admins, var.aad_supervisors_group_members)
}

data "azuread_user" "admins" {
  for_each            = toset(var.aad_admins_group_members)
  user_principal_name = each.value
}
resource "azuread_group_member" "admins_members" {
  for_each         = data.azuread_user.admins
  group_object_id  = azuread_group.admins_group.object_id
  member_object_id = each.value.object_id
}

data "azuread_user" "supervisors" {
  for_each            = toset(var.aad_supervisors_group_members)
  user_principal_name = each.value
}
resource "azuread_group_member" "supervisors_members" {
  for_each         = data.azuread_user.supervisors
  group_object_id  = azuread_group.supervisors_group.object_id
  member_object_id = each.value.object_id
}



########################################
# 8) Assign App Roles to the Security Groups
########################################
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

########################################
# 9) Optional: client secret for API App
########################################
resource "azuread_application_password" "api_app_secret" {
  application_id = azuread_application.api_app.id
  display_name   = "client-secret-for-Graph-calls"
}
