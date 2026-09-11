#!/usr/bin/env python3
"""Produit les visuels de la section projets de l'accueil, en .webp.

    python3 tools/build_projects.py

Mêmes règles que build_shots.py et build_social.py : les sources vivent hors
dépôt dans assets/home/src/projects/, seuls les .webp produits ici, dans
assets/home/projects/, sont versionnés.

LA TAILLE CIBLE N'EST PAS ÉCRITE ICI, ELLE EST LUE. Chaque pièce du groupement
est posée en pourcentage d'un cadre de référence (voir « La section projets » de
CLAUDE.md) : c'est ce pourcentage, et lui seul, qui dit à quelle taille l'image
sera réellement affichée. Le script va donc le chercher dans css/style.css, et
apparie les classes aux fichiers en lisant les `src` d'index.html. Rien à tenir
d'accord à la main : déplace une pièce ou change sa largeur, relance, et les
exports suivent.

C'est le même principe que la tuile de relief, dont le chemin est lu dans le CSS
plutôt que recopié dans le JS.

POURQUOI DEUX FOIS LA TAILLE D'AFFICHAGE. Les écrans courants sont en densité 2.
Servi à sa taille d'affichage, un visuel y est étiré du simple au double par le
navigateur — c'est ce qui se voyait sur la carte Jimizz, dont les pièces étaient
en plus agrandies par la composition : les exports de maquette faisaient 145 à
250 px pour des pièces affichées jusqu'à 429, soit près de 3x d'agrandissement
une fois la densité prise en compte.

On ne vise pas la densité 3 : au-delà de 2 le poids double encore sans qu'aucun
écran courant n'en tire parti. À ne pas confondre avec l'échelle d'export Figma,
qui doit elle monter à 3x — la pièce y est dessinée bien plus petite qu'elle n'est
affichée, et c'est le produit des deux qui compte.

CE QUE FAIT ce script quand la source est plus PETITE que la cible : un
rééchantillonnage Lanczos suivi d'un masque flou. Ça ne réinvente aucun détail —
mais ça évite au navigateur un agrandissement fait avec son filtre à lui, et ça
lui laisse une image dont il n'a presque plus qu'à ajuster la taille. Le gain est
réel sur les bords, il n'est pas magique.

CE QU'IL FAUT POUR QUE ÇA LE DEVIENNE : des exports Figma en @2x ou @3x déposés
dans assets/home/src/projects/, sous le même nom. La cible étant calculée et non
relative à la source, le script se contente alors de RÉDUIRE — ce qui est toujours
propre — et la netteté n'est plus simulée mais réelle. Rien d'autre à changer : ni
le CSS, ni le HTML, ni ce fichier.

D'où cette cible calculée plutôt qu'un « x2 » aveugle : sans elle, une source déjà
en haute définition serait doublée une seconde fois.
"""

import math
import os
import re
import shutil

from PIL import Image, ImageFilter

SRC = "assets/home/src/projects"
OUT = "assets/home/projects"
CSS = "css/style.css"
HTML = "index.html"

# Le dossier où les exports Figma atterrissent naturellement quand on les dépose
# à côté des fichiers servis. Il est RAMASSÉ vers SRC au début de chaque passe, et
# ce n'est pas de la coquetterie : `assets/*/src/` est la seule règle de
# .gitignore qui tient les sources hors du dépôt, et le dépôt est public. Un
# export de 1,2 Mo laissé là partirait en ligne au prochain commit.
DROPBOX = os.path.join(OUT, "png")

DENSITY = 2          # densité d'écran visée

# La largeur du groupement à son maximum, en px CSS. La section plafonne à
# 1512 px de large et porte 40 px de marge de chaque côté ; le groupement en
# occupe 53 % (`.pcluster`). C'est la plus grande taille à laquelle une pièce
# sera jamais affichée — au-delà de 1512 px de fenêtre, plus rien ne grandit.
CLUSTER_MAX = round((1512 - 2 * 40) * 0.53)

# Le masque flou ne sert QUE dans le sens agrandissement : il rattrape le flou du
# rééchantillonnage. Sur une source déjà grande, réduire suffit — ajouter du
# contraste de bord au-dessus donnerait un liseré.
SHARPEN = dict(radius=1.6, percent=60, threshold=2)

# Deux qualités seulement. 92 pour ce qui porte du texte ou des bords nets —
# interfaces, captures d'écran, logos — où un artefact de compression se lit tout
# de suite ; 84 pour les rendus 3D, les photos et les pièces déjà floutées, qui
# n'en montrent rien.
CRISP, SOFT = 92, 84
QUALITY = {
    "jm-ipad": CRISP,
    "jm-logo": CRISP,
    "beepz-iphone": CRISP,
    "jmz-wallet": CRISP,
    "jmz-stats": CRISP,
    "logo-jm-left": CRISP,
    "logo-beepz-left": CRISP,
    "logo-jimizz-left": CRISP,
}


def collect():
    """Ramasse les exports déposés dans OUT/png/ vers SRC, et vide le dossier."""
    if not os.path.isdir(DROPBOX):
        return

    os.makedirs(SRC, exist_ok=True)
    moved = 0
    for root, _, files in os.walk(DROPBOX):
        for f in files:
            if not f.lower().endswith(".png"):
                continue
            shutil.move(os.path.join(root, f), os.path.join(SRC, f))
            moved += 1

    shutil.rmtree(DROPBOX, ignore_errors=True)
    if moved:
        print(f"{DROPBOX}/ → {SRC}/ : {moved} sources rangées hors du dépôt.\n")


