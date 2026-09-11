#!/usr/bin/env python3
"""Prépare les captures de sites de la facette « sites » de projet-jm.html.

Mêmes règles que tools/build_social.py : les sources vivent hors dépôt dans
assets/jm/ (jusqu'à 9,4 Mo la pièce), seuls les .webp produits ici, dans
assets/jm/shots/, sont versionnés.

    python3 tools/build_shots.py

LE FLOUTAGE NE SE FAIT PLUS ICI. Il l'a fait un temps, par zones ; Vincent floute
désormais ses captures à la main en amont, et la page pose par-dessus un gate
« NSFW » à cliquer (`.nsfw` dans le CSS). Les sources sont donc reprises TELLES
QUELLES, et les rectangles ci-dessous sont conservés inertes : ils documentent ce
qui n'est PAS flouté à la source, et se réactivent en les remettant dans la liste
de l'entrée concernée.

À savoir si tu les réactives : le gate est une porte, pas une censure. Il masque à
l'écran, mais le .webp reste directement accessible par son URL — seul un flou cuit
dans le fichier rend un visuel réellement inaccessible.

Les rectangles sont en FRACTIONS de l'image (x0, y0, x1, y1), pas en pixels :
une capture réexportée à une autre définition garde le même traitement.
"""

import os
from PIL import Image, ImageFilter

SRC = "assets/jm"
OUT = "assets/jm/shots"
QUALITY = 82

# (source, slug, recadrage | None, [rectangles à flouter], largeur d'export, alt)
#
# `recadrage` en fractions lui aussi. Les captures pleine page font jusqu'à
# 9941 px de haut : affichées en entier elles seraient illisibles, et un cadre
# défilant a déjà été essayé puis retiré sur la page Beepz. On garde donc le haut.
SHOTS = [
    # La maquette propre de JMTV, pleine page et sans recadrage : c'est elle qui
    # est montrée en grand, à côté de sa version mobile (voir `.shots-pair`).
    # Elle remplace un crop du haut de `new-desktop.png`, plus ancien et moins net ;
    # la source est conservée, l'entrée est simplement sortie de cette liste.
    ("jmtv-home.png", "jmtv-home",
     None,
     [],
     1400,
     "La page d’accueil de Jacquie &amp; Michel TV\u00a0: en-tête, encart d’inscription, "
     "grilles de vidéos et sélections éditoriales."),

    ("new-mobile.png", "jmtv-mobile",
     None,
     # Le lecteur vidéo de la fiche n'est pas flouté à la source.
     # Zone : (0.015, 0.240, 0.985, 0.460).
     [],
     704,
     "La même page d’accueil sur téléphone : une seule colonne, la même grille repliée."),

    ("pornovoisine.png", "pornovoisines",
     (0, 0, 1, 0.2886),          # 1956 x 1400
     [],
     1200,
     "La page d’accueil de PornoVoisines après refonte : formulaire de recherche "
     "et grilles de vignettes sur fond clair."),

    ("pornudeo.png", "pornudeo",
     None,
     # AUCUNE zone n'est floutée à la source sur cette capture — ni la bannière
     # d'accueil, ni les deux rangées de vignettes. Zones, si tu les rétablis
     # (bornes basses débordant chaque rangée : à la fraction juste, un liseré net
     # subsiste sous les tuiles) :
     #   (0.40, 0.045, 1.00, 0.575)  la bannière, moitié droite — le bloc de titre
     #                               et les boutons restent nets, c'est l'interface
     #   (0.03, 0.620, 1.00, 0.808)  la rangée « Recommandé pour vous »
     #   (0.03, 0.852, 1.00, 1.000)  la rangée « Tendances actuelles »
     [],
     1400,
     "La page d’accueil de Pornudeo : bannière pleine largeur, rail de navigation "
     "à gauche et rangées de vignettes."),
]


def blur_region(im: Image.Image, box: tuple[float, float, float, float]) -> None:
    """Floute un rectangle EN PLACE. Le rayon suit la largeur de l'image pour que
    deux captures de définitions différentes soient floutées au même degré une
    fois à l'écran, et non au même nombre de pixels."""
    x0, y0, x1, y1 = (round(box[0] * im.width), round(box[1] * im.height),
                      round(box[2] * im.width), round(box[3] * im.height))
    region = im.crop((x0, y0, x1, y1))
    im.paste(region.filter(ImageFilter.GaussianBlur(im.width * 0.012)), (x0, y0))


def main() -> None:
    os.makedirs(OUT, exist_ok=True)
    rows = []
    for src, slug, crop, regions, width, alt in SHOTS:
        im = Image.open(os.path.join(SRC, src)).convert("RGB")
        if crop:
            im = im.crop((round(crop[0] * im.width), round(crop[1] * im.height),
                          round(crop[2] * im.width), round(crop[3] * im.height)))
        for box in regions:
            blur_region(im, box)
        if im.width > width:
            im = im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)
        dest = os.path.join(OUT, slug + ".webp")
        im.save(dest, "WEBP", quality=QUALITY, method=6)
        rows.append((slug, *im.size, alt, round(os.path.getsize(dest) / 1024), len(regions)))

    print(f"{len(rows)} captures — {sum(r[4] for r in rows)} Ko au total\n")
    for slug, w, h, alt, ko, n in rows:
        print(f"{ko:>4} Ko  {w:>4}x{h:<5} {w/h:.3f}  {slug}"
              + (f"  ({n} zones floutées)" if n else ""))

    print("\n--- balises ---")
    for slug, w, h, alt, *_ in rows:
        print(f'<img src="assets/jm/shots/{slug}.webp" width="{w}" height="{h}"\n'
              f'     loading="lazy" decoding="async" alt="{alt}">')


if __name__ == "__main__":
    main()
