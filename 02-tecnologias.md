# Tecnologías a Utilizar

Stack recomendado priorizando: bajo costo (idealmente gratis, dado que es una app personal para 2 usuarios), rapidez de desarrollo y buen soporte de mapas.

---

## 1. Frontend

| Elemento | Recomendación | Alternativa |
|---|---|---|
| Framework | **React** con **Next.js** (App Router) | Vue 3 + Vite |
| Lenguaje | **TypeScript** | JavaScript |
| Estilos | **Tailwind CSS** | CSS Modules / styled-components |
| Componentes UI | **shadcn/ui** o **Material UI (MUI)** | Chakra UI |
| Manejo de formularios | **React Hook Form** + **Zod** (validación) | Formik + Yup |
| Cliente HTTP | **fetch** nativo o **Axios** | React Query / TanStack Query (recomendado para cache de citas) |
| Fechas/horas | **date-fns** o **dayjs** | Luxon |
| Mapas en el cliente | **Leaflet** (con `react-leaflet`) usando teselas de **OpenStreetMap** | Google Maps JavaScript API |

> **Nota sobre mapas:** Leaflet + OpenStreetMap es 100% gratuito y no requiere tarjeta de crédito ni API key, ideal para un proyecto personal. Google Maps es más pulido visualmente pero requiere facturación configurada (aunque tiene cuota gratuita mensual).

---

## 2. Backend

| Elemento | Recomendación | Alternativa |
|---|---|---|
| Runtime | **Node.js** | — |
| Framework | **Express.js** | Fastify / NestJS (si se quiere algo más robusto) |
| Lenguaje | **TypeScript** | JavaScript |
| Autenticación | **JWT** (jsonwebtoken) + **bcrypt** para hash de contraseñas | Auth con sesiones + cookies (express-session) |
| Validación de datos | **Zod** | Joi |
| ODM / acceso a datos | **Mongoose** (sobre MongoDB) | Prisma (soporta Mongo pero con menos madurez que Mongoose) |

> **Alternativa "todo en uno":** si se quiere reducir la cantidad de piezas a mantener, se puede usar directamente las **API Routes de Next.js** como backend (sin Express separado), ideal para un proyecto pequeño de 2 usuarios.

---

## 3. Base de datos

**Elegida: MongoDB**

| Elemento | Recomendación |
|---|---|
| Motor | **MongoDB** (NoSQL, documentos) |
| Hosting | **MongoDB Atlas** — clúster gratuito (M0), sin costo, con backups básicos incluidos |
| ODM (modelado) | **Mongoose** — define esquemas, validaciones y tipos sobre las colecciones |

**Colecciones principales:**

- `usuarios`: `{ _id, nombre, email, passwordHash, rol: "novio" | "novia" }`
- `citas`: `{ _id, nombre, descripcion, horario (Date), lugar: { direccion, lat, lng }, tematica, vestimentaRecomendada, estado, creadoPor (ref usuario), createdAt, updatedAt }`

MongoDB encaja bien aquí porque el documento de "cita" es autocontenido (no necesita joins complejos) y el esquema puede evolucionar fácilmente si más adelante se agregan campos como fotos o comentarios.

> Nota: como se usa Mongoose con esquemas definidos, se mantiene la validación de datos de forma similar a un ORM relacional, sin perder la flexibilidad de MongoDB.

---

## 4. Autenticación y roles

- **JWT** con roles embebidos en el token (`role: "novio" | "novia"`).
- Como solo hay 2 usuarios, se puede optar por:
  - Usuarios fijos creados por script de seed (sin registro público).
  - O usar **Firebase Auth** para simplificar login y recuperación de contraseña (compatible igualmente con MongoDB como base de datos de la app).

---

## 5. Mapas — detalle de proveedor

| Proveedor | Costo | Pros | Contras |
|---|---|---|---|
| **OpenStreetMap + Leaflet** | Gratis | Sin API key, sin límites de uso, ligero | Diseño visual más básico, geocodificación externa (Nominatim) puede ser más lenta |
| **Google Maps Platform** | Gratis hasta cierta cuota, luego de pago | Geocodificación muy precisa, diseño familiar (Google Maps) | Requiere tarjeta de crédito registrada para la API key |
| **Mapbox** | Gratis hasta cierta cuota | Muy buena estética, personalizable | Requiere registro y API key |

