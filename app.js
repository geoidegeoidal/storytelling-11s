const AVISO = document.getElementById("aviso");
const ESCENAS = document.getElementById("escenas");
const BARRA = document.getElementById("progress");
const HUD_HORA = document.getElementById("hud-hora");
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

function crearImagen(src, alt, lazy) {
  const img = document.createElement("img");
  img.src = src;
  img.alt = alt;
  if (lazy !== false) img.loading = "lazy";
  img.decoding = "async";
  return img;
}

function parrafos(texto) {
  const box = el("div", "relato");
  texto
    .split(/\n{2,}/)
    .map((t) => t.trim())
    .filter(Boolean)
    .forEach((t) => box.appendChild(el("p", null, t)));
  return box;
}

function media(e) {
  const fig = el("figure", "media");
  fig.appendChild(crearImagen(e.imagenes[0], e.titulo));
  return fig;
}

function fuenteLink(e) {
  const a = el("a", "scene__src", "Ver en Instagram");
  a.href = e.url || "#";
  a.target = "_blank";
  a.rel = "noopener";
  return a;
}

function escena(e, flip) {
  const sec = el("section", "scene" + (flip ? " scene--flip" : ""));
  sec.id = e.shortcode;
  sec.dataset.hora = e.hora || "";

  const texto = el("div", "scene__text");
  const meta = el("p", "scene__meta");
  const hora = el("span", "scene__hora");
  if (e.hora) {
    hora.textContent = e.hora;
  } else {
    hora.classList.add("vacia");
  }
  meta.append(hora, fuenteLink(e));
  texto.append(meta, el("h2", "scene__title", e.titulo), parrafos(e.relato));

  const col = el("div", "scene__media");
  col.appendChild(media(e));

  sec.append(texto, col);
  return sec;
}

function intro(e) {
  const sec = el("section", "intro");
  sec.append(el("h2", "intro__title", e.titulo), parrafos(e.relato));
  return sec;
}

function cierre(e) {
  const sec = el("section", "closing");
  if (e.imagenes[0]) {
    const bg = el("div", "closing__bg");
    bg.style.backgroundImage = `url("${e.imagenes[0]}")`;
    sec.appendChild(bg);
  }
  const inner = el("div", "closing__inner");
  inner.append(el("h2", "scene__title", e.titulo), parrafos(e.relato));
  sec.appendChild(inner);
  return sec;
}

function portada(e) {
  const bg = document.getElementById("cover-bg");
  if (bg && e.imagenes[0]) bg.style.backgroundImage = `url("${e.imagenes[0]}")`;
}

function activarReveal() {
  const nodos = ESCENAS.querySelectorAll(".scene");
  if (!("IntersectionObserver" in window)) {
    nodos.forEach((n) => n.classList.add("visible"));
    return;
  }
  const revelar = new IntersectionObserver(
    (entradas) => {
      entradas.forEach((en) => {
        if (en.isIntersecting) {
          en.target.classList.add("visible");
          revelar.unobserve(en.target);
        }
      });
    },
    { rootMargin: "0px 0px -12% 0px", threshold: 0.05 }
  );
  nodos.forEach((n) => revelar.observe(n));

  const hud = new IntersectionObserver(
    (entradas) => {
      entradas.forEach((en) => {
        if (en.isIntersecting && en.target.dataset.hora) {
          HUD_HORA.textContent = en.target.dataset.hora;
        }
      });
    },
    { rootMargin: "-48% 0px -48% 0px" }
  );
  nodos.forEach((n) => hud.observe(n));
}

function activarProgreso() {
  let pendiente = false;
  const pintar = () => {
    const doc = document.documentElement;
    const total = doc.scrollHeight - doc.clientHeight;
    const avance = total > 0 ? doc.scrollTop / total : 0;
    BARRA.style.transform = `scaleX(${avance})`;
    pendiente = false;
  };
  window.addEventListener(
    "scroll",
    () => {
      if (!pendiente) {
        pendiente = true;
        requestAnimationFrame(pintar);
      }
    },
    { passive: true }
  );
  pintar();
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
  if (validas.length === 0) return;

  portada(validas[0]);
  ESCENAS.appendChild(intro(validas[0]));

  const cuerpo = validas.length > 2 ? validas.slice(1, -1) : [];
  cuerpo.forEach((e, i) => ESCENAS.appendChild(escena(e, i % 2 === 1)));

  if (validas.length > 1) ESCENAS.appendChild(cierre(validas[validas.length - 1]));

  activarReveal();
  activarProgreso();

  if (location.hash) {
    const destino = document.getElementById(location.hash.slice(1));
    if (destino) window.scrollTo({ top: destino.offsetTop, behavior: "instant" });
  }
}

iniciar();
