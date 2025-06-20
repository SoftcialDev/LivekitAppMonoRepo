<#
.SYNOPSIS
  Generate a .env file in the repo root containing Terraform outputs in KEY=VALUE format,
  with keys in uppercase and values preserved exactly as returned by Terraform.
.DESCRIPTION
  This script:
    1. Changes directory into the Terraform folder (default: "infra/core-infra").
    2. Runs `terraform output -json` to retrieve all outputs.
    3. Parses the JSON and writes each output as `KEY=VALUE` to a .env file in the repo root,
       converting only the key to uppercase and preserving the original casing and content of the value.
    4. Skips the output named "aks_kubeconfig" to avoid leaking Kubernetes credentials.
.PARAMETER TerraformDir
  Relative path to the Terraform directory from the current working directory.
  Default: "infra/core-infra"
.PARAMETER EnvFilePath
  Path to the output .env file in the repo root.
  Default: ".env"
.EXAMPLE
  PS> .\scripts\Generate-TerraformEnv.ps1
  Uses the defaults and writes a `.env` file in the repo root, with keys uppercased
  and original values.
#>

param(
    [string]$TerraformDir = "infra/core-infra",
    [string]$EnvFilePath   = ".env"
)

try {
    # Verify that Terraform is installed
    if (-not (Get-Command terraform -ErrorAction SilentlyContinue)) {
        Write-Error "Terraform command not found in PATH. Please install Terraform."
        exit 1
    }

    # Verify the Terraform directory exists
    if (-not (Test-Path -Path $TerraformDir -PathType Container)) {
        Write-Error "Terraform directory '$TerraformDir' not found. Adjust the TerraformDir parameter if needed."
        exit 1
    }

    # Change into the Terraform directory
    Push-Location $TerraformDir

    Write-Host "Running 'terraform output -json' in '$TerraformDir'..."
    $tfOutputJson = terraform output -json 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Error executing 'terraform output -json': $tfOutputJson"
        Pop-Location
        exit 1
    }

    # Parse the JSON output into a PowerShell object
    try {
        $outputs = $tfOutputJson | ConvertFrom-Json
    }
    catch {
        Write-Error "Failed to parse JSON from Terraform output: $_"
        Pop-Location
        exit 1
    }

    # Return to the original directory
    Pop-Location

} catch {
    Write-Error "Unexpected error: $_"
    exit 1
}

# Build lines for the .env file
$lines = @()
foreach ($prop in $outputs.PSObject.Properties) {
    $name = $prop.Name

    # Skip the sensitive Kubernetes kubeconfig
    if ($name -ieq "aks_kubeconfig") {
        Write-Host "Skipping output: $name"
        continue
    }

    $meta = $prop.Value
    $val  = $meta.value

    # Skip null values
    if ($null -eq $val) {
        Write-Host "Skipping null value for output: $name"
        continue
    }

    # Uppercase the key, preserve the value exactly
    $keyUpper = $name.ToUpperInvariant()

    if ($val -is [System.Collections.IEnumerable] -and -not ($val -is [string])) {
        # Serialize arrays or objects to compact JSON, preserving original casing
        $valString = $val | ConvertTo-Json -Compress
    }
    else {
        # Scalar values: convert to string without changing case
        $valString = $val.ToString()
    }

    # Append the KEY=VALUE line
    $lines += "$keyUpper=$valString"
}

# Write all lines to the .env file in the repo root
try {
    Write-Host "Writing ${lines.Count} entries to '$EnvFilePath'..."
    $lines | Out-File -FilePath $EnvFilePath -Encoding UTF8
    Write-Host "Successfully generated '$EnvFilePath'."
}
catch {
    Write-Error "Failed to write to '$EnvFilePath': $_"
    exit 1
}
