###########################################################
# 0) Prerequisites
# - Ensure you have privileges to register AAD apps and grant admin consent.
###########################################################
# Generate stable UUIDs for custom App Roles and the API scope
resource "random_uuid" "app_role_admin"      {}
resource "random_uuid" "app_role_supervisor" {}
resource "random_uuid" "app_role_employee"   {}
resource "random_uuid" "api_scope_id"        {}
resource "random_uuid" "app_role_contact_manager"        {}
resource "random_uuid" "app_role_super_admin"        {}

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
    "Chat.Create",
    "Chat.Read.All",
    "Chat.ReadBasic.All",
    "Chat.ReadWrite.All",
    "ChatMember.Read.All",
    "ChatMember.ReadWrite.All",
    "Chat.Read",
    "Chat.ReadBasic",
    "Chat.ReadWrite",
    "Chat.ReadWrite.All",
    "ChatMember.Read",
    "ChatMember.ReadWrite",
  ]
  # Map each permission name to its role-ID GUID
  graph_app_role_map = {
    "Group.Read.All"          = "7ab1d382-f21e-4acd-a863-ba3e13f7da61"
    "Group.ReadWrite.All"     = "62a82d76-70ea-41e2-9197-370581804d09"
    "User.Read.All"           = "df021288-bdef-4463-88db-98f22de89214"
    "User.ReadWrite.All"      = "741f803b-c850-494e-b5df-cde7c675a1ca"
    "Directory.Read.All"      = "7ab1d382-f21e-4acd-a863-ba3e13f7da61"
    "Directory.ReadWrite.All" = "19dbc75e-c2e2-444c-a770-ec69d8559fc7"
    "ChatMember.ReadWrite.All" = "d9c48af6-9ad9-47ad-82c3-63757137b9af"
    "ChatMember.Read.All"     = "a3410be2-8e48-4f32-8454-c29a7465209d"
    "Chat.ReadWrite.All"      = "294ce7c9-31ba-490a-ad7d-97a7d075e4ed"
    "Chat.ReadBasic.All"      =  "b2e060da-3baf-4687-9611-f4ebc0f0cbde"
    "Chat.Read.All"           =  "6b7d71aa-70aa-4810-a8d9-5d9fb2830017"
    "Chat.Create"             =  "d9c48af6-9ad9-47ad-82c3-63757137b9af"
    "Chat.Read" = "f501c180-9344-439a-bca0-6cbf209fd270"
    "Chat.ReadBasic" = "9547fcb5-d03f-419d-9948-5928bbf71b0f"
    "Chat.ReadWrite" = "9ff7295e-131b-4d94-90e1-69fde507ac11"
    "ChatMember.Read" = "c5a9e2b1-faf6-41d4-8875-d381aa549b24"
    "ChatMember.ReadWrite"  = "dea13482-7ea6-488f-8b98-eb5bbecf033d"
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
    "Chat.Create",
    "Chat.Read.All",
    "Chat.ReadBasic.All",
    "Chat.ReadWrite.All",
    "ChatMember.Read.All",
    "ChatMember.ReadWrite.All",
    "Chat.Read",
    "Chat.ReadBasic",
    "Chat.ReadWrite",
    "Chat.ReadWrite.All",
    "ChatMember.Read",
    "ChatMember.ReadWrite",

  ]
  graph_delegated_scope_map = {
    "Group.Read.All"      = "7ab1d382-f21e-4acd-a863-ba3e13f7da61"
    "Group.ReadWrite.All" = "62a82d76-70ea-41e2-9197-370581804d09"
    "User.Read.All"       = "df021288-bdef-4463-88db-98f22de89214"
    "User.ReadWrite.All"  = "741f803b-c850-494e-b5df-cde7c675a1ca"
    "ChatMember.ReadWrite.All" = "d9c48af6-9ad9-47ad-82c3-63757137b9af"
    "ChatMember.Read.All"     = "a3410be2-8e48-4f32-8454-c29a7465209d"
    "Chat.ReadWrite.All"      = "7e9a077b-3711-42b9-b7cb-5fa5f3f7fea7"
    "Chat.ReadBasic.All"      =  "b2e060da-3baf-4687-9611-f4ebc0f0cbde"
    "Chat.Read.All"           =  "6b7d71aa-70aa-4810-a8d9-5d9fb2830017"
    "Chat.Create"             =  "d9c48af6-9ad9-47ad-82c3-63757137b9af"
    "Chat.Read" = "f501c180-9344-439a-bca0-6cbf209fd270"
    "Chat.ReadBasic" = "9547fcb5-d03f-419d-9948-5928bbf71b0f"
    "Chat.ReadWrite" = "9ff7295e-131b-4d94-90e1-69fde507ac11"
    "ChatMember.Read" = "c5a9e2b1-faf6-41d4-8875-d381aa549b24"
    "ChatMember.ReadWrite"  = "dea13482-7ea6-488f-8b98-eb5bbecf033d"
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
    redirect_uris = var.aad_desktop_redirect_uris
    
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

    app_role {
    id                   = random_uuid.app_role_contact_manager.result
    allowed_member_types = ["User"]
    display_name         = "Contact Manager"
    description          = "Users in this role have contact manager access"
    value                = "ContactManager"
    enabled              = true
  }

      app_role {
    id                   = random_uuid.app_role_super_admin.result
    allowed_member_types = ["User"]
    display_name         = "Super Admin"
    description          = "Users in this role have super admin access"
    value                = "SuperAdmin"
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

resource "azuread_group" "contact_manager_group" {
  display_name     = "${var.aad_app_name}-Contact-Manager"
  security_enabled = true
  mail_enabled     = false
}

resource "azuread_group" "super_admins_group" {
  display_name     = "${var.aad_app_name}-Super-Admins"
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

resource "azuread_app_role_assignment" "contact_manager_assignment" {
  principal_object_id = azuread_group.employees_group.object_id
  app_role_id         = azuread_application.spa_app.app_role_ids["ContactManager"]
  resource_object_id  = azuread_service_principal.spa_sp.object_id
}

resource "azuread_app_role_assignment" "super_admin_assignment" {
  principal_object_id = azuread_group.super_admins_group.object_id
  app_role_id         = azuread_application.spa_app.app_role_ids["SuperAdmin"]
  resource_object_id  = azuread_service_principal.spa_sp.object_id
}

########################################################### 
#Client secret for the API App
###########################################################
resource "azuread_application_password" "api_app_secret" {
  application_id = azuread_application.api_app.id
  display_name   = "client-secret-for-Graph-calls"
}

data "azurerm_subscription" "current" {}


resource "azuread_application_federated_identity_credential" "github_oidc" {
  application_id = azuread_application.api_app.id
  display_name   = "github-actions-main-oidc"

  issuer    = "https://token.actions.githubusercontent.com"
  subject   = "repo:SoftcialDev/InContactApplication:ref:refs/heads/main"
  audiences = ["api://AzureADTokenExchange"]
}

resource "azurerm_role_assignment" "github_oidc_contributor" {
  scope                = data.azurerm_subscription.current.id
  role_definition_name = "Contributor"
  principal_id         = azuread_service_principal.api_sp.object_id
}
