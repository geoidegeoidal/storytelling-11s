const AVISO = document.getElementById("aviso");
const ESCENAS = document.getElementById("escenas");
const BARRA = document.getElementById("progress");
const HUD_HORA = document.getElementById("hud-hora");
const CUENTA = "@conmapas";

/* Música de fondo: pegá el link de YouTube o el ID del video.
   Dejá "" para no usar música (o para usar audio/musica.mp3 si existe). */
const YT_MUSICA = "";
const VOL_MUSICA = 0.2;
const VOL_MUSICA_DUCK = 0.05;
const VOL_DISCURSO = 0.95;

let entradas = [];
let musica = null;
let sonidoActivo = false;
let botonSonido = null;
let escenaDiscurso = null;
let ytListo = null;

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

  if (e.audio_embed) sec._audioConfig = { yt: e.audio_embed };
  else if (e.audio) sec._audioConfig = { file: e.audio };

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

  if (sec._audioConfig) {
    const nota = el("p", "scene__discurso", "Discurso · activá el sonido");
    nota.hidden = true;
    texto.appendChild(nota);
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

/* ---------- Fuentes de audio (archivo o embed de YouTube) ---------- */

function fuenteArchivo(src) {
  const a = new Audio(src);
  a.preload = "none";
  a.volume = 0;
  let vol = 0;
  return {
    play() { a.play().catch(() => {}); },
    pause() { a.pause(); },
    vol(v) { vol = Math.max(0, Math.min(1, v)); a.volume = vol; },
    get v() { return vol; },
    onEnd(cb) { a.addEventListener("ended", cb); },
  };
}

function cargarYT() {
  if (ytListo) return ytListo;
  ytListo = new Promise((resolve) => {
    if (window.YT && window.YT.Player) return resolve();
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (prev) prev();
      resolve();
    };
    const s = document.createElement("script");
    s.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(s);
  });
  return ytListo;
}

function extraerIdYT(v) {
  if (!v) return "";
  const s = String(v).trim();
  const m = s.match(/(?:youtu\.be\/|[?&]v=|embed\/|shorts\/|live\/)([A-Za-z0-9_-]{11})/);
  if (m) return m[1];
  return s;
}

async function fuenteYT(id, loop) {
  await cargarYT();
  const vid = extraerIdYT(id);
  const host = el("div", "yt-oculto");
  document.body.appendChild(host);
  const player = new YT.Player(host, {
    videoId: vid,
    playerVars: {
      autoplay: 0,
      controls: 0,
      disablekb: 1,
      loop: loop ? 1 : 0,
      playlist: loop ? vid : undefined,
      playsinline: 1,
      rel: 0,
    },
  });
  let vol = 0;
  let fin = null;
  player.addEventListener("onStateChange", (e) => {
    if (e.data === 0 && fin) fin();
  });
  return {
    play() { try { player.playVideo(); } catch { /* aún no listo */ } },
    pause() { try { player.pauseVideo(); } catch { /* aún no listo */ } },
    vol(v) { vol = Math.max(0, Math.min(1, v)); try { player.setVolume(Math.round(vol * 100)); } catch { /* aún no listo */ } },
    get v() { return vol; },
    onEnd(cb) { fin = cb; },
  };
}

function fadeFuente(f, destino, ms) {
  if (!f) return;
  clearInterval(f._fade);
  const inicio = f.v;
  const t0 = performance.now();
  f._fade = setInterval(() => {
    const k = Math.min(1, (performance.now() - t0) / ms);
    f.vol(inicio + (destino - inicio) * k);
    if (k >= 1) clearInterval(f._fade);
  }, 50);
}

async function archivoExiste(url) {
  try {
    const r = await fetch(url, { method: "HEAD" });
    return r.ok;
  } catch {
    return false;
  }
}

/* ---------- Control de sonido ---------- */

function setHora(txt) {
  if (!txt || HUD_HORA.textContent === txt) return;
  HUD_HORA.textContent = txt;
  HUD_HORA.classList.remove("flip");
  void HUD_HORA.offsetWidth;
  HUD_HORA.classList.add("flip");
}

function actualizarNotas() {
  document.querySelectorAll(".scene__discurso").forEach((n) => {
    const sec = n.closest(".scene");
    const f = sec._fuente;
    const suena = sonidoActivo && f && escenaDiscurso === sec;
    n.textContent = !sonidoActivo
      ? "Discurso · activá el sonido"
      : suena
      ? "Reproduciendo el último discurso"
      : "El discurso suena al llegar a esta escena";
  });
}

function reproducirDiscurso(sec) {
  const f = sec && sec._fuente;
  if (!f) return;
  f.play();
  fadeFuente(f, VOL_DISCURSO, 900);
  if (musica) fadeFuente(musica, VOL_MUSICA_DUCK, 900);
  actualizarNotas();
}

function pausarDiscurso(sec) {
  const f = sec && sec._fuente;
  if (f) {
    fadeFuente(f, 0, 500);
    setTimeout(() => f.pause(), 520);
  }
  if (musica && sonidoActivo) fadeFuente(musica, VOL_MUSICA, 700);
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
      musica.play();
      fadeFuente(musica, escenaDiscurso ? VOL_MUSICA_DUCK : VOL_MUSICA, 900);
    }
    if (escenaDiscurso) reproducirDiscurso(escenaDiscurso);
  } else {
    if (musica) fadeFuente(musica, 0, 400);
    pausarDiscurso(escenaDiscurso);
  }
  actualizarNotas();
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

  let hayAudio = false;

  if (YT_MUSICA) {
    musica = await fuenteYT(YT_MUSICA, true);
    hayAudio = true;
  } else if (await archivoExiste("audio/musica.mp3")) {
    musica = fuenteArchivo("audio/musica.mp3");
    hayAudio = true;
  }

  for (const sec of ESCENAS.querySelectorAll(".scene")) {
    const cfg = sec._audioConfig;
    if (!cfg) continue;
    let fuente = null;
    if (cfg.yt) {
      fuente = await fuenteYT(cfg.yt, false);
    } else if (cfg.file && (await archivoExiste(cfg.file))) {
      fuente = fuenteArchivo(cfg.file);
    }
    if (fuente) {
      fuente.onEnd(() => {
        if (escenaDiscurso === sec) {
          if (musica && sonidoActivo) fadeFuente(musica, VOL_MUSICA, 900);
          actualizarNotas();
        }
      });
      sec._fuente = fuente;
      const nota = sec.querySelector(".scene__discurso");
      if (nota) nota.hidden = false;
      hayAudio = true;
    }
  }

  botonSonido.hidden = !hayAudio;
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
        if (sec._fuente) {
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
