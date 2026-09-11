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

## Reel / video

- `scripts/record_reel.mjs` graba un **reel vertical 1080×1920** recorriendo el
  sitio. Por defecto hace **paradas**: se detiene en la portada, la bajada, cada
  escena y el cierre (para mirar el mapa y leer) y transiciona entre paradas
  (`--hold <s>` por parada, `--trans <s>` de transición). Sin dependencias: usa
  el WebSocket nativo de Node 22 + Chrome DevTools Protocol.
- Requiere Chrome y un binario de `ffmpeg` (p. ej. el de `ffmpeg-static`).
- Ejemplo: `node scripts/record_reel.mjs --url http://localhost:8000/ --out reel-11s.mp4 --ffmpeg <ruta>\ffmpeg.exe`
- Oculta la pantalla de entrada, el botón de sonido y la pista durante la grabación.
- El video sale **sin audio** (se agrega la música en la app de Instagram).
- El mp4 no se versiona (ver `.gitignore`).

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
  toque); la pista "Activa el sonido" desaparece al desbloquear. El
  botón flotante es solo un mute/unmute.
- Al abrir, si hay audio, aparece una **pantalla de entrada** ("Entrar con
  sonido" / "Entrar en silencio"). El clic en la primera es el gesto que
  desbloquea el audio y arranca la música; la segunda entra muteado.
- **Modo in-app** (navegador de Instagram/Facebook/TikTok): se detecta por
  User-Agent (`EN_APP`). Esos navegadores no permiten controlar YouTube por
  código, así que se muestra un **reproductor visible** (`.yt-card`, con
  controles nativos) para que la persona toque el play del propio YouTube; sirve
  para la música y, al llegar a su escena, se cambia al discurso
  (`loadVideoById`). En in-app no se usa el reproductor oculto ni el desbloqueo
  programático.
- El discurso suena al centrar su escena y **sigue hasta el final** (no se pausa
  al scrollear); baja la música (duck) mientras dura y la música vuelve al
  terminar (o al mutear).
- No se versionan audios con derechos; el embed delega la licencia en YouTube.

## Publicación

- Repo: https://github.com/geoidegeoidal/storytelling-11s
- Sitio: https://geoidegeoidal.github.io/storytelling-11s/ (GitHub Pages,
  branch `main`, raíz).
- Deploy: `git push` a `main`; Pages publica solo. No hay build step.
