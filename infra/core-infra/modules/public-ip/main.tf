resource "azurerm_public_ip" "public_ip" {
  name                = "${var.name_prefix}-egress-pip"
  resource_group_name = var.resource_group_name
  location            = var.region
  allocation_method   = "Static"
  sku                 = "Standard"
}

resource "azurerm_nat_gateway" "natgw" {
  name                = "${var.name_prefix}-natgw"
  resource_group_name = var.resource_group_name
  location            = var.region
  sku_name            = "Standard"
  # No incluir public_ip_address_ids aquí si no está soportado
}

resource "azurerm_nat_gateway_public_ip_association" "natgw_pip_association" {
  nat_gateway_id       = azurerm_nat_gateway.natgw.id
  public_ip_address_id = azurerm_public_ip.public_ip.id
}
