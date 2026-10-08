param()

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$projectRoot = Split-Path -Parent $PSScriptRoot
$resourceRoot = Join-Path $projectRoot 'android/app/src/main/res'
$sourceRoot = Join-Path $projectRoot 'assets/app-icons'
$icons = @(
    @{ Key = 'default'; Source = 'default.png' },
    @{ Key = 'navratri'; Source = 'navratri.png' },
    @{ Key = 'dasera'; Source = 'dasera.png' },
    @{ Key = 'diwali'; Source = 'diwali.jpg' }
)
$densities = @(
    @{ Name = 'mdpi'; Scale = 1 },
    @{ Name = 'hdpi'; Scale = 1.5 },
    @{ Name = 'xhdpi'; Scale = 2 },
    @{ Name = 'xxhdpi'; Scale = 3 },
    @{ Name = 'xxxhdpi'; Scale = 4 }
)

function Export-IconBitmap {
    param($Image, [int]$Size, [int]$ArtworkSize, [string]$Path)
    $bitmap = New-Object System.Drawing.Bitmap($Size, $Size)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    try {
        $graphics.Clear([System.Drawing.Color]::Transparent)
        $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
        $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
        $scale = [Math]::Min($ArtworkSize / $Image.Width, $ArtworkSize / $Image.Height)
        $width = [int][Math]::Round($Image.Width * $scale)
        $height = [int][Math]::Round($Image.Height * $scale)
        $destination = New-Object System.Drawing.Rectangle(([int](($Size - $width) / 2)), ([int](($Size - $height) / 2)), $width, $height)
        $attributes = New-Object System.Drawing.Imaging.ImageAttributes
        try {
            $attributes.SetWrapMode([System.Drawing.Drawing2D.WrapMode]::TileFlipXY)
            $graphics.DrawImage($Image, $destination, 0, 0, $Image.Width, $Image.Height, [System.Drawing.GraphicsUnit]::Pixel, $attributes)
        } finally {
            $attributes.Dispose()
        }
        $bitmap.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
    } finally {
        $graphics.Dispose()
        $bitmap.Dispose()
    }
}

foreach ($icon in $icons) {
    $image = [System.Drawing.Image]::FromFile((Join-Path $sourceRoot $icon.Source))
    try {
        $resourceName = if ($icon.Key -eq 'default') { 'ic_launcher' } else { 'ic_launcher_' + $icon.Key }
        foreach ($density in $densities) {
            $directory = Join-Path $resourceRoot ('mipmap-' + $density.Name)
            $null = New-Item -ItemType Directory -Path $directory -Force
            $legacySize = [int](48 * $density.Scale)
            Export-IconBitmap $image $legacySize $legacySize (Join-Path $directory ($resourceName + '.png'))
            # The complete supplied artwork fits inside the adaptive icon's 66dp safe area.
            Export-IconBitmap $image ([int](108 * $density.Scale)) ([int](66 * $density.Scale)) (Join-Path $directory ($resourceName + '_foreground.png'))
            if ($icon.Key -eq 'default') {
                Export-IconBitmap $image $legacySize $legacySize (Join-Path $directory 'ic_launcher_round.png')
            }
        }
        Write-Output ('Exported ' + $icon.Key + ' (' + $image.Width + 'x' + $image.Height + ' source)')
    } finally {
        $image.Dispose()
    }
}