**Geocodificación** (convertir dirección de texto a coordenadas): **Nominatim** (OpenStreetMap, gratis) o **Google Geocoding API**.

---

## 6. Exportar a Google Calendar

| Elemento | Recomendación | Detalle |
|---|---|---|
| Formato de archivo | **.ics** (estándar iCalendar) | Compatible con Google Calendar, Apple Calendar, Outlook, etc. Se genera en el servidor o incluso en el cliente sin dependencias externas. |
| Librería (backend) | **ics** (npm) | Genera el archivo `.ics` a partir de los datos de la cita (nombre, descripción, horario, ubicación). |
| Alternativa directa | Enlace tipo `https://calendar.google.com/calendar/render?action=TEMPLATE&...` | Abre directamente Google Calendar con los datos precargados, sin necesidad de descargar archivo. Se puede ofrecer ambas opciones: "Descargar .ics" y "Agregar a Google Calendar". |

No requiere OAuth ni conexión a la cuenta de Google del usuario — ambas opciones (`.ics` o enlace directo) funcionan sin login adicional, ideal para mantener la app simple.

---

## 7. Diseño visual moderno

| Elemento | Recomendación | Detalle |
|---|---|---|
| Sistema de diseño | **Tailwind CSS** + **shadcn/ui** | Componentes accesibles, minimalistas y fácilmente personalizables (radios, sombras, espaciados consistentes). |
| Tipografía | Google Fonts — ej. **Poppins**, **Inter** o **Playfair Display** combinada con una sans-serif | Una fuente con carácter para títulos + una limpia para texto. |
| Paleta de color | Tonos cálidos personalizados (ej. rosados/durazno + acento oscuro) definidos como variables CSS/Tailwind config, no colores por defecto | Evita que se vea "genérico"; se define una identidad propia de la app. |
| Iconografía | **lucide-react** | Set de íconos moderno, coherente con shadcn/ui. |
| Micro-interacciones | **Framer Motion** | Animaciones sutiles al abrir una cita, transiciones entre vistas, efecto al marcar "próxima cita". |
| Modo oscuro (opcional) | Soporte vía Tailwind `dark:` | Detalle moderno adicional, no obligatorio. |

---

## 8. Notificaciones (opcional, Fase 8)

| Elemento | Recomendación |
|---|---|
| Email | **Resend** o **SendGrid** (planes gratuitos) |
| Notificaciones push web | **Web Push API** nativa o **OneSignal** (plan gratuito) |

---

## 9. Hosting y despliegue

| Componente | Recomendación | Costo |
|---|---|---|
| Frontend (Next.js) | **Vercel** | Gratis (plan hobby) |
| Backend (si es separado) | **Railway** o **Render** | Gratis con límites, o muy bajo costo |
| Base de datos | **MongoDB Atlas** (clúster M0) | Gratis (plan free) |
| Dominio (opcional) | Namecheap / Google Domains | ~$10–15 USD/año |

> Si se usa Next.js con API Routes y MongoDB Atlas, **todo el proyecto puede desplegarse gratis en Vercel + Atlas**, sin necesidad de backend separado.

---

## 10. Herramientas de desarrollo

- **Git + GitHub** — control de versiones.
- **ESLint + Prettier** — calidad y formato de código.
- **Postman** o **Thunder Client** — pruebas de API durante desarrollo.
- **Vitest** o **Jest** — pruebas unitarias.
- **Playwright** o **Cypress** — pruebas end-to-end (opcional).

---

## 11. Stack resumido recomendado (opción más simple y económica)

```
Frontend + Backend: Next.js (TypeScript) — App Router + API Routes
Base de datos:       MongoDB (Atlas, clúster gratuito M0)
ODM:                 Mongoose
Autenticación:       JWT propio
Estilos/Diseño:      Tailwind CSS + shadcn/ui + Framer Motion (diseño moderno)
Mapas:               Leaflet + OpenStreetMap (gratis, sin API key)
Calendario:          Generación de archivo .ics + enlace directo a Google Calendar
Hosting:             Vercel (frontend/backend) + MongoDB Atlas (DB)
```

Esta combinación permite desarrollar y desplegar la app completa **sin costos**, con un único repositorio y sin necesidad de mantener múltiples servidores.
