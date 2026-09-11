#!/usr/bin/env node
/*
 Graba un reel vertical (1080x1920) recorriendo el sitio.

 Uso:
   node scripts/record_reel.mjs [--url http://localhost:8000/] [--out reel-11s.mp4]
                                [--ffmpeg <ruta-al-binario>] [--dur 24]

 Requiere Chrome y ffmpeg (por ejemplo el binario de ffmpeg-static).
 Usa WebSocket nativo de Node 22 + Chrome DevTools Protocol: sin dependencias.
*/
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, cur, i, arr) => {
    if (cur.startsWith("--")) acc.push([cur.slice(2), arr[i + 1] && !arr[i + 1].startsWith("--") ? arr[i + 1] : true]);
    return acc;
  }, [])
);

const URL = args.url || "http://localhost:8000/";
const OUT = path.resolve(args.out || "reel-11s.mp4");
const FFMPEG = args.ffmpeg || "ffmpeg";
const DUR = Number(args.dur || 24);
const FPS = 30;
const HOLD_IN = 2;
const HOLD_OUT = 2.5;
const W = 540;
const H = 960;
const DSF = 2;
const PORT = 9223 + Math.floor(Math.random() * 200);
const PROFILE = fs.mkdtempSync(path.join(os.tmpdir(), "reel-prof-"));
const FRAMES = fs.mkdtempSync(path.join(os.tmpdir(), "reel-frames-"));

const CHROME =
  process.env.CHROME ||
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

async function esperarDebugger(ms) {
  const fin = Date.now() + ms;
  while (Date.now() < fin) {
    try {
      const r = await fetch(`http://127.0.0.1:${PORT}/json/list`);
      if (r.ok) return await r.json();
    } catch { /* aún no */ }
    await sleep(200);
  }
  throw new Error("Chrome no expuso el puerto de depuración");
}

function conectar(wsUrl) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    let id = 0;
    const pend = new Map();
    const eventos = [];
    ws.onopen = () =>
      resolve({
        send(method, params = {}) {
          return new Promise((res, rej) => {
            const i = ++id;
            pend.set(i, { res, rej });
            ws.send(JSON.stringify({ id: i, method, params }));
          });
        },
        on(metodo, cb) { eventos.push([metodo, cb]); },
        cerrar() { try { ws.close(); } catch { /* noop */ } },
        _ws: ws,
        _pend: pend,
        _eventos: eventos,
      });
    ws.onerror = (e) => reject(new Error("WS error: " + (e.message || "")));
    ws.onmessage = (ev) => {
      const m = JSON.parse(ev.data);
      if (m.id && pend.has(m.id)) {
        const p = pend.get(m.id);
        pend.delete(m.id);
        if (m.error) p.rej(new Error(JSON.stringify(m.error)));
        else p.res(m.result);
      } else if (m.method) {
        for (const [met, cb] of eventos) if (met === m.method) cb(m.params);
      }
    };
  });
}

async function main() {
  console.log("Lanzando Chrome…");
  const chrome = spawn(CHROME, [
    "--headless=new",
    "--disable-gpu",
    "--no-first-run",
    "--no-default-browser-check",
    "--hide-scrollbars",
    "--mute-audio",
    `--remote-debugging-port=${PORT}`,
    "--remote-allow-origins=*",
    `--user-data-dir=${PROFILE}`,
    `--window-size=${W},${H}`,
    `--force-device-scale-factor=${DSF}`,
    "about:blank",
  ]);

  const lista = await esperarDebugger(15000);
  const target = lista.find((t) => t.type === "page");
  if (!target) throw new Error("No hay target de página");

  const cdp = await conectar(target.webSocketDebuggerUrl);
  const evaluar = async (fn, ...a) => {
    const expr = `(${fn.toString()})(${a.map((x) => JSON.stringify(x)).join(",")})`;
    const r = await cdp.send("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true });
    if (r.exceptionDetails) throw new Error("eval: " + JSON.stringify(r.exceptionDetails).slice(0, 400));
    return r.result.value;
  };

  await cdp.send("Page.enable");
  let cargada = false;
  cdp.on("Page.loadEventFired", () => { cargada = true; });

  console.log("Navegando a", URL);
  await cdp.send("Page.navigate", { url: URL });
  const fin = Date.now() + 20000;
  while (!cargada && Date.now() < fin) await sleep(150);
  await sleep(3000);

  await evaluar(() => {
    document.getElementById("entrada")?.remove();
    const quitar = () =>
      document.querySelectorAll(".pista-sonido, .sonido").forEach((n) => n.remove());
    quitar();
    new MutationObserver(quitar).observe(document.body, { childList: true, subtree: true });
    document.documentElement.style.scrollBehavior = "auto";
    document.querySelectorAll("img").forEach((i) => (i.loading = "eager"));
    window.scrollTo(0, 0);
  });
  await evaluar(async () => {
    await Promise.all(
      [...document.images].map((img) =>
        img.complete
          ? Promise.resolve()
          : new Promise((r) => {
              img.addEventListener("load", r, { once: true });
              img.addEventListener("error", r, { once: true });
            })
      )
    );
  });

  const maxScroll = await evaluar(() => document.documentElement.scrollHeight - window.innerHeight);
  const total = Math.round(FPS * HOLD_IN) + Math.round(FPS * DUR) + 1 + Math.round(FPS * HOLD_OUT);
  console.log(`Altura: ${maxScroll}px · frames: ${total}`);

  const pasos = [];
  for (let i = 0; i < FPS * HOLD_IN; i++) pasos.push(0);
  const N = Math.round(FPS * DUR);
  for (let i = 0; i <= N; i++) pasos.push(Math.round(easeInOut(i / N) * maxScroll));
  for (let i = 0; i < FPS * HOLD_OUT; i++) pasos.push(maxScroll);

  let n = 0;
  for (const y of pasos) {
    await evaluar((yy) => window.scrollTo(0, yy), y);
    await sleep(45);
    const shot = await cdp.send("Page.captureScreenshot", { format: "jpeg", quality: 90 });
    fs.writeFileSync(path.join(FRAMES, `f${String(n + 1).padStart(5, "0")}.jpg`), Buffer.from(shot.data, "base64"));
    n++;
    if (n % 60 === 0) console.log(`  ${n}/${pasos.length}`);
  }

  cdp.cerrar();
  chrome.kill();

  console.log("Codificando…");
  await new Promise((res, rej) => {
    const ff = spawn(FFMPEG, [
      "-y",
      "-framerate", String(FPS),
      "-i", path.join(FRAMES, "f%05d.jpg"),
      "-vf", "scale=1080:1920:flags=lanczos,setsar=1",
      "-c:v", "libx264",
      "-preset", "medium",
      "-crf", "20",
      "-pix_fmt", "yuv420p",
      "-movflags", "+faststart",
      OUT,
    ]);
    ff.stderr.on("data", () => {});
    ff.on("close", (code) => (code === 0 ? res() : rej(new Error("ffmpeg salió con " + code))));
  });

  fs.rmSync(FRAMES, { recursive: true, force: true });
  console.log("Listo:", OUT);
}

main().catch((e) => {
  console.error("ERROR:", e.message);
  process.exit(1);
});
