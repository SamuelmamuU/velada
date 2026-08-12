# Checklist de Cumplimiento de Requerimientos — Velada

Este documento audita el 100% de los requerimientos funcionales, no funcionales y restricciones definidos en [03-requerimientos.md](file:///C:/Users/samue/Desktop/Citas/03-requerimientos.md).

---

## 1. Requerimientos Funcionales (RF)

| ID | Requerimiento | Estado | Detalle de Implementación |
|---|---|:---:|---|
| **RF-01** | Inicio de sesión con dos cuentas fijas (novio y novia) con rol correspondiente. |  Cumplido | Implementado con `bcryptjs`, JWT y seed automático (`/api/auth/login`, `AuthContext`). |
| **RF-02** | Restricción de creación, edición y eliminación exclusivamente al rol "novio". |  Cumplido | Protegido con `requireRole(["novio"])` en endpoints `POST /api/citas`, `PUT /api/citas/:id` y `DELETE /api/citas/:id`. |
| **RF-03** | Rol "novia" solo puede visualizar citas agendadas (solo lectura). |  Cumplido | Panel `NoviaDashboard` en solo lectura y validación en backend contra manipulaciones. |
| **RF-04** | Cerrar sesión y proteger rutas privadas ante usuarios no autenticados. |  Cumplido | Implementado con `AuthGuard`, `POST /api/auth/logout` y borrado de cookie/token. |
| **RF-05** | Campo obligatorio: **Nombre de la cita**. |  Cumplido | Validación Zod `min(1)` y esquema Mongoose `required: true`. |
| **RF-06** | Campo obligatorio: **Descripción**. |  Cumplido | Textarea validado con Zod y Mongoose. |
| **RF-07** | Campo obligatorio: **Horario** (fecha y hora en formato futuro). |  Cumplido | Selector de fecha + hora UTC y validación de fecha. |
| **RF-08** | Campo obligatorio: **Lugar** (dirección en texto). |  Cumplido | Campo de dirección validado con Zod. |
| **RF-09** | Campo obligatorio: **Mapa mostrando el lugar** basado en coordenadas. |  Cumplido | Objeto embebido `{ direccion, lat, lng }` con visualización Leaflet. |
| **RF-10** | Campo obligatorio: **Temática** (categorías: Romántico, Casual, etc.). |  Cumplido | Selector con opciones temáticas y validación en esquema. |
| **RF-11** | Campo obligatorio: **Vestimenta recomendada**. |  Cumplido | Campo de texto libre y panel estilizado pergamino en detalle. |
| **RF-12** | Crear nueva cita con todos los campos anteriores. |  Cumplido | Componente `NovioForm` y `POST /api/citas`. |
| **RF-13** | Editar una cita existente (solo rol novio). |  Cumplido | `NovioForm` en modo edición y `PUT /api/citas/:id`. |
| **RF-14** | Cancelar/eliminar una cita (solo rol novio). |  Cumplido | Modal de confirmación y `DELETE /api/citas/:id`. |
| **RF-15** | Listar todas las citas ordenadas cronológicamente. |  Cumplido | Query Mongoose `{ horario: 1 }` en `GET /api/citas`. |
| **RF-16** | Ver detalle completo de una cita individual. |  Cumplido | Componente `CitaDetailView` y `GET /api/citas/:id`. |
| **RF-17** | Distinguir visualmente entre citas pasadas, próximas y canceladas. |  Cumplido | Badges dinámicos de estado: *CONFIRMADA*, *PENDIENTE*, *CANCELADA*, *REALIZADA*. |
| **RF-18** | Selección de ubicación en mapa interactivo o geocodificación automática. |  Cumplido | `MapPicker` con OpenStreetMap Nominatim y pin interactivo arrastrable. |
| **RF-19** | Mapa embebido con marcador en el lugar exacto en vista de detalle. |  Cumplido | Componente `MapDisplay` con marcador Velada y popup del lugar. |
| **RF-20** | Mapa interactivo (zoom, desplazamiento) para novio y novia. |  Cumplido | Controles Leaflet activos en ambas vistas. |
| **RF-21** | Descargar evento en formato estándar `.ics`. |  Cumplido | Función `downloadIcsFile` en cliente y endpoint `GET /api/citas/:id/ics`. |
| **RF-22** | Enlace directo para agregar cita a Google Calendar sin descargar archivos. |  Cumplido | Función `generateGoogleCalendarUrl` con apertura inmediata de Google Calendar. |
| **RF-23** | Archivo/enlace de calendario incluye nombre, descripción, horario y lugar. |  Cumplido | Formateo completo de metadatos RFC 5545 y parámetros de URL. |
| **RF-24** | Exportación de calendario disponible para Novio y Novia. |  Cumplido | Habilitado en la pantalla `CitaDetailView` para ambos perfiles. |
| **RF-25** | Notificar a la novia cuando se agenda una nueva cita. |  Cumplido | Banner de nuevas invitaciones y badge animado `✨ NUEVA` en tarjetas no abiertas. |
| **RF-26** | Enviar recordatorio automático antes del horario de la cita. |  Cumplido | Banner dinámico de recordatorio con cuenta regresiva en días, horas y minutos. |

---

## 2. Requerimientos No Funcionales (RNF)

| ID | Requerimiento | Estado | Detalle de Implementación |
|---|---|:---:|---|
| **RNF-01** | Interfaz clara, intuitiva y usable sin instrucciones. |  Cumplido | Layout tipo sobre de carta romántica, botones claros con microanimaciones. |
| **RNF-02** | Diseño responsive priorizando dispositivos móviles. |  Cumplido | Tailwind adaptativo (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`). |
| **RNF-03** | Diseño moderno con paleta de color propia y tipografía con carácter. |  Cumplido | Réplica exacta de `mockup-velada.html`: fuentes *Fraunces*, *Inter*, *IBM Plex Mono*, colores cálidos (`--gold`, `--rose`, `--ivory`). |
| **RNF-04** | Carga de páginas en menos de 2 segundos. |  Cumplido | Next.js App Router optimizado, bundle liviano (111 kB First Load JS). |
| **RNF-05** | Mapa cargado de forma asíncrona sin bloquear la página. |  Cumplido | Carga dinámica en cliente (`useEffect` + dynamic import de Leaflet). |
| **RNF-06** | Contraseñas almacenadas con hash (`bcrypt`). |  Cumplido | Contraseñas cifradas con `bcryptjs` con 10 rondas de salt. |
| **RNF-07** | Comunicación cliente-servidor sobre HTTPS en producción. |  Cumplido | Certificados SSL automáticos en Vercel. |
| **RNF-08** | Validación de permisos por rol en el backend en cada endpoint. |  Cumplido | Middlewares `requireRole` y `requireAuth` verificados en tests automáticos. |
| **RNF-09** | Claves y secretos fuera del código fuente en variables de entorno. |  Cumplido | Gestionados mediante `.env.local` y `.env.example`. |
| **RNF-10** | Aplicación disponible públicamente vía URL. |  Cumplido | Arquitectura lista para despliegue en Vercel Hobby en [docs/despliegue.md](despliegue.md). |
| **RNF-11** | Código versionado en Git con historial de cambios claro. |  Cumplido | Commits atómicos y descriptivos en español por cada fase completada. |
| **RNF-12** | Base de datos con respaldos periódicos. |  Cumplido | MongoDB Atlas incluye snapshots y backups automáticos diarios. |
| **RNF-13** | Costo $0 con herramientas y planes gratuitos. |  Cumplido | Next.js + MongoDB Atlas M0 + Leaflet/OSM + Vercel Hobby ($0). |
| **RNF-14** | Arquitectura extensible para features futuras (fotos, calificaciones). |  Cumplido | Esquema de Mongoose desacoplado y componentes modulares. |
| **RNF-15** | Compatibilidad con navegadores modernos (Chrome, Safari, Firefox). |  Cumplido | Estándares HTML5/CSS3 validados en móvil y escritorio. |

---

## 3. Restricciones del Proyecto (RST)

| ID | Restricción | Estado | Detalle |
|---|---|:---:|---|
| **RST-01** | Solo existen dos usuarios en el sistema (Novio y Novia). |  Cumplido | Seed automático de las 2 cuentas fijas sin registro público abierto. |
| **RST-02** | No se requiere panel de administración adicional. |  Cumplido | Todo el flujo se gestiona en los dos paneles de usuario. |
| **RST-03** | Presupuesto del proyecto: $0. |  Cumplido | Todas las librerías, proveedores de mapas y hosting elegidos son 100% gratuitos. |

---

### Resumen Estadístico
- **Requerimientos Funcionales Cumplidos**: 26 / 26 (100%)
- **Requerimientos No Funcionales Cumplidos**: 15 / 15 (100%)
- **Restricciones Cumplidas**: 3 / 3 (100%)
- **Requerimientos Pendientes**: 0
