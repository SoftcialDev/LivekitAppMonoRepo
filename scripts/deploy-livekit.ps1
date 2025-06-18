# deploy-livekit.ps1

# Ajusta estas rutas según tu estructura
$coreInfraDir = "infra\core-infra"
$manifestsDir = "infra\manifests"
# Nombre del Secret que usará LiveKit
$secretName   = "redis-secret"
# Nombre del archivo plantilla y del temporal
$templateFile = "livekit.yaml"
$renderedFile = "livekit-rendered.yaml"

# 1. Ir al directorio de core-infra y obtener kubeconfig de AKS
Push-Location $coreInfraDir

terraform output -raw kubeconfig > kubeconfig.yaml
$Env:KUBECONFIG = (Resolve-Path .\kubeconfig.yaml).Path
Write-Output "KUBECONFIG apuntando a $Env:KUBECONFIG"

# 2. Obtener valores de Redis desde Terraform
$redisHostRaw  = terraform output -raw redis_hostname
$redisHostFull = "$redisHostRaw:6379"
$redisKey      = terraform output -raw redis_primary_key
Write-Output "Redis host completo: $redisHostFull"

# 3. Crear o actualizar el Secret en Kubernetes
kubectl create secret generic $secretName `
  --from-literal=REDIS_HOST="$redisHostFull" `
  --from-literal=REDIS_KEY="$redisKey" `
  --dry-run=client -o yaml | kubectl apply -f -
Write-Output "Secret '$secretName' aplicado/actualizado."

Pop-Location

# 4. Preprocesar livekit.yaml con placeholders sin modificar el original
Push-Location $manifestsDir

if (-Not (Test-Path $templateFile)) {
    Write-Error "No se encontró $templateFile en $PWD"
    Pop-Location
    return
}

# Leer y reemplazar placeholders en un archivo temporal
(Get-Content $templateFile) |
  ForEach-Object {
    $_ -replace '\$\{REDIS_HOST\}', [Regex]::Escape($redisHostFull) `
       -replace '\$\{REDIS_KEY\}', [Regex]::Escape($redisKey)
  } | Set-Content $renderedFile

Write-Output "Generado temporal $renderedFile con valores de Redis."

# 5. Aplicar el YAML procesado
kubectl apply -f $renderedFile
Write-Output "Manifiestos de LiveKit aplicados desde $PWD\$renderedFile"

# 6. Eliminar el archivo temporal para dejar la plantilla intacta
Remove-Item $renderedFile -ErrorAction SilentlyContinue
Write-Output "Archivo temporal eliminado, plantilla $templateFile permanece sin cambios."

Pop-Location

Write-Output "Despliegue completado."
