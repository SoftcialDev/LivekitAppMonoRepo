########################################
# AKS Module Outputs
########################################

output "kubeconfig" {
  description = "Kubeconfig credentials for connecting to the AKS cluster."
  value       = module.aks.kubeconfig
  sensitive   = true
}

output "aks_egress_ip" {
  description = "Public IP address used by AKS for outbound (egress) traffic."
  value       = module.pip_egress.public_ip_address
}

########################################
# Redis Module Outputs
########################################

output "redis_host_name" {
  description = "DNS hostname of the Redis instance."
  value       = module.redis.redis_hostname
}

output "redis_primary_key" {
  description = "Primary access key for the Redis instance."
  value       = module.redis.redis_primary_key
  sensitive   = true
}

########################################
# Static Web App Module Outputs
########################################

output "static_web_app_id" {
  description = "Resource ID of the Azure Static Web App."
  value       = module.static_web_app.static_web_app_id
}

output "default_hostname" {
  description = "Default hostname assigned to the Static Web App (without https://)."
  value       = module.static_web_app.default_hostname
}

output "url" {
  description = "Public HTTPS URL of the Static Web App."
  value       = module.static_web_app.url
}

output "azure_static_app_deploy_key" {
  description = "Deployment token for the Static Web App (used by CI/CD)."
  value       = module.static_web_app.static_web_app_deployment_token
  sensitive   = true
}


## aaa

output api_application_id {
  value = module.aad_spa.api_application_id
  sensitive = true
}

output app_application_id {
  value = module.aad_spa.spa_application_id
  sensitive = true
}

output app_tenant_id {
  value = module.aad_spa.tenant_id
}

output api_scope_uri {
  value = module.aad_spa.api_scope_uri
}