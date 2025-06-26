variable "name_prefix" {
  description = "Prefix for naming resources (for example, 'myapp'). Used to form server and database names."
  type        = string
}

variable "resource_group_name" {
  description = "Name of the existing Resource Group where PostgreSQL Flexible Server will be deployed."
  type        = string
}

variable "location" {
  description = "Azure region for PostgreSQL Flexible Server, for example 'eastus'."
  type        = string
}

variable "admin_username" {
  description = "Administrator username for PostgreSQL Flexible Server."
  type        = string
}

variable "admin_password" {
  description = "Administrator password for PostgreSQL Flexible Server."
  type        = string
  sensitive   = true
}

variable "postgres_version" {
  description = "PostgreSQL major version, for example '13' or '14'."
  type        = string
  default     = "13"
}

variable "sku_name" {
  description = "SKU name for PostgreSQL Flexible Server, for example 'Standard_D2s_v3'."
  type        = string
  default     = "Standard_D2s_v3"
}

variable "storage_mb" {
  description = "Storage size in MB for PostgreSQL Flexible Server."
  type        = number
  default     = 32768
}

variable "vnet_subnet_id" {
  description = "Resource ID of a subnet delegated to Microsoft.DBforPostgreSQL/flexibleServers for private access."
  type        = string
  default     = ""
}

variable "public_network_access" {
  description = "Whether to allow public network access: set to 'Enabled' or 'Disabled'."
  type        = string
  default     = "Enabled"
}

variable "allowed_ips" {
  description = "List of client IP addresses or CIDR blocks to allow when public_network_access is 'Enabled', for example ['203.0.113.5/32']. If empty, no public access rules are created."
  type        = list(string)
  default     = []
}
