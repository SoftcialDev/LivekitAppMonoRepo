# 1. Crear Resource Group inline
resource "azurerm_resource_group" "main-rg" {
  name     = var.name_prefix
  location = var.region
}

# 2. Invocar módulo network para VNet + Subnet
module "network" {
  source      = "./modules/network"
  name_prefix = var.name_prefix
  region      = var.region
  resource_group  = azurerm_resource_group.main-rg.name
  nat_gateway_id = module.pip_egress.nat_gateway_id
   depends_on = [ module.pip_egress ]
}

module "static_web_app" {
  source              = "./modules/static-web-app"  # Ajusta la ruta relativa
  name_prefix         = var.name_prefix             # Prefijo general de tu proyecto
  resource_group_name = azurerm_resource_group.main-rg.name
  location            = "eastus2" #eastus is not avaible for static web app, so we are using this
  sku_tier            = var.swa_sku_tier            # opcional, por defecto “Free”
  repository_url      = var.swa_repository_url      # URL Git del repo
  repository_branch   = var.swa_repository_branch   # Rama a usar (por ejemplo "main")
  repository_token    = var.swa_repository_token    # GitHub PAT con permisos
  tags                = var.tags                    # Mapa de etiquetas opcionales
}
# 3) Public IPs

module "pip_egress" {
  source              = "./modules/public-ip"
  name_prefix         = var.name_prefix
  purpose             = "egress"
  resource_group_name = azurerm_resource_group.main-rg.name
  region            = var.region
}

module "redis" {
  source         = "./modules/redis"
  name_prefix    = var.name_prefix
  region         = var.region
  resource_group = azurerm_resource_group.main-rg.name
  family         = var.redis_family      
  sku_name       = var.redis_sku_name
  capacity       = var.redis_capacity          
  egress_public_ip = module.pip_egress.public_ip_address
}

module "aad_app" {
  source = "./modules/aad-app"

  app_name               = var.aad_app_name
  redirect_uris          = var.aad_redirect_uris
  logout_uris            = var.aad_logout_uris
  redirect_url           = var.redirect_url_for_invited_users
  admins_group_members   = var.aad_admins_group_members
  employees_group_members = var.aad_employees_group_members
  invite_emails          = var.aad_invite_emails
  enable_directory_role_assignment = var.aad_enable_directory_role_assignment
}

# 3. Invocar módulo AKS
module "aks" {
  source              = "./modules/aks"
  name_prefix         = var.name_prefix
  region              = var.region
  resource_group = azurerm_resource_group.main-rg.name
  vnet_subnet_id = module.network.subnet_id
  aks_node_count      = var.aks_node_count
  vm_sku              = var.vm_sku
  aks_price_tier      = var.aks_price_tier
  depends_on = [ module.network ]

}
