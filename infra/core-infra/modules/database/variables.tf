variable "resource_group_name" {
  type        = string
  description = "Resource group name"
}
variable "location" {
  type        = string
  description = "Azure region"
}
variable "server_name" {
  type        = string
  description = "PostgreSQL Flexible Server name"
}
variable "sku_name" {
  type        = string
  description = "SKU name, e.g., Standard_D2s_v3"
  default     = "Standard_D2s_v3"
}
variable "storage_mb" {
  type        = number
  description = "Storage in MB"
  default     = 32768
}
variable "version" {
  type        = string
  description = "PostgreSQL version, e.g., '13'"
  default     = "13"
}
variable "admin_username" {
  type        = string
  description = "Admin username for PostgreSQL"
}
variable "admin_password" {
  type        = string
  description = "Admin password for PostgreSQL"
  sensitive   = true
}
variable "vnet_subnet_id" {
  type        = string
  description = "Subnet resource ID for private access (optional). If empty, server is public."
  default     = ""
}
variable "public_network_access" {
  type        = string
  description = "Allow public access? 'Enabled' or 'Disabled'"
  default     = "Enabled"
}
variable "allowed_ips" {
  type        = list(string)
  description = "List of IPs to allow when public_network_access = 'Enabled'"
  default     = []
}
