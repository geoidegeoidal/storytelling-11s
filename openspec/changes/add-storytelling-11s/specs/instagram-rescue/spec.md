## Purpose

Obtener desde un link de publicación de Instagram los mapas (imágenes) y el relato (caption) que los acompaña, guardarlos como assets locales y registrarlos en un timeline cronológico editable.

## ADDED Requirements

### Requirement: Rescate de un post por URL
El sistema SHALL aceptar la URL de una publicación de Instagram (`https://www.instagram.com/p/<shortcode>/`) y obtener su caption completo y su(s) imagen(es).

#### Scenario: Post público de una sola imagen
- **WHEN** se ejecuta el pipeline con la URL de un post público de una imagen
- **THEN** se descarga la imagen y se extrae el caption completo con su texto exacto

#### Scenario: URL inválida
- **WHEN** la entrada no es una URL de publicación de Instagram reconocible
- **THEN** el pipeline falla con un mensaje claro sin descargar nada ni escribir en el timeline

### Requirement: Soporte de carrusel
Cuando la publicación contiene múltiples imágenes, el sistema SHALL descargar todas y registrarlas como parte de la misma entrada del timeline, preservando su orden.

#### Scenario: Post con varias imágenes
- **WHEN** el post contiene N imágenes
- **THEN** se guardan N archivos asociados a una sola entrada, en el orden original

### Requirement: Persistencia de assets y entrada de timeline
El sistema SHALL guardar cada imagen en `assets/maps/` con un nombre derivado del shortcode y SHALL registrar o actualizar la entrada correspondiente en `data/timeline.json` con al menos: shortcode, referencia a las imágenes y el relato.

#### Scenario: Primera ejecución de un post
- **WHEN** el post aún no está en el timeline
- **THEN** se agrega una nueva entrada con sus imágenes y relato

#### Scenario: Re-ejecución idempotente
- **WHEN** se vuelve a ejecutar el pipeline sobre un post ya registrado
- **THEN** la entrada se actualiza sin duplicarse y sin dejar imágenes huérfanas

### Requirement: Degradación y fallback ante bloqueo
El sistema SHALL reportar de forma explícita cuando Instagram impide la descarga anónima, e SHALL permitir incorporar manualmente la imagen y el relato de ese post sin romper la estructura del timeline.

#### Scenario: Instagram bloquea la descarga anónima
- **WHEN** la descarga con sesión anónima falla por bloqueo o rate limit
- **THEN** el pipeline informa el fallo y permite completar la entrada por carga manual (imagen local + texto del relato) con el mismo formato
