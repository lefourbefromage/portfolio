#!/usr/bin/env python3
"""Prépare TOUS les visuels de projet-jimizz.html.

    python3 tools/build_jimizz.py

Même mécanique que `tools/build_jm.py`, dont ce script est le jumeau : les
originaux vivent dans `assets/jimizz/src/` (hors dépôt, 29 Mo dont 16 pour la
seule maquette), et seuls les .webp produits ici sont versionnés. Le dépôt est
PUBLIC et GitHub Pages le sert tel quel : tout ce qui y entre est lisible de
tous, historique compris.

Les sorties sont rangées PAR SECTION DE LA PAGE, comme assets/home/ :

    assets/jimizz/marque/       la bande de marque, pleine largeur
    assets/jimizz/site/         le collage en perspective + les deux mises en scène
    assets/jimizz/app/          les trois écrans, la fusée et les cinq pièces
    assets/jimizz/plateformes/  la marketplace, le dashboard, le quizz, l'aide

LES PIÈCES POSÉES EN POURCENTAGE TIENNENT LEUR TAILLE DU CSS, et c'est le point
à comprendre : le script y lit leur `width: %`, le multiplie par le cadre de
référence de leur composition et en déduit la cible @2x. Déplacer un écran ou
changer sa largeur, relancer, et l'export suit. Les pièces qui ne portent pas de
pourcentage — les bandes pleine largeur, les deux cases de la grille — ont leur
nombre écrit dans le manifeste, parce qu'il n'existe nulle part ailleurs.

DEUX CADRES DE RÉFÉRENCE, et ils ne sont pas interchangeables : la composition
de l'app est posée dans 1512 px (elle est pleine largeur), le collage des
plateformes dans 1350 px (la « bande » de la page). D'où le cadre déclaré pièce
par pièce dans le manifeste, à côté de la classe.

IL DIT CE QU'IL FAIT : en fin de passe il liste les pièces dont la source est
trop petite pour la densité 2, avec l'échelle d'export Figma qui corrigerait.
Sans ça rien ne distinguerait une sortie honnête d'un fichier à la bonne taille
dont la moitié des pixels est inventée. Il N'AGRANDIT JAMAIS.

L'ÉTAT DES SOURCES, AU MOMENT OÙ CE SCRIPT A ÉTÉ ÉCRIT : tout est en @2x pile —
les exports Figma tombent exactement au double de leur taille d'affichage — SAUF
`Rectangle 89.png`, la bande de marque, qui fait 1512 px pour 1512 px
d'affichage. C'est la seule pièce molle de la page sur un écran retina, et il
faut la réexporter deux fois plus grand.

LES ALPHA SONT À GARDER. Trois choses en dépendent, et aucune ne se rattrape en
CSS : les captures des plateformes portent leur ARRONDI dans leur alpha, les
trois écrans de l'app portent leur OMBRE DOUCE (qui remplit 134 px sous le
dernier, et c'est ce qui règle l'espace jusqu'au texte suivant), et les deux
mises en scène portent un DÉGRADÉ vertical qui les fait fondre dans l'encre de
la page — leurs coins descendent à 140 et 101 sur 255. D'où le mode RGBA partout
et jamais un aplatissement sur fond opaque.
"""

import os
import re
import sys

from PIL import Image

SRC = "assets/jimizz/src"
OUT = "assets/jimizz"
CSS = "css/style.css"
QUALITY = 82

# L'ALPHA EST COMPRESSÉ AVEC PERTE, et c'est le seul réglage de ce script qui ne
# vienne pas de build_jm.py. Les trois écrans de l'app portent une ombre douce
# qui occupe plus de place que la capture elle-même : à alpha sans perte ils
# pèsent 1 160 Ko à eux trois, contre 843 ici. Mesuré sur l'image composée
# au-dessus de l'encre de la page, le prix est de 0,2 niveau d'écart moyen sur
# 255 et rien au 99e centile — invisible. Sur les arrondis des captures, qui sont
# eux aussi dans l'alpha, l'erreur plafonne à 9 niveaux sur un bord déjà
# anti-aliasé. Descendre plus bas (50) ne gagne plus rien.
ALPHA_QUALITY = 70

# Densité d'écran visée. La cible d'export vaut DENSITY × la largeur d'affichage.
DENSITY = 2

# Les deux cadres de référence de la page (voir l'en-tête).
PAGE = 1512          # la pleine largeur : les bandes, et la composition de l'app
BAND = 1350          # `--jmz-band` : les mises en scène et le collage des plateformes

