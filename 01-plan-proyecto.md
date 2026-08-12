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
- [ ] Entrega/presentación de la app a la novia 💛.

**Criterio de aceptación:** la aplicación está lista para uso real y estable.
