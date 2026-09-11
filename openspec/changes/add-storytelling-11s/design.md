## Context

Proyecto nuevo (repo vacío). El contenido fuente son publicaciones de Instagram (mapas + relato del 11-S). Ver `proposal.md` para la motivación. La restricción central: Instagram bloquea el acceso anónimo por fetchers (verificado: la página `embed/captioned` devolvió una página de error), y el resultado final debe ser un sitio estático sin backend.

## Goals / Non-Goals

**Goals:**
- Rescatar imágenes + caption de un post y volcarlos a una estructura de datos local estable.
- Sitio sin build step, sin framework, sin dependencias de runtime.

**Non-Goals:**
- Scraping masivo de cuentas/perfiles (solo post por post, vía links provistos).
- Backend, base de datos, CMS o panel de edición.
- Reproducir interacciones de Instagram (likes, comentarios, stories).

## Decisions

- **Herramienta de rescate: `instaloader`.** Es la que mejor cubre los tres requisitos juntos (imagen, caption y carrusel) y maneja autenticación/rate limit. Alternativas: `gallery-dl` (más general, caption menos directo), `yt-dlp` (orientado a video), scraping propio del embed (bloqueado).
- **Modelo de datos: un único `data/timeline.json`.** Array de entradas `{shortcode, hora, titulo, relato, imagenes[]}`. JSON plano porque es estático, editable a mano y no requiere build. Alternativa descartada: un archivo por entrada o Markdown con front-matter (más fricción, más parsing).
- **Assets: `assets/maps/<shortcode>_<n>.jpg`.** Nombre derivado del shortcode para idempotencia; el timeline guarda rutas relativas.
- **Sitio: HTML/CSS/JS vanilla.** El alcance (un timeline) no justifica framework ni bundler. Se sirve como archivos estáticos en cualquier hosting.
- **Relato: se guarda verbatim.** Se preservan saltos de línea y emojis; el render respeta `white-space: pre-line`.
- **Orden: campo `hora`.** Los cortes temporales los define el contenido (los mapas), no una grilla fija; el sitio ordena por `hora`.

## Risks / Trade-offs

- [Instagram bloquea la descarga anónima de un post] → instaloader con sesión logueada del autor (`--login`) o carga manual (imagen + texto) con el mismo formato de entrada.
- [Rate limit al procesar muchos links seguidos] → procesar secuencialmente con pausas entre posts; reutilizar sesión.
- [Caption con formato frágil (emojis, links, multilínea)] → guardar verbatim y renderizar sin reinterpretar; no sanitizar el texto del autor.
- [Peso de imágenes] → `loading="lazy"` y ancho máximo; optimizar solo si el peso total lo justifica.
- [Derechos de contenido] → es material propio del autor; se conserva la atribución de la cuenta fuente.

## Open Questions

- Hosting de publicación (GitHub Pages / Netlify / otro).
- Título y branding del sitio.
- Formato exacto de las etiquetas de hora (ej. "07:00" vs "7:00 AM").
