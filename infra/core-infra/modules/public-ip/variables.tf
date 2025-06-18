variable "name_prefix" {
  description = "Common prefix for all resources"
  type        = string
}

variable "purpose" {
  description = "Short descriptor for this IP (e.g. livekit, stunner)"
  type        = string
}

variable "resource_group_name" {
  description = "Resource Group in which to create the IP"
  type        = string
}

variable "region" {
  description = "Azure region (e.g. westus2)"
  type        = string
}

