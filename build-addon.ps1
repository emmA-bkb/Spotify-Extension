# Script para compactar a extensão com caminhos Unix
Add-Type -Assembly System.IO.Compression.FileSystem

$WorkDir = "c:\Visual Studio\spoti"
$OutputFile = "$WorkDir\spoti-extension.zip"

# Remover ZIP anterior
if (Test-Path $OutputFile) {
    Remove-Item $OutputFile -Force
}

# Criar ZIP com caminhos Unix (/)
$zip = [System.IO.Compression.ZipFile]::Open($OutputFile, 'Create')

# Função para adicionar arquivos e pastas
function Add-ToZip($zip, $rootPath, $prefix) {
    Get-ChildItem -Path $rootPath -Recurse -Force | ForEach-Object {
        $filePath = $_.FullName
        $relativePath = $filePath -replace [regex]::Escape($rootPath), "" -replace "\\", "/"
        $zipPath = ($prefix + $relativePath) -replace "^/", ""
        
        if (-not $_.PSIsContainer) {
            $entry = $zip.CreateEntry($zipPath)
            $stream = $entry.Open()
            $file = [System.IO.File]::OpenRead($filePath)
            $file.CopyTo($stream)
            $file.Close()
            $stream.Close()
        }
    }
}

# Adicionar manifest.json
$entry = $zip.CreateEntry("manifest.json")
$stream = $entry.Open()
$file = [System.IO.File]::OpenRead("$WorkDir\manifest.json")
$file.CopyTo($stream)
$file.Close()
$stream.Close()

# Adicionar pastas
Add-ToZip $zip "$WorkDir\background" "background"
Add-ToZip $zip "$WorkDir\content" "content"
Add-ToZip $zip "$WorkDir\icons" "icons"
Add-ToZip $zip "$WorkDir\popup" "popup"
Add-ToZip $zip "$WorkDir\src" "src"

$zip.Dispose()

Write-Host "Arquivo criado: $OutputFile"
Write-Host "Pronto para upload!"
