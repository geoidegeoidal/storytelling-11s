const AVISO = document.getElementById("aviso");
const ESCENAS = document.getElementById("escenas");
const BARRA = document.getElementById("progress");
const HUD_HORA = document.getElementById("hud-hora");
const ENTRADA = document.getElementById("entrada");
const CUENTA = "@conmapas";

/* Música de fondo: pegá el link de YouTube o el ID del video.
   Dejá "" para no usar música (o para usar audio/musica.mp3 si existe). */
const YT_MUSICA = "6TvCfFvPdWs";
const VOL_MUSICA = 0.2;
const VOL_MUSICA_DUCK = 0.05;
const VOL_DISCURSO = 0.95;

/* Navegador dentro de apps (Instagram, Facebook, TikTok…): no permite
   controlar YouTube por código, así que ahí mostramos un reproductor visible
   para que la persona toque el play del propio YouTube. */
const EN_APP = /Instagram|FBAN|FBAV|FB_IAB|Messenger|TikTok|Line\//i.test(navigator.userAgent);

let entradas = [];
let musica = null;
let sonidoActivo = true;
let desbloqueado = false;
let bloqueoArmado = false;
let hayFuenteEscena = false;
let botonSonido = null;
let pistaSonido = null;
let escenaDiscurso = null;
let ytListo = null;
let idMusica = YT_MUSICA;
let idDiscurso = "";
let cardYt = null;
let cardHost = null;
let cardLabel = null;

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

  if (e.audio_embed) {
    sec._audioConfig = { yt: e.audio_embed };
    sec._discursoId = e.audio_embed;
  } else if (e.audio) {
    sec._audioConfig = { file: e.audio };
  }

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
    const nota = el("p", "scene__discurso", "Activa el sonido");
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
    play() {
      return a
        .play()
        .then(() => true)
        .catch(() => false);
    },
    pause() { a.pause(); },
    vol(v) { vol = Math.max(0, Math.min(1, v)); a.volume = vol; },
    get v() { return vol; },
    onEnd(cb) { a.addEventListener("ended", cb); },
  };
}

const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

function cargarYT() {
  if (ytListo) return ytListo;
  ytListo = new Promise((resolve, reject) => {
    if (window.YT && window.YT.Player) return resolve();
    const t = setTimeout(() => {
      ytListo = null;
      reject(new Error("YouTube API timeout"));
    }, 10000);
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      clearTimeout(t);
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
  let marcarListo;
  const listo = new Promise((r) => (marcarListo = r));
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
    events: { onReady: () => marcarListo() },
  });
  let vol = 0;
  let fin = null;
  player.addEventListener("onStateChange", (e) => {
    if (e.data === 0 && fin) fin();
  });
  await Promise.race([listo, esperar(6000)]);
  return {
    play() {
      return new Promise((resolve) => {
        try {
          player.mute();
          player.playVideo();
        } catch {
          return resolve(false);
        }
        setTimeout(() => {
          try { player.unMute(); } catch { /* noop */ }
          let estado = -1;
          try { estado = player.getPlayerState(); } catch { estado = -1; }
          resolve(estado === 1 || estado === 3);
        }, 700);
      });
    },
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
    if (EN_APP) {
      n.textContent = "Discurso · toca el botón de sonido";
      return;
    }
    const suena = sonidoActivo && desbloqueado && escenaDiscurso === sec;
    n.textContent = suena
      ? "Reproduciendo el último discurso"
      : desbloqueado
      ? "El discurso suena al llegar a esta escena"
      : "Discurso · activa el sonido";
  });
}

function actualizarBoton() {
  if (!botonSonido) return;
  if (EN_APP) {
    botonSonido.hidden = !cardHost;
    return;
  }
  botonSonido.hidden = !(musica || hayFuenteEscena);
  botonSonido.classList.toggle("is-on", sonidoActivo && desbloqueado);
  botonSonido.setAttribute("aria-pressed", String(sonidoActivo));
  const t = botonSonido.querySelector(".sonido__texto");
  if (t) t.textContent = sonidoActivo ? "Sonido" : "Silencio";
}

