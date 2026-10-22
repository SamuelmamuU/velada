# 💌 Nuestras Aventuras (Velada de Citas) — Estado Actual del Proyecto (v1.8)

> **Documento de Contexto y Continuidad**: Este archivo permite a cualquier agente de Antigravity o desarrollador retomar el trabajo inmediatamente con todo el contexto técnico y funcional del proyecto.

---

## 📌 Resumen General
* **Nombre de la App**: Nuestras Aventuras
* **Versión Actual**: `1.8.0` (Android VersionCode: `8`, VersionName: `"1.8"`)
* **Stack**: Next.js 14 (App Router), Three.js, TypeScript, Tailwind CSS, Capacitor Android 8, MongoDB / Mongoose + Mappings en memoria offline, Leaflet + OpenStreetMap.

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

### 7. Animaciones y Modelos 3D de Buzones Fotorrealistas (Three.js - Reconstrucción Modular v1.7.1)
* **Skill Dedicada**: [`threejs-animations`](./.agents/skills/threejs-animations/SKILL.md) que establece las directrices de físicas, optimización GPU móvil y ciclo de vida Three.js.
* **Componente 3D Principal**: [`Mailbox3DExperience.tsx`](./src/components/mailbox/Mailbox3DExperience.tsx) desacoplado de la geometría WebGL mediante la arquitectura modular en `src/components/mailbox/three/`:
  - [`mailboxModel.ts`](./src/components/mailbox/three/mailboxModel.ts): 3 modelos físicos con siluetas y geometrías volumétricas 100% sólidas y estancas (`clasico`, `vintage`, `moderno`), sin caras faltantes ni piezas flotando. Banderín en `-X` y rótulo caligráfico de la pareja en `+X`.
  - [`envelopeModel.ts`](./src/components/mailbox/three/envelopeModel.ts): Sobre 3D cerrado con sello de cera en relieve 3D, textura HD en pergamino con título de la cita centrado y fechas de creación y cita en las esquinas inferiores (`📅 Envío: ...`, `✨ Cita: ...`), más solapa triangular que se desdobla al tocarlo.
  - [`MailboxScene.ts`](./src/components/mailbox/three/MailboxScene.ts): Gestor de escena con ciclo de vida único (no recrea el contexto WebGL al cambiar de etapa), encuadre responsive adaptativo según relación de aspecto vertical/horizontal, cinemática suave con `Clock` delta, discriminación de arrastre vs. tap (umbral de 7 px) y apertura física lógica de la puerta cayendo hacia afuera (+X ~95°) con micro-rebote elástico.
* **Navegación Multi-Carta**: Controles táctiles integrados (‹ › y contador `1 de N`) para hojear cartas pendientes en 3D.
* **Etiqueta Adhesiva Lateral CSS3D**: Inyectada en el costado `+X` para inicio de sesión y registro interactivo directo sobre el buzón, completamente adaptada a pantallas móviles y de escritorio.
  - **Luz Cálida Cavidad Interior**: Encendido dinámico de un `PointLight` en el interior del buzón al abrirse.
  - **Emergencia de Sobres 3D**: Animación emergente de sobres 3D en WebGL saliendo físicamente del buzón hacia el usuario.
  - **Cero Bugs Visuales & Rendimiento**: Eliminación de *z-fighting* en la pintura de los nombres con `polygonOffset`, control de DPR para Android (Capacitor) y suspensión en segundo plano (`visibilitychange`).

### 8. Widgets Móviles y Animaciones 3D de Estado (Three.js v1.8)
* **Widget Móvil de Buzón 3D**: [`MailboxMobileWidget.tsx`](./src/components/widgets/MailboxMobileWidget.tsx) con escena especializada [`MailboxWidgetScene.ts`](./src/components/widgets/three/MailboxWidgetScene.ts).
* **3 Animaciones de Estado en Three.js**:
  1. **Llegada de Carta (`arriving`)**: Sobre 3D volando en arco Bézier con estela de partículas doradas, apertura suave de puerta, elevación de banderín e inserción en el buzón.
  2. **Buzón Vaciado (`emptied`)**: Cierre ordenado de puerta, banderín en reposo y halo de partículas ascendentes doradas "Al día".
  3. **Inactividad Prolongada / Desierto (`desert_tumbleweed`)**: Iluminación dorada de atardecer desértico y un arbusto rodante 3D ([`TumbleweedModel.ts`](./src/components/widgets/three/TumbleweedModel.ts)) rodando y rebotando frente al buzón con viento y partículas de polvo.
* **Widget Móvil de Calendario**: [`CalendarMobileWidget.tsx`](./src/components/widgets/CalendarMobileWidget.tsx) con cuadrícula mensual, moneda 3D interactiva del día en Three.js y tarjeta de próxima cita.
* **Rutas Standalone para Webviews / Widgets**: `/widget/buzon` y `/widget/calendario`.
* **Centro de Widgets Móviles**: [`WidgetsModal.tsx`](./src/components/widgets/WidgetsModal.tsx) accesible desde ambos dashboards mediante el botón "Widgets" en la barra de avatares entrelazados.

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

