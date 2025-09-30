# PowerShell script to convert all .js files to .ts files
# Excludes node_modules directory

Get-ChildItem -Path . -Recurse -Filter "*.js" | 
Where-Object { $_.FullName -notlike "*node_modules*" } |
ForEach-Object {
    $newName = $_.Name -replace '\.js$', '.ts'
    $newPath = Join-Path $_.Directory $newName
    Write-Host "Converting $($_.FullName) to $newPath"
    Rename-Item -Path $_.FullName -NewName $newName
}

Write-Host "Conversion completed!"
