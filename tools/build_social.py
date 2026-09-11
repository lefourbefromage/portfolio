#!/usr/bin/env python3
"""Prépare les visuels de la facette « réseaux sociaux » de projet-jm.html.

Les sources vivent dans assets/jm/social-network/ — des exports d'origine, lourds
(jusqu'à 7461 px de large et 4 Mo la pièce) et hors dépôt : le dépôt est PUBLIC et
git garde l'historique, donc rien de lourd ni de non servi n'y entre. Ce script
en tire les .webp que la page charge, dans assets/jm/social/, qui eux sont
versionnés. Même partage que assets/beepz/src/beepz-system.png et les sept stickers du hero.

    python3 tools/build_social.py

Il est idempotent : relancer réécrit les mêmes fichiers. Le manifeste imprimé en
fin de course donne le <li> à coller dans la grille, rapport d'image compris.

LE FLOU EST OPTIONNEL ET DÉCLARÉ ICI, dans BLUR : une entrée par visuel à
traiter, et c'est tout. Il est CUIT dans le .webp — jamais un filter: blur() en
CSS, qui laisserait l'image d'origine téléchargeable dans l'onglet réseau.
"""

import os
import re
import unicodedata
from PIL import Image, ImageFilter, ImageEnhance

SRC = "assets/jm/social-network"
OUT = "assets/jm/social"

# Longueur du plus grand côté. La colonne de la grille fait ~420 px sur un écran
# de 1440, donc 1000 px couvre le 2x confortablement. Au-delà on paie des octets
# pour rien : personne n'ouvre ces visuels en grand.
LONG_EDGE = 1000
QUALITY = 80

# Flou par visuel, à remplir au besoin : "nom de fichier source" -> intensité.
# 0 = net. 1 = flou franc (le sujet reste lisible en composition, plus en détail).
# Une valeur intermédiaire donne un flou partiel, à éviter : un flou léger reste
# reconnaissable et se lit comme une maladresse plutôt que comme un parti pris.
BLUR: dict[str, float] = {}

# L'ordre de la grille, et l'alternative textuelle de chaque visuel.
# L'ordre est ÉDITORIAL, pas chronologique : les formats sont entrelacés pour
# qu'aucune colonne ne reçoive que des bannières. Le multi-colonnes CSS équilibre
# les hauteurs tout seul, mais il le fait mieux sur une suite déjà panachée.
PIECES = [
    ("jacquia-instagram-post.png",                          "insta-voix-off",
     "Post Instagram : appel à candidatures pour devenir la voix off de la marque."),
    ("blackfriday-jacquieetmichelstore--banner-desktop.png", "store-black-friday",
     "Bannière Black Friday de la boutique."),
    ("1er_Avril_2018.jpg",                                   "poisson-avril-2018",
     "Visuel de poisson d’avril : deux burgers baptisés « Le Jacquie » et « Le Michel »."),
    ("Pâques_2017.jpg",                                      "paques-2017",
     "Visuel de Pâques : « À Pâques, il n’y a pas que le chocolat qui va prendre »."),
    ("calendar_2017.jpg",                                    "calendrier-avent-2017",
     "Visuel du calendrier de l’avent : une mise à plat de Noël autour d’une tablette."),
    ("fdm-2023-jacquieetmichelstore--banner-social.png",     "store-fete-des-meres-2023",
     "Visuel de fête des mères pour la boutique, avec code promotionnel."),
    ("Foot  Mockup.jpg",                                     "tshirts-foot",
     "Deux t-shirts floqués, présentés de face et de dos."),
    ("halloween-jacquieetmichelstore--banner-desktop.png",   "store-halloween",
     "Bannière d’Halloween de la boutique."),
    ("Halloween_2018.jpg",                                   "halloween-2018",
     "Visuel d’Halloween : un fantôme en drap blanc dans un lit."),
    ("bitometre rs.jpg",                                     "bitometre",
     "Visuel du Bitomètre : une règle géante, « la règle qui va clore les débats »."),
    ("happy-hour.gif",                                       "happy-hour",
     "Visuel animé « Foot ou porno ? » pour Jacquie & Michel TV."),
    ("st-valentin-2024-jacquieetmichelstore--banner-store.png", "store-saint-valentin-2024",
     "Bannière de la Saint-Valentin pour la boutique : des coffrets cadeaux."),
    ("jdc-insta.png",                                        "insta-jeu-de-cartes",
     "Post Instagram pour le jeu de cartes de la marque."),
    ("Présidentiel_vote_2018.jpg",                           "presidentielle-2018",
     "Visuel de campagne électorale détourné : « Votez @jacquieetmichelx »."),
    ("eggs-jacquieetmichelstore--banner-desktop.png",        "store-paques",
     "Bannière de Pâques pour la boutique."),
    ("kiss-2023-jacquieetmichelstore-banner-mail.jpg",       "mail-journee-du-baiser",
     "Bandeau d’email pour la journée internationale du baiser."),
    ("1er_Avril_2015.png",                                   "poisson-avril-2015",
     "Visuel de poisson d’avril : un faux yaourt de marque, « 100 % naturel »."),
    ("summer-26-jacquieetmichelstore--banner-desktop.png",   "store-ete",
     "Bannière d’été de la boutique, sur une sélection de produits."),
    ("produit_masturbateur_homme.jpg",                       "store-produit",
     "Visuel produit pour la boutique : « Ceci n’est pas une flûte »."),
    ("fdp-2023-jacquie-et-michel-store-banner-store.png",    "store-fete-des-peres-2023",
     "Bannière de fête des pères pour la boutique, avec code promotionnel."),
]


