# Requerimientos del Proyecto

## 1. Requerimientos funcionales

### 1.1 Roles de usuario

| Rol | Permisos |
|---|---|
| **Novio** | Crear, editar, eliminar/cancelar y visualizar citas. |
| **Novia** | Únicamente visualizar citas agendadas (solo lectura). |

- RF-01: El sistema debe permitir iniciar sesión con dos cuentas fijas (novio y novia), cada una con su rol correspondiente.
- RF-02: El sistema debe restringir las acciones de creación, edición y eliminación de citas exclusivamente al rol "novio".
- RF-03: El sistema debe permitir al rol "novia" visualizar todas las citas agendadas, sin opción de modificarlas.
- RF-04: El sistema debe cerrar sesión y proteger las rutas privadas ante usuarios no autenticados.

### 1.2 Gestión de citas

Cada cita debe contar obligatoriamente con los siguientes campos:

- RF-05: **Nombre de la cita** — texto corto, obligatorio.
- RF-06: **Descripción** — texto libre, obligatorio.
- RF-07: **Horario** — fecha y hora, obligatorio, debe ser una fecha futura al momento de crearse.
- RF-08: **Lugar** — dirección en texto, obligatorio.
- RF-09: **Mapa mostrando el lugar** — visualización geográfica basada en coordenadas asociadas al lugar, obligatorio.
- RF-10: **Temática** — texto corto o selección de categoría (ej. romántico, casual, aventura, formal), obligatorio.
- RF-11: **Vestimenta recomendada** — texto libre, obligatorio.

- RF-12: El sistema debe permitir crear una nueva cita con todos los campos anteriores.
- RF-13: El sistema debe permitir editar una cita existente (solo rol novio).
- RF-14: El sistema debe permitir cancelar/eliminar una cita (solo rol novio).
- RF-15: El sistema debe listar todas las citas ordenadas cronológicamente.
- RF-16: El sistema debe permitir ver el detalle completo de una cita individual.
- RF-17: El sistema debe distinguir visualmente entre citas pasadas, próximas y canceladas.

### 1.3 Mapa

- RF-18: Al crear una cita, el sistema debe permitir seleccionar la ubicación en un mapa interactivo o ingresar una dirección que se convierta automáticamente en coordenadas.
- RF-19: En la vista de detalle de la cita, el sistema debe mostrar un mapa embebido con un marcador en el lugar exacto.
- RF-20: El mapa debe ser interactivo (zoom, desplazamiento) tanto para el novio como para la novia.

### 1.4 Exportar a Google Calendar

- RF-21: Desde la pantalla de detalle de una cita, el sistema debe ofrecer una opción para **descargar el evento** en formato compatible con calendarios (`.ics`).
- RF-22: El sistema debe ofrecer también un enlace directo para **agregar la cita a Google Calendar** sin necesidad de descargar archivos.
- RF-23: El archivo/enlace de calendario debe incluir: nombre de la cita, descripción, fecha y hora de inicio, y ubicación (lugar).
- RF-24: Esta función debe estar disponible tanto para el rol novio como para el rol novia.

### 1.5 Notificaciones (deseable, no obligatorio)

- RF-25: El sistema debería notificar a la novia cuando se agenda una nueva cita.
- RF-26: El sistema debería enviar un recordatorio antes del horario de la cita.

---

## 2. Requerimientos no funcionales

### 2.1 Usabilidad

- RNF-01: La interfaz debe ser clara, intuitiva y usable sin necesidad de instrucciones.
- RNF-02: El diseño debe ser **responsive**, priorizando la experiencia en dispositivos móviles, ya que probablemente se use principalmente desde el celular.
- RNF-03: El diseño visual debe ser **moderno**: paleta de color propia (no colores por defecto de librerías), tipografía con carácter, componentes con espaciados y sombras consistentes, y micro-interacciones/animaciones sutiles que refuercen la sensación de cuidado y personalización de la app.

### 2.2 Rendimiento

- RNF-04: Las páginas principales (login, lista de citas, detalle de cita) deben cargar en menos de 2 segundos en condiciones normales de red.
- RNF-05: El mapa debe cargar sin bloquear el resto del contenido de la página (carga asíncrona).

### 2.3 Seguridad

- RNF-06: Las contraseñas deben almacenarse siempre con hash (nunca en texto plano).
- RNF-07: Toda comunicación entre cliente y servidor debe ir sobre HTTPS en producción.
- RNF-08: El sistema debe validar en el backend los permisos por rol en cada endpoint, no solo en el frontend (evitar que la novia pueda crear citas manipulando la petición directamente).
- RNF-09: Las claves de API (mapas, email, etc.) deben mantenerse fuera del código fuente (variables de entorno).

### 2.4 Disponibilidad y mantenimiento

- RNF-10: La aplicación debe estar disponible públicamente vía URL accesible desde cualquier dispositivo con internet.
- RNF-11: El código debe estar versionado en un repositorio Git con historial de cambios claro.
- RNF-12: La base de datos debe respaldarse periódicamente (backup) para no perder el historial de citas.

### 2.5 Escalabilidad y costo

- RNF-13: La solución debe operar preferentemente dentro de planes gratuitos, dado que es un proyecto personal de bajo volumen (2 usuarios, decenas de citas).
- RNF-14: La arquitectura debe permitir agregar fácilmente nuevas funcionalidades futuras (ej. fotos de la cita, comentarios, calificación post-cita) sin rediseñar el sistema.

### 2.6 Compatibilidad

- RNF-15: La aplicación debe funcionar correctamente en los navegadores modernos más comunes (Chrome, Safari, Firefox) tanto en escritorio como en móvil.

---

## 3. Restricciones del proyecto

- RST-01: Solo existen dos usuarios en el sistema (no se requiere registro público ni gestión de múltiples parejas).
- RST-02: No se requiere panel de administración adicional más allá de las vistas de novio y novia.
- RST-03: El presupuesto ideal del proyecto es $0, priorizando herramientas y planes gratuitos.

---

## 4. Criterios de éxito del proyecto

- El novio puede crear una cita completa (todos los campos) en menos de 2 minutos.
- La novia puede ver el detalle de una cita, incluyendo el mapa, sin fricciones ni necesidad de ayuda técnica.
- La aplicación es accesible desde el celular de ambos en cualquier momento.
- No existen errores críticos que impidan crear o visualizar una cita en el flujo principal.
