

output "kubeconfig" {
  value     = module.aks.kubeconfig
  sensitive = true
}

output redis_host_name {
    value = module.redis.redis_hostname
}

output redis_primary_key {
    value = module.redis.redis_primary_key
    sensitive = true
}

output aks_egress_ip {
   value = module.pip_egress.public_ip_address
}



# outputs.tf

output "static_web_app_id" {
  description = "ID del recurso Static Web App"
  value       = module.static_web_app.static_web_app_id
}

output "default_hostname" {
  description = "Hostname asignado a la Static Web App (sin https://)"
  value       = module.static_web_app.default_hostname
}

output "url" {
  description = "URL completa de la Static Web App"
  value       = module.static_web_app.url
}


output azure_static_app_deploy_key {
   value = module.static_web_app.static_web_app_deployment_token
   sensitive = true
}