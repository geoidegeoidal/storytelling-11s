const AVISO = document.getElementById("aviso");
const LISTA = document.getElementById("timeline");
const CUENTA = "@conmapas";

function mostrarAviso(msg) {
  AVISO.textContent = msg;
  AVISO.hidden = false;
}

function esValida(e) {
  return (
    e &&
    typeof e.relato === "string" &&
    typeof e.titulo === "string" &&
    Array.isArray(e.imagenes) &&
    e.imagenes.length > 0
  );
}

function el(tag, cls, text) {
  const nodo = document.createElement(tag);
  if (cls) nodo.className = cls;
  if (text != null) nodo.textContent = text;
  return nodo;
}

function crearImagen(src, alt) {
  const img = document.createElement("img");
  img.src = src;
  img.alt = alt;
  img.loading = "lazy";
  img.decoding = "async";
  return img;
}

function crearEvento(e) {
  const item = el("li", "evento");

  const marca = el("div", "marca");
  const hora = el("time", "hora");
  const etiqueta = (e.hora || "").trim();
  if (etiqueta) {
    hora.textContent = etiqueta;
  } else {
    hora.textContent = "—";
    hora.classList.add("vacia");
  }
  marca.appendChild(hora);

  const contenido = el("div", "contenido");

  const fuente = el("p", "fuente");
  fuente.appendChild(el("span", null, CUENTA + " · "));
  const enlace = el("a", null, "Ver en Instagram");
  enlace.href = e.url || "#";
  enlace.target = "_blank";
  enlace.rel = "noopener";
  fuente.appendChild(enlace);
  contenido.appendChild(fuente);

  contenido.appendChild(el("h3", "titulo", e.titulo || "Sin título"));

  const media = el("figure", "media");
  e.imagenes.forEach((src, i) => {
    const sufijo = e.imagenes.length > 1 ? ` (${i + 1} de ${e.imagenes.length})` : "";
    media.appendChild(crearImagen(src, `${e.titulo || "Mapa"}${sufijo}`));
  });
  if (e.imagenes.length > 1) {
    media.appendChild(el("figcaption", "contador", `${e.imagenes.length} mapas`));
  }
  contenido.appendChild(media);

  const relato = el("div", "relato");
  e.relato
    .split(/\n{2,}/)
    .map((t) => t.trim())
    .filter(Boolean)
    .forEach((t) => relato.appendChild(el("p", null, t)));
  contenido.appendChild(relato);

  item.append(marca, contenido);
  return item;
}

function revelar() {
  const items = LISTA.querySelectorAll(".evento");
  if (!("IntersectionObserver" in window)) {
    items.forEach((n) => n.classList.add("visible"));
    return;
  }
  const io = new IntersectionObserver(
    (entradas) => {
      entradas.forEach((en) => {
        if (en.isIntersecting) {
          en.target.classList.add("visible");
          io.unobserve(en.target);
        }
      });
    },
    { rootMargin: "0px 0px -10% 0px", threshold: 0.05 }
  );
  items.forEach((n) => io.observe(n));
}

async function iniciar() {
  let datos;
  try {
    const r = await fetch("data/timeline.json", { cache: "no-store" });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    datos = await r.json();
  } catch (err) {
    mostrarAviso(
      `No se pudo cargar data/timeline.json (${err.message}). Serví el sitio por HTTP (por ejemplo, python -m http.server).`
    );
    return;
  }

  if (!Array.isArray(datos)) {
    mostrarAviso("El timeline no tiene el formato esperado.");
    return;
  }

  const validas = datos
    .filter(esValida)
    .sort((a, b) => (a.fecha || "").localeCompare(b.fecha || ""));

  const omitidas = datos.length - validas.length;
  if (omitidas > 0) {
    mostrarAviso(`${omitidas} entrada(s) con datos incompletos fueron omitidas.`);
  }

  validas.forEach((e) => LISTA.appendChild(crearEvento(e)));
  revelar();
}

iniciar();
