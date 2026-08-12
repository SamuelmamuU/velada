# Prompt para el agente de IA — Proyecto "Velada"

> Copia y pega este prompt completo como primer mensaje al agente (ej. Claude Code) dentro de la carpeta del proyecto, con los 4 archivos de planeación ya colocados en la raíz o en una carpeta `docs/`.

---

```
Vas a construir "Velada", una aplicación web de citas para pareja con dos perfiles
de usuario (Novio y Novia). Antes de escribir una sola línea de código, debes leer
y absorber por completo los siguientes archivos de planeación que están en este
repositorio:

1. 01-plan-proyecto.md      → Plan del proyecto por fases, con cada tarea a ejecutar.
2. 02-tecnologias.md        → Stack tecnológico obligatorio a utilizar.
3. 03-requerimientos.md     → Requerimientos funcionales, no funcionales y restricciones.
4. mockup-velada.html       → Mockup visual de referencia (diseño, paleta de color,
                               tipografía, componentes y flujo de pantallas). Este
                               archivo es la fuente de verdad del diseño final: la UI
                               que construyas debe verse y sentirse igual a este mockup,
                               no una interpretación genérica.

INSTRUCCIONES DE TRABAJO:

1. Lee los 4 archivos completos antes de generar cualquier código o estructura de
   carpetas. No asumas contenido que no hayas leído.

2. Ejecuta el proyecto siguiendo EXACTAMENTE el orden de fases definido en
   01-plan-proyecto.md (Fase 0 a Fase 11). No te saltes fases ni tareas dentro de
   una fase, incluso si parecen triviales.

3. Al terminar cada fase:
   - Resume en el chat qué se implementó.
   - Verifica el "Criterio de aceptación" de esa fase antes de pasar a la siguiente.
   - Si algo del criterio de aceptación no se cumple, corrígelo antes de avanzar.
   - No avances a la siguiente fase sin mi confirmación explícita, salvo que te
     indique lo contrario.

4. Usa únicamente las tecnologías especificadas en 02-tecnologias.md (stack
   resumido al final de ese archivo). Si consideras que alguna pieza del stack no
   es viable por alguna limitación técnica real, detente y pregúntame antes de
   sustituirla — no cambies el stack por tu cuenta.

5. Cada requerimiento funcional y no funcional listado en 03-requerimientos.md
   (RF-01 a RF-26, RNF-01 a RNF-15) debe quedar cubierto por el código que generes.
   Al finalizar el proyecto, dame una checklist marcando qué requerimientos se
   cumplieron y cuáles quedaron pendientes, con la razón si aplica.

6. El diseño visual (colores, tipografía, componentes, layout de tarjetas tipo
   invitación, sello de cera, mapa estilizado, etc.) debe replicar fielmente
   mockup-velada.html. Extrae de ahí la paleta de colores exacta (variables CSS),
   las fuentes (Fraunces, Inter, IBM Plex Mono) y la estructura de componentes.
   No introduzcas un estilo visual distinto al del mockup.

7. Si en algún punto la planeación es ambigua o falta un detalle para continuar,
   pregúntame antes de asumir algo por tu cuenta — especialmente en decisiones de
   modelo de datos, autenticación o estructura de la API.

8. Al finalizar cada fase, haz commit del avance con un mensaje descriptivo en
   español (ej. "Fase 2: autenticación y manejo de roles completado").

9. No implementes funcionalidades que no estén en el plan ni en los requerimientos,
   aunque te parezcan buenas ideas. Si tienes una sugerencia de mejora, anótala al
   final de tu resumen de fase para que yo decida si la agregamos, pero no la
   implementes sin autorización.

Antes de empezar, confírmame con un resumen breve que entendiste el plan completo,
el stack tecnológico y los requerimientos, y dime con qué tarea de la Fase 0
vas a comenzar.
```

---

## Notas de uso

- Si tu agente de IA tiene acceso a herramientas de archivo (como Claude Code), puedes reemplazar la instrucción 1 por rutas reales, por ejemplo `docs/01-plan-proyecto.md`, para que las localice automáticamente.
- Si quieres que el agente avance fase por fase **sin pedir confirmación** en cada una (modo autónomo), elimina la frase *"No avances a la siguiente fase sin mi confirmación explícita"* de la instrucción 3.
- Si el proyecto se retoma en una sesión nueva, puedes reutilizar este mismo prompt agregando al final: `Ya se completaron las fases 0 a N, continúa desde la Fase N+1.`
