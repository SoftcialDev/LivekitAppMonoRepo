# variables.tf en infra/core-infra

variable "name_prefix" {
  description = "Prefix for the name of the resources"
  type        = string
  default     = "livekit-agent-azure"
}

variable "region" {
  description = "The region in which the resources will be deployed"
  type        = string
  default     = "eastus"
}

variable "vnet_ip" {
  description = "The IP range for the VNET"
  type        = string
  default     = "10.26.0.0"
}

variable "vnet_mask" {
  description = "The subnet mask for the VNET"
  type        = string
  default     = "/16"
}

variable "subnet_mask" {
  description = "The subnet mask for the AKS cluster - nodes and pods"
  type        = string
  default     = "/20"
}

variable "aks_node_count" {
  description = "The number of nodes in the AKS cluster"
  type        = number
  default     = 2
}

variable "vm_sku" {
  description = "The size of the Virtual Machine"
  type        = string
  default     = "Standard_B4ms"
}

variable "aks_price_tier" {
  description = "The pricing tier for the AKS cluster"
  type        = string
  default     = "Standard"
}


variable redis_sku_name {
    type = string
}


variable redis_family {
    type = string
}

variable redis_capacity {
    type = string
}

//module aad

variable "aad_app_name" {
  description = "Nombre de la aplicación en Azure AD"
  type        = string
}

variable "aad_redirect_uris" {
  description = "Redirect URIs permitidas para la app Azure AD"
  type        = list(string)
}

variable "aad_logout_uris" {
  description = "Post logout URIs para la app Azure AD"
  type        = list(string)
}

variable "aad_admins_group_members" {
  description = "Lista de Object IDs de usuarios iniciales para el grupo Admins"
  type        = list(string)
}

variable "aad_employees_group_members" {
  description = "Lista de Object IDs de usuarios iniciales para el grupo Employees"
  type        = list(string)
}

variable "aad_invite_emails" {
  description = "Lista de correos a invitar como Guest Users"
  type        = list(string)
}

variable "aad_enable_directory_role_assignment" {
  description = "Si es true, asigna el Directory Role 'User Administrator' al grupo Admins"
  type        = bool
}


variable "redirect_url_for_invited_users" {
  description = "Redirect URL for invited users"
  type        = string
  default     = "https://example.com/invite" # Replace with the actual URL
}

variable "swa_repository_url" {
  description = "URL del repositorio GitHub para la Static Web App"
  type        = string
}

variable "swa_repository_branch" {
  description = "Branch para despliegue de la Static Web App"
  type        = string
  default     = "main"
}

variable "swa_repository_token" {
  description = "GitHub Personal Access Token para la Static Web App"
  type        = string
  sensitive   = true
}

variable "swa_sku_tier" {
  description = "SKU tier para la Static Web App (Free o Standard)"
  type        = string
  default     = "Free"
}

variable "tags" {
  description = "Etiquetas comunes para todos los recursos"
  type        = map(string)
  default     = {}
}