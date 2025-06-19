# Name prefix for resources / App Registrations
variable "aad_app_name" {
  description = "Base name for Azure AD applications (SPA and API)"
  type        = string
}

# Redirect URIs for the SPA (Admin-Web)
variable "aad_redirect_uris" {
  description = "List of redirect URIs for the SPA (e.g., http://localhost:5173, https://prod-domain/.../auth)"
  type        = list(string)
}

# Logout URIs for the SPA
variable "aad_logout_uris" {
  description = "List of post-logout redirect URIs for the SPA"
  type        = list(string)
}

# Redirect URIs for the API App Registration (optional, for admin-consent flows)
variable "aad_api_redirect_uris" {
  description = "List of redirect URIs for the API App Registration (used if you need consent UX)"
  type        = list(string)
  default     = []
}

# Internal tenant user object IDs to assign to Admin role group
variable "aad_admins_group_members" {
  description = "List of user object IDs (GUIDs) for initial Admins"
  type        = list(string)
  default     = []
}

