---
name: threejs-animations
description: >-
  Guía completa y referencias técnicas para desarrollar, optimizar y depurar animaciones y experiencias 3D en Three.js con React, Next.js y WebGL. Usa esta skill cuando el usuario solicite crear, modificar o pulir animaciones 3D, modelos interactivos, luces, materiales, físicas de puertas/sobres, rotación de cámara, o efectos visuales tridimensionales.
---

# 🎨 Three.js 3D Animations & WebGL Experience Skill

Esta skill proporciona las directrices y estándares para crear y optimizar animaciones 3D en **Three.js** dentro del proyecto *Velada / Nuestras Aventuras*.

---

## 🛠️ 1. Estructura Estándar de Componentes Three.js en React / Next.js

Al crear componentes interactivos 3D en cliente:

1. **Uso obligatorio de `use client`**:
   - Los renderizadores WebGL y CSS3D acceden a `window` y `document`, por lo que deben montarse exclusivamente en componentes del cliente.

2. **Doble Renderizador (WebGL + CSS3D)**:
   - Utilizar `THREE.WebGLRenderer` para geometría 3D, sombras, materiales metálicos y luces.
   - Utilizar `CSS3DRenderer` (de `three/examples/jsm/renderers/CSS3DRenderer.js`) para incrustar elementos HTML/React interactivos (como etiquetas de usuario, botones o formularios) directamente adheridos a la superficie 3D.

3. **Ciclo de Vida y Limpieza (Memory Leak Prevention)**:
   - En el retorno de `useEffect`, liberar **obligatoriamente** todos los recursos creados:
     ```typescript
     geometry.dispose();
     material.dispose();
     texture.dispose();
     webglRenderer.dispose();
     cancelAnimationFrame(animId);
     ```

---

## 🎬 2. Flujo y Principios de Animación 3D

### A. Animación Suave (Lerp & Clock Delta)
- Utilizar `THREE.Clock` para obtener el delta de tiempo real en cada frame.
- Para interpolar movimientos y rotaciones suaves entre estados de animación (como la rotación del buzón o el basculamiento de la puerta):
  ```typescript
  currentRotation += (targetRotation - currentRotation) * lerpFactor;
  ```

### B. Animaciones Específicas de Buzón de Cartas 3D
- **Apertura de Puerta Frontal**:
  - Crear un pivote `doorPivot = new THREE.Group()` alineado con la bisagra inferior física (`z = +halfZ`, `y = hingeY`).
  - Animar la rotación `doorPivot.rotation.x` hacia un ángulo positivo `+Math.PI * 0.54` (~95°-97°) para abatir la puerta hacia afuera y abajo hasta el tope horizontal con amortiguación y micro-rebote físico. (IMPORTANTE: Nunca usar ángulos negativos en la puerta frontal, ya que la empotran dentro del buzón).
- **Separación de Lados para Banderín y Placa de Nombres**:
  - El banderín postal articulado debe ubicarse en el costado izquierdo (`-X`), mientras que la placa o adhesivo con los nombres de la pareja y el login CSS3D debe ubicarse en el costado opuesto (`+X`), previniendo cualquier cruce visual entre ambos elementos.
- **Sobres Flotantes y Desdoblamiento**:
  - Los sobres nacen acostados dentro de la cámara y se trasladan hacia el frente (`z` pasando de 2.0 a 14.5) elevándose suavemente con oscilación sinusoidal (`Math.sin(time * frequency)`). Al interactuar, la solapa superior triangular (`flapPivot`) se desdobla 170° hacia arriba y atrás antes de desplegar la carta completa.

---

## 📱 3. Optimización para Dispositivos Móviles (Android / Capacitor)

1. **Control de DPR (Device Pixel Ratio)**:
   - Limitar la resolución máxima para no saturar GPUs móviles:
     ```typescript
     const maxDpr = isMobile ? 1.75 : 2;
     renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxDpr));
     ```
2. **Suspensión por Inactividad de Pantalla**:
   - Escuchar `visibilitychange` para pausar la animación cuando la pestaña o aplicación pasa a segundo plano:
     ```typescript
     document.addEventListener("visibilitychange", () => {
       if (document.hidden) cancelAnimationFrame(animId);
     });
     ```
3. **Sombras Optimizadas**:
   - Usar `THREE.PCFSoftShadowMap` con mapas de sombra de resolución moderada (`1024x1024` o `512x512`).

---

## 🚀 4. Guía de Creación de Nuevos Modelos y Animaciones Futuras

Cuando el usuario solicite nuevas animaciones 3D:
1. **Modelado Procedural**: Construir piezas atómicas usando `THREE.Shape`, `THREE.ExtrudeGeometry` y `THREE.Group` ordenados jerárquicamente.
2. **Materiales Distintivos**: Configurar albedo (`color`), rugosidad (`roughness`) y metalicidad (`metalness`) para diferenciar superficies (madera, latón dorado, hierro forjado, pastel satinado).
3. **Pivotes Limpios**: Colocar los puntos de rotación (`Group`) exactamente sobre el eje físico de articulación (bisagras, tapas, cierres).
