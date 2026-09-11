#!/usr/bin/env python3
"""Le serveur de dev, qui imite GitHub Pages sur un seul point : les URL sans extension.

GitHub Pages sert `projet-beepz.html` à l'adresse `/projet-beepz`, sans redirection.
`python3 -m http.server` ne le fait pas — il rend un 404 — et comme tous les liens
internes du site sont désormais sans extension, la navigation entre pages cassait
en local alors qu'elle marche en ligne. C'est le genre d'écart qui fait chercher
un bug là où il n'y en a pas.

Une seule règle est ajoutée, la même que celle de Pages : si le chemin demandé
n'existe pas, ne finit pas par « / » et qu'un fichier du même nom suivi de `.html`
existe, on sert celui-là.

Le « / » final reste donc un 404, exactement comme en ligne — et c'est voulu :
`/projet-beepz/` ferait résoudre les chemins relatifs des assets depuis un dossier
qui n'existe pas, et la page se chargerait sans CSS ni images.
"""

import os
import sys
from http.server import HTTPServer, SimpleHTTPRequestHandler


class Handler(SimpleHTTPRequestHandler):
    def translate_path(self, path):
        local = super().translate_path(path)
        if not path.endswith('/') and not os.path.exists(local):
            candidate = local + '.html'
            if os.path.isfile(candidate):
                return candidate
        return local


if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 4173
    print(f'portfolio → http://localhost:{port}/')
    HTTPServer(('', port), Handler).serve_forever()
