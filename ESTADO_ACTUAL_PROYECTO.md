# 💌 Nuestras Aventuras (Velada de Citas) — Estado Actual del Proyecto (v1.7)

> **Documento de Contexto y Continuidad**: Este archivo permite a cualquier agente de Antigravity o desarrollador retomar el trabajo inmediatamente con todo el contexto técnico y funcional del proyecto.

---

## 📌 Resumen General
* **Nombre de la App**: Nuestras Aventuras
* **Versión Actual**: `1.7.0` (Android VersionCode: `7`, VersionName: `"1.7"`)
* **Archivo APK de Producción**: [`NuestrasAventuras-v1.7.apk`](./NuestrasAventuras-v1.7.apk) (4.33 MB en la raíz)
* **Stack**: Next.js 14 (App Router), TypeScript, Tailwind CSS, Capacitor Android 8, MongoDB / Mongoose + Mappings en memoria offline, Leaflet + OpenStreetMap.

---

## ✨ Funcionalidades Clave Implementadas

### 1. Perfiles de Pareja y Avatares Entrelazados
* Componente: [`CoupleAvatarHeader.tsx`](./src/components/dashboard/CoupleAvatarHeader.tsx)
* Avatares protegidos contra deformaciones en móvil (`shrink-0`, `min-w-[52px] min-h-[52px] aspect-square rounded-full`).
* Corazón flotante interactivo en la unión de ambos círculos.
* Edición de perfil (nombre, avatar y contraseña) accesible al tocar el avatar o el botón de configuración.

### 2. Tema de Color Compartido
* Tanto el Novio como la Novia comparten exactamente la misma paleta de color en sus dashboards y calendarios.
* Endpoint: [`/api/pareja/tema`](./src/app/api/pareja/tema/route.ts) guarda en simultáneo `colorDashboardNovio` y `colorDashboardNovia`.
* Modal: [`ThemeSelectorModal.tsx`](./src/components/dashboard/ThemeSelectorModal.tsx) ("Color del Dashboard Compartido").

### 3. Fondo Vintage de Diario con 6 Polaroids Dinámicas
* Componente: [`TravelJournalBackground.tsx`](./src/components/ui/TravelJournalBackground.tsx)
* Eliminadas las fotos fijas anteriores. Ahora carga en tiempo real las **6 fotografías que la pareja sube**.
* Si tienen menos de 6 fotos subidas, muestra marcos decorativos con cámara invitando a subirlas.
* Se sincroniza automáticamente con el evento `velada_polaroids_updated`.

### 4. Álbum de Recuerdos Polaroid y Calendario Multi-Item
* Álbum: [`PolaroidMemoriesGallery.tsx`](./src/components/citas/PolaroidMemoriesGallery.tsx) muestra todas las polaroids independientes y las fotos de citas terminadas.
* Calendario: [`AdventureCalendar.tsx`](./src/components/dashboard/AdventureCalendar.tsx)
  * Si un día tiene múltiples elementos (varias citas, cita + polaroid o varias polaroids), al presionar el día se abre el modal **Detalle del Día**, mostrando todas las invitaciones con hora/lugar/botón "Ver Carta" y todas las polaroids en galería.
  * Muestra insignias (`💌`, `📷`) en los días con más de un elemento.

### 5. Barra Superior Sólida
* Componente: [`AppHeader.tsx`](./src/components/layout/AppHeader.tsx)
* Diseño con fondo blanco traslúcido (`bg-white/95 backdrop-blur-md rounded-[22px] border border-slate-200/90`) para evitar solapamientos con el fondo ilustrado.

### 6. Sistema de Notificaciones Nativas Android
* Archivo: [`mobileNative.ts`](./src/lib/mobileNative.ts) con soporte para `@capacitor/local-notifications`.
* Notificaciones automáticas:
  - Cuando llega una nueva carta.
  - Cuando la pareja se vincula con éxito.
  - Cuando una cita es aceptada o rechazada.

---

## 🛠️ Comandos de Desarrollo y Compilación

* **Servidor de desarrollo**:
  ```powershell
  npm run dev
  ```
* **Compilación de la web**:
  ```powershell
  npm run build
  ```
* **Compilación del APK de Android**:
  ```powershell
  npm run android:build
  ```
  *(Usa el script `./scripts/build-apk.ps1` que sincroniza Capacitor y compila con Gradle usando el JDK de Android Studio).*
