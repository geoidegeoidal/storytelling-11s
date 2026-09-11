#!/usr/bin/env python
"""Rescata mapas y relatos de posts de Instagram al timeline del 11-S.

Uso:
    python scripts/fetch_post.py <url-de-instagram> [<url> ...]

Requiere instaloader (ver .venv). Sin login funciona para posts públicos;
si Instagram bloquea, reintentar más tarde o cargar la entrada a mano.
"""
import argparse
import json
import os
import re
import shutil
import sys
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TIMELINE = ROOT / "data" / "timeline.json"
IMAGES = ROOT / "assets" / "maps"

SHORTCODE = re.compile(r"instagram\.com/(?:p|reel|tv)/([A-Za-z0-9_-]+)")


def fix_ca_bundle():
    """Si CURL_CA_BUNDLE apunta a un archivo inexistente, usar el bundle de certifi."""
    ca = os.environ.get("CURL_CA_BUNDLE")
    if ca and not os.path.exists(ca):
        try:
            import certifi
            os.environ["CURL_CA_BUNDLE"] = certifi.where()
        except ImportError:
            os.environ.pop("CURL_CA_BUNDLE", None)


def shortcode(url):
    m = SHORTCODE.search(url)
    if not m:
        raise ValueError(f"URL no reconocida: {url}")
    return m.group(1)


def titulo_from(caption):
    for line in (caption or "").splitlines():
        line = line.strip()
        if line:
            return line if len(line) <= 120 else line[:117] + "..."
    return ""


def media_urls(post):
    if post.typename == "GraphSidecar":
        for node in post.get_sidecar_nodes():
            if node.is_video:
                yield node.video_url, ".mp4"
            else:
                yield node.display_url, ".jpg"
    elif post.is_video:
        yield post.video_url, ".mp4"
    else:
        yield post.url, ".jpg"


def download(url, dest):
    if dest.exists():
        return dest
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=60) as r, open(dest, "wb") as f:
        shutil.copyfileobj(r, f)
    return dest


def load_timeline():
    if TIMELINE.exists():
        return json.loads(TIMELINE.read_text(encoding="utf-8"))
    return []


def save_timeline(entries):
    TIMELINE.parent.mkdir(parents=True, exist_ok=True)
    TIMELINE.write_text(
        json.dumps(entries, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )


def process(url):
    import instaloader

    sc = shortcode(url)
    loader = instaloader.Instaloader(quiet=True)
    post = instaloader.Post.from_shortcode(loader.context, sc)

    paths = []
    for i, (media_url, ext) in enumerate(media_urls(post), 1):
        dest = IMAGES / f"{sc}_{i}{ext}"
        download(media_url, dest)
        paths.append(dest.relative_to(ROOT).as_posix())

    IMAGES.mkdir(parents=True, exist_ok=True)
    for stale in IMAGES.glob(f"{sc}_*"):
        if stale.relative_to(ROOT).as_posix() not in paths:
            stale.unlink()

    entries = load_timeline()
    old = next((e for e in entries if e.get("shortcode") == sc), {})
    entry = {
        "shortcode": sc,
        "url": f"https://www.instagram.com/p/{sc}/",
        "fecha": post.date_utc.isoformat(),
        "hora": old.get("hora", ""),
        "titulo": old.get("titulo") or titulo_from(post.caption),
        "relato": post.caption or "",
        "imagenes": paths,
    }
    entries = [e for e in entries if e.get("shortcode") != sc]
    entries.append(entry)
    entries.sort(key=lambda e: e.get("fecha") or "")
    save_timeline(entries)
    return entry


def main():
    fix_ca_bundle()
    ap = argparse.ArgumentParser(description="Rescata posts de Instagram al timeline.")
    ap.add_argument("urls", nargs="+", help="URLs de publicaciones de Instagram")
    args = ap.parse_args()

    failed = 0
    for url in args.urls:
        try:
            e = process(url)
            print(f"OK  {e['shortcode']}  {len(e['imagenes'])} img  {e['titulo'][:60]}")
        except Exception as ex:
            failed += 1
            print(f"FALLO  {url}: {ex}", file=sys.stderr)
            print(
                "  Fallback manual: guardá la imagen en assets/maps/ y agregá una "
                "entrada a data/timeline.json (mismos campos que las demás).",
                file=sys.stderr,
            )
    return 1 if failed else 0


def _demo():
    assert shortcode("https://www.instagram.com/p/ABC123/?img_index=1") == "ABC123"
    assert shortcode("https://www.instagram.com/reel/XYZ-9/") == "XYZ-9"
    try:
        shortcode("https://example.com/foo")
    except ValueError:
        pass
    else:
        raise AssertionError("debió rechazar una URL que no es de Instagram")
    assert titulo_from("Hola\n\nmundo") == "Hola"
    assert titulo_from("") == ""
    assert titulo_from("x" * 200).endswith("...")
    print("demo ok")


if __name__ == "__main__":
    if "--demo" in sys.argv:
        _demo()
    else:
        sys.exit(main())