def targets():
    """Renvoie {nom de fichier: largeur cible en px}, lue dans le CSS et le HTML."""
    css = open(CSS, encoding="utf-8").read()
    html = open(HTML, encoding="utf-8").read()

    # .pcluster__item--jz-rocket { ... width: 26.0%; ... }
    widths = {m.group(1): float(m.group(2)) for m in re.finditer(
        r"\.pcluster__item--([a-z0-9-]+)\s*\{[^}]*?width:\s*([\d.]+)%", css)}

    # class="pcluster__item pcluster__item--jz-rocket" ... src=".../jmz-rocket.webp"
    out = {}
    for slug, name in re.findall(
            r'pcluster__item--([a-z0-9-]+)"[^>]*?src="assets/home/projects/([a-z0-9-]+)\.webp"',
            html):
        if slug not in widths:
            raise SystemExit(f"{slug} est dans index.html mais pas dans le CSS")
        out[name] = round(widths[slug] / 100 * CLUSTER_MAX * DENSITY)

    missing = set(widths) - {s for s, _ in re.findall(
        r'pcluster__item--([a-z0-9-]+)"[^>]*?src="assets/home/projects/([a-z0-9-]+)\.webp"',
        html)}
    if missing:
        raise SystemExit(f"règles CSS sans image dans index.html : {sorted(missing)}")

    # Les trois icônes de carte, elles, sont dimensionnées en px : on prend le
    # plafond de leur clamp, la seule taille où elles ont besoin de tout leur jus.
    icon = re.search(r"\.pcard__icon\s*\{[^}]*?width:\s*clamp\([^)]*?([\d.]+)px\s*\)", css)
    if not icon:
        raise SystemExit("largeur de .pcard__icon introuvable dans le CSS")
    icon_w = round(float(icon.group(1)) * DENSITY)
    for name in re.findall(r'pcard__icon" src="assets/home/projects/([a-z0-9-]+)\.webp"', html):
        out[name] = icon_w

    return out


def build(name, target_w):
    src = os.path.join(SRC, name + ".png")
    if not os.path.exists(src):
        print(f"  {name:20s} source absente, ignoré")
        return None, 0, 0

    im = Image.open(src).convert("RGBA")
    target_h = round(im.height * target_w / im.width)
    quality = QUALITY.get(name, SOFT)

    if im.width == target_w:
        out, how = im, "tel quel"
    else:
        out = im.resize((target_w, target_h), Image.LANCZOS)
        ratio = target_w / im.width
        if ratio > 1:
            out = out.filter(ImageFilter.UnsharpMask(**SHARPEN))
            how = f"agrandi ×{ratio:.2f}"
        else:
            how = f"réduit ×{ratio:.2f}"

    dst = os.path.join(OUT, name + ".webp")
    out.save(dst, "WEBP", quality=quality, method=6)
    print(f"  {name:20s} {im.width:4d} → {target_w:4d} px  q{quality}  "
          f"{os.path.getsize(dst) / 1024:6.1f} Ko  ({how})")
    return out.size, im.width, target_w


def main():
    os.makedirs(OUT, exist_ok=True)
    collect()
    print(f"{SRC} → {OUT}   (groupement large de {CLUSTER_MAX} px, densité {DENSITY})")

    sizes, short, absent = {}, [], []
    for name, target_w in targets().items():
        size, src_w, want_w = build(name, target_w)
        if not size:
            absent.append(name)
            continue
        sizes[name] = size
        if src_w < want_w:
            short.append((name, src_w, want_w))

    total = sum(os.path.getsize(os.path.join(OUT, f))
                for f in os.listdir(OUT) if f.endswith(".webp"))
    print(f"\n{len(sizes)} fichiers, {total / 1024:.0f} Ko au total.")

    print("\nAttributs width/height à porter dans index.html :")
    for name, (w, h) in sorted(sizes.items()):
        print(f'  {name:20s} width="{w}" height="{h}"')

    report_short(short, absent)


def report_short(short, absent):
    """Dit ce qu'il manque, et à quelle échelle réexporter pour que ça cesse.

    Sans ça le script rend le même service en silence qu'il ait de vraies sources
    ou des vignettes : il produit un fichier à la bonne taille dans les deux cas,
    et rien ne dit que la moitié des pixels est inventée."""
    if absent:
        print(f"\n⚠  {len(absent)} pièces n'ont PAS été régénérées, faute de source "
              f"dans {SRC}/ :")
        for name in absent:
            print(f"   {name}")
        print("   Le .webp déjà servi est laissé en place — la page ne casse pas, mais "
              "ces\n   pièces ne sont plus reconstructibles. Redépose leur PNG.")

    if not short:
        print("\nToutes les sources présentes étaient au moins à la taille voulue. "
              "Rien n'a été agrandi.")
        return

    worst = max(w / s for _, s, w in short)
    figma = math.ceil(worst)
    print(f"\n⚠  {len(short)} pièces ont été AGRANDIES : leur source est plus "
          f"petite que la cible.")
    print("   Le rééchantillonnage nettoie les bords, il n'invente aucun détail — "
          "ces\n   pièces resteront molles tant que la source ne sera pas plus grande.")
    print(f"\n   {'pièce':20s} {'source':>7s} {'cible':>7s} {'facteur':>9s}")
    for name, src_w, want_w in sorted(short, key=lambda r: -r[2] / r[1]):
        print(f"   {name:20s} {src_w:7d} {want_w:7d} {want_w / src_w:8.2f}×")
    print(f"\n   Le plus fort facteur vaut ×{worst:.2f}. Dans Figma : sélectionne les "
          f"pièces,\n   Export → PNG → {figma}x, et dépose-les dans {SRC}/ sous les MÊMES "
          f"noms.\n   Une source trop grande ne coûte rien : le script la réduit, ce qui "
          f"est propre.")


if __name__ == "__main__":
    main()
