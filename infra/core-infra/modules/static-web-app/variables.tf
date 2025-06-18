# Prefijo para el nombre de la Static Web App
variable "name_prefix" {
  description = "Prefijo para el nombre de la Static Web App"
  type        = string
}

# Resource Group donde desplegar la Static Web App
variable "resource_group_name" {
  description = "Nombre del Resource Group donde se desplegará la Static Web App"
  type        = string
}

# Región para la Static Web App
variable "location" {
  description = "Región para la Static Web App"
  type        = string
}

# SKU tier: Free o Standard
variable "sku_tier" {
  description = "SKU tier para la Static Web App (Free o Standard)"
  type        = string
  default     = "Free"
}
variable "repository_url" {
  description = "URL del repositorio GitHub para la Static Web App"
  type        = string
}
variable "repository_branch" {
  description = "Branch para despliegue (por ejemplo 'main')"
  type        = string
}
variable "repository_token" {
  description = "GitHub PAT con permisos para el repo"
  type        = string
  sensitive   = true
}


# Tags opcionales
variable "tags" {
  description = "Map de tags para el recurso"
  type        = map(string)
  default     = {}
}
