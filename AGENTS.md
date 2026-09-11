# AGENTS.md — Storytelling 11 de septiembre

## Qué es

Storytelling web estático, hora a hora, del golpe de Estado en Chile del
11 de septiembre de 1973, construido a partir de mapas publicados en
Instagram (cuenta de conmapas) y los relatos que los acompañan.

## Estructura

- `openspec/` — specs y changes (spec-driven). Change activo: `add-storytelling-11s`.
- `scripts/` — pipeline de rescate de posts de Instagram (autoría, no runtime).
- `data/timeline.json` — fuente única de contenido del sitio.
- `assets/maps/` — imágenes de los mapas (`<shortcode>_<n>.jpg`).
- `audio/` — pistas opcionales: `musica.mp3` (fondo) y `ultimo-discurso.mp3`
  (referenciado en `timeline.json`). No se versionan audios con derechos.
- `index.html`, `styles.css`, `app.js` — sitio estático (HTML/CSS/JS vanilla).

## Convenciones

- Sin framework, sin build step, sin backend. Solo archivos estáticos.
- El contenido se edita en `data/timeline.json`; no hardcodear relatos en HTML/JS.
- Los relatos son textos editados a mano: sin emojis ni hashtags. El rescate
  **no** los pisa (preserva `relato`/`titulo`/`hora`/`audio`); `--refresh` fuerza
  volver al caption original de Instagram.
- El sitio muestra solo la primera imagen de cada entrada (el mapa); la segunda
  de los carruseles es la tarjeta de texto que duplica el relato.
- Todo en español.

## Trampas resueltas

- Instagram bloquea el fetch anónimo (la página `embed/captioned` devuelve
  página de error). El rescate usa `instaloader`, con fallback manual
  (imagen + texto) si falla. `instaloader` anónimo sí funciona para estos posts.
- `CURL_CA_BUNDLE` del entorno apunta a un archivo inexistente
  (`...PostgreSQL\18\ssl\certs\ca-bundle.crt`), lo que rompe TLS en Python.
  `scripts/fetch_post.py` lo redirige a certifi si el path no existe.
- Carruseles: los `GraphSidecar` se bajan con `get_sidecar_nodes()` como
  `<shortcode>_1.jpg`, `<shortcode>_2.jpg`, etc.

## Entorno

- Python del proyecto: `.venv\Scripts\python.exe` (con `instaloader`).

## Comandos

- Instalar deps: `python -m venv .venv; .\.venv\Scripts\python.exe -m pip install instaloader`
- Rescate: `.\.venv\Scripts\python.exe scripts\fetch_post.py <url> [<url> ...]`
- Rescate forzando caption original: agregar `--refresh`
- Self-check del rescate: `.\.venv\Scripts\python.exe scripts\fetch_post.py --demo`
- Validar spec: `openspec validate add-storytelling-11s`
- Servir local: `.\.venv\Scripts\python.exe -m http.server` en la raíz.

## Audio

- El sitio tiene un control de sonido flotante y reproduce un audio por escena
  (`audio` en la entrada del timeline) al llegar a ella.
- Dos formas de fuente, sin romper la estética:
  - **Embed de YouTube** (reproductor oculto + control propio): música en la
    constante `YT_MUSICA` (ID de video) de `app.js`; discurso en el campo
    `audio_embed` de la entrada. Vía recomendada por derechos de autor.
  - **Archivo local**: `audio/musica.mp3` (fondo, loop) y `audio/ultimo-discurso.mp3`.
- Si no hay fuente configurada, el control y la nota se ocultan solos.
- El audio intenta autoplay al cargar. Si el navegador lo bloquea (política de
  autoplay), arranca con el **primer gesto** en cualquier parte (clic, tecla o
  toque); la pista "Tocá para activar el sonido" desaparece al desbloquear. El
  botón flotante es solo un mute/unmute.
- El discurso suena al centrar su escena y baja la música (duck); al salir se
  pausa y la música vuelve.
- No se versionan audios con derechos; el embed delega la licencia en YouTube.

## Publicación

- Repo: https://github.com/geoidegeoidal/storytelling-11s
- Sitio: https://geoidegeoidal.github.io/storytelling-11s/ (GitHub Pages,
  branch `main`, raíz).
- Deploy: `git push` a `main`; Pages publica solo. No hay build step.
