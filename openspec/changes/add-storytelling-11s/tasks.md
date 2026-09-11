## 1. Setup del proyecto

- [ ] 1.1 Crear estructura base: `scripts/`, `data/`, `assets/maps/`
- [ ] 1.2 Agregar `.gitignore` (entorno Python, caches, sesión de instaloader)
- [ ] 1.3 Crear `AGENTS.md` y `HANDOFF.md`
- [ ] 1.4 Definir esquema de `data/timeline.json` (entradas vacías de ejemplo)

## 2. Pipeline de rescate (`instagram-rescue`)

- [ ] 2.1 Instalar `instaloader` (entorno aislado) y verificar versión
- [ ] 2.2 Implementar `scripts/fetch_post.py <url>`: extraer shortcode y validar URL
- [ ] 2.3 Descargar imagen(es) a `assets/maps/<shortcode>_<n>.jpg` y el caption
- [ ] 2.4 Registrar/actualizar la entrada en `data/timeline.json` (idempotente, sin duplicados ni imágenes huérfanas)
- [ ] 2.5 Manejar carruseles preservando el orden de las imágenes
- [ ] 2.6 Manejar el fallo de descarga anónima: mensaje claro y soporte de alta manual (imagen local + relato)

## 3. Contenido

- [ ] 3.1 Procesar los links provistos por el usuario, uno a uno
- [ ] 3.2 Completar manualmente las entradas que Instagram bloquee
- [ ] 3.3 Ordenar las entradas por hora y revisar coherencia del relato

## 4. Sitio (`storytelling-site`)

- [ ] 4.1 Crear `index.html` (estructura semántica del timeline)
- [ ] 4.2 Crear `styles.css` con diseño del timeline, legible en desktop y móvil
- [ ] 4.3 Implementar `app.js`: cargar `data/timeline.json`, ordenar por hora y renderizar entradas
- [ ] 4.4 Renderizar cada entrada: hora, título, imagen(es) y relato (preservando saltos de línea)
- [ ] 4.5 Galería navegable para entradas con varias imágenes
- [ ] 4.6 Manejo de error visible cuando `timeline.json` falta o una entrada es inválida, sin dejar la página en blanco
- [ ] 4.7 `loading="lazy"` y ancho máximo de imágenes

## 5. Verificación y publicación

- [ ] 5.1 Verificar el sitio localmente (servidor estático) en desktop y móvil
- [ ] 5.2 Revisar contraste, foco y estructura semántica (accesibilidad básica)
- [ ] 5.3 Definir hosting (GitHub Pages / Netlify / otro) y publicar
- [ ] 5.4 `openspec validate add-storytelling-11s` y archivar el change
- [ ] 5.5 Actualizar `HANDOFF.md` con el estado final
