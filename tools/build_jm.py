#!/usr/bin/env python3
"""Prépare TOUS les visuels de projet-jm.html, dans sa version maquettée.

    python3 tools/build_jm.py

Mêmes règles que tools/build_projects.py, dont ce script reprend la mécanique :
les originaux vivent dans assets/jm/src/ (hors dépôt, 16 Mo), et seuls les .webp
produits ici sont versionnés. Le dépôt est PUBLIC et GitHub Pages le sert tel
quel : tout ce qui y entre est lisible de tous, historique compris.

Les sorties sont rangées par SECTION DE LA PAGE, comme assets/home/ :

    assets/jm/hero/       la couverture pleine largeur
    assets/jm/sites/      les quatre mises en scène d'appareils
    assets/jm/marques/    les douze vignettes de marque
    assets/jm/jacquia/    la bannière de campagne et ses trois écrans
    assets/jm/campagnes/  les trois visuels du collage
    assets/jm/frise/      la fresque des vingt ans

LES PIÈCES POSÉES EN POURCENTAGE TIENNENT LEUR TAILLE DU CSS : le script y lit
leur `width: %`, le multiplie par le cadre de leur section et en déduit la cible
@2x. Déplacer un écran de JacquIA ou une pièce du collage, relancer, et l'export
suit — même principe que build_projects.py. Les cases de grille, elles, ne
portent aucune largeur (c'est la grille qui décide), donc leur nombre est écrit
dans le manifeste ; il n'y a rien à tenir d'accord ailleurs.

IL DIT CE QU'IL FAIT, et c'est sa fonction la plus utile : en fin de passe il
liste les pièces dont la source est trop petite pour la densité 2, avec l'échelle
d'export Figma qui corrigerait. Sans ça rien ne distinguerait une sortie honnête
d'un fichier à la bonne taille dont la moitié des pixels est inventée. Il
N'AGRANDIT JAMAIS : une source trop petite sort à sa taille native.

────────────────────────────────────────────────────────────────────────────────
LA COUVERTURE EST LE SEUL CAS QUI DEMANDE UN TRAITEMENT, et il vaut d'être lu.

Dans la maquette, la photo de couverture est très assombrie — elle descend
jusqu'à l'encre du site — MAIS le tampon « Jacquie & Michel » reste net et
lumineux par-dessus. Les deux ne peuvent donc pas sortir de la même courbe, et
le logo est pourtant CUIT dans cover.png : il n'y a pas de calque à récupérer.

On le retrouve par ce qui le distingue de la photo, qui est en noir et blanc :
le logo est le seul endroit SATURÉ (l'anneau rose) ou QUASI BLANC (le lettrage).
Ce masque-là ne demande aucune coordonnée à tenir à jour, et il survivrait à un
recadrage de la photo.

Le reste sort en TEINTE PLATE À OPACITÉ VARIABLE, et ce n'est pas une
approximation : la maquette compose la photo en additif au-dessus de l'encre,
donc son apport est le même sur les trois canaux. Une couleur unique
(`ink + LIFT`) portée par un alpha en (gris)^GAMMA redonne exactement le même
rendu — mesuré à 1,6 % d'écart moyen sur la maquette — pour un fichier qui n'est
plus qu'une carte d'alpha, et qui se compresse comme telle.

L'ALPHA N'EST PAS UN LUXE : c'est lui qui laisse le motif topographique de la
page transparaître dans les noirs, comme sur la maquette. Une couverture opaque
le masquerait, et il faudrait le cuire dans le fichier.
"""

import os
import re
import sys

import numpy as np
from PIL import Image, ImageFilter

SRC = "assets/jm/src"
CSS = "css/style.css"
QUALITY = 82

# Densité d'écran visée. La cible d'export vaut DENSITY × la largeur d'affichage.
DENSITY = 2

# Le cadre de la page : `.case-section` fait 1512 px au plus, moins son
# `padding-inline` de 20 px de chaque côté. Toutes les largeurs en % de la
# maquette se résolvent là-dessus.
FRAME = 1472
PAGE = 1512          # les deux bandes pleine largeur (couverture, frise)

# ---------------------------------------------------------------------------
# Le traitement de la couverture (voir l'en-tête).
INK = np.array([6, 13, 34], float)   # --ink
LIFT = 45            # de combien la teinte plate monte au-dessus de l'encre
GAMMA = 1.52         # courbe de la maquette, relevée sur ses niveaux
SCALE = 0.169        # apport de la photo à plein blanc, avant la courbe
LOGO_DIM = 0.81      # le tampon est légèrement retenu, il ne brille pas à cru

