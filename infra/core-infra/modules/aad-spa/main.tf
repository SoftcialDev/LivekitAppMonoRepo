########################################
# 1) Generate stable UUIDs for roles and API scope
########################################
resource "random_uuid" "app_role_admin"      {}
resource "random_uuid" "app_role_supervisor" {}
resource "random_uuid" "app_role_employee"   {}
resource "random_uuid" "api_scope_id"        {}

data "azuread_client_config" "current" {}

########################################
# 2) Create API App Registration (for your backend API)
#    - Exposes OAuth2 permission scope "access_as_user"
########################################
resource "azuread_application" "api_app" {
  display_name     = "${var.aad_app_name}-API"
  sign_in_audience = "AzureADMyOrg"

  # Use a stable, known Application ID URI based on tenant ID + app name.
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
}

# Service Principal for API App
resource "azuread_service_principal" "api_sp" {
  client_id = azuread_application.api_app.application_id
}

########################################
# 3) Create SPA App Registration (Admin-Web)
#    - Defines App Roles for RBAC (Admin, Supervisor, Employee)
#    - Declares required_resource_access referencing API scope
########################################
resource "azuread_application" "spa_app" {
  display_name     = "${var.aad_app_name}-SPA"
  sign_in_audience = "AzureADMyOrg"

  single_page_application {
    redirect_uris = var.aad_redirect_uris
  }

  # App Role: Admin
  app_role {
    id                   = random_uuid.app_role_admin.result
    allowed_member_types = ["User"]
    display_name         = "Admin"
    description          = "Users in this role have full administrative privileges"
    value                = "Admin"
    enabled              = true
  }

  # App Role: Supervisor
  app_role {
    id                   = random_uuid.app_role_supervisor.result
    allowed_member_types = ["User"]
    display_name         = "Supervisor"
    description          = "Users in this role can manage assigned employees"
    value                = "Supervisor"
    enabled              = true
  }

  # App Role: Employee
  app_role {
    id                   = random_uuid.app_role_employee.result
    allowed_member_types = ["User"]
    display_name         = "Employee"
    description          = "Users in this role have standard access"
    value                = "Employee"
    enabled              = true
  }

  # Declare that this SPA requires the API scope from the API App
  required_resource_access {
    resource_app_id = azuread_application.api_app.application_id
    resource_access {
      id   = random_uuid.api_scope_id.result
      type = "Scope"
    }
  }
}

# Service Principal for SPA App
resource "azuread_service_principal" "spa_sp" {
  client_id = azuread_application.spa_app.application_id
}

########################################
# 4) Create Security Groups for RBAC
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
# 5) Assign existing Azure AD users to groups
#
# - Users in var.aad_admins_group_members  → Admins group
# - Users in var.aad_supervisors_group_members → Supervisors group
# - All others (minus admins) → Employees group
########################################

# Get all users from Azure AD
data "azuread_users" "all_users" {
  return_all = true
}

# Derive employees as: all users minus the explicit Admins & Supervisors
locals {
  all_user_emails     = [for u in data.azuread_users.all_users.users : u.user_principal_name]
  non_admins          = setsubtract(local.all_user_emails, var.aad_admins_group_members)
  non_admins_supers   = setsubtract(local.non_admins, var.aad_supervisors_group_members)
}

# Admin users lookup
data "azuread_user" "admins" {
  for_each            = toset(var.aad_admins_group_members)
  user_principal_name = each.value
}
resource "azuread_group_member" "admins_members" {
  for_each         = data.azuread_user.admins
  group_object_id  = azuread_group.admins_group.id
  member_object_id = each.value.id
}

# Supervisor users lookup
data "azuread_user" "supervisors" {
  for_each            = toset(var.aad_supervisors_group_members)
  user_principal_name = each.value
}
resource "azuread_group_member" "supervisors_members" {
  for_each         = data.azuread_user.supervisors
  group_object_id  = azuread_group.supervisors_group.id
  member_object_id = each.value.id
}

# Remaining employees lookup
data "azuread_user" "employees" {
  for_each            = toset(local.non_admins_supers)
  user_principal_name = each.value
}
resource "azuread_group_member" "employees_members" {
  for_each         = data.azuread_user.employees
  group_object_id  = azuread_group.employees_group.id
  member_object_id = each.value.id
}

########################################
# 6) Assign App Roles to the Security Groups
########################################
resource "azuread_app_role_assignment" "admins_assignment" {
  principal_object_id = azuread_group.admins_group.id
  app_role_id         = azuread_application.spa_app.app_role_ids["Admin"]
  resource_object_id  = azuread_service_principal.spa_sp.id
}

resource "azuread_app_role_assignment" "supervisors_assignment" {
  principal_object_id = azuread_group.supervisors_group.id
  app_role_id         = azuread_application.spa_app.app_role_ids["Supervisor"]
  resource_object_id  = azuread_service_principal.spa_sp.id
}

resource "azuread_app_role_assignment" "employees_assignment" {
  principal_object_id = azuread_group.employees_group.id
  app_role_id         = azuread_application.spa_app.app_role_ids["Employee"]
  resource_object_id  = azuread_service_principal.spa_sp.id
}

########################################
# 7) Optional: client secret for API App
########################################
resource "azuread_application_password" "api_app_secret" {
  application_id = azuread_application.api_app.id
  display_name   = "client-secret-for-Graph-calls"
}
