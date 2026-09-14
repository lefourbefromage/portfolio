#!/usr/bin/env python3
"""Les CV, allégés : le fond en 300 dpi redescendu à 150, le texte intact.

    python3 tools/shrink_cv.py            → assets/home/about/cv-fr.pdf, cv-en.pdf

Les exports Affinity de Vincent pèsent 3,1 Mo la page, dont 3,0 pour une seule
image : le motif topographique posé en fond de page, en 2484 × 3511 (300 dpi),
en CMYK et avec un masque de transparence. Le reste — tout le texte — est
vectoriel et ne pèse rien.

CE QUI EST REFAIT, ET CE QUI NE L'EST PAS. On ne touche QUE les images :

  — le fond est décodé, aplati sur le blanc de la page (son masque ne sert qu'à
    ça : il n'y a rien d'autre dessous, l'image est le premier objet dessiné),
    ramené à 150 dpi de la taille où elle est POSÉE — pas de sa taille propre —,
    passé en niveaux de gris quand ses trois canaux sont à moins de
    `NEUTRE` l'un de l'autre, et réencodé en JPEG ;
  — le texte, les polices et la mise en page ne sont pas retouchés. C'est la
    condition à ne jamais perdre : un CV rastérisé n'est plus lisible par les
    outils de tri de candidatures, et c'est justement ce qu'on cherche à éviter.

RELANCER NE RECOMPRESSE RIEN. Une passe ne touche qu'une image PLUS DENSE que la
cible : une fois le fond à 150 dpi, il n'y a plus rien à reprendre et le fichier
est laissé tel quel. C'est ce test, et lui seul, qui distingue aussi un nouvel
export d'un fichier déjà allégé — surtout pas la date des fichiers : le script
réécrit lui-même le fichier servi, donc sa date est toujours la plus récente, et
s'y fier lui faisait prendre son propre résultat pour un original (c'est arrivé,
et ça a écrasé la copie gardée).

L'ORIGINAL EST GARDÉ, dans `assets/home/src/cv/` — hors dépôt, comme toutes les
sources (voir « Les assets, rangés par contexte » dans CLAUDE.md). Il n'est
remplacé que par un export frais, jamais par un fichier déjà allégé.
"""

import shutil
import sys
import warnings
from io import BytesIO
from pathlib import Path

import pikepdf
from PIL import Image, ImageChops

# Attendu, et c'est même ce qu'on veut : le fond est en CMYK avec un masque, et
# Pillow ne sait pas tenir les deux — pikepdf le convertit donc en RGBA, qu'on
# aplatit juste après sur le blanc de la page.
warnings.filterwarnings('ignore', message='A CMYK image carries a mask')

ROOT = Path(__file__).resolve().parent.parent
SERVI = ROOT / 'assets/home/about'
SOURCES = ROOT / 'assets/home/src/cv'
FICHIERS = ('cv-fr.pdf', 'cv-en.pdf')

DPI = 150            # la densité visée pour les images de fond
QUALITE = 75         # le JPEG qui en sort
NEUTRE = 6           # écart maximal entre canaux pour passer en niveaux de gris
BLANC = (255, 255, 255)


def tailles_posees(page):
    """Pour chaque image de la page, sa taille EN POINTS telle qu'elle est posée.

    On suit la pile graphique (`q`/`Q`) et les `cm` : une image est toujours
    dessinée dans le carré unité, donc la matrice courante au moment du `Do`
    donne sa taille. Sans ça on viserait 150 dpi de la taille du fichier, ce qui
    ne veut rien dire — c'est la taille à l'écran qui compte.
    """
    ctm = [1, 0, 0, 1, 0, 0]
    pile, posees = [], {}

    def produit(m, n):
        a, b, c, d, e, f = m
        A, B, C, D, E, F = n
        return [a * A + b * C, a * B + b * D, c * A + d * C,
                c * B + d * D, e * A + f * C + E, e * B + f * D + F]

    for operandes, op in pikepdf.parse_content_stream(page):
        nom = str(op)
        if nom == 'q':
            pile.append(list(ctm))
        elif nom == 'Q' and pile:
            ctm = pile.pop()
        elif nom == 'cm':
            ctm = produit([float(o) for o in operandes], ctm)
        elif nom == 'Do':
            largeur = (ctm[0] ** 2 + ctm[1] ** 2) ** .5
            hauteur = (ctm[2] ** 2 + ctm[3] ** 2) ** .5
            cle = str(operandes[0])
            garde = posees.get(cle, (0, 0))
            posees[cle] = (max(garde[0], largeur), max(garde[1], hauteur))
    return posees