def treat(im: Image.Image, amount: float) -> Image.Image:
    """Flou franc plus désaturation partielle. Le rayon suit la largeur pour que
    deux visuels de définitions différentes soient floutés au même degré à
    l'écran, et non au même nombre de pixels."""
    if amount <= 0:
        return im
    im = im.filter(ImageFilter.GaussianBlur(radius=im.width * 0.045 * amount))
    return ImageEnhance.Color(im).enhance(1 - 0.45 * amount)


def fit(im: Image.Image) -> Image.Image:
    if max(im.size) <= LONG_EDGE:
        return im
    r = LONG_EDGE / max(im.size)
    return im.resize((round(im.width * r), round(im.height * r)), Image.LANCZOS)


def main() -> None:
    os.makedirs(OUT, exist_ok=True)
    rows = []
    for src, slug, alt in PIECES:
        path = os.path.join(SRC, src)
        im = Image.open(path)
        animated = getattr(im, "n_frames", 1) > 1
        amount = BLUR.get(src, 0)
        dest = os.path.join(OUT, slug + ".webp")

        if animated:
            # Le GIF garde son animation : WebP sait l'encoder, et une pièce qui
            # bouge dans le mur vaut mieux qu'une image figée qui l'aplatit.
            frames = []
            for i in range(im.n_frames):
                im.seek(i)
                frames.append(treat(fit(im.convert("RGB")), amount))
            frames[0].save(dest, "WEBP", save_all=True, append_images=frames[1:],
                           quality=QUALITY, method=6,
                           duration=im.info.get("duration", 500), loop=0)
        else:
            treat(fit(im.convert("RGB")), amount).save(
                dest, "WEBP", quality=QUALITY, method=6)

        w, h = Image.open(dest).size
        rows.append((slug, w, h, alt, round(os.path.getsize(dest) / 1024),
                     amount, animated))

    total = sum(r[4] for r in rows)
    print(f"{len(rows)} visuels — {total} Ko au total\n")
    for slug, w, h, alt, ko, amount, animated in rows:
        flag = (" flou" if amount else "") + (" animé" if animated else "")
        print(f"{ko:>4} Ko  {w:>4}x{h:<4} {w/h:.3f}  {slug}{flag}")

    print("\n--- à coller dans .gallery ---")
    for slug, w, h, alt, *_ in rows:
        print(f'          <li>\n'
              f'            <div class="gallery__shot">\n'
              f'              <img src="assets/jm/social/{slug}.webp" width="{w}" height="{h}"\n'
              f'                   loading="lazy" decoding="async" alt="{alt}">\n'
              f'            </div>\n'
              f'          </li>')


if __name__ == "__main__":
    main()
