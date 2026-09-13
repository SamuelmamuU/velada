# 📱 Guía de Instalación y Uso — Aplicación Android (APK)
## *Nuestras Aventuras (Planesito de Vida 💌)*

> **Archivo APK generado:** `NuestrasAventuras-v1.0.apk` (Tamaño: ~4.0 MB)  
> **Ubicación en tu equipo:** `C:\Users\samue\Desktop\Citas\NuestrasAventuras-v1.0.apk`  
> **Costo:** **$0.00 USD (Sin pagar cuentas de Google Play Store)**

---

## 🚀 1. Cómo instalar el APK en cualquier teléfono Android

Puedes instalar la aplicación en el teléfono del **Novio (Samuel)** y de la **Novia (Diana)** siguiendo estos sencillos pasos:

### Paso 1: Enviar el archivo APK al celular
Elige cualquiera de estos métodos gratuitos:
- **WhatsApp / Telegram**: Envía el archivo `NuestrasAventuras-v1.0.apk` como documento a tu chat con tu pareja.
- **Google Drive / Dropbox**: Sube el APK a tu Drive y descárgalo en los teléfonos.
- **Cable USB**: Conecta el celular a la computadora y copia el archivo a la carpeta *Descargas* (*Download*).

### Paso 2: Abrir e instalar en el celular
1. En el teléfono Android, pulsa sobre el archivo `NuestrasAventuras-v1.0.apk`.
2. Si es la primera vez que instalas un archivo fuera de la Play Store, Android mostrará un aviso de seguridad estándar:
   > *"Por tu seguridad, tu teléfono no tiene permitido instalar apps desconocidas de esta fuente"*.
3. Pulsa en **Ajustes / Configuración**.
4. Activa la casilla **"Permitir desde esta fuente"** (o *"Confiar en esta app"*).
5. Regresa y pulsa **"Instalar"**.
6. En segundos aparecerá el icono de **Nuestras Aventuras** en el menú de aplicaciones de tu teléfono.

---

## 🌐 2. Conectividad con el Servidor Backend

La aplicación móvil se conecta de forma segura mediante HTTPS / HTTP a tu servidor backend de Next.js (con MongoDB Atlas):

### Opción A: Servidor en Producción (Vercel) — *Recomendada para uso diario*
Si despliegas la web en Vercel (100% gratuito según [docs/despliegue.md](despliegue.md)):
- La app móvil se conectará a `https://tu-proyecto.vercel.app`.
- Tanto el novio como la novia tendrán acceso en tiempo real desde cualquier lugar con datos móviles o Wi-Fi.

### Opción B: Servidor Local (Para pruebas en la misma red Wi-Fi de casa)
1. En tu computadora, obtén tu IP local de Wi-Fi abriendo PowerShell y escribiendo: `ipconfig` (ejemplo: `192.168.1.50`).
2. Inicia el servidor con:
   ```bash
   npm run dev -- -H 0.0.0.0
   ```
3. En `capacitor.config.ts`, define la URL o variable de entorno:
   ```ts
   url: "http://192.168.1.50:3000"
   ```
4. Recompila con: `npm run android:build`.

---

## 💌 3. Funcionalidades Nativas en Android

| Funcionalidad Nativa | Cómo funciona en el teléfono |
|---|---|
| **Buzón 3D con Three.js** | Optimizado para GPU móvil con antialiasing y límite de DPR para no consumir batería. Se suspende automáticamente al apagar la pantalla o minimizar la app. |
| **Escáner QR con Cámara** | Al tocar *"Vincular Pareja"* > *"Escanear QR"*, Android solicitará permiso de cámara. Apunta la cámara al código de tu pareja para sincronizarse al instante con retroalimentación háptica. |
| **Vibración Háptica** | Vibraciones sutiles al tocar botones, abrir sobres de cartas y confirmar emparejamiento. |
| **Notificaciones Locales** | El sistema Android programa alertas nativas 24 horas y 2 horas antes de cada cita agendada, avisando vestimenta y lugar. |
| **Exportación a Calendario** | Botones para descargar `.ics` o abrir directamente el evento en la app nativa de Google Calendar del celular. |
| **Zonas Seguras (*Safe Areas*)** | La interfaz respeta automáticamente la barra de estado superior, el recorte de la cámara (*Notch*) y la barra gestual de navegación inferior de Android. |

---

## 🛠️ 4. Comandos para Desarrolladores

Si realizas cambios en el código y deseas generar un nuevo APK:

```bash
# 1. Compilar y sincronizar automáticamente el APK
npm run android:build

# 2. Solo sincronizar cambios web hacia el proyecto Android
npm run android:sync

# 3. Abrir el proyecto en Android Studio (si lo tienes instalado)
npm run android:open
```

El nuevo archivo APK siempre se colocará automáticamente en la raíz:  
`C:\Users\samue\Desktop\Citas\NuestrasAventuras-v1.0.apk`
