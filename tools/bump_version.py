"""Pose le numéro de version du site dans les quatre pages.

Le numéro vaut `v0.N`, N étant le numéro du commit qui va le livrer : le nombre
de commits de `main` plus un. On le lit donc dans l'historique, rien à retenir.

Il est écrit en paramètre `?v=` des trois ressources partagées
(`css/style.css`, `js/veil.js`, `js/main.js`). Sans lui, un navigateur mobile
peut afficher le HTML neuf avec le CSS ou le JS de la veille. Une URL qui
change ne peut pas être servie depuis le cache.

Il a aussi été AFFICHÉ, dans une pastille du bandeau de chantier, pour vérifier
depuis un téléphone qu'une mise en ligne était arrivée. Le bandeau est parti
avec elle ; les `?v=` sont restés, ils continuent de protéger les mises en ligne.

À lancer juste avant chaque commit qui touche au site. Idempotent : le relancer
sans commit entre deux redonne le même numéro.

    python3 tools/bump_version.py        # N = commits + 1
    python3 tools/bump_version.py 42     # N imposé
"""

import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PAGES = ["index.html", "projet-beepz.html", "projet-jm.html", "projet-jimizz.html"]
ASSETS = ["css/style.css", "js/veil.js", "js/main.js"]

# Seuls les attributs sont visés : les commentaires HTML citent `css/style.css`
# entre accents graves, et ils ne doivent pas bouger.
ASSET_RE = re.compile(
    r'((?:href|src)=")(' + "|".join(re.escape(a) for a in ASSETS) + r')(?:\?v=[^"]*)?(")'
)


def next_number():
    out = subprocess.run(
        ["git", "rev-list", "--count", "HEAD"],
        cwd=ROOT, capture_output=True, text=True, check=True,
    )
    return int(out.stdout.strip()) + 1


def main():
    n = int(sys.argv[1]) if len(sys.argv) > 1 else next_number()
    version = f"0.{n}"

    for name in PAGES:
        path = ROOT / name
        html = path.read_text(encoding="utf-8")
        html, assets = ASSET_RE.subn(rf"\g<1>\g<2>?v={version}\g<3>", html)
        if assets != len(ASSETS):
            sys.exit(f"{name} : {assets} ressource(s) trouvée(s), {len(ASSETS)} "
                     f"attendues — rien n'est écrit pour cette page.")
        path.write_text(html, encoding="utf-8")

    print(f"v{version} posée dans les {len(PAGES)} pages.")


if __name__ == "__main__":
    main()
