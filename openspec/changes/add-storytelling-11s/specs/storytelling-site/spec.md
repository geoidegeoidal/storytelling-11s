## Purpose

Presentar en un sitio web estático el relato hora a hora del 11 de septiembre de 1973, mostrando en cada corte temporal el mapa y el relato que lo acompañan.

## ADDED Requirements

### Requirement: Timeline cronológico
El sitio SHALL mostrar las entradas del timeline en orden cronológico según su hora, de la más temprana a la más tardía.

#### Scenario: Orden de las entradas
- **WHEN** se carga el sitio
- **THEN** las entradas aparecen ordenadas por su hora, independientemente del orden en que fueron rescatadas

### Requirement: Contenido por entrada
Cada entrada SHALL mostrar su hora, un título, el/los mapas asociados y el relato completo.

#### Scenario: Entrada con una imagen
- **WHEN** una entrada tiene una imagen
- **THEN** se muestra la hora, el título, la imagen y el relato

#### Scenario: Entrada con carrusel
- **WHEN** una entrada tiene varias imágenes
- **THEN** se muestran todas, navegables, dentro de la misma entrada

### Requirement: Contenido dirigido por datos
El sitio SHALL renderizarse a partir de `data/timeline.json`, de modo que agregar o editar una entrada no requiera modificar el código del sitio.

#### Scenario: Alta de una nueva entrada
- **WHEN** se agrega una entrada válida a `data/timeline.json`
- **THEN** el sitio la muestra sin cambios en HTML/CSS/JS

#### Scenario: Datos ausentes o inválidos
- **WHEN** `data/timeline.json` no está disponible o una entrada está malformada
- **THEN** el sitio no queda en blanco: informa el problema y renderiza las entradas válidas

### Requirement: Publicación estática y responsiva
El sitio SHALL funcionar como archivos estáticos sin backend y SHALL ser legible en pantallas de escritorio y móvil.

#### Scenario: Sin backend
- **WHEN** los archivos se sirven desde un hosting estático
- **THEN** el sitio funciona completamente sin llamadas a un servidor propio

#### Scenario: Pantalla móvil
- **WHEN** el sitio se abre en un ancho de pantalla reducido
- **THEN** el contenido se reacomoda sin desbordes horizontales y mantiene la legibilidad
