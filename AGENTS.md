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
- `index.html`, `styles.css`, `app.js` — sitio estático (HTML/CSS/JS vanilla).

## Convenciones

- Sin framework, sin build step, sin backend. Solo archivos estáticos.
- El contenido se edita en `data/timeline.json`; no hardcodear relatos en HTML/JS.
- Relatos verbatim (saltos de línea y emojis preservados).
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
- Self-check del rescate: `.\.venv\Scripts\python.exe scripts\fetch_post.py --demo`
- Validar spec: `openspec validate add-storytelling-11s`
- Servir local: `.\.venv\Scripts\python.exe -m http.server` en la raíz.

## Publicación

- Repo: https://github.com/geoidegeoidal/storytelling-11s
- Sitio: https://geoidegeoidal.github.io/storytelling-11s/ (GitHub Pages,
  branch `main`, raíz).
- Deploy: `git push` a `main`; Pages publica solo. No hay build step.
