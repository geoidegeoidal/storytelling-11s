## Why

El 11 de septiembre de 1973 el golpe de Estado en Chile se desarrolló hora a hora, pero el relato suele contarse de forma agregada. Ya existe un corpus de mapas publicados en Instagram (cuenta de conmapas) que narran esos momentos con su relato acompañante. Este cambio convierte ese corpus disperso en un storytelling web interactivo, hora a hora, preservando mapas y relatos.

## What Changes

- Pipeline de rescate que, a partir de un link de post de Instagram, descarga la(s) imagen(es) del mapa y el caption (relato) y los normaliza a una estructura de timeline.
- Sitio web estático con timeline vertical: una entrada por corte temporal definido por los mapas, cada una con hora, título, mapa (soporta carrusel) y relato.
- Estructura de datos `data/timeline.json` como fuente única de contenido, editable a mano.
- No hay backend ni build step: HTML/CSS/JS vanilla, publicable en cualquier hosting estático.

## Capabilities

### New Capabilities

- `instagram-rescue`: obtener desde un link de Instagram el/los mapas (imágenes) y el relato (caption), guardarlos como assets locales y registrarlos en el timeline.
- `storytelling-site`: sitio estático que renderiza el timeline hora a hora con mapas y relatos, responsive y accesible.

### Modified Capabilities

<!-- ninguna -->

## Impact

- Nuevos: `scripts/` (rescate), `data/timeline.json`, `assets/maps/`, `index.html`, `styles.css`, `app.js`.
- Dependencia nueva: `instaloader` (Python) para el rescate. Solo se usa en tiempo de autoría, no en el runtime del sitio.
- Sin impacto en sistemas existentes (proyecto nuevo).
- Riesgo externo: Instagram limita descargas anónimas; el pipeline necesita fallbacks (sesión logueada del autor o carga manual).
