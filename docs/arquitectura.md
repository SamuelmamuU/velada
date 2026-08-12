# Arquitectura del Sistema — Velada

## 1. Diagrama General de Arquitectura

```text
┌────────────────────────────────────────────────────────────────────────┐
│                          NAVEGADOR / CLIENTE                           │
│  (Novio / Novia en Móvil o Desktop)                                    │
│                                                                        │
│  ┌───────────────────────┐   ┌───────────────────┐   ┌───────────────┐ │
│  │ Vista Novio           │   │ Vista Novia       │   │ Autenticación │ │
│  │ (CRUD Citas + Mapa)   │   │ (Lectura + .ics)  │   │ (JWT Session) │ │
│  └───────────┬───────────┘   └─────────┬─────────┘   └───────┬───────┘ │
└──────────────┼─────────────────────────┼─────────────────────┼─────────┘
               │                         │                     │
               ▼                         ▼                     ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        NEXT.JS BACKEND (API)                           │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Middleware de Auth & Roles (/api/*)                              │  │
│  │ - Verificación de token JWT Bearer / Cookie                      │  │
│  │ - Control de acceso basado en rol: novio vs novia                │  │
│  └──────────────────────────────────┬───────────────────────────────┘  │
│                                     │                                  │
│  ┌──────────────────────────────────┴───────────────────────────────┐  │
│  │ Endpoints REST:                                                  │  │
│  │ • POST /api/auth/login    • GET /api/citas                       │  │
│  │ • POST /api/auth/seed     • POST /api/citas      (solo novio)    │  │
│  │ • GET  /api/auth/me       • PUT /api/citas/:id   (solo novio)    │  │
│  │ • GET  /api/citas/:id     • DELETE /api/citas/:id (solo novio)   │  │
│  │ • GET  /api/citas/:id/ics • GET /api/geocode                     │  │
│  └──────────────────────────────────┬───────────────────────────────┘  │
└─────────────────────────────────────┼──────────────────────────────────┘
                                      │
        ┌─────────────────────────────┼─────────────────────────────┐
        ▼                             ▼                             ▼
┌───────────────┐             ┌───────────────┐             ┌───────────────┐
│ MONGODB ATLAS │             │ OPENSTREETMAP │             │ EXPORTACIÓN   │
│   (Mongoose)  │             │   + LEAFLET   │             │  CALENDARIO   │
│ • usuarios    │             │ • Render Mapa │             │ • Archivo .ics│
│ • citas       │             │ • Nominatim   │             │ • Google Cal  │
└───────────────┘             └───────────────┘             └───────────────┘
```

---

## 2. Modelo de Datos (MongoDB / Mongoose)

### Colección: `usuarios`
Representa los dos únicos perfiles autorizados en el sistema.

```typescript
interface IUsuario {
  _id: ObjectId;
  nombre: string;              // "Novio" | "Novia"
  email: string;               // Único, normalizado a minúsculas
  passwordHash: string;        // Hash bcrypt
  rol: "novio" | "novia";      // Rol inmutable para autorización
  createdAt: Date;
  updatedAt: Date;
}
```

**Índices:**
- `{ email: 1 }` (Unique)

---

### Colección: `citas`
Representa cada cita o plan romántico creado por el novio.

```typescript
interface ILugar {
  direccion: string;           // Dirección en texto (ej. "Terraza San Pedro, Monterrey")
  lat: number;                 // Latitud geográfica (-90 a 90)
  lng: number;                 // Longitud geográfica (-180 a 180)
}

interface ICita {
  _id: ObjectId;
  nombre: string;              // Nombre corto (ej. "Cena bajo las luces")
  descripcion: string;         // Descripción detallada del plan
  horario: Date;               // Fecha y hora en formato UTC
  lugar: ILugar;               // Objeto embebido con dirección y coordenadas
  tematica: "Romántico" | "Casual" | "Aventura" | "Cultural" | "Formal" | string;
  vestimentaRecomendada: string;// Sugerencia de vestimenta (ej. "Elegante casual")
  estado: "pendiente" | "confirmada" | "cancelada"; // Estado de la cita
  creadoPor: ObjectId;         // Referencia a usuarios._id
  createdAt: Date;
  updatedAt: Date;
}
```

**Índices:**
- `{ horario: 1 }` — Permite ordenar cronológicamente de forma óptima (próximas citas vs pasadas).
- `{ creadoPor: 1 }` — Permite filtrar citas por creador.
- `{ estado: 1 }` — Permite filtros por estado.

---

## 3. Estrategia de Autenticación y Autorización por Rol

1. **Tokens JWT**:
   - Al iniciar sesión en `/api/auth/login`, se valida la contraseña con `bcryptjs`.
   - Se genera un token JWT firmado con `JWT_SECRET` con expiración de 30 días (`expiresIn: "30d"`).
   - Payload del token: `{ id: string, email: string, rol: "novio" | "novia", nombre: string }`.
2. **Autorización en Backend**:
   - `verificarAuth`: Middleware helper que extrae y valida el JWT (desde header `Authorization: Bearer <token>` o cookie de sesión).
   - `requiereRol("novio")`: Middleware helper que rechaza con `403 Forbidden` cualquier intento de creación, edición o eliminación que no provenga de un token con `rol === "novio"`.
   - El rol `novia` tiene acceso total a endpoints de lectura (`GET`), detalle, mapas y descarga de calendario.
3. **Usuarios fijos (Seed)**:
   - Script/endpoint de inicialización para garantizar la existencia de las cuentas `novio@velada.app` y `novia@velada.app` con contraseñas seguras preconfiguradas.

---

## 4. Estrategia de Fechas y Zona Horaria

1. **Almacenamiento**:
   - Todas las fechas se almacenan en MongoDB como objetos `Date` nativos (UTC / ISO 8601).
2. **Validación**:
   - Al crear una cita, se verifica que la fecha sea válida y futura respecto al momento de creación.
3. **Presentación en Cliente**:
   - Formateo con `date-fns` en español (ej. *"Sábado 15 de agosto · 8:00 PM"*).
   - Cálculo reactivo de cuenta regresiva (*"Próxima cita en X días"*).
   - Clasificación dinámica en: **Próximas** (`horario >= now` y `estado !== cancelada`), **Pasadas** (`horario < now`), y **Canceladas** (`estado === cancelada`).

---

## 5. Estrategia de Mapas y Calendario

1. **Mapas (Leaflet + OpenStreetMap)**:
   - Componente interactivo cargado dinámicamente (`next/dynamic` con `ssr: false` para evitar discrepancias de SSR con `window`).
   - Geocodificación inversa / directa gratuita mediante API pública de Nominatim de OpenStreetMap.
2. **Calendario (.ics y Google Calendar)**:
   - **Google Calendar URL**: Construcción de enlace `https://calendar.google.com/calendar/render?action=TEMPLATE&text=...&dates=...&details=...&location=...`
   - **Descarga .ics**: Generación de archivo estándar iCalendar compatible con iOS, macOS, Android y Outlook.
