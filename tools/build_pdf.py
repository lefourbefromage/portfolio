#!/usr/bin/env python3
"""Le portfolio PDF, imprimé par Chrome depuis `tools/pdf/portfolio.html`.

    python3 tools/build_pdf.py            → tools/pdf/out/Vincent-Waldmann-Portfolio.pdf

La page source est du HTML ordinaire, à la palette et aux polices du site, mise
en pages A4 paysage (`@page` dans `portfolio.css`). Ce script ne fait que la
servir et l'imprimer : toute la mise en page est dans le CSS, tout le contenu
dans le HTML. Pour relire la mise en page, ouvre la page avec le serveur de dev
(`/tools/pdf/portfolio.html`) : l'écran montre les pages empilées.

POURQUOI UN SERVEUR, ET PAS `file://` : la page relit l'adresse de contact dans
`index.html` avec un `fetch`, que Chrome refuse sur un fichier local. On sert
donc le dépôt sur un port libre, le temps de l'impression, avec le même
gestionnaire que `tools/serve.py`.

LES IMAGES SONT SERVIES RÉDUITES, et c'est ce qui fait tenir le fichier.
Chrome embarque chaque image à sa définition d'origine et sans perte : le
premier essai pesait 48 Mo, quand un formulaire de candidature en accepte
souvent 5 à 10. Le script fait donc deux passes :

  1. il charge la page et relit ce qu'elle a relevé sur chaque `<img>` — sa
     boîte de mise en page (`data-box`) et si sa transparence compte
     (`data-alpha`) ;
  2. il sert à Chrome, AUX MÊMES ADRESSES, des copies ramenées à DEUX FOIS leur
     taille affichée (≈ 190 dpi à l'impression) : en JPEG quand l'image est
     opaque ou posée sur le fond d'encre — elle y est alors aplatie —, en PNG
     quand elle se pose sur autre chose. Rien n'est écrit dans `assets/`, et le
     HTML n'a pas à connaître ces copies.

LE PDF N'EST PAS VERSIONNÉ (`tools/pdf/out/` est ignoré par git). Il porte
l'adresse de contact en clair — c'est son rôle —, et le dépôt est public : voir
« L'adresse de contact » dans CLAUDE.md. Ne le déplace pas hors de `out/`.

Le script s'arrête avant d'imprimer si l'adresse n'a pas été posée dans la page
ou si une police n'a pas chargé : sans ça, un PDF « réussi » pourrait partir
avec un lien de repli ou en police système.
"""

import io
import os
import re
import shutil
import subprocess
import sys
import tempfile
import threading
import time
from html.parser import HTMLParser
from http.server import ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urljoin, urlsplit

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
sys.dont_write_bytecode = True  # pas de __pycache__ dans tools/ en important serve.py
sys.path.insert(0, str(ROOT / 'tools'))
from serve import Handler  # noqa: E402  — la même règle d'URL que le serveur de dev

PAGE = '/tools/pdf/portfolio.html'
OUT = ROOT / 'tools/pdf/out/Vincent-Waldmann-Portfolio.pdf'

CHROME_CANDIDATES = [
    os.environ.get('CHROME', ''),
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    shutil.which('google-chrome') or '',
    shutil.which('chromium') or '',
]

# Le temps virtuel laissé à la page avant l'impression : chargement des images,
# des polices, et le `fetch` de l'adresse. Chrome le fait passer aussi vite
# que possible, ce n'est pas une attente réelle.
BUDGET_MS = 20000

DENSITY = 2          # pixels d'image par pixel CSS : 2 × 96 = 192 dpi
# Les images qui gardent leur transparence partent en PNG, sans perte, que
# Chrome ne sait pas recompresser : ce sont elles qui pèsent (5,7 des 8,7 Mo
# à densité 2). Posées dans des compositions, à petite taille, elles restent
# nettes à 144 dpi.
DENSITY_ALPHA = 1.5
JPEG_QUALITY = 86
INK = (6, 13, 34)    # --ink, le fond des pages : là où s'aplatit la transparence


def chrome():
    for c in CHROME_CANDIDATES:
        if c and Path(c).exists():
            return c
    sys.exit('Chrome introuvable — indique son chemin dans la variable CHROME.')


def serve(derived):
    """Le dépôt, plus les copies réduites servies à la place des originaux."""
    class H(Handler):
        def do_GET(self):
            path = unquote(urlsplit(self.path).path)
            if path in derived:
                body, kind = derived[path]
                self.send_response(200)
                self.send_header('Content-Type', kind)
                self.send_header('Content-Length', str(len(body)))
                self.end_headers()
                self.wfile.write(body)
                return
            super().do_GET()

        def log_message(self, *args):
            pass

    os.chdir(ROOT)
    httpd = ThreadingHTTPServer(('127.0.0.1', 0), H)
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    return httpd


