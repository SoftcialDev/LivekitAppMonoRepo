########################################
# Global Configuration (shared across modules)
########################################

variable "name_prefix" {
  description = "Prefix used for naming all provisioned resources."
  type        = string
  default     = "livekit-agent-azure"
}

variable "region" {
  description = "Azure region where all resources will be deployed."
  type        = string
  default     = "eastus"
}

########################################
# AKS (Azure Kubernetes Service) Module
########################################

variable "aks_node_count" {
  description = "Number of nodes to provision in the AKS cluster."
  type        = number
  default     = 2
}

variable "aks_price_tier" {
  description = "Pricing tier for the AKS cluster (e.g., Free, Standard)."
  type        = string
  default     = "Standard"
}

variable "vm_sku" {
  description = "The SKU (size) of the virtual machines used for AKS nodes."
  type        = string
  default     = "Standard_B4ms"
}

########################################
# Redis Module
########################################

variable "redis_sku_name" {
  description = "SKU name of the Redis instance (e.g., Basic, Standard, Premium)."
  type        = string
}

variable "redis_family" {
  description = "Redis cache family type (e.g., C for basic workloads)."
  type        = string
}

variable "redis_capacity" {
  description = "Capacity tier for the Redis instance."
  type        = string
}

########################################
# Networking Module
########################################

variable "vnet_ip" {
  description = "The base IP range of the Virtual Network (VNET)."
  type        = string
  default     = "10.26.0.0"
}

variable "vnet_mask" {
  description = "CIDR subnet mask for the VNET."
  type        = string
  default     = "/16"
}

variable "subnet_mask" {
  description = "CIDR subnet mask for subnets (e.g., AKS node pool and pods)."
  type        = string
  default     = "/20"
}

########################################
# Azure Active Directory (AAD) Module
########################################

variable "aad_app_name" {
  description = "Name of the Azure AD application."
  type        = string
}

variable "aad_redirect_uris" {
  description = "List of redirect URIs allowed for the Azure AD app."
  type        = list(string)
}

variable "aad_logout_uris" {
  description = "List of post-logout redirect URIs for the Azure AD app."
  type        = list(string)
}

variable "aad_admins_group_members" {
  description = "List of user principal names (UPNs) to be added to the Admins group."
  type        = list(string)
}


variable "aad_enable_directory_role_assignment" {
  description = "If true, assigns the 'User Administrator' directory role to the Admins group."
  type        = bool
}



########################################
# Static Web App (SWA) Module
########################################

variable "swa_repository_url" {
  description = "GitHub repository URL used to deploy the Azure Static Web App."
  type        = string
}

variable "swa_repository_branch" {
  description = "Git branch to deploy for the Static Web App."
  type        = string
  default     = "main"
}

variable "swa_repository_token" {
  description = "GitHub Personal Access Token used for deployment authentication."
  type        = string
  sensitive   = true
}

variable "swa_sku_tier" {
  description = "SKU tier for the Static Web App (e.g., Free, Standard)."
  type        = string
  default     = "Free"
}

########################################
# Global Tags
########################################

variable "tags" {
  description = "Common tags applied to all Azure resources."
  type        = map(string)
  default     = {}
}
