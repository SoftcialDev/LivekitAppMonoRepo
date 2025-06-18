output "application_id" {
  value       = azuread_application.app.application_id
  description = "The Application (client) ID of the Azure AD App"
}

output "application_object_id" {
  value       = azuread_application.app.object_id
  description = "The Object ID of the Azure AD App"
}

output "admins_group_id" {
  value       = azuread_group.admins_group.id
  description = "Object ID of the Admins group"
}

output "employees_group_id" {
  value       = azuread_group.employees_group.id
  description = "Object ID of the Employees group"
}

output "service_principal_id" {
  value       = azuread_service_principal.sp.id
  description = "Object ID of the Service Principal"
}
