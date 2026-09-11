# Plan de Proyecto — App de Citas para Pareja

> Aplicación web con dos perfiles: **Novio** (crea y agenda citas) y **Novia** (visualiza citas agendadas).

Este documento está redactado para ser ejecutado por un agente de IA (ej. Claude Code) de forma secuencial, fase por fase. Cada tarea es atómica y verificable.

---

## Fase 0 — Preparación del entorno

**Objetivo:** dejar el proyecto listo para empezar a programar.

- [ ] Crear repositorio Git (monorepo o carpetas `frontend/` y `backend/`).
- [ ] Definir estructura de carpetas del proyecto.
- [ ] Inicializar `package.json` en frontend y backend.
- [ ] Configurar linter y formateador (ESLint + Prettier).
- [ ] Configurar variables de entorno (`.env.example`) para: URL de base de datos, claves de mapa, secretos de sesión/JWT.
- [ ] Configurar `.gitignore` (node_modules, .env, dist, etc.).
- [ ] Elegir y documentar el gestor de paquetes (npm/pnpm/yarn).
- [ ] Crear README inicial con instrucciones de instalación.

**Criterio de aceptación:** el proyecto corre localmente con "Hello World" en frontend y backend, y ambos se comunican entre sí (ping/pong de prueba).

---

## Fase 1 — Diseño de arquitectura y modelo de datos

**Objetivo:** definir cómo se comunican las piezas del sistema antes de programar features.

- [ ] Diagramar arquitectura general (cliente ↔ API ↔ base de datos ↔ servicio de mapas).
- [ ] Definir el modelo de datos en MongoDB (colecciones vía Mongoose):
  - **usuarios**: `_id`, nombre, rol (`novio` | `novia`), email, passwordHash.
  - **citas**: `_id`, nombre, descripción, horario (Date), lugar `{ direccion, lat, lng }`, temática, vestimentaRecomendada, estado (pendiente/confirmada/cancelada), creadoPor (ref a `usuarios._id`), createdAt, updatedAt.
- [ ] Definir los esquemas de Mongoose (`UsuarioSchema`, `CitaSchema`) con sus validaciones (campos requeridos, tipos, enums para `rol` y `estado`).
- [ ] Crear índices necesarios en MongoDB Atlas (ej. índice por `horario` para ordenar citas, índice por `creadoPor`).
- [ ] Definir el contrato de la API (endpoints REST, verbos, payloads esperados) — documentar en un archivo `api-contract.md`.
- [ ] Definir estrategia de autenticación y autorización por rol (quién puede crear, quién solo puede ver).
- [ ] Definir estrategia de manejo de fechas/horarios y zona horaria.

**Criterio de aceptación:** existe un documento de arquitectura y un esquema de base de datos aprobado antes de escribir código de negocio.

---

## Fase 2 — Backend: autenticación y usuarios

- [ ] Configurar conexión a MongoDB Atlas (string de conexión en variable de entorno).
- [ ] Crear el modelo de Mongoose `Usuario` con rol.
- [ ] Endpoint de registro (o script de seed, ya que solo hay 2 usuarios fijos: novio y novia).
- [ ] Endpoint de login con generación de token de sesión (JWT o sesión con cookie).
- [ ] Middleware de autenticación (verifica token válido).
- [ ] Middleware de autorización por rol (bloquea creación de citas si el rol no es `novio`).
- [ ] Endpoint para obtener el perfil del usuario autenticado (`/me`).
- [ ] Pruebas manuales/automatizadas de login, token inválido y acceso denegado por rol.

**Criterio de aceptación:** solo el usuario con rol `novio` puede acceder a rutas de creación; ambos roles pueden acceder a rutas de lectura.

---

## Fase 3 — Backend: CRUD de citas

- [ ] Endpoint `POST /citas` — crear cita (solo rol `novio`). Recibe: nombre, descripción, horario, lugar, coordenadas (lat/long), temática, vestimenta recomendada.
- [ ] Endpoint `GET /citas` — listar todas las citas (ambos roles).
- [ ] Endpoint `GET /citas/:id` — ver detalle de una cita.
- [ ] Endpoint `PUT /citas/:id` — editar cita (solo rol `novio`).
- [ ] Endpoint `DELETE /citas/:id` — cancelar/eliminar cita (solo rol `novio`).
- [ ] Validación de datos de entrada (campos requeridos, formato de fecha, coordenadas válidas).
- [ ] Manejo de errores estandarizado (404, 401, 403, 400, 500).
- [ ] Endpoint de geocodificación auxiliar (si el novio escribe una dirección en texto, convertirla a coordenadas) o alternativamente input manual de coordenadas/selección en mapa.

