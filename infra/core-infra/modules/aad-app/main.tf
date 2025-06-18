# modules/aad-app/main.tf

# 1) Generate stable UUIDs for the App Roles so Terraform validates correctly.
resource "random_uuid" "app_role_admin" {}
resource "random_uuid" "app_role_employee" {}

# 2) Register the Azure AD application (single-tenant) with two App Roles.
resource "azuread_application" "app" {
  display_name     = var.app_name
  sign_in_audience = "AzureADMyOrg"

  web {
    redirect_uris = var.redirect_uris
    logout_url    = length(var.logout_uris) > 0 ? var.logout_uris[0] : null
  }

  app_role {
    id                   = random_uuid.app_role_admin.result
    allowed_member_types = ["User"]
    display_name         = "Admin"
    description          = "Admin role with elevated privileges"
    value                = "Admin"
    enabled              = true
  }

  app_role {
    id                   = random_uuid.app_role_employee.result
    allowed_member_types = ["User"]
    display_name         = "Employee"
    description          = "Employee role with standard access"
    value                = "Employee"
    enabled              = true
  }
}

# 3) Create the Service Principal for the application.
resource "azuread_service_principal" "sp" {
  client_id = azuread_application.app.application_id
}

# 4) Create security groups: Admins and Employees.
resource "azuread_group" "admins_group" {
  display_name     = "${var.app_name}-Admins"
  security_enabled = true
  mail_enabled     = false
}

resource "azuread_group" "employees_group" {
  display_name     = "${var.app_name}-Employees"
  security_enabled = true
  mail_enabled     = false
}

# 5) Assign initial members to each group.
resource "azuread_group_member" "admins_members" {
  count            = length(var.admins_group_members)
  group_object_id  = azuread_group.admins_group.id
  member_object_id = var.admins_group_members[count.index]
}

resource "azuread_group_member" "employees_members" {
  count            = length(var.employees_group_members)
  group_object_id  = azuread_group.employees_group.id
  member_object_id = var.employees_group_members[count.index]
}

# 6) Assign App Roles to the groups.
resource "azuread_app_role_assignment" "admins_assignment" {
  principal_object_id = azuread_group.admins_group.id
  app_role_id         = azuread_application.app.app_role_ids["Admin"]
  resource_object_id  = azuread_service_principal.sp.id
}

resource "azuread_app_role_assignment" "employees_assignment" {
  principal_object_id = azuread_group.employees_group.id
  app_role_id         = azuread_application.app.app_role_ids["Employee"]
  resource_object_id  = azuread_service_principal.sp.id
}

# 7) Invite external users (Guest Users) if invite_emails has entries.
resource "azuread_invitation" "invite" {
  for_each           = toset(var.invite_emails)
  user_email_address = each.key
  redirect_url       = var.redirect_url
}
