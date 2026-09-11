# HANDOFF.md — Última sesión / handoff entre sesiones

> **Convención**: este archivo es el puente entre sesiones del agente.
> Al final de cada sesión, el agente (o el usuario a mano) actualiza las
> secciones abajo. Al iniciar la próxima sesión, el agente lee este archivo
> **antes** de tocar código.

## Sesión actual / próxima

**Estado**: Rediseñado como storymap scrollytelling y publicado en GitHub Pages:
https://geoidegeoidal.github.io/storytelling-11s/ (verificado con screenshots
headless: portada, escena desktop y móvil). Falta archivar el change de openspec.

## Historial de sesiones

### 2026-09-10 — Rediseño: storymap scrollytelling

**Objetivo**: Reemplazar el listado plano por un storymap tipo ArcGIS StoryMaps,
tomando ideas de refero.design.

**Hecho**:
- `index.html`/`styles.css`/`app.js` reescritos: portada full-bleed, intro,
  escenas con **texto que scrollea + mapa fijo (sticky)** alternando lados,
  cierre full-bleed, HUD con la hora activa y barra de progreso.
- Deep-links por shortcode (`#<shortcode>`).
- Dirección de diseño rescatada de refero: lienzo oscuro (Air), tipografía
  editorial monumental (Aker), display condensado + mono (AI for Business).
  Acento magenta que retoma el de los propios mapas.
- Verificación con Chrome headless (`--screenshot`): portada, Valparaíso
  (mapa izq/texto der), Carriel Sur (texto izq/mapa der) y móvil.

**Decidido**:
- Se muestra **solo el mapa** (1ª imagen) por entrada, sin carrusel: en todos los
  carruseles la 2ª imagen es la tarjeta de texto que duplica el relato.
  Spec `storytelling-site` actualizado en consecuencia.
- Orden por `fecha`; `hora` es la etiqueta mostrada (grande, en Anton).

**Bloqueantes / pendientes**:
- Archivar el change de openspec cuando el usuario dé el visto bueno.
- Trampa para revisar: en headless, un carrusel `overflow-x:auto`/grid no pinta
  (por eso se descartó); no afecta al sitio actual.

**Próxima sesión**:
- `openspec archive add-storytelling-11s` si se cierra el change.
- Ajustes finos de contenido (títulos/horas) si el usuario los pide.

### 2026-09-10 — Rescate de 11 posts + sitio

**Objetivo**: Rescatar los mapas y relatos de los links provistos y construir
el sitio de storytelling.

**Hecho**:
- `.venv` con `instaloader` 4.15.3.
- `scripts/fetch_post.py`: rescata imagen(es) + caption, idempotente, con
  `--demo` (self-check). Baja carruseles por `get_sidecar_nodes()`.
- 11/11 posts rescatados → `data/timeline.json` + 17 imágenes en `assets/maps/`.
- Sitio: `index.html`, `styles.css`, `app.js` (timeline, orden por `fecha`,
  carrusel apilado, aviso de error, reveal on scroll). Smoke test del servidor OK.

**Decidido**:
- Orden del timeline por `fecha` (timestamp de publicación, que respeta el orden
  narrativo de la serie); `hora` es la etiqueta editorial a mostrar.
- Sin carrusel JS: las imágenes de un post se apilan (legibles y navegables).

**Bloqueantes / pendientes**:
- Horas y títulos extraídos de los propios mapas (la hora está en el título de
  cada imagen). 9 entradas con hora; la bajada (intro) y el cierre van sin hora,
  a propósito. `fecha` (publicación) ordena el timeline y coincide con el orden
  narrativo.
- Crédito: los mapas dicen "Elaborado por Jorge Ulloa" (reflejado en el pie).
- Publicado: repo `geoidegeoidal/storytelling-11s`, GitHub Pages (branch `main`,
  raíz). Deploy = `git push` a `main`.

**Próxima sesión**:
- Verificación visual en navegador (desktop/móvil) y accesibilidad básica.
- `openspec validate` + `archive` del change.

**Commits relevantes**: `d9bc098` (rescate + sitio + openspec)

### 2026-09-10 — Planificación del storytelling 11-S

**Objetivo**: Planificar con openspec un storytelling hora a hora del golpe
del 11 de septiembre de 1973, rescatando mapas (Instagram) y relatos.

**Hecho**:
- `openspec init` (schema spec-driven) + change `add-storytelling-11s`.
- Artefactos completos y validados (`--strict`): proposal, specs de
  `instagram-rescue` y `storytelling-site`, design, tasks.
- `AGENTS.md`, `HANDOFF.md`, `.gitignore`.

**Decidido**:
- Formato final: web interactivo estático (HTML/CSS/JS vanilla, sin build).
- Los mapas son posts de Instagram; rescate con `instaloader` (fallback manual).
- Cortes temporales según los mapas, no una grilla fija de horas.
- Datos en `data/timeline.json`; assets en `assets/maps/`.

**Bloqueantes / pendientes**:
- Los links de los posts los provee el usuario (uno a uno).
- Validar el rescate con el primer link real (instaloader no instalado aún).
- Nota: se probó `https://www.instagram.com/p/C_ubg3lA6RZ/` — el embed anónimo
  fue bloqueado, confirmando la necesidad de instaloader.

**Próxima sesión**:
- Instalar `instaloader` e implementar `scripts/fetch_post.py`.
- Procesar los links y armar `data/timeline.json`.
- Construir el sitio y publicar.

**Commits relevantes**: (proyecto sin git inicializado)