# ---------------------------------------------------------------------------
# LE MANIFESTE. Une entrée par fichier servi :
#
#   (source, dossier de sortie, nom servi, largeur d'affichage, alternative)
#
# La largeur d'affichage est soit un nombre de pixels, soit une chaîne `.classe`
# — auquel cas elle est LUE dans le CSS et multipliée par le cadre de sa section.
# Le partage n'est pas arbitraire : une pièce POSÉE EN POURCENTAGE d'un cadre
# (les écrans de JacquIA, les trois du collage) tient sa taille du CSS, et c'est
# là qu'il faut aller la chercher ; une case de GRILLE, elle, ne porte aucune
# largeur — c'est la grille qui la décide — donc son nombre est écrit ici.
# Les noms ne répètent pas leur dossier : assets/jm/sites/pornudeo.webp, pas
# sites/site-pornudeo.webp.
PIECES = [
    # -- La couverture ------------------------------------------------------
    ("cover.png", "hero", "cover", PAGE, None),      # décorative : alt="" dans la page

    # -- Les quatre mises en scène ------------------------------------------
    # Carrées, deux par rangée dans le cadre : (1472 - 28) / 2.
    ("01.png", "sites", "jm", 722,
     "Le site Jacquie &amp; Michel affiché sur un ordinateur portable posé en forêt : "
     "en-tête sombre, bandeau promotionnel et grille de vidéos."),
    ("02.png", "sites", "pornovoisines", 722,
     "Le site PornoVoisines sur un ordinateur portable : interface claire, "
     "formulaire de recherche et grilles de profils."),
    ("03.png", "sites", "pornudeo", 722,
     "Le site Pornudeo sur une tablette : rail de navigation à gauche, "
     "bannière pleine largeur et rangées de vignettes."),
    ("04.png", "sites", "elite", 722,
     "Le site Jacquie &amp; Michel Élite sur une tablette inclinée : "
     "lecteur en grand et sélections éditoriales."),

    # -- Les douze marques --------------------------------------------------
    # L'ordre est celui de la grille, en lecture : trois par rangée.
    ("image 48.png", "marques", "maison-du-porno", 469,
     "Logotype de La Maison du Porno."),
    ("image 46.png", "marques", "illicoporno", 469,
     "Logotype d’IllicoPorno."),
    ("image 49.png", "marques", "colmax", 469,
     "Logotype de Colmax."),
    ("image 45.png", "marques", "elite", 469,
     "Logotype de Jacquie &amp; Michel Élite."),
    ("image 47.png", "marques", "jmtv", 469,
     "Logotype de Jacquie &amp; Michel TV."),
    ("swame.png", "marques", "swame", 469,
     "Logotype de Swame."),
    ("image 43.png", "marques", "hotvideo", 469,
     "Logotype de Hot Video."),
    ("image 53.png", "marques", "jmtv2", 469,
     "Logotype de Jacquie &amp; Michel TV2."),
    ("image 51.png", "marques", "madame-porno", 469,
     "Logotype de Madame Porno."),
    ("image 44.png", "marques", "pornudeo", 469,
     "Logotype de Pornudeo."),
    ("image 54.png", "marques", "pornovoisines", 469,
     "Logotype de PornoVoisines."),
    ("image 52.png", "marques", "tyjam", 469,
     "Logotype de Tyjam."),

    # -- JacquIA ------------------------------------------------------------
    ("jacquia.png", "jacquia", "banner", FRAME,
     "La page de campagne JacquIA : « Devenez la voix-off de Jacquie &amp; Michel », "
     "sur un fond magenta, avec le bouton « Lancer le test »."),
    ("image 40.png", "jacquia", "ecran-accueil", ".jm-jacquia__phone",
     "L’écran d’accueil de JacquIA sur téléphone : le titre de la campagne et le bouton de lancement."),
    ("image 41.png", "jacquia", "ecran-enregistrement", ".jm-jacquia__phone",
     "L’écran d’enregistrement : « Dites très fort ON DIT MERCI QUI ?! » et un décompte."),
    ("image 42.png", "jacquia", "ecran-resultat", ".jm-jacquia__phone",
     "L’écran de résultat : un score sur 100 et le commentaire du jury."),

    # -- Le collage des campagnes -------------------------------------------
    ("Rectangle 63.png", "campagnes", "swame-awards", ".jm-social__piece--awards",
     "Affiche des Swame Awards 2024 : un lettrage graffiti et 20 000 € à gagner."),
    ("Rectangle 65.png", "campagnes", "halloween", ".jm-social__piece--halloween",
     "Visuel d’Halloween : un fantôme en drap blanc dans un lit, « Joyeux Halloween »."),
    ("Rectangle 64.png", "campagnes", "bitometre", ".jm-social__piece--bitometre",
     "Visuel du Bitomètre : une règle géante à table, « la règle qui va clore les débats »."),

    # -- La fresque des vingt ans -------------------------------------------
    ("Group 37.png", "frise", "vingt-ans", PAGE,
     "La page anniversaire des vingt ans de Jacquie &amp; Michel, présentée en trois "
     "panneaux inclinés : une frise chronologique sur fond bleu, ponctuée d’anecdotes, "
     "de captures d’époque et de vignettes découpées."),
]


