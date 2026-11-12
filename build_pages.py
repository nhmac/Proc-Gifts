"""
Gera o site do Proc-Gifts para o GitHub Pages na pasta _site/.

Build: py build_pages.py
Publicar: commit e git push para o main. O GitHub Actions (.github/workflows/pages.yml)
corre este script e publica a pasta _site/ no GitHub Pages.
(Só biblioteca padrão: corre com o Python instalado, sem .venv.)

A fonte é o web\\gifts.html (não usa bibliotecas). O build só a embrulha no documento
HTML e junta:
    - a fonte Inter servida pelo próprio site (Inter\\static), sem CDNs
    - manifest + service worker: a página pode ser instalada como app (ícone no
      Ambiente de Trabalho e na barra de tarefas) e funciona sem internet
"""

import hashlib
import json
import os
import shutil

PROJETO = os.path.dirname(os.path.abspath(__file__))
FONTE = os.path.join(PROJETO, "web", "gifts.html")
DESTINO = os.path.join(PROJETO, "_site")
NOME = "Proc-Gifts"

COPIAR = {
    "vendor/pdfjs/pdf.min.js": "web/vendor/pdfjs/pdf.min.js",
    "vendor/pdfjs/pdf.worker.min.js": "web/vendor/pdfjs/pdf.worker.min.js",
    "vendor/pdfjs/LICENSE": "web/vendor/pdfjs/LICENSE",
    "fonts/Inter_18pt-Regular.ttf": "Inter/static/Inter_18pt-Regular.ttf",
    "fonts/Inter_18pt-SemiBold.ttf": "Inter/static/Inter_18pt-SemiBold.ttf",
    "fonts/Inter_24pt-SemiBold.ttf": "Inter/static/Inter_24pt-SemiBold.ttf",
    "fonts/OFL.txt": "Inter/OFL.txt",
    "icone.ico": "icone.ico",
    "icon-192.png": "web/icon-192.png",
    "icon-512.png": "web/icon-512.png",
}

DESCRICAO = "Diz a que processo pertence cada encomenda de Presentes Personalizados, pelo nome da pasta de produto."

FONTES_CSS = """<style>
  @font-face { font-family: "Inter"; font-weight: 400; font-display: swap; src: url("fonts/Inter_18pt-Regular.ttf") format("truetype"); }
  @font-face { font-family: "Inter"; font-weight: 600; font-display: swap; src: url("fonts/Inter_18pt-SemiBold.ttf") format("truetype"); }
  @font-face { font-family: "Inter Display"; font-weight: 600; font-display: swap; src: url("fonts/Inter_24pt-SemiBold.ttf") format("truetype"); }
  body { margin: 0; }
  [hidden] { display: none !important; }
</style>"""

SW = """// Gerado pelo build_pages.py
const CACHE = "proc-gifts-%(versao)s";
const FICHEIROS = %(ficheiros)s;

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FICHEIROS)));
  self.skipWaiting();
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(chaves => Promise.all(chaves.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

// Rede primeiro: com internet vê-se sempre a versão publicada; sem internet usa a cópia guardada
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET" || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(
    fetch(e.request)
      .then(r => {
        if (r.ok) {
          const copia = r.clone();
          caches.open(CACHE).then(c => c.put(e.request, copia));
        }
        return r;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true }))
  );
});
"""

def gerar_html():
    with open(FONTE, encoding="utf-8") as f:
        html = f.read()

    for externo in ("http://", "https://"):
        if f'src="{externo}' in html or f'href="{externo}' in html:
            raise SystemExit(f"build_pages: web/gifts.html carrega um recurso de fora ({externo}); o site tem de ser autónomo")

    titulo, resto = html.split("\n", 1)
    if not titulo.startswith("<title>"):
        raise SystemExit("build_pages: a primeira linha de web/gifts.html devia ser o <title>")
    estilo, corpo = resto.split("</style>\n", 1)

    return f"""<!doctype html>
<html lang="pt-PT">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="description" content="{DESCRICAO}">
<meta name="theme-color" content="#15171c">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" href="icone.ico">
<link rel="apple-touch-icon" href="icon-192.png">
{titulo}
{FONTES_CSS}
{estilo}</style>
</head>
<body>
{corpo}
<script>
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {{}});
</script>
</body>
</html>
"""


def main():
    # Começa sempre de uma pasta vazia
    shutil.rmtree(DESTINO, ignore_errors=True)
    os.makedirs(DESTINO)

    def escrever(rel, conteudo):
        with open(os.path.join(DESTINO, rel), "w", encoding="utf-8", newline="\n") as f:
            f.write(conteudo)

    escrever("index.html", gerar_html())
    for rel, origem in COPIAR.items():
        destino = os.path.join(DESTINO, *rel.split("/"))
        os.makedirs(os.path.dirname(destino), exist_ok=True)
        shutil.copy2(os.path.join(PROJETO, *origem.split("/")), destino)

    escrever("manifest.webmanifest", json.dumps({
        "name": NOME,
        "short_name": NOME,
        "description": DESCRICAO,
        "lang": "pt-PT",
        "start_url": "./",
        "scope": "./",
        "display": "standalone",
        "background_color": "#15171c",
        "theme_color": "#15171c",
        "icons": [
            {"src": "icon-192.png", "sizes": "192x192", "type": "image/png"},
            {"src": "icon-512.png", "sizes": "512x512", "type": "image/png"},
        ],
    }, ensure_ascii=False, indent=2) + "\n")

    # A versão do cache muda sempre que algum ficheiro muda: o service worker novo substitui o antigo
    ficheiros = ["./"] + sorted(
        os.path.relpath(os.path.join(r, f), DESTINO).replace(os.sep, "/")
        for r, _, fs in os.walk(DESTINO) if ".git" not in os.path.relpath(r, DESTINO).split(os.sep)
        for f in fs if not (r == DESTINO and f == "README.md"))
    soma = hashlib.sha256()
    for rel in ficheiros[1:]:
        with open(os.path.join(DESTINO, rel), "rb") as f:
            soma.update(rel.encode() + f.read())
    escrever("sw.js", SW % {"versao": soma.hexdigest()[:12], "ficheiros": json.dumps(ficheiros)})
    escrever(".nojekyll", "")

    todos = [os.path.join(r, f) for r, _, fs in os.walk(DESTINO)
             if ".git" not in os.path.relpath(r, DESTINO).split(os.sep) for f in fs]
    print(f"Site: {DESTINO} ({len(todos)} ficheiros, {sum(map(os.path.getsize, todos)) / 2**20:.1f} MB)")


if __name__ == "__main__":
    main()
