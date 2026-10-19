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

Deux réglages de plus, sans lesquels le site mettait de longues secondes à charger
dans Edge et Chrome :
- le serveur est MULTI-FIL. Un `HTTPServer` nu traite une connexion à la fois ; or
  le navigateur ouvre d'avance des connexions qu'il n'utilise pas tout de suite, et
  une seule d'entre elles bloquait toutes les autres jusqu'à son expiration ;
- il écoute en IPv4 ET en IPv6. `localhost` se résout d'abord en `::1` sous
  Windows : sans IPv6, chaque connexion attendait l'échec avant de se rabattre.
"""

import os
import socket
import sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer


class Handler(SimpleHTTPRequestHandler):
    def translate_path(self, path):
        local = super().translate_path(path)
        if not path.endswith('/') and not os.path.exists(local):
            candidate = local + '.html'
            if os.path.isfile(candidate):
                return candidate
        return local


class DualStackServer(ThreadingHTTPServer):
    address_family = socket.AF_INET6
    daemon_threads = True

    def server_bind(self):
        # Accepte aussi l'IPv4 sur la même socket (::ffff:127.0.0.1).
        try:
            self.socket.setsockopt(socket.IPPROTO_IPV6, socket.IPV6_V6ONLY, 0)
        except (AttributeError, OSError):
            pass
        super().server_bind()


if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 4173
    # Sous Windows, une sortie redirigée (le panneau navigateur) est en cp1252, qui ne
    # sait pas écrire la flèche : sans ça le serveur meurt au démarrage.
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    print(f'portfolio → http://localhost:{port}/', flush=True)
    try:
        server = DualStackServer(('::', port), Handler)
    except OSError:
        # Pas d'IPv6 sur la machine : IPv4 seul, toujours multi-fil.
        server = ThreadingHTTPServer(('', port), Handler)
        server.daemon_threads = True
    server.serve_forever()
