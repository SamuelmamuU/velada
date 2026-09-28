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

### 7. Animaciones y Modelos 3D de Buzones Fotorrealistas (Three.js)
* **Skill Dedicada**: [`threejs-animations`](./.agents/skills/threejs-animations/SKILL.md) que establece las directrices de físicas, optimización GPU móvil y ciclo de vida Three.js.
* **Componente 3D Principal**: [`Mailbox3DExperience.tsx`](./src/components/mailbox/Mailbox3DExperience.tsx)
* **3 Modelos Configurables por la Pareja**:
  - `clasico`: Domo abovedado esmaltado en azul satinado, herrajes de latón pulido, tirador de aro y poste de madera.
  - `vintage`: Cofre victoriano a dos aguas en hierro forjado oscuro con remaches 3D en bronce, candado artesanal con ojo de cerradura y poste de forja.
  - `moderno`: Bloque minimalista de bordes suaves satinados en pastel/crema, ranura dorada para cartas, banderín de corazón 3D magenta y poste de aluminio.
* **Físicas & Efectos Fotorrealistas**:
  - **Inclinación Interactiva 3D**: Respuesta al movimiento del puntero/ratón (`onPointerMove`) inclinando el buzón sutilmente para dar profundidad de campo.
  - **Puerta con Rebote Elástico**: Abatimiento mecánico de la puerta con micro-oscilación al abrir.
  - **Luz Cálida Cavidad Interior**: Encendido dinámico de un `PointLight` en el interior del buzón al abrirse.
  - **Emergencia de Sobres 3D**: Animación emergente de sobres 3D en WebGL saliendo físicamente del buzón hacia el usuario.
  - **Cero Bugs Visuales & Rendimiento**: Eliminación de *z-fighting* en la pintura de los nombres con `polygonOffset`, control de DPR para Android (Capacitor) y suspensión en segundo plano (`visibilitychange`).

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

