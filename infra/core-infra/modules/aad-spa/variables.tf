# Base name prefix applied to both the SPA and API App Registrations in Azure AD.
variable "aad_app_name" {
  description = "Base name for Azure AD applications (SPA and API)"
  type        = string
}

# One or more URIs where Azure AD will send authentication responses for the Single-Page Application.
variable "aad_redirect_uris" {
  description = "List of redirect URIs for the SPA (e.g., http://localhost:5173, https://prod-domain/.../auth)"
  type        = list(string)
}

variable "aad_desktop_redirect_uris" {
  description = "List of redirect URIs for the SPA (e.g., http://localhost:5173, https://prod-domain/.../auth)"
  type        = list(string)
}

# URIs to which Azure AD will redirect users after they sign out of the SPA.
variable "aad_logout_uris" {
  description = "List of post-logout redirect URIs for the SPA"
  type        = list(string)
}

# (Optional) Redirect URIs for the API App Registration, used when you want an admin-consent user experience.
variable "aad_api_redirect_uris" {
  description = "List of redirect URIs for the API App Registration (used if you need consent UX)"
  type        = list(string)
  default     = []
}

# Initial list of Azure AD user object IDs to include in the “Admins” role group.
variable "aad_admins_group_members" {
  description = "List of user object IDs (GUIDs) for initial Admins"
  type        = list(string)
  default     = []
}

# Initial list of Azure AD user object IDs to include in the “Supervisors” (SuperAdmin) role group.
variable "aad_supervisors_group_members" {
  description = "List of user object IDs (GUIDs) for initial SuperAdmins"
  type        = list(string)
  default     = []
}


variable "github_repo" {
  description = "GitHub repo for OIDC: format ORG/REPO"
  type        = string
}

variable "github_branch" {
  description = "Branch name to trust for OIDC"
  type        = string
  default     = "main"
}