def trop_dense(pdf):
    """Le PDF porte-t-il encore une image au-dessus de la cible ?

    C'est la signature d'un export frais, et le seul test qui vaille : il ne
    dépend ni de la date ni du poids du fichier.
    """
    for page in pdf.pages:
        posees = tailles_posees(page)
        boite = page.MediaBox
        defaut = (float(boite[2]) - float(boite[0]), float(boite[3]) - float(boite[1]))
        for nom, xo in page.Resources.get('/XObject', {}).items():
            if xo.get('/Subtype') != '/Image':
                continue
            largeur_pt, hauteur_pt = posees.get(nom, defaut)
            if int(xo.Width) > round(largeur_pt / 72 * DPI) or \
               int(xo.Height) > round(hauteur_pt / 72 * DPI):
                return True
    return False


def allege(pdf):
    """Réencode les images trop denses. Rend la liste de ce qui a changé."""
    rapport = []
    for page in pdf.pages:
        posees = tailles_posees(page)
        boite = page.MediaBox
        defaut = (float(boite[2]) - float(boite[0]), float(boite[3]) - float(boite[1]))
        for nom, xo in page.Resources.get('/XObject', {}).items():
            if xo.get('/Subtype') != '/Image':
                continue
            largeur_pt, hauteur_pt = posees.get(nom, defaut)
            cible = (max(1, round(largeur_pt / 72 * DPI)), max(1, round(hauteur_pt / 72 * DPI)))
            avant = int(xo.Width), int(xo.Height)
            if avant[0] <= cible[0] and avant[1] <= cible[1]:
                continue

            im = pikepdf.PdfImage(xo).as_pil_image()
            if im.mode in ('RGBA', 'LA', 'PA') or 'transparency' in im.info:
                # Le masque ne sert qu'à poser le motif sur la page : l'image est
                # le premier objet dessiné, il n'y a rien d'autre dessous.
                fond = Image.new('RGB', im.size, BLANC)
                fond.paste(im.convert('RGBA'), mask=im.convert('RGBA').getchannel('A'))
                im = fond
            im = im.convert('RGB').resize(cible, Image.LANCZOS)

            r, v, b = im.resize((160, 160)).split()
            neutre = max(ImageChops.difference(x, y).getextrema()[1]
                         for x, y in ((r, v), (v, b), (r, b))) <= NEUTRE
            if neutre:
                im = im.convert('L')

            tampon = BytesIO()
            im.save(tampon, 'JPEG', quality=QUALITE, optimize=True)

            xo.write(tampon.getvalue(), filter=pikepdf.Name('/DCTDecode'))
            xo.Width, xo.Height = cible
            xo.ColorSpace = pikepdf.Name('/DeviceGray' if neutre else '/DeviceRGB')
            xo.BitsPerComponent = 8
            for cle in ('/SMask', '/Mask', '/Decode', '/DecodeParms', '/Interpolate'):
                if cle in xo:
                    del xo[cle]
            rapport.append(f'{avant[0]}×{avant[1]} → {cible[0]}×{cible[1]}'
                           f'{" en niveaux de gris" if neutre else ""}')
    return rapport


def main():
    SOURCES.mkdir(parents=True, exist_ok=True)
    total_avant = total_apres = 0
    for nom in FICHIERS:
        servi, source = SERVI / nom, SOURCES / nom
        if not servi.exists():
            print(f'{nom} : absent, ignoré.')
            continue

        avant = servi.stat().st_size
        pdf = pikepdf.open(servi)
        if not trop_dense(pdf):
            print(f'{nom} : déjà allégé ({avant / 1e6:.2f} Mo), rien à faire.')
            total_avant += avant
            total_apres += avant
            continue

        # Un export frais : on en garde une copie hors dépôt avant d'y toucher.
        shutil.copy2(servi, source)
        rapport = allege(pdf)
        pdf.save(servi, compress_streams=True,
                 object_stream_mode=pikepdf.ObjectStreamMode.generate)
        apres = servi.stat().st_size
        if apres >= avant:          # rien à gagner : on rend l'original tel quel
            shutil.copy2(source, servi)
            apres = avant
        total_avant += avant
        total_apres += apres
        detail = ' ; '.join(rapport) or 'aucune image à reprendre'
        print(f'{nom} : {avant / 1e6:.2f} Mo → {apres / 1e6:.2f} Mo  ({detail})')

    if total_avant:
        print(f'total : {total_avant / 1e6:.2f} Mo → {total_apres / 1e6:.2f} Mo '
              f'({100 - total_apres / total_avant * 100:.0f} % de moins). '
              f'Originaux dans {SOURCES.relative_to(ROOT)}/ (hors dépôt).')


if __name__ == '__main__':
    sys.exit(main())