**Criterio de aceptación:** se puede crear, listar, editar y eliminar una cita completa vía API, respetando permisos por rol.

---

## Fase 4 — Frontend: estructura base y autenticación

- [ ] Inicializar proyecto frontend (framework elegido en `02-tecnologias.md`).
- [ ] Configurar enrutamiento (rutas públicas vs. privadas).
- [ ] Pantalla de login.
- [ ] Manejo de sesión en el cliente (guardar token, cerrar sesión).
- [ ] Guard de rutas según rol (redirigir si el rol no tiene permiso).
- [ ] Configurar el sistema de diseño moderno: Tailwind config con paleta de color personalizada, tipografía (Google Fonts), componentes base de shadcn/ui.
- [ ] Layout base compartido (header, navegación, footer) con estética "de pareja" (colores cálidos, tipografía con carácter, espaciados consistentes).
- [ ] Configurar Framer Motion para transiciones y micro-interacciones básicas (entrada de tarjetas, cambios de vista).

**Criterio de aceptación:** el usuario puede iniciar sesión y ser redirigido a la vista correspondiente a su rol.

---

## Fase 5 — Frontend: vista del Novio (creación y gestión de citas)

- [ ] Formulario de creación de cita con todos los campos:
  - Nombre de la cita
  - Descripción
  - Fecha y hora
  - Lugar (dirección en texto)
  - Selector de ubicación en mapa (para fijar lat/long)
  - Temática
  - Vestimenta recomendada
- [ ] Validación de formulario en cliente (campos obligatorios, fecha futura, etc.).
- [ ] Vista de lista de citas creadas, con estado (pendiente/confirmada/cancelada).
- [ ] Vista de detalle de cita con opción de editar.
- [ ] Opción de eliminar/cancelar cita con confirmación.
- [ ] Feedback visual de éxito/error al guardar (toast o mensaje).

**Criterio de aceptación:** el novio puede crear una cita completa desde el formulario y verla reflejada inmediatamente en su lista.

---

## Fase 6 — Frontend: vista de la Novia (visualización de citas)

- [ ] Vista de lista/calendario de citas agendadas (solo lectura).
- [ ] Vista de detalle de cita mostrando: nombre, descripción, horario, lugar, temática, vestimenta recomendada.
- [ ] Integración de mapa embebido mostrando el lugar exacto de la cita.
- [ ] Botón **"Agregar a Google Calendar"** en la pantalla de detalle del evento, con dos opciones:
  - Enlace directo que abre Google Calendar con los datos precargados (nombre, descripción, horario, ubicación).
  - Botón "Descargar .ics" que genera y descarga el archivo de calendario (compatible también con Apple Calendar/Outlook).
- [ ] Endpoint backend (o función serverless) `GET /citas/:id/calendario.ics` que genera el archivo `.ics` a partir de los datos de la cita.
- [ ] Indicador visual de "próxima cita" o cuenta regresiva.
- [ ] Diseño responsive para verlo cómodamente desde el celular.
- [ ] (Opcional) Notificación visual de citas nuevas no vistas.

**Criterio de aceptación:** la novia puede ver todas sus citas agendadas con el mapa del lugar renderizado correctamente, sin poder editar ni crear, y puede agregar cualquier cita a su Google Calendar desde la pantalla de detalle en un clic.

---

## Fase 7 — Integración de mapas

- [ ] Elegir proveedor de mapas (ver `02-tecnologias.md`).
- [ ] Configurar API key / proveedor.
- [ ] Componente reutilizable de mapa que reciba lat/long y muestre un marcador.
- [ ] Integrar selector de ubicación en el formulario de creación (Fase 5).
- [ ] Integrar mapa de solo visualización en el detalle de cita (Fase 6).
- [ ] Manejo de error si la ubicación no se puede geocodificar o el mapa no carga.

**Criterio de aceptación:** al crear una cita, el mapa muestra correctamente el lugar seleccionado en ambas vistas (novio y novia).

---

## Fase 8 — Notificaciones (opcional pero recomendado)

- [ ] Definir canal de notificación (email, push web, o simplemente indicador en la app).
- [ ] Notificar a la novia cuando se crea una nueva cita.
- [ ] Recordatorio automático X horas antes de la cita.