function mostrarPista() {
  if (pistaSonido || desbloqueado) return;
  pistaSonido = el("button", "pista-sonido", "Activa el sonido");
  pistaSonido.type = "button";
  pistaSonido.addEventListener("click", desbloquear);
  document.body.appendChild(pistaSonido);
}

function ocultarPista() {
  if (pistaSonido) {
    pistaSonido.remove();
    pistaSonido = null;
  }
}

async function reproducirDiscurso(sec) {
  const f = sec && sec._fuente;
  if (!f) return false;
  const ok = await f.play();
  fadeFuente(f, VOL_DISCURSO, 900);
  if (musica) fadeFuente(musica, VOL_MUSICA_DUCK, 900);
  actualizarNotas();
  return ok;
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

async function desbloquear() {
  desbloqueado = true;
  document.body.classList.add("sonido-on");
  ocultarPista();
  actualizarBoton();
  if (!sonidoActivo) return;
  let ok = true;
  if (musica) {
    ok = await musica.play();
    fadeFuente(musica, escenaDiscurso ? VOL_MUSICA_DUCK : VOL_MUSICA, ok ? 900 : 0);
  }
  if (escenaDiscurso) ok = (await reproducirDiscurso(escenaDiscurso)) || ok;
  if (!ok) {
    desbloqueado = false;
    document.body.classList.remove("sonido-on");
    mostrarPista();
    armarDesbloqueo();
  }
  actualizarBoton();
  actualizarNotas();
}

function armarDesbloqueo() {
  if (bloqueoArmado) return;
  bloqueoArmado = true;
  const eventos = ["pointerdown", "keydown", "touchstart"];
  const once = () => {
    eventos.forEach((e) => window.removeEventListener(e, once));
    desbloquear();
  };
  eventos.forEach((e) => window.addEventListener(e, once, { passive: true }));
}

function mostrarEntrada() {
  if (!ENTRADA) return;
  ENTRADA.hidden = false;
  document.body.classList.add("entrada-abierta");
  const si = document.getElementById("entrada-si");
  const no = document.getElementById("entrada-no");
  if (si) {
    si.addEventListener("click", () => {
      sonidoActivo = true;
      document.body.classList.add("sonido-on");
      if (EN_APP) {
        mostrarCard();
        cerrarEntrada();
        return;
      }
      if (musica) musica.play();
      desbloquear();
      cerrarEntrada();
    });
    si.focus();
  }
  if (no) {
    no.addEventListener("click", () => {
      sonidoActivo = false;
      document.body.classList.remove("sonido-on");
      actualizarBoton();
      actualizarNotas();
      cerrarEntrada();
    });
  }
}

function cerrarEntrada() {
  if (!ENTRADA) return;
  ENTRADA.classList.add("entrada--fuera");
  document.body.classList.remove("entrada-abierta");
  setTimeout(() => {
    ENTRADA.hidden = true;
  }, 520);
}

function toggleSonido() {
  sonidoActivo = !sonidoActivo;
  if (sonidoActivo) {
    desbloquear();
  } else {
    document.body.classList.remove("sonido-on");
    if (musica) fadeFuente(musica, 0, 400);
    pausarDiscurso(escenaDiscurso);
  }
  actualizarBoton();
  actualizarNotas();
}

function crearBotonSonido() {
  const b = el("button", "sonido");
  b.type = "button";
  b.setAttribute("aria-pressed", "true");
  b.innerHTML =
    '<span class="sonido__icono" aria-hidden="true"><i></i><i></i><i></i><i></i></span>' +
    '<span class="sonido__texto">Sonido</span>';
  b.hidden = true;
  return b;
}

async function montarSonido() {
  botonSonido = crearBotonSonido();
  botonSonido.addEventListener("click", toggleSonido);
  document.body.appendChild(botonSonido);

  try {
    if (YT_MUSICA) {
      musica = await fuenteYT(YT_MUSICA, true);
    } else if (await archivoExiste("audio/musica.mp3")) {
      musica = fuenteArchivo("audio/musica.mp3");
    }
  } catch {
    musica = null;
  }

  for (const sec of ESCENAS.querySelectorAll(".scene")) {
    const cfg = sec._audioConfig;
    if (!cfg) continue;
    let fuente = null;
    try {
      if (cfg.yt) {
        fuente = await fuenteYT(cfg.yt, false);
      } else if (cfg.file && (await archivoExiste(cfg.file))) {
        fuente = fuenteArchivo(cfg.file);
      }
    } catch {
      fuente = null;
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
      hayFuenteEscena = true;
    }
  }

  actualizarBoton();
}

function mostrarCard() {
  if (cardHost) cardHost.hidden = false;
}

async function montarSonidoApp() {
  document.body.classList.add("in-app");

  cardHost = el("div", "yt-card");
  const frame = el("div", "yt-card__frame");
  const slot = el("div");
  frame.appendChild(slot);
  cardHost.appendChild(frame);

  botonSonido = crearBotonSonido();
  botonSonido.querySelector(".sonido__texto").textContent = "Sonido";
  cardHost.appendChild(botonSonido);

  cardHost.hidden = true;
  document.body.appendChild(cardHost);

  try {
    await cargarYT();
    cardYt = new YT.Player(slot, {
      videoId: idMusica || idDiscurso,
      playerVars: { controls: 1, playsinline: 1, rel: 0, modestbranding: 1 },
    });
    cardYt.addEventListener("onStateChange", (e) => {
      if (botonSonido) botonSonido.classList.toggle("is-on", e.data === 1);
    });
  } catch {
    cardYt = null;
    mostrarAviso(
      "Este navegador no permite reproducir YouTube. Abre el enlace en Safari o Chrome para escuchar."
    );
  }

  actualizarBoton();
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
        if (EN_APP) {
          if (sec._discursoId && cardYt) {
            try { cardYt.loadVideoById(sec._discursoId); } catch { /* noop */ }
            if (cardLabel) cardLabel.textContent = "Último discurso de Allende";
            mostrarCard();
          }
          return;
        }
        if (sec._fuente) {
          if (sonidoActivo && escenaDiscurso !== sec) {
            if (escenaDiscurso) pausarDiscurso(escenaDiscurso);
            escenaDiscurso = sec;
            reproducirDiscurso(sec).then((ok) => {
              if (ok) {
                desbloqueado = true;
                document.body.classList.add("sonido-on");
                ocultarPista();
              } else {
                mostrarPista();
                armarDesbloqueo();
              }
              actualizarBoton();
              actualizarNotas();
            });
          } else {
            escenaDiscurso = sec;
          }
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

  idDiscurso = (entradas.find((e) => e.audio_embed) || {}).audio_embed || "";

  portada(entradas[0]);
  ESCENAS.appendChild(intro(entradas[0]));

  const cuerpo = entradas.length > 2 ? entradas.slice(1, -1) : [];
  cuerpo.forEach((e, i) => ESCENAS.appendChild(escena(e, i % 2 === 1)));

  if (entradas.length > 1) ESCENAS.appendChild(cierre(entradas[entradas.length - 1]));

  activarReveal();
  activarProgreso();

  if (EN_APP) {
    if (idMusica || idDiscurso) {
      await montarSonidoApp();
      mostrarEntrada();
    } else if (ENTRADA) {
      ENTRADA.remove();
    }
  } else {
    await montarSonido();
    if (musica || hayFuenteEscena) mostrarEntrada();
    else if (ENTRADA) ENTRADA.remove();
  }

  if (location.hash) {
    const destino = document.getElementById(location.hash.slice(1));
    if (destino) window.scrollTo({ top: destino.offsetTop, behavior: "instant" });
  }
}

iniciar();