def run(binary, profile, done, *args, timeout=120):
    """Lance Chrome et l'ARRÊTE dès que `done(stdout, stderr)` est vrai.

    ON N'ATTEND PAS QUE CHROME SORTE DE LUI-MÊME, et c'est voulu : sur macOS il
    écrit bien son résultat, puis reste en vie indéfiniment — des services
    d'arrière-plan le retiennent, et les `--disable-…` ci-dessous n'y suffisent
    pas toujours. On guette donc la fin du travail et on coupe.

    `--use-mock-keychain` n'est pas optionnel non plus : avec un profil neuf,
    Chrome demande l'accès au trousseau et attend la réponse EN SILENCE.
    Les deux pannes se ressemblent — un script qui se tait jusqu'au délai.
    """
    proc = subprocess.Popen(
        [binary, '--headless=new', '--disable-gpu', '--no-first-run',
         '--use-mock-keychain', '--password-store=basic',
         '--disable-background-networking', '--disable-sync', '--disable-component-update',
         '--disable-default-apps', '--no-service-autorun', '--disable-extensions',
         '--no-default-browser-check', f'--user-data-dir={profile}',
         '--hide-scrollbars', f'--virtual-time-budget={BUDGET_MS}', *args],
        stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True,
    )
    out, err = [], []

    def pump(stream, sink):
        for line in stream:
            sink.append(line)

    for stream, sink in ((proc.stdout, out), (proc.stderr, err)):
        threading.Thread(target=pump, args=(stream, sink), daemon=True).start()

    deadline = time.monotonic() + timeout
    while proc.poll() is None and time.monotonic() < deadline:
        if done(''.join(out), ''.join(err)):
            time.sleep(.3)  # le dernier octet écrit, pas le premier
            break
        time.sleep(.2)
    proc.kill()
    proc.wait()
    return ''.join(out), ''.join(err)


class Images(HTMLParser):
    """Relève, pour chaque image de la page, la plus grande boîte où elle
    s'affiche et si sa transparence compte quelque part."""

    def __init__(self):
        super().__init__()
        self.found = {}

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag != 'img' or 'data-box' not in a:
            return
        path = urljoin(PAGE, a['src'])
        w, h = (int(n) for n in a['data-box'].split('x'))
        pw, ph, alpha = self.found.get(path, (0, 0, False))
        self.found[path] = (max(w, pw), max(h, ph), alpha or 'data-alpha' in a)


def shrink(path, box_w, box_h, keep_alpha):
    """La copie réduite d'une image, ou None s'il n'y a rien à gagner."""
    src = ROOT / path.lstrip('/')
    if src.suffix == '.svg' or not src.exists() or not box_w:
        return None
    im = Image.open(src).convert('RGBA')
    nw, nh = im.size
    png = keep_alpha and im.getchannel('A').getextrema()[0] < 255
    # La boîte peut rogner l'image (`object-fit: cover`) : on vise la taille
    # à laquelle elle la COUVRE, pas celle où elle y tiendrait entière.
    density = DENSITY_ALPHA if png else DENSITY
    scale = min(1, density * max(box_w / nw, box_h / nh))
    size = (max(1, round(nw * scale)), max(1, round(nh * scale)))
    if size != im.size:
        im = im.resize(size, Image.LANCZOS)

    buf = io.BytesIO()
    if png:
        im.save(buf, 'PNG', optimize=True)
        return buf.getvalue(), 'image/png'
    flat = Image.new('RGB', im.size, INK)
    flat.paste(im, mask=im.getchannel('A'))
    flat.save(buf, 'JPEG', quality=JPEG_QUALITY, optimize=True, progressive=False)
    return buf.getvalue(), 'image/jpeg'


def main():
    binary = chrome()
    derived = {}
    httpd = serve(derived)
    url = f'http://127.0.0.1:{httpd.server_address[1]}{PAGE}'
    OUT.parent.mkdir(parents=True, exist_ok=True)

    # Des profils jetables : Chrome refuse de partager celui d'une session
    # ouverte. Et UN PAR PASSE — avec un seul, la seconde relirait les images
    # d'origine dans le cache de la première, et les copies réduites ne
    # seraient jamais demandées (le PDF pesait toujours 48 Mo).
    with tempfile.TemporaryDirectory() as profile, tempfile.TemporaryDirectory() as profile2:
        dom, _ = run(binary, profile, lambda out, err: '</html>' in out, '--dump-dom', url)
        if 'data-ready="1"' not in dom:
            sys.exit('La page ne s’est pas annoncée prête : impression annulée.')
        if 'data-fonts="1"' not in dom:
            sys.exit('Une police n’a pas chargé : impression annulée.')
        if not re.search(r'<a[^>]*data-mail-slot[^>]*href="mailto:', dom):
            sys.exit('L’adresse de contact n’a pas été posée (index.html a-t-il changé '
                     'de balisage ?) : impression annulée.')

        parser = Images()
        parser.feed(dom)
        before = after = 0
        for path, (w, h, alpha) in parser.found.items():
            small = shrink(path, w, h, alpha)
            if small:
                derived[path] = small
                before += (ROOT / path.lstrip('/')).stat().st_size
                after += len(small[0])

        if OUT.exists():
            OUT.unlink()
        # Chrome annonce la fin de l'écriture sur stderr : « N bytes written to file ».
        _, err = run(binary, profile2, lambda out, err: 'bytes written to file' in err,
                     '--no-pdf-header-footer', f'--print-to-pdf={OUT}', url)

    httpd.shutdown()
    if not OUT.exists():
        sys.exit('Chrome n’a rien écrit.\n' + err[-2000:])

    data = OUT.read_bytes()
    pages = len(re.findall(rb'/Type\s*/Page[^s]', data))
    size = len(data) / 1024 / 1024
    print(f'{len(derived)} images réduites : {before / 1024 / 1024:.1f} Mo → {after / 1024 / 1024:.1f} Mo')
    print(f'{OUT.relative_to(ROOT)} — {pages} pages, {size:.1f} Mo')
    if size > 10:
        print('Attention : au-delà de 10 Mo, beaucoup de formulaires de candidature refusent le fichier.')


if __name__ == '__main__':
    main()
