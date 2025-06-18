# Declare variables for the module
variable "app_name" {
  description = "Name of the Azure AD application"
  type        = string
}

variable "redirect_uris" {
  description = "List of redirect URIs for the application"
  type        = list(string)
}

variable "logout_uris" {
  description = "List of logout URIs for the application"
  type        = list(string)
}

variable "redirect_url" {
  description = "Redirect URL for guest user invitations"
  type        = string
}

variable "admins_group_members" {
  description = "List of object IDs for Admin group members"
  type        = list(string)
}

variable "employees_group_members" {
  description = "List of object IDs for Employee group members"
  type        = list(string)
}

variable "invite_emails" {
  description = "List of email addresses to invite as guest users"
  type        = list(string)
}

variable "enable_directory_role_assignment" {
  description = "Enable assignment of directory roles"
  type        = bool
  default     = false
}