# Guía de Despliegue en Producción — Velada ($0 de Costo)

Esta guía explica paso a paso cómo desplegar la aplicación web **Velada** de forma 100% gratuita utilizando **Vercel** (Frontend + Backend) y **MongoDB Atlas** (Base de datos).

---

## 1. Configuración de la Base de Datos en MongoDB Atlas (Gratis)

1. **Crear cuenta o Iniciar sesión**:
   - Entra a [https://www.mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas).
2. **Crear un Clúster Gratuito (M0 Sandbox)**:
   - Selecciona **Shared** (Gratis para siempre, 512 MB).
   - Elige el proveedor de nube y región más cercana a tu ubicación (ej. AWS en `us-east-1` o `us-west-2`).
   - Nombra tu clúster (ej. `ClusterVelada`) y pulsa **Create Deployment**.
3. **Crear Usuario de Base de Datos**:
   - Ve a **Database Access** -> **Add New Database User**.
   - Tipo de autenticación: *Password*.
   - Nombre de usuario: `velada_user`.
   - Contraseña: Crea una contraseña segura y anótala.
   - Rol: *Read and write to any database*.
4. **Permitir Conexiones de Red (IP Access List)**:
   - Ve a **Network Access** -> **Add IP Address**.
   - Selecciona **Allow Access from Anywhere** (`0.0.0.0/0`) para permitir que las funciones serverless de Vercel se conecten sin bloqueos.
   - Pulsa **Confirm**.
5. **Obtener la Cadena de Conexión (Connection String)**:
   - Ve a **Database** -> pulsa el botón **Connect** en tu clúster.
   - Elige **Drivers** (Node.js).
   - Copia la URL que luce así:
     ```text
     mongodb+srv://velada_user:<password>@clustervelada.xxxx.mongodb.net/velada?retryWrites=true&w=majority
     ```
   - Reemplaza `<password>` con tu contraseña real y asegúrate de que termine con `/velada?retryWrites=true&w=majority`.

---

## 2. Despliegue en Vercel (Gratis)

### Opción A: Despliegue con GitHub (Recomendado)
1. Sube este repositorio a tu cuenta de GitHub (público o privado).
2. Entra a [https://vercel.com](https://vercel.com) e inicia sesión con tu cuenta de GitHub.
3. Pulsa **Add New...** -> **Project**.
4. Importa el repositorio de **Velada**.
5. En la sección **Environment Variables**, agrega las siguientes 3 variables:
   - `MONGODB_URI`: Tu cadena de conexión de MongoDB Atlas obtenida en el paso 1.
   - `JWT_SECRET`: Una clave secreta larga y segura (ej. `velada_jwt_production_secret_key_2026_super_seguro`).
   - `NEXT_PUBLIC_APP_URL`: La URL que Vercel te asigne (ej. `https://velada.vercel.app`).
6. Pulsa **Deploy**.
7. En menos de 2 minutos tu aplicación estará desplegada con HTTPS automático y accesible desde cualquier celular o computadora.

---

### Opción B: Despliegue desde Terminal con Vercel CLI
```bash
# 1. Instalar Vercel CLI globalmente
npm i -g vercel

# 2. Desplegar en producción
vercel --prod
```
El asistente te preguntará por tu cuenta y te permitirá configurar las variables de entorno interactivamente.

---

## 3. Inicialización Automática en Producción

La primera vez que abras tu URL pública en producción (ej. `https://velada.vercel.app`):
1. La aplicación detectará que la base de datos es nueva e inicializará automáticamente los dos usuarios fijos:
   - **Novio**: `novio@velada.app` / `NovioVelada2026!` (o las contraseñas que definas en variables de entorno).
   - **Novia**: `novia@velada.app` / `NoviaVelada2026!`.
2. Las citas iniciales de demostración se cargarán automáticamente para que el diseño y el mapa luzcan perfectos desde el primer instante.

---

## 4. Acceso desde Dispositivos Móviles

- La aplicación es **100% responsive** y está optimizada para la pantalla táctil de smartphones (iOS Safari y Android Chrome).
- En iPhone/Safari o Android/Chrome, ambos usuarios pueden usar la opción **"Agregar a pantalla de inicio"** (PWA/Acceso directo) para usar Velada como si fuera una aplicación nativa.