**Criterio de aceptación:** la novia recibe un aviso cuando el novio agenda una nueva cita.

---

## Fase 9 — Pruebas

- [ ] Pruebas unitarias de backend (modelos, validaciones, permisos por rol).
- [ ] Pruebas de integración de endpoints (API).
- [ ] Pruebas de UI críticas (login, creación de cita, visualización de cita).
- [ ] Pruebas manuales de extremo a extremo: flujo completo novio crea → novia visualiza.
- [ ] Revisión de casos límite (fecha pasada, campos vacíos, sin conexión a internet, mapa sin permisos de ubicación).

**Criterio de aceptación:** el flujo completo funciona sin errores críticos en los casos de prueba definidos.

---

## Fase 10 — Despliegue

- [ ] Elegir hosting de frontend y backend (ver `02-tecnologias.md`).
- [ ] Configurar variables de entorno en producción.
- [ ] Configurar base de datos en producción.
- [ ] Configurar dominio (opcional).
- [ ] Desplegar backend.
- [ ] Desplegar frontend.
- [ ] Probar la app en producción con los dos usuarios reales.
- [ ] Configurar HTTPS.

**Criterio de aceptación:** la app es accesible públicamente vía URL y ambos usuarios pueden usarla desde sus celulares.

---

## Fase 11 — Pulido final y entrega

- [ ] Revisión visual/UX general (detalles de diseño, animaciones sutiles, mensajes cálidos).
- [ ] Optimización de rendimiento (carga de imágenes, mapas, tiempos de respuesta).
- [ ] Documentación final de uso para ambos usuarios.
- [ ] Backup de la base de datos.
- [ ] Entrega/presentación de la app a la pareja.

**Criterio de aceptación:** la aplicación está lista para uso real y estable.

---

## Fase 12 — Creación de perfiles y vinculación de parejas por Código QR con sincronización

**Objetivo:** Permitir el registro de múltiples usuarios/parejas, generación y escaneo de códigos QR para emparejamiento, y sincronización de citas y buzón exclusivo entre las parejas conectadas.

- [x] **Modelo de datos y esquemas de vinculación**:
  - Ampliar `Usuario`: añadir campos `parejaId` (referencia a la pareja o usuario vinculado), `codigoVinculacion` (código alfanumérico único para emparejamiento manual o QR), `avatarUrl` y timestamps de conexión.
  - Crear modelo `Pareja` (o relación bidireccional en `Usuario`): `_id`, `codigoVinculacion`, `miembros` (`novioId`, `noviaId`), `estado` (`esperando_pareja` | `conectados`), `fechaVinculacion`.
  - Adaptar `Cita`: asociar cada cita a `parejaId` para garantizar aislamiento y privacidad entre distintas parejas en la plataforma.
- [x] **Backend: Endpoints de perfiles y emparejamiento**:
  - `POST /api/auth/register` — Registro y creación de nuevo perfil de usuario (nombre, email, contraseña, rol `novio` o `novia`).
  - `GET /api/pareja/codigo` — Obtener el código de vinculación y los datos para generar el código QR de la cuenta.
  - `POST /api/pareja/vincular` — Vincular dos perfiles mediante el escaneo del código QR o el ingreso manual del código de invitación.
  - `GET /api/pareja/estado` — Consultar el estado actual de sincronización con la pareja (datos del novio/novia vinculado, fecha de conexión, estado activo).
  - `POST /api/pareja/desvincular` — Opción de desvincular pareja en caso de reinicio o cambio de cuenta.
- [x] **Generación y renderizado de Código QR**:
  - Integrar librería de generación de códigos QR (vectorial SVG/Canvas con diseño armónico acorde al estilo postal).
  - Código QR dinámico que contiene el código seguro de vinculación o URL profunda (`/vincular?codigo=...`).
  - Modal/tarjeta postal estilizada para mostrar el QR propio con botón para copiar el código alfanumérico de respaldo.
- [x] **Escaneo y lectura de Código QR / Entrada manual**:
  - Lector de código QR utilizando la cámara del dispositivo móvil/escritorio con permisos dinámicos y fallback accesible.
  - Formulario alternativo de ingreso manual de código para casos donde la cámara no esté disponible o se comparta a distancia.
  - Animación de confirmación de conexión ("Pareja conectada con éxito").
