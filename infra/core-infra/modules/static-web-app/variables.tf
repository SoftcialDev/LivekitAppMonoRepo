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
}


# Tags 
variable "tags" {
  description = "Map de tags para el recurso"
  type        = map(string)
  default     = {}
}


variable "env_vars" {
  type        = map(string)
  description = "Mapa de variables de entorno (App Settings) para la Static Web App"
  default     = {}
}
