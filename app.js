const AVISO = document.getElementById("aviso");
const ESCENAS = document.getElementById("escenas");
const BARRA = document.getElementById("progress");
const HUD_HORA = document.getElementById("hud-hora");
const CUENTA = "@conmapas";

const MUSICA = "audio/musica.mp3";
const VOL_MUSICA = 0.2;
const VOL_MUSICA_DUCK = 0.05;
const VOL_DISCURSO = 0.95;

let entradas = [];
let musica = null;
let sonidoActivo = false;
let botonSonido = null;
let escenaDiscurso = null;

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
  texto.append(meta);

  if (e.audio) {
    const nota = el("p", "scene__discurso", "Discurso · activá el sonido");
    nota.hidden = true;
    texto.appendChild(nota);
    const a = document.createElement("audio");
    a.src = e.audio;
    a.preload = "none";
    a.volume = 0;
    sec._audio = a;
  }

  texto.append(el("h2", "scene__title", e.titulo), parrafos(e.relato));

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
  inner.append(el("h2", "closing__title", e.titulo), parrafos(e.relato));
  sec.appendChild(inner);
  return sec;
}

function portada(e) {
  const bg = document.getElementById("cover-bg");
  if (bg && e.imagenes[0]) bg.style.backgroundImage = `url("${e.imagenes[0]}")`;
}

/* ---------- Audio ---------- */

function fade(audio, destino, ms) {
  if (!audio) return;
  clearInterval(audio._fade);
  const inicio = audio.volume;
  const t0 = performance.now();
  audio._fade = setInterval(() => {
    const k = Math.min(1, (performance.now() - t0) / ms);
    audio.volume = Math.max(0, Math.min(1, inicio + (destino - inicio) * k));
    if (k >= 1) clearInterval(audio._fade);
  }, 40);
}

function setHora(txt) {
  if (!txt || HUD_HORA.textContent === txt) return;
  HUD_HORA.textContent = txt;
  HUD_HORA.classList.remove("flip");
  void HUD_HORA.offsetWidth;
  HUD_HORA.classList.add("flip");
}

function actualizarNotas() {
  document.querySelectorAll(".scene__discurso").forEach((n) => {
    const a = n.closest(".scene")._audio;
    const suena = sonidoActivo && a && !a.paused && a.currentTime > 0;
    n.textContent = !sonidoActivo
      ? "Discurso · activá el sonido"
      : suena
      ? "Reproduciendo el último discurso"
      : "El discurso suena al llegar a esta escena";
  });
}

function reproducirDiscurso(sec) {
  const a = sec && sec._audio;
  if (!a) return;
  if (a.readyState === 0) a.load();
  a.play().catch(() => {});
  fade(a, VOL_DISCURSO, 900);
  if (musica) fade(musica, VOL_MUSICA_DUCK, 900);
  actualizarNotas();
}

function pausarDiscurso(sec) {
  const a = sec && sec._audio;
  if (a) {
    fade(a, 0, 500);
    setTimeout(() => a.pause(), 520);
  }
  if (musica && sonidoActivo) fade(musica, VOL_MUSICA, 700);
  actualizarNotas();
}

function toggleSonido() {
  sonidoActivo = !sonidoActivo;
  document.body.classList.toggle("sonido-on", sonidoActivo);
  botonSonido.setAttribute("aria-pressed", String(sonidoActivo));
  botonSonido.classList.toggle("is-on", sonidoActivo);
  botonSonido.querySelector(".sonido__texto").textContent = sonidoActivo
    ? "Sonido activado"
    : "Activar sonido";
  if (sonidoActivo) {
    if (musica) {
      musica.play().catch(() => {});
      fade(musica, escenaDiscurso ? VOL_MUSICA_DUCK : VOL_MUSICA, 900);
    }
    if (escenaDiscurso) reproducirDiscurso(escenaDiscurso);
  } else {
    if (musica) fade(musica, 0, 400);
    pausarDiscurso(escenaDiscurso);
  }
  actualizarNotas();
}

async function archivoExiste(url) {
  try {
    const r = await fetch(url, { method: "HEAD" });
    return r.ok;
  } catch {
    return false;
  }
}

async function montarSonido() {
  botonSonido = el("button", "sonido");
  botonSonido.type = "button";
  botonSonido.setAttribute("aria-pressed", "false");
  botonSonido.innerHTML =
    '<span class="sonido__icono" aria-hidden="true"><i></i><i></i><i></i><i></i></span>' +
    '<span class="sonido__texto">Activar sonido</span>';
  botonSonido.addEventListener("click", toggleSonido);
  botonSonido.hidden = true;
  document.body.appendChild(botonSonido);

  const hayMusica = await archivoExiste(MUSICA);
  if (hayMusica) {
    musica = new Audio(MUSICA);
    musica.loop = true;
    musica.volume = 0;
    musica.preload = "none";
  }

  let hayDiscurso = false;
  for (const sec of ESCENAS.querySelectorAll(".scene")) {
    if (!sec._audio) continue;
    const ok = await archivoExiste(sec._audio.getAttribute("src"));
    if (ok) {
      const nota = sec.querySelector(".scene__discurso");
      if (nota) nota.hidden = false;
      hayDiscurso = true;
    } else {
      delete sec._audio;
    }
  }

  botonSonido.hidden = !(hayMusica || hayDiscurso);
  actualizarNotas();
}

/* ---------- Observers ---------- */

function activarReveal() {
  const nodos = ESCENAS.querySelectorAll(".scene");
  const animables = ESCENAS.querySelectorAll(".scene, .intro, .closing");
  if (!("IntersectionObserver" in window)) {
    animables.forEach((n) => n.classList.add("visible"));
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
  animables.forEach((n) => revelar.observe(n));

  const activa = new IntersectionObserver(
    (entradas) => {
      entradas.forEach((en) => {
        if (!en.isIntersecting) return;
        const sec = en.target;
        if (sec.dataset.hora) setHora(sec.dataset.hora);
        if (sec._audio) {
          if (sonidoActivo && escenaDiscurso !== sec) {
            if (escenaDiscurso) pausarDiscurso(escenaDiscurso);
            escenaDiscurso = sec;
            reproducirDiscurso(sec);
          } else {
            escenaDiscurso = sec;
          }
        } else if (escenaDiscurso) {
          pausarDiscurso(escenaDiscurso);
          escenaDiscurso = null;
        }
      });
    },
    { rootMargin: "-42% 0px -42% 0px" }
  );
  nodos.forEach((n) => activa.observe(n));
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

  entradas = datos
    .filter(esValida)
    .sort((a, b) => (a.fecha || "").localeCompare(b.fecha || ""));

  const omitidas = datos.length - entradas.length;
  if (omitidas > 0) {
    mostrarAviso(`${omitidas} entrada(s) con datos incompletos fueron omitidas.`);
  }
  if (entradas.length === 0) return;

  portada(entradas[0]);
  ESCENAS.appendChild(intro(entradas[0]));

  const cuerpo = entradas.length > 2 ? entradas.slice(1, -1) : [];
  cuerpo.forEach((e, i) => ESCENAS.appendChild(escena(e, i % 2 === 1)));

  if (entradas.length > 1) ESCENAS.appendChild(cierre(entradas[entradas.length - 1]));

  activarReveal();
  activarProgreso();
  await montarSonido();

  if (location.hash) {
    const destino = document.getElementById(location.hash.slice(1));
    if (destino) window.scrollTo({ top: destino.offsetTop, behavior: "instant" });
  }
}

iniciar();