- [x] **Sincronización de correspondencia y buzón**:
  - Modificar las consultas de `GET /api/citas` y `POST /api/citas` para filtrar y sincronizar exclusivamente las citas de la pareja conectada.
  - Vista adaptativa en el buzón y header que refleje el nombre real de la pareja vinculada (reemplazando nombres genéricos por los perfiles activos).
  - Estado de espera informativo cuando un usuario aún no ha vinculado su cuenta ("Esperando a que tu pareja escanee tu código QR").


**Criterio de aceptación:** Un usuario nuevo puede registrarse, generar su código QR, su pareja puede escanearlo desde su propio dispositivo y ambas cuentas quedan sincronizadas en tiempo real, compartiendo sus cartas, citas y recuerdos en su buzón común.

---

## Fase 13 — Buzón 3D Interactivo, Login Lateral Cinemático y Flujo de Cartas Flotantes

**Objetivo:** Crear una experiencia inmersiva tridimensional (Three.js / CSS 3D y Framer Motion) donde el buzón de correos es el protagonista visual de la aplicación: el login se sitúa en su cara lateral con los nombres de Samuel & Diana en pintura hecha a mano, la cámara rota al frente tras autenticarse, la puerta se abre para liberar sobres de cartas flotantes en 3D, y al abrir/responder una carta se guarda con animación hacia el tablero mientras el buzón se repliega elegantemente a un costado.

- [x] **Buzón 3D y Login en Cara Lateral**:
  - Construir el modelo/escena del Buzón 3D con geometría detallada (cuerpo cilíndrico/abovedado pastel, puerta frontal abatible con pestillo, banderín rojo levantado, poste de madera rústico y cara lateral).
  - Embeber el formulario interactivo de inicio de sesión/registro directamente sobre la cara lateral del buzón 3D como una placa integrada al buzón.
  - En la parte superior de dicho costado del buzón, renderizar los nombres "Samuel & Diana" con efecto de pintura hecha a mano (brochazo rústico, trazo caligráfico artesanal y relieve de pintura sobre madera/metal).
- [x] **Cinemática de Transición Post-Login**:
  - Al autenticarse exitosamente (o al ingresar como novia/novio), ejecutar una animación fluida de cámara/escena: el buzón se aleja ligeramente en perspectiva y rota con suavidad desde la vista lateral hasta quedar perfectamente de frente a la cámara, encuadrando la puerta y el banderín.
- [x] **Apertura de Puerta 3D y Cartas Flotantes**:
  - Interacción táctil/click sobre la puerta del buzón: la puerta se abre oscilando hacia abajo con física suave y sonido/vibración visual.
  - Al abrirse la puerta, emergen las cartas sin leer (pendientes de respuesta) en sobres tridimensionales auténticos con sello de cera.
  - Los sobres se quedan flotando suavemente en levitación (idle floating bobbing) en el espacio frente a la puerta del buzón.
- [x] **Apertura de Sobre y Despliegue de 3 Pestañas**:
  - Al hacer click en cualquiera de los sobres flotantes, el sobre se abre con animación expansiva y despliega la experiencia completa de 3 hojas sobrepuestas:
    1. **Carta**: Invitación manuscrita con dedicatoria y botones de respuesta.
    2. **Mapa**: Ubicación geográfica con mapa interactivo y coordenadas.
    3. **Foto Polaroid**: Recuerdo fotográfico con marco Polaroid artesanal.
  - Soporte de esquina doblada (dog-ear) para alternar entre las 3 hojas.
- [x] **Animación de Cierre, Guardado y Minimización del Buzón**:
  - Al contestar o cerrar la carta, el sobre se pliega y se guarda con animación de trayectoria hacia el tablero principal.
  - El buzón 3D se desplaza fluidamente desde el centro hacia una esquina/costado de la pantalla mientras reduce su escala a un widget miniatura interactivo.
  - El tablero principal (con la cuadrícula de sobres y el muro de polaroids) queda visible y accesible.
  - Al hacer click en el buzón miniatura del costado, vuelve a expandirse al centro para reabrir cartas o revisar correspondencia.

**Criterio de aceptación:** El login opera sobre la cara lateral con "Samuel & Diana" pintados; tras el login, la cámara rota al frente; al tocar la puerta se abre y flotan los sobres en 3D; al abrir un sobre se accede a las 3 hojas (Carta/Mapa/Polaroid); al cerrar, la carta se archiva en el tablero y el buzón se repliega al costado como widget miniatura.
