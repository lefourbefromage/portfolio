#!/usr/bin/env python3
"""Récupère et étalonne les fonds de montagne des scènes de projet-jm.html.

    python3 tools/fetch_scenes.py

Les photos viennent d'Unsplash, sous licence Unsplash : usage libre, y compris
commercial, sans autorisation à demander. Le crédit n'est pas exigé mais il est
la moindre des politesses — les trois auteurs sont nommés ci-dessous et dans la
page.

RIEN N'EST STOCKÉ EN SOURCE. Le script télécharge, étalonne et n'écrit que le
.webp servi dans assets/jm/scenes/. Relancer refait exactement le même fichier ;
il n'y a donc pas d'original lourd à garder hors dépôt, contrairement aux
captures (voir tools/build_shots.py).

L'ÉTALONNAGE EST LE POINT DÉLICAT. Une photo de stock posée telle quelle jure
avec le reste du site, qui tient sur quatre couleurs et un axe de bleus à la
teinte 226. Trois passes, dans cet ordre :

  1. DÉSATURATION — les verts de forêt et les roses de couchant sortent de la
     palette ; on en retire assez pour qu'il ne reste que la valeur.
  2. VIRAGE VERS L'ENCRE — un mélange avec `--ink` (#060d22), qui ramène toute
     l'image sur l'axe des bleus du site au lieu de la laisser sur sa dominante.
  3. ASSOMBRISSEMENT — l'appareil posé dessus doit rester l'élément le plus
     clair de la scène. C'est ce qui fait la lecture : un fond trop lumineux et
     la capture disparaît dedans.

Le dégradé qui éteint le haut de l'image est en CSS, pas ici : il dépend de la
hauteur de la scène, qui change entre la grande et celles de la bande.
"""

import io
import os
import urllib.request
from PIL import Image, ImageEnhance

OUT = "assets/jm/scenes"
UA = {"User-Agent": "Mozilla/5.0 (portfolio build script)"}

INK = (6, 13, 34)

# L'ÉTALONNAGE EST PAR SCÈNE, et il le faut : une photo de crêtes au crépuscule
# est déjà sombre, une mer de nuages est presque blanche. Un réglage unique
# laissait les deux fonds de brouillard si clairs que l'appareil posé dessus
# s'y noyait. Les brumes prennent donc deux fois plus d'encre et beaucoup moins
# de lumière. Règle à garder si tu changes de photo : l'écran doit rester
# l'élément le plus clair de la scène.
#
# (id Unsplash, sortie, largeur, saturation, encre, luminosité, auteur, page)
SCENES = [
    ("photo-1549321495-305eb13f8aa9", "ridges", 1800, 0.42, 0.34, 0.74,
     "Alessio Soggetti", "https://unsplash.com/photos/zxcBR3zNc7I",
     "Des crêtes bleues étagées au crépuscule, au-dessus d’un lac."),
    ("photo-1502058665739-cc9a8769fb1e", "clouds", 1100, 0.34, 0.58, 0.46,
     "Tyler Lastovich", "https://unsplash.com/photos/pI3cMIlgIy4",
     "Une crête émergeant d’une mer de nuages."),
    ("photo-1477468572316-36979010099d", "face", 1100, 0.34, 0.54, 0.50,
     "Paul Pastourmatzis", "https://unsplash.com/photos/r0J9sGBWFOc",
     "Une face rocheuse enneigée dans le brouillard."),
]


def grade(im: Image.Image, desat: float, ink_mix: float, darken: float) -> Image.Image:
    im = ImageEnhance.Color(im).enhance(desat)
    im = Image.blend(im, Image.new("RGB", im.size, INK), ink_mix)
    return ImageEnhance.Brightness(im).enhance(darken)


def main() -> None:
    os.makedirs(OUT, exist_ok=True)
    rows = []
    for pid, name, width, desat, ink_mix, darken, author, page, alt in SCENES:
        url = f"https://images.unsplash.com/{pid}?w={width}&q=80&fm=jpg&fit=max"
        req = urllib.request.Request(url, headers=UA)
        with urllib.request.urlopen(req, timeout=45) as r:
            im = Image.open(io.BytesIO(r.read())).convert("RGB")
        if im.width > width:
            im = im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)
        dest = os.path.join(OUT, name + ".webp")
        grade(im, desat, ink_mix, darken).save(dest, "WEBP", quality=80, method=6)
        rows.append((name, *im.size, round(os.path.getsize(dest) / 1024), author, page))

    print(f"{len(rows)} fonds — {sum(r[3] for r in rows)} Ko\n")
    for name, w, h, ko, author, page in rows:
        print(f"{ko:>4} Ko  {w:>4}x{h:<4}  {name:<8} © {author} — {page}")


if __name__ == "__main__":
    main()
