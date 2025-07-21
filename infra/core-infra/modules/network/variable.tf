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

variable "resource_group" {
    type = string
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
