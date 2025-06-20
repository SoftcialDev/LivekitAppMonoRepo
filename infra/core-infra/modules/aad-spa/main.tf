########################################
# 1) Generate stable UUIDs for roles and API scope
########################################
resource "random_uuid" "app_role_admin" {}
resource "random_uuid" "app_role_employee" {}
resource "random_uuid" "api_scope_id" {}

data "azuread_client_config" "current" {}

########################################
# 2) Create API App Registration (for your backend API)
#    - Exposes OAuth2 permission scope "access_as_user"
########################################

resource "azuread_application" "api_app" {
  display_name     = "${var.aad_app_name}-API"
  sign_in_audience = "AzureADMyOrg"

  # Use a stable, known Application ID URI based on tenant ID + app name.
  # This avoids referencing a GUID that may not resolve at runtime.
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
#    - Defines App Roles for RBAC
#    - Declares required_resource_access referencing API scope
########################################
resource "azuread_application" "spa_app" {
  display_name     = "${var.aad_app_name}-SPA"
  sign_in_audience = "AzureADMyOrg"



  # App Role: Admin
  app_role {
    id                   = random_uuid.app_role_admin.result
    allowed_member_types = ["User"]
    display_name         = "Admin"
    description          = "Users in this role have full administrative privileges"
    value                = "Admin"
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

    single_page_application  {
    redirect_uris = var.aad_redirect_uris
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
resource "azuread_group" "employees_group" {
  display_name     = "${var.aad_app_name}-Employees"
  security_enabled = true
  mail_enabled     = false
}

resource "azuread_group" "superadmins_group" {
  display_name     = "SuperAdmins"
  security_enabled = true
  mail_enabled = false
}


########################################
# 5) Assign existing Azure AD users to groups
#
# This logic assumes all users already exist in Azure AD.Q
# - Users explicitly listed in var.aad_admins_group_members go to the Admins group.
# - All other users found in Azure AD are assigned to the Employees group,
#   except those already in the Admin list.
########################################

# Get all users from Azure AD
# NOTE: This retrieves *all* users from the tenant, including guests and members.
data "azuread_users" "all_users" {
  return_all = true
}
# Derive employee users as: all users minus the ones in the Admins group
locals {
  all_user_emails       = [for user in data.azuread_users.all_users.users : user.user_principal_name]
  resolved_employees    = setsubtract(local.all_user_emails, var.aad_admins_group_members)
}

# Look up Admin users by UPN
data "azuread_user" "admins" {
  for_each = toset(var.aad_admins_group_members)
  user_principal_name = each.value
}

# Look up Employee users by UPN (excluding admins)
data "azuread_user" "employees" {
  for_each = local.resolved_employees
  user_principal_name = each.value
}

# Assign Admin users to Admins group
resource "azuread_group_member" "admins_members" {
  for_each         = toset(var.aad_admins_group_members)
  group_object_id  = azuread_group.admins_group.id
  member_object_id = data.azuread_user.admins[each.key].id
}

# Assign remaining users (excluding admins) to Employees group
resource "azuread_group_member" "employees_members" {
  for_each = {
    for k, v in data.azuread_user.employees : k => v if v.id != null
  }
  group_object_id  = azuread_group.employees_group.id
  member_object_id = each.value.id
}


data "azuread_user" "superadmins" {
  for_each           = toset(var.aad_superadmins_group_members)
  user_principal_name = each.value
}

resource "azuread_group_member" "superadmins_members" {
  for_each         = toset(var.aad_superadmins_group_members)
  group_object_id  = azuread_group.superadmins_group.id
  member_object_id = data.azuread_user.superadmins[each.key].id
}


########################################
# 6) Assign App Roles to the Security Groups
########################################
resource "azuread_app_role_assignment" "admins_assignment" {
  principal_object_id = azuread_group.admins_group.id
  app_role_id         = azuread_application.spa_app.app_role_ids["Admin"]
  resource_object_id  = azuread_service_principal.spa_sp.id
}


resource "azuread_app_role_assignment" "employees_assignment" {
  principal_object_id = azuread_group.employees_group.id
  app_role_id         = azuread_application.spa_app.app_role_ids["Employee"]
  resource_object_id  = azuread_service_principal.spa_sp.id
}



resource "azuread_application_password" "api_app_secret" {
  application_id = azuread_application.api_app.application_id
  display_name   = "client-secret-for-Graph-calls"

}