# ---------------------------------------------------------------------------
# LE MANIFESTE. Une entrée par fichier servi :
#
#   (source, dossier de sortie, nom servi, largeur d'affichage, cadre, alternative)
#
# La largeur d'affichage est soit un nombre de pixels, soit une chaîne `.classe`
# — auquel cas elle est LUE dans le CSS et multipliée par le cadre donné juste
# après. Le partage n'est pas arbitraire : une pièce posée en POURCENTAGE d'une
# composition tient sa taille du CSS, et c'est là qu'il faut aller la chercher ;
# une bande pleine largeur ou une case de grille, elle, ne porte aucun
# pourcentage, donc son nombre est ici.
#
# Les noms ne répètent pas leur dossier : assets/jimizz/site/collage.webp, pas
# site/site-collage.webp.
PIECES = [
    # -- La bande de marque -------------------------------------------------
    # Décorative : le mot « Jimizz » y est dessiné, mais le `h1` de la page le
    # dit déjà. D'où `alt=""` dans le HTML, et la visionneuse l'ignore.
    ("Rectangle 89.png", "marque", "bande", PAGE, None, None),

    # -- Le site ------------------------------------------------------------
    ("Group 37.png", "site", "collage", PAGE, None,
     "Les pages du site Jimizz présentées en perspective sur un fond magenta "
     "semé de pièces d’or : l’accueil « Grab the bull by the balls », la carte de "
     "présentation du jeton, l’écosystème J&amp;M et la marketplace de NFT."),
    # Deux cases de grille dans la bande de 1350 px, 26 px entre elles :
    # (1350 - 26) / 2 = 662. La grille décide, pas la pièce — d'où le nombre.
    ("01.png", "site", "tablette", 662, None,
     "L’accueil de Jimizz sur une tablette posée devant un décor magenta, "
     "entourée de pièces d’or en suspension."),
    ("02.png", "site", "portable", 662, None,
     "La marketplace de NFT de Jimizz sur un ordinateur portable et sur un "
     "téléphone, devant un décor magenta et deux pièces d’or."),

    # -- La composition de l'app -------------------------------------------
    # Cadre 1512. L'ordre suit celui du DOM, qui est l'ordre de peinture.
    ("jmz-coin3.png",   "app", "coin-1", ".jmz-app__coin--1", PAGE, None),
    ("jmz-coin1.png",   "app", "coin-2", ".jmz-app__coin--2", PAGE, None),
    ("jmz-coin4.png",   "app", "coin-3", ".jmz-app__coin--3", PAGE, None),
    ("jmz-coin4-1.png", "app", "coin-4", ".jmz-app__coin--4", PAGE, None),
    ("image 58.png", "app", "wallet", ".jmz-app__screen--wallet", PAGE,
     "L’écran « Mon portefeuille » du dashboard Jimizz sur téléphone : "
     "l’adresse du portefeuille, 99 999 999 JMZ disponibles et la courbe du "
     "jeton en euros."),
    ("image 60.png", "app", "menu", ".jmz-app__screen--menu", PAGE,
     "Le menu du dashboard Jimizz sur téléphone : Dashboard, Staking, Livret X, "
     "Holder Assembly, Mon compte et Centre d’aide."),
    ("image 59.png", "app", "staking", ".jmz-app__screen--staking", PAGE,
     "L’écran de staking du dashboard Jimizz sur téléphone : une campagne de "
     "quatre mois à 50 % d’intérêt, puis la liste des blocages en cours."),
    ("jmz-rocket.png", "app", "rocket", ".jmz-app__rocket", PAGE, None),
    ("jmz-coin3-1.png", "app", "coin-5", ".jmz-app__coin--5", PAGE, None),

    # -- Les quatre plateformes --------------------------------------------
    # Cadre 1350. L'ordre suit celui du DOM, donc de la peinture.
    ("Rectangle 103.png", "plateformes", "marketplace",
     ".jmz-plateformes__piece--marketplace", BAND,
     "La marketplace de NFT Jimizz : le NFT « Hot D’Or 1992 #WIP001 » mis en "
     "avant, puis les enchères en cours."),
    ("Rectangle 104.png", "plateformes", "dashboard",
     ".jmz-plateformes__piece--dashboard", BAND,
     "Le dashboard Jimizz sur ordinateur : le portefeuille, la courbe du jeton, "
     "les investissements en cours et le vote du Holder Assembly."),
    ("Rectangle 105.png", "plateformes", "quizz",
     ".jmz-plateformes__piece--quizz", BAND,
     "Le site de quiz Jimizz Party : le tableau des scores à gauche, la question "
     "en cours au centre et le décompte du temps restant."),
    ("Rectangle 106.png", "plateformes", "aide",
     ".jmz-plateformes__piece--aide", BAND,
     "Le centre d’aide Jimizz : « What can we do for you ? », six rubriques et "
     "la liste des articles les plus consultés."),
]


