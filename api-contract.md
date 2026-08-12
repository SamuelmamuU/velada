# Contrato de la API REST — Velada

Todos los endpoints REST responden con formato JSON estándar (excepto endpoints de descarga como `.ics`).

---

## 1. Autenticación (`/api/auth`)

### `POST /api/auth/login`
Inicia sesión y genera el token JWT.
- **Acceso:** Público
- **Request Body:**
```json
{
  "email": "novio@velada.app",
  "password": "Password123!"
}
```
- **Response 200 OK:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "usuario": {
    "id": "64f1a2b3c4d5e6f7a8b9c0d1",
    "nombre": "Novio",
    "email": "novio@velada.app",
    "rol": "novio"
  }
}
```
- **Response 400 / 401:**
```json
{
  "success": false,
  "error": "Credenciales inválidas"
}
```

---

### `GET /api/auth/me`
Obtiene los datos del usuario autenticado a partir del token.
- **Acceso:** Autenticado (`novio` o `novia`)
- **Headers:** `Authorization: Bearer <token>` (o cookie)
- **Response 200 OK:**
```json
{
  "success": true,
  "usuario": {
    "id": "64f1a2b3c4d5e6f7a8b9c0d1",
    "nombre": "Novia",
    "email": "novia@velada.app",
    "rol": "novia"
  }
}
```

---

### `POST /api/auth/seed`
Inicializa los 2 usuarios fijos si aún no existen en la base de datos.
- **Acceso:** Público (idempotente)
- **Response 200 OK:**
```json
{
  "success": true,
  "message": "Usuarios inicializados correctamente",
  "usuarios": [
    { "email": "novio@velada.app", "rol": "novio" },
    { "email": "novia@velada.app", "rol": "novia" }
  ]
}
```

---

## 2. Citas (`/api/citas`)

### `GET /api/citas`
Lista todas las citas ordenadas cronológicamente por horario ascendente.
- **Acceso:** Autenticado (`novio` o `novia`)
- **Headers:** `Authorization: Bearer <token>`
- **Response 200 OK:**
```json
{
  "success": true,
  "total": 3,
  "citas": [
    {
      "id": "64f1a2b3c4d5e6f7a8b9c0d2",
      "nombre": "Cena bajo las luces",
      "descripcion": "Una mesa reservada para nosotros, vino tinto y la terraza que tanto te gusta.",
      "horario": "2026-08-15T20:00:00.000Z",
      "lugar": {
        "direccion": "Terraza San Pedro, Monterrey",
        "lat": 25.6572,
        "lng": -100.4024
      },
      "tematica": "Romántico",
      "vestimentaRecomendada": "Elegante casual",
      "estado": "confirmada",
      "creadoPor": "64f1a2b3c4d5e6f7a8b9c0d1",
      "createdAt": "2026-08-11T12:00:00.000Z",
      "updatedAt": "2026-08-11T12:00:00.000Z"
    }
  ]
}
```

---

### `POST /api/citas`
Crea una nueva cita.
- **Acceso:** **Solo rol `novio`** (403 si es `novia` o no autorizado)
- **Headers:** `Authorization: Bearer <token>`
- **Request Body:**
```json
{
  "nombre": "Cena bajo las luces",
  "descripcion": "Una mesa reservada para nosotros, vino tinto y la terraza que tanto te gusta.",
  "horario": "2026-08-15T20:00:00.000Z",
  "lugar": {
    "direccion": "Terraza San Pedro, Monterrey",
    "lat": 25.6572,
    "lng": -100.4024
  },
  "tematica": "Romántico",
  "vestimentaRecomendada": "Elegante casual",
  "estado": "confirmada"
}
```
- **Response 201 Created:**
```json
{
  "success": true,
  "cita": { ... }
}
```
- **Response 403 Forbidden:**
```json
{
  "success": false,
  "error": "Acceso denegado: Solo el novio puede crear citas"
}
```

---

### `GET /api/citas/:id`
Obtiene el detalle completo de una cita individual.
- **Acceso:** Autenticado (`novio` o `novia`)
- **Headers:** `Authorization: Bearer <token>`
- **Response 200 OK:**
```json
{
  "success": true,
  "cita": {
    "id": "64f1a2b3c4d5e6f7a8b9c0d2",
    "nombre": "Cena bajo las luces",
    "descripcion": "Una mesa reservada para nosotros, vino tinto y la terraza que tanto te gusta.",
    "horario": "2026-08-15T20:00:00.000Z",
    "lugar": {
      "direccion": "Terraza San Pedro, Monterrey",
      "lat": 25.6572,
      "lng": -100.4024
    },
    "tematica": "Romántico",
    "vestimentaRecomendada": "Elegante casual",
    "estado": "confirmada",
    "creadoPor": {
      "id": "64f1a2b3c4d5e6f7a8b9c0d1",
      "nombre": "Novio"
    }
  }
}
```
- **Response 404 Not Found:**
```json
{
  "success": false,
  "error": "Cita no encontrada"
}
```

---

### `PUT /api/citas/:id`
Edita una cita existente.
- **Acceso:** **Solo rol `novio`**
- **Headers:** `Authorization: Bearer <token>`
- **Request Body:** Campos a modificar (parcial o total).
- **Response 200 OK:**
```json
{
  "success": true,
  "cita": { ... }
}
```

---

### `DELETE /api/citas/:id`
Elimina o marca como cancelada una cita.
- **Acceso:** **Solo rol `novio`**
- **Headers:** `Authorization: Bearer <token>`
- **Response 200 OK:**
```json
{
  "success": true,
  "message": "Cita eliminada correctamente"
}
```

---

### `GET /api/citas/:id/ics`
Genera y descarga el archivo estándar `.ics` de la cita.
- **Acceso:** Autenticado (`novio` o `novia`)
- **Headers:** `Authorization: Bearer <token>` (o token en query string para descarga directa)
- **Response:** `Content-Type: text/calendar; charset=utf-8`, `Content-Disposition: attachment; filename="cita-velada.ics"`

---

## 3. Geocodificación (`/api/geocode`)

### `GET /api/geocode?q=...`
Convierte texto de dirección en coordenadas geográficas utilizando Nominatim OpenStreetMap con headers adecuados y caching.
- **Acceso:** Autenticado
- **Response 200 OK:**
```json
{
  "success": true,
  "results": [
    {
      "display_name": "Terraza San Pedro, San Pedro Garza García, N.L., México",
      "lat": 25.6572,
      "lng": -100.4024
    }
  ]
}
```
