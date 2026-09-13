# Script para generar todos los iconos de Android a partir de public/NuestrasAventurasLG.png
Add-Type -AssemblyName System.Drawing

$sourcePath = "C:\Users\samue\Desktop\Citas\public\NuestrasAventurasLG.png"
if (-not (Test-Path $sourcePath)) {
    Write-Error "No se encontro el archivo de logo original en $sourcePath"
    exit 1
}

$srcImg = [System.Drawing.Image]::FromFile($sourcePath)

$densities = @(
    @{ Name = "mipmap-mdpi";    LauncherSize = 48;  FgSize = 108 },
    @{ Name = "mipmap-hdpi";    LauncherSize = 72;  FgSize = 162 },
    @{ Name = "mipmap-xhdpi";   LauncherSize = 96;  FgSize = 216 },
    @{ Name = "mipmap-xxhdpi";  LauncherSize = 144; FgSize = 324 },
    @{ Name = "mipmap-xxxhdpi"; LauncherSize = 192; FgSize = 432 }
)

function Resize-And-Save($sourceImage, $width, $height, $destinationFile, $insetRatio = 1.0) {
    $bmp = New-Object System.Drawing.Bitmap $width, $height
    $graphics = [System.Drawing.Graphics]::FromImage($bmp)
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $graphics.Clear([System.Drawing.Color]::Transparent)

    if ($insetRatio -lt 1.0) {
        # Para foreground adaptativo: centrar el logo con zona segura
        $targetW = [int]($width * $insetRatio)
        $targetH = [int]($height * $insetRatio)
        $offsetX = [int](($width - $targetW) / 2)
        $offsetY = [int](($height - $targetH) / 2)
        $graphics.DrawImage($sourceImage, $offsetX, $offsetY, $targetW, $targetH)
    } else {
        $graphics.DrawImage($sourceImage, 0, 0, $width, $height)
    }

    $graphics.Dispose()
    $bmp.Save($destinationFile, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
}

$resBase = "C:\Users\samue\Desktop\Citas\android\app\src\main\res"

foreach ($d in $densities) {
    $dir = Join-Path $resBase $d.Name
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }

    $launcherFile = Join-Path $dir "ic_launcher.png"
    $roundFile    = Join-Path $dir "ic_launcher_round.png"
    $fgFile       = Join-Path $dir "ic_launcher_foreground.png"

    # Icono estándar
    Resize-And-Save $srcImg $d.LauncherSize $d.LauncherSize $launcherFile 1.0
    # Icono redondo
    Resize-And-Save $srcImg $d.LauncherSize $d.LauncherSize $roundFile 1.0
    # Icono adaptativo foreground (con margen de 72% para la zona segura de Android 8+)
    Resize-And-Save $srcImg $d.FgSize $d.FgSize $fgFile 0.72

    Write-Host "[OK] Iconos generados para $($d.Name)" -ForegroundColor Green
}

# Generar Splash Screen centrado
$splashFile = Join-Path $resBase "drawable\splash.png"
if (Test-Path (Split-Path $splashFile)) {
    $splashBmp = New-Object System.Drawing.Bitmap 480, 800
    $splashG = [System.Drawing.Graphics]::FromImage($splashBmp)
    $splashG.Clear([System.Drawing.ColorTranslator]::FromHtml("#F8FBFE"))
    $logoSize = 220
    $logoX = [int]((480 - $logoSize) / 2)
    $logoY = [int]((800 - $logoSize) / 2)
    $splashG.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $splashG.DrawImage($srcImg, $logoX, $logoY, $logoSize, $logoSize)
    $splashG.Dispose()
    $splashBmp.Save($splashFile, [System.Drawing.Imaging.ImageFormat]::Png)
    $splashBmp.Dispose()
    Write-Host "[OK] Splash screen generado con el logo oficial" -ForegroundColor Green
}

$srcImg.Dispose()
Write-Host "Todos los iconos y splash de Android han sido actualizados con el logo de Nuestras Aventuras." -ForegroundColor Cyan
