# Planesito de Vida 💌✨ — Aplicación Web de Citas de Amor para Pareja

> *Cartas de amor hechas a mano, momentos íntimos y planes para toda la vida.*

Aplicación web romántica diseñada con estética artesanal y de buzón postal para parejas con dos perfiles de usuario:
- **Novio**: Diseña, escribe y envía cartas de invitación románticas a su novia con dedicatoria, fecha, hora, detalles y ubicación en mapa.
- **Novia**: Abre su buzón de cartas animado, desdobla invitaciones narrativas manuscritas, voltea la hoja con esquina doblada (dog-ear) para consultar el mapa, y responde (Aceptar / Rechazar / Guardar) o sugiere ajustes de horario.

---

## 🛠️ Stack Tecnológico

- **Frontend & Backend**: Next.js (App Router, API Routes, React 18, TypeScript)
- **Base de datos**: MongoDB Atlas con ODM Mongoose
- **Autenticación**: JWT propio con contraseñas hasheadas en `bcryptjs`
- **Estilos y UI**: Tailwind CSS personalizado + animaciones con Framer Motion + Lucide Icons + Google Fonts (*Fraunces*, *Inter*, *IBM Plex Mono*)
- **Mapas**: Leaflet + OpenStreetMap (100% gratuito y sin API keys)
- **Calendario**: Generación de archivos `.ics` y enlaces directos a Google Calendar
- **Gestor de paquetes**: `npm`

---

## 📁 Estructura del Proyecto

```text
├── src/
│   ├── app/                 # Rutas y páginas de Next.js (App Router)
│   │   ├── api/             # Endpoints backend REST (API Routes)
│   │   │   └── ping/        # Endpoint de salud y diagnóstico
│   │   ├── globals.css      # Variables CSS, tokens de diseño y utilidades
│   │   ├── layout.tsx       # Root layout con tipografías Fraunces, Inter y Mono
│   │   └── page.tsx         # Vista principal
│   ├── components/          # Componentes reutilizables (UI, mapas, cartas)
│   ├── lib/                 # Utilidades, cliente MongoDB, helpers JWT
│   ├── models/              # Modelos y esquemas de Mongoose (Usuario, Cita)
│   └── types/               # Definiciones de TypeScript
├── .env.example             # Plantilla de variables de entorno
├── .env.local               # Variables de entorno locales
├── mockup-velada.html       # Mockup visual de referencia
├── 01-plan-proyecto.md      # Plan de proyecto por fases
├── 02-tecnologias.md        # Definición de stack tecnológico
└── 03-requerimientos.md     # Requerimientos funcionales y no funcionales
```

---

## 🚀 Instalación y Ejecución Local

### 1. Prerrequisitos
- **Node.js**: v18.17.0 o superior (recomendado v20+ o v22+)
- **npm**: v9.0.0 o superior

### 2. Instalación de dependencias
```bash
npm install
```

### 3. Configuración de Variables de Entorno
Copia `.env.example` a `.env.local` y configura tu conexión a MongoDB Atlas y secreto JWT:
```bash
cp .env.example .env.local
```

### 4. Iniciar servidor de desarrollo
```bash
npm run dev
```
Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

### 5. Scripts disponibles
- `npm run dev`: Inicia el servidor de desarrollo en puerto 3000.
- `npm run build`: Compila la aplicación para producción.
- `npm run start`: Inicia el servidor compilado de producción.
- `npm run lint`: Ejecuta el análisis de linter ESLint.
- `npm run format`: Formatea el código fuente con Prettier.

---

## 📋 Fases de Desarrollo

- [x] **Fase 0**: Preparación del entorno y verificación Ping/Pong.
- [x] **Fase 1**: Diseño de arquitectura y modelo de datos (Mongoose, API contract).
- [x] **Fase 2**: Backend: autenticación y usuarios con JWT y roles.
- [x] **Fase 3**: Backend: CRUD completo de citas con validación Zod y geocodificación.
- [x] **Fase 4**: Frontend: estructura base, sesión y diseño Velada.
- [x] **Fase 5**: Frontend: panel y formulario de citas del Novio con mapa interactivo.
- [x] **Fase 6**: Frontend: vista de citas, cuenta regresiva, mapas y exportación a calendario de la Novia.
- [x] **Fase 7**: Integración avanzada de mapas interactivos (Leaflet + OSM) con sugerencias y fallbacks.
- [x] **Fase 8**: Notificaciones in-app de nuevas invitaciones y recordatorios.
- [x] **Fase 9**: Pruebas automatizadas unitarias, de integración y UI test runner.
- [x] **Fase 10**: Despliegue en producción (Vercel + MongoDB Atlas en plan gratuito $0). Ver [docs/despliegue.md](docs/despliegue.md).
- [x] **Fase 11**: Pulido final, checklist de requerimientos y entrega. Ver [docs/checklist-requerimientos.md](docs/checklist-requerimientos.md) y [docs/guia-de-uso.md](docs/guia-de-uso.md).
