#!/usr/bin/env python3
"""Prépare les seize visuels de la grille « réseaux sociaux » de projet-jm.html.

    python3 tools/build_social.py

Les sources vivent dans assets/jm/social-network/ — des exports d'origine, lourds
(jusqu'à 7461 px de large et 11 Mo la pièce) et hors dépôt : le dépôt est PUBLIC
et git garde l'historique, donc rien de lourd ni de non servi n'y entre. Ce
script en tire les .webp que la page charge, dans assets/jm/social/, qui eux sont
versionnés.

LA GRILLE EST CARRÉE, LES FICHIERS NE LE SONT PAS. Chaque case recadre son visuel
en CSS (`aspect-ratio: 1` + `object-fit: cover`), et c'est voulu : la visionneuse
ouvre le `src` de la vignette, donc un fichier recadré ici y montrerait lui aussi
une affiche amputée de son titre. Le cadrage de chaque case — quand le centre ne
suffit pas — est un `object-position` dans le CSS, jamais une découpe ici.

D'où la règle de taille : c'est le PETIT CÔTÉ qui doit couvrir la case en
densité 2, puisque c'est lui qui la remplit. Le grand côté suit.

Il est idempotent et N'AGRANDIT JAMAIS : une source trop petite sort à sa taille
native, et le rapport de fin de passe le dit.
"""

import os
import sys

from PIL import Image

SRC = "assets/jm/social-network"
OUT = "assets/jm/social"
QUALITY = 80

# La case de la grille, en desktop : le cadre de 1472 px, quatre colonnes, trois
# gouttières de 28 px (le plafond du `gap` de `.jm-reseaux`). Soit 347 px, et
# 694 en densité 2. Si tu changes la grille, change ces trois nombres.
FRAME, COLS, GAP, DENSITY = 1472, 4, 28, 2
SHORT_EDGE = round((FRAME - (COLS - 1) * GAP) / COLS * DENSITY)

# Source -> nom servi. L'ordre est celui de la grille, et il est ÉDITORIAL : la
# voix-off en premier parce qu'elle prolonge JacquIA, juste au-dessus ; puis les
# fonds sont panachés pour qu'aucune rangée ne soit toute rose ou toute sombre.
# Les alternatives sont dans la page, pas ici : il n'y a qu'un texte à tenir.
PIECES = [
    ("jacquia-instagram-post.png",                              "insta-voix-off"),
    ("1er_Avril_2018.jpg",                                      "poisson-avril-2018"),
    ("Pâques_2017.jpg",                                         "paques-2017"),
    ("happy-hour.gif",                                          "happy-hour"),
    ("calendar_2017.jpg",                                       "calendrier-avent-2017"),
    ("fdm-2023-jacquieetmichelstore--banner-social.png",        "store-fete-des-meres-2023"),
    ("Présidentiel_vote_2018.jpg",                              "presidentielle-2018"),
    ("jdc-insta.png",                                           "insta-jeu-de-cartes"),
    ("blackfriday-jacquieetmichelstore--banner-desktop.png",    "store-black-friday"),
    ("kiss-2023-jacquieetmichelstore-banner-mail.jpg",          "mail-journee-du-baiser"),
    ("1er_Avril_2015.png",                                      "poisson-avril-2015"),
    ("Foot  Mockup.jpg",                                        "tshirts-foot"),
    ("produit_masturbateur_homme.jpg",                          "store-produit"),
    ("Instagram Story 1@2x.png",                                "insta-blue-monday"),
    ("st-valentin-2024-jacquieetmichelstore--banner-store.png", "store-saint-valentin-2024"),
    ("summer-26-jacquieetmichelstore--banner-desktop.png",      "store-ete"),
]


def fit(im: Image.Image) -> Image.Image:
    """Ramène le petit côté à SHORT_EDGE, sans jamais agrandir."""
    r = SHORT_EDGE / min(im.size)
    if r >= 1:
        return im
    return im.resize((round(im.width * r), round(im.height * r)), Image.LANCZOS)


def main() -> int:
    if not os.path.isdir(SRC):
        raise SystemExit(f"{SRC}/ est introuvable : c'est là que vivent les originaux.")

    os.makedirs(OUT, exist_ok=True)
    rows, trop_petites = [], []
    for src, slug in PIECES:
        im = Image.open(os.path.join(SRC, src))
        dest = os.path.join(OUT, slug + ".webp")
        if min(im.size) < SHORT_EDGE:
            trop_petites.append((src, min(im.size)))

        if getattr(im, "n_frames", 1) > 1:
            # Le GIF garde son animation : WebP sait l'encoder, et une case qui
            # bouge dans le mur vaut mieux qu'une image figée.
            frames = []
            for i in range(im.n_frames):
                im.seek(i)
                frames.append(fit(im.convert("RGB")))
            frames[0].save(dest, "WEBP", save_all=True, append_images=frames[1:],
                           quality=QUALITY, method=6,
                           duration=im.info.get("duration", 500), loop=0)
        else:
            # L'alpha est jeté : ces visuels sont opaques de bord à bord, et un
            # RGBA uniformément plein ne porte rien.
            fit(im.convert("RGB")).save(dest, "WEBP", quality=QUALITY, method=6)

        w, h = Image.open(dest).size
        rows.append((slug, w, h, round(os.path.getsize(dest) / 1024)))

    print(f"{len(rows)} visuels, petit côté à {SHORT_EDGE} px — "
          f"{sum(r[3] for r in rows)} Ko au total\n")
    for slug, w, h, ko in rows:
        print(f"  {ko:>4} Ko  {w:>4}x{h:<4}  {slug}")

    servis = {slug + ".webp" for _, slug in PIECES}
    orphelins = sorted(f for f in os.listdir(OUT) if f.endswith(".webp") and f not in servis)
    if orphelins:
        print(f"\nDANS {OUT}/ SANS ÊTRE DANS LA GRILLE — plus rien ne les charge :")
        for f in orphelins:
            print(f"  {f}")

    if trop_petites:
        print(f"\nSOURCES TROP PETITES POUR LA DENSITÉ 2 (petit côté < {SHORT_EDGE} px) :")
        for src, cote in trop_petites:
            print(f"  {src}  ({cote} px)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