# ---------------------------------------------------------------------------
def css_widths(path):
    """Relève les `width: N%` du CSS, par classe.

    Comme dans build_projects.py : la taille d'affichage est déjà écrite une
    fois, dans la feuille de style. La recopier ici en ferait deux à tenir
    d'accord, et c'est toujours la seconde qui ment.
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


def largeur_affichage(spec, widths):
    """Résout la largeur d'affichage d'une pièce, en pixels."""
    if isinstance(spec, (int, float)):
        return float(spec)
    if spec not in widths:
        raise SystemExit(
            f"« {spec} » n'a pas de `width: %` dans {CSS}. Le script lit les "
            f"tailles là-bas plutôt que de les redire ici — ajoute la règle, ou "
            f"donne un nombre de pixels dans PIECES."
        )
    return FRAME * widths[spec] / 100.0


def traiter_couverture(im):
    """La photo assombrie jusqu'à l'encre, le tampon préservé. Voir l'en-tête."""
    a = np.asarray(im.convert("RGB")).astype(float)
    gris = a.mean(axis=2)
    sat = a.max(axis=2) - a.min(axis=2)

    # Le masque du tampon : saturé (l'anneau rose) ou quasi blanc (le lettrage).
    # Le flou d'un pixel adoucit la frontière, sinon elle crénelle.
    masque = np.clip(sat / 40.0, 0, 1)
    masque = np.maximum(masque, np.clip((gris - 215) / 25.0, 0, 1))
    masque = np.asarray(
        Image.fromarray((masque * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.2))
    ).astype(float) / 255.0
    masque = masque[..., None]

    # La photo : une teinte plate, portée par un alpha en (gris)^GAMMA.
    alpha_photo = np.clip(255 * SCALE * np.power(gris / 255.0, GAMMA) / LIFT, 0, 1)
    teinte = np.broadcast_to(INK + LIFT, a.shape)

    # Le tampon : ses vraies couleurs, opaque, à peine retenu.
    rgb = teinte * (1 - masque) + (a * LOGO_DIM) * masque
    alpha = np.maximum(alpha_photo[..., None], masque)[..., 0]

    return Image.merge("RGBA", (
        *Image.fromarray(np.clip(rgb, 0, 255).astype(np.uint8)).split(),
        Image.fromarray((np.clip(alpha, 0, 1) * 255).astype(np.uint8)),
    ))


def main():
    if not os.path.isdir(SRC):
        raise SystemExit(f"{SRC}/ est introuvable : c'est là que vivent les originaux.")

    widths = css_widths(CSS)
    manquantes, trop_petites, ecrits = [], [], []

    for source, dossier, nom, spec, _alt in PIECES:
        chemin = os.path.join(SRC, source)
        if not os.path.exists(chemin):
            manquantes.append(source)
            continue

        cible = round(largeur_affichage(spec, widths) * DENSITY)
        im = Image.open(chemin)
        native = im.width

        if nom == "cover":
            im = traiter_couverture(im)
        elif im.mode not in ("RGB", "RGBA"):
            im = im.convert("RGBA")

        # ON N'AGRANDIT JAMAIS : une source trop courte sort à sa taille native,
        # et sa ligne apparaît dans le rapport de fin de passe.
        largeur = min(cible, native)
        if largeur < cible:
            trop_petites.append((source, native, cible, cible / native))
        if largeur != im.width:
            im = im.resize((largeur, round(im.height * largeur / im.width)), Image.LANCZOS)

        os.makedirs(os.path.join("assets/jm", dossier), exist_ok=True)
        sortie = os.path.join("assets/jm", dossier, nom + ".webp")
        im.save(sortie, "WEBP", quality=QUALITY, method=6)
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