# ---------------------------------------------------------------------------
def css_widths(path):
    """Relève les `width: N%` du CSS, par classe.

    Comme dans build_jm.py et build_projects.py : la taille d'affichage est déjà
    écrite une fois, dans la feuille de style. La recopier ici en ferait deux à
    tenir d'accord, et c'est toujours la seconde qui ment.
    """
    src = open(path, encoding="utf-8").read()
    # LES COMMENTAIRES D'ABORD, et ce n'est pas de la coquetterie : le découpage
    # ci-dessous prend « tout ce qui précède une accolade » pour des sélecteurs.
    # Un commentaire posé juste avant une règle en fait donc partie, et une
    # virgule dedans suffit à faire perdre la règle en silence — ou à lever
    # l'erreur « n'a pas de width », ce qui est déjà mieux.
    src = re.sub(r"/\*.*?\*/", "", src, flags=re.S)
    out = {}
    for bloc in re.finditer(r"([^{}]+)\{([^{}]*)\}", src):
        selecteurs, corps = bloc.group(1), bloc.group(2)
        m = re.search(r"(?<![-\w])width:\s*([\d.]+)%", corps)
        if not m:
            continue
        for sel in selecteurs.split(","):
            sel = sel.strip()
            if sel.startswith(".") and " " not in sel and ":" not in sel:
                out[sel] = float(m.group(1))
    return out


def largeur_affichage(spec, cadre, widths):
    """Résout la largeur d'affichage d'une pièce, en pixels."""
    if isinstance(spec, (int, float)):
        return float(spec)
    if spec not in widths:
        raise SystemExit(
            f"« {spec} » n'a pas de `width: %` dans {CSS}. Le script lit les "
            f"tailles là-bas plutôt que de les redire ici — ajoute la règle, ou "
            f"donne un nombre de pixels dans PIECES."
        )
    if cadre is None:
        raise SystemExit(f"« {spec} » est en pourcentage : il lui faut un cadre.")
    return cadre * widths[spec] / 100.0


def main():
    if not os.path.isdir(SRC):
        raise SystemExit(f"{SRC}/ est introuvable : c'est là que vivent les originaux.")

    widths = css_widths(CSS)
    manquantes, trop_petites, ecrits = [], [], []

    for source, dossier, nom, spec, cadre, _alt in PIECES:
        chemin = os.path.join(SRC, source)
        if not os.path.exists(chemin):
            manquantes.append(source)
            continue

        cible = round(largeur_affichage(spec, cadre, widths) * DENSITY)
        im = Image.open(chemin)
        native = im.width

        # RGBA partout : les alpha portent l'arrondi des captures, l'ombre des
        # écrans et le dégradé des mises en scène. Voir l'en-tête.
        if im.mode != "RGBA":
            im = im.convert("RGBA")

        # ON N'AGRANDIT JAMAIS : une source trop courte sort à sa taille native,
        # et sa ligne apparaît dans le rapport de fin de passe.
        largeur = min(cible, native)
        if largeur < cible:
            trop_petites.append((source, native, cible, cible / native))
        if largeur != im.width:
            im = im.resize((largeur, round(im.height * largeur / im.width)), Image.LANCZOS)

        os.makedirs(os.path.join(OUT, dossier), exist_ok=True)
        sortie = os.path.join(OUT, dossier, nom + ".webp")
        im.save(sortie, "WEBP", quality=QUALITY, alpha_quality=ALPHA_QUALITY, method=6)
        ecrits.append((sortie, im.width, im.height, os.path.getsize(sortie)))

    print(f"{len(ecrits)} fichiers écrits, "
          f"{sum(e[3] for e in ecrits) / 1024:.0f} Ko au total.\n")
    for chemin, w, h, taille in ecrits:
        print(f"  {chemin:44s} {w:5d}×{h:<5d} {taille / 1024:6.0f} Ko")

    if manquantes:
        print("\nSANS SOURCE — les fichiers déjà servis sont laissés en place :")
        for s in manquantes:
            print(f"  {s}  (à redéposer dans {SRC}/)")

    if trop_petites:
        print("\nSOURCES TROP PETITES POUR LA DENSITÉ 2. Elles sortent à leur taille")
        print("native — aucun pixel n'est inventé — mais elles seront molles sur un")
        print("écran retina. L'échelle d'export Figma qui corrigerait est donnée :")
        for source, native, cible, facteur in trop_petites:
            print(f"  {source:20s} {native:5d} px pour {cible:5d} attendus "
                  f"→ réexporter {facteur:.1f}x plus grand")

    return 0


if __name__ == "__main__":
    sys.exit(main())
