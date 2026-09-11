#!/usr/bin/env python3
"""Fabrique les icônes du site depuis la police et la palette.

POURQUOI UN SCRIPT, pour trois fichiers qu'on pourrait dessiner à la main : la
marque est une LETTRE DE CLASH DISPLAY, et le contour de cette lettre n'est écrit
nulle part. Il est extrait de `fonts/ClashDisplay-Variable.ttf` à la graisse 700,
celle du logo du header — donc si la police change, on relance et l'icône suit.
Un `<text>` dans le SVG ne marcherait pas : une icône de favori est rendue hors
de toute page, sans feuille de style ni `@font-face` à charger.

Trois fichiers, et c'est le jeu minimal complet aujourd'hui :

  favicon.svg           — le moderne, net à toute taille, seul fichier vectoriel ;
  favicon.ico           — 16 + 32 + 48, pour ce qui ne sait pas lire un SVG, et
                          surtout pour `/favicon.ico`, que des agents sondent à
                          l'aveugle sans jamais lire le `<link>` ;
  apple-touch-icon.png  — 180x180, iOS. OPAQUE ET SANS ARRONDI : iOS applique son
                          propre masque, un PNG déjà arrondi laisserait un liseré.

ILS SONT À LA RACINE DU DÉPÔT, et c'est un écart assumé à la règle de `assets/`
(un dossier par page) : ces fichiers n'appartiennent à aucune page, et deux
d'entre eux sont cherchés à un chemin fixe par des agents qui ne lisent pas le
HTML. Voir CLAUDE.md, « Le favicon et l'image de partage ».

La marque est une lettre CRÈME sur un carré d'ENCRE, les deux tokens du site, et
elle mord volontiers sur les bords : à 16 px, tout ce qui est marge est perdu.
"""
import pathlib
import subprocess
import sys

from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

ROOT = pathlib.Path(__file__).resolve().parent.parent
FONT = ROOT / "fonts" / "ClashDisplay-Variable.ttf"

MARK = "W"      # l'initiale du logo : « Waldmann », puis « Vincent »
WEIGHT = 700    # la graisse du logo du header
INK = "#060d22"
CREAM = "#fef1da"

BOX = 64        # le viewBox du SVG
FILL = 0.88     # part de la largeur occupée par la lettre — elle mord les bords
OPTICAL = 0.02  # remontée optique, en part de BOX : un W posé sur sa ligne de
                # base paraît bas si on le centre sur sa hauteur de capitale


def glyph_path():
    font = TTFont(FONT)
    instantiateVariableFont(font, {"wght": WEIGHT}, inplace=True)
    glyphs = font.getGlyphSet()
    glyph = glyphs[font.getBestCmap()[ord(MARK)]]
    bounds = BoundsPen(glyphs)
    glyph.draw(bounds)
    pen = SVGPathPen(glyphs)
    glyph.draw(pen)
    return pen.getCommands(), bounds.bounds


def svg():
    d, (x0, y0, x1, y1) = glyph_path()
    w, h = x1 - x0, y1 - y0
    scale = BOX * FILL / w
    # le pen dessine en repère typographique (y vers le haut) : on retourne.
    tx = BOX / 2 - (x0 + w / 2) * scale
    ty = BOX / 2 + (y0 + h / 2) * scale - BOX * OPTICAL
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {BOX} {BOX}">'
        f'<rect width="{BOX}" height="{BOX}" fill="{INK}"/>'
        f'<path transform="translate({tx:.3f} {ty:.3f}) scale({scale:.5f} -{scale:.5f})"'
        f' fill="{CREAM}" d="{d}"/>'
        "</svg>\n"
    )


def render(size):
    """Rastérise la MÊME lettre que le SVG, avec PIL plutôt qu'un moteur SVG.

    Aucun rastériseur SVG n'est installé ici, et en ajouter un pour trois PNG
    serait cher payé : on redessine le glyphe depuis la police, avec les mêmes
    trois nombres (FILL, OPTICAL, la boîte du glyphe), donc les deux sorties se
    superposent. Supersampling 8x puis réduction : à 16 px, c'est l'anticrénelage
    qui fait toute la lisibilité.
    """
    from PIL import Image, ImageDraw, ImageFont

    ss = 8 if size <= 64 else 2
    box = size * ss
    font = ImageFont.truetype(FONT, box)
    font.set_variation_by_axes([WEIGHT])
    img = Image.new("RGB", (box, box), INK)
    draw = ImageDraw.Draw(img)
    x0, y0, x1, y1 = draw.textbbox((0, 0), MARK, font=font)
    font = ImageFont.truetype(FONT, round(box * box * FILL / (x1 - x0)))
    font.set_variation_by_axes([WEIGHT])
    x0, y0, x1, y1 = draw.textbbox((0, 0), MARK, font=font)
    draw.text(
        (box / 2 - (x0 + x1) / 2, box / 2 - (y0 + y1) / 2 - box * OPTICAL),
        MARK,
        font=font,
        fill=CREAM,
    )
    return img.resize((size, size), Image.LANCZOS)


def main():
    out = ROOT / "favicon.svg"
    out.write_text(svg(), encoding="utf-8")
    print(f"favicon.svg          {out.stat().st_size:>6} o")

    # Chaque taille est rendue POUR ELLE-MÊME et non réduite depuis la plus
    # grande : à 16 px, un rendu de 48 px réduit perd ses fûts.
    ico = ROOT / "favicon.ico"
    render(48).save(ico, sizes=[(16, 16), (32, 32), (48, 48)],
                    append_images=[render(16), render(32)])
    print(f"favicon.ico          {ico.stat().st_size:>6} o  (16, 32, 48)")

    touch = ROOT / "apple-touch-icon.png"
    render(180).save(touch, optimize=True)
    print(f"apple-touch-icon.png {touch.stat().st_size:>6} o  (180x180, opaque)")


if __name__ == "__main__":
    sys.exit(main())
