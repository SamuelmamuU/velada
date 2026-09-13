# Script automatizado para compilar el APK de Android de Nuestras Aventuras (Velada)
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  Compilando APK de Android: Nuestras Aventuras           " -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Configurar JAVA_HOME si no esta en las variables de entorno
$jbrPath = "C:\Program Files\Android\Android Studio\jbr"
if (Test-Path "$jbrPath\bin\java.exe") {
    $env:JAVA_HOME = $jbrPath
    $env:Path = "$jbrPath\bin;" + $env:Path
    Write-Host "[OK] Usando JDK de Android Studio: $jbrPath" -ForegroundColor Green
}

# 2. Sincronizar assets con Capacitor
Write-Host ""
Write-Host "[1/3] Sincronizando plataforma Android con Capacitor..." -ForegroundColor Cyan
npx cap sync android

# 3. Compilar APK con Gradle
Write-Host ""
Write-Host "[2/3] Compilando APK nativo con Gradle..." -ForegroundColor Cyan
Push-Location android
try {
    .\gradlew.bat assembleDebug
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Error durante la compilacion de Gradle."
        exit $LASTEXITCODE
    }
} finally {
    Pop-Location
}

# 4. Copiar APK a la raiz del proyecto para facil acceso
$apkSource = "android\app\build\outputs\apk\debug\app-debug.apk"
$apkDest = "NuestrasAventuras-v1.1.apk"

if (Test-Path $apkSource) {
    Copy-Item $apkSource -Destination $apkDest -Force
    Copy-Item $apkSource -Destination "NuestrasAventuras-v1.0.apk" -Force
    $fileItem = Get-Item $apkDest
    $sizeMb = [math]::Round(($fileItem.Length / 1MB), 2)
    Write-Host ""
    Write-Host "==========================================================" -ForegroundColor Green
    Write-Host "  APK COMPILADO EXITOSAMENTE!                             " -ForegroundColor Green
    Write-Host "==========================================================" -ForegroundColor Green
    Write-Host ("  Archivo: " + $apkDest + " (" + $sizeMb + " MB)") -ForegroundColor White
    Write-Host ("  Ruta:    " + $fileItem.FullName) -ForegroundColor White
    Write-Host "  Listo para instalar en cualquier telefono Android ($0)." -ForegroundColor Cyan
    Write-Host "==========================================================" -ForegroundColor Green
} else {
    Write-Error "No se encontro el APK generado en $apkSource"
}
