"""Relief cuit : une seule tuile, et un tracé qui monte et descend avec le terrain.

Le relief n'est pas obtenu en empilant des calques en 3D — une version
précédente le faisait, et la surface composée (un calque par niveau, sur toute
la carte) saturait le compositeur : la carte et le tracé clignotaient. Ici le
décalage de chaque niveau est **dessiné dans la tuile**, une bonne fois. Un seul
calque, donc plus aucun coût de composition, et autant de niveaux qu'on veut.

Le prix de cette cuisson : la direction de l'empilement est fixée dans l'image,
donc elle suit la rotation cap-en-haut de la carte au lieu de rester verticale à
l'écran. Comme ROT_DAMP borne cette rotation à ±25°, le relief penche un peu au
fil de la marche — c'est le compromis assumé.

Le script produit deux choses :
  - assets/trail-relief.svg, la tuile ;
  - le `d` des deux <path> du parcours dans index.html, décalé en altitude pour
    que le chemin colle au relief.

Le tracé plat de référence est conservé dans assets/route-flat.path : c'est lui
qui est relu à chaque exécution, donc relancer le script ne cumule pas les
décalages. Si tu régénères le tracé avec gen_route.py, supprime ce fichier pour
qu'il soit recapturé, puis relance ce script.
"""
import os
import pathlib
import re
REPO = pathlib.Path(__file__).resolve().parent.parent
import numpy as np
from scipy.ndimage import gaussian_filter
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

# --- Réglages du relief -------------------------------------------------------
# STEP est contraint par l'espacement horizontal des courbes : au-delà d'environ
# un quart de cet espacement, deux niveaux voisins se croisent à l'écran au lieu
# de s'emboîter, et le volume cesse de se lire. Espacement ~ TILE / LEVELS.
TILE = 1400          # période du motif, en px de carte
LEVELS = 18
STEP = 18            # px de carte entre deux niveaux
INDEX_EVERY = 4

N = 220              # field resolution (before the wrap duplicate)
MIN_LAKE_AREA = 900
MAX_LAKE_AREA = 260000
DECIMATE = 2
LO, HI = 0.06, 0.95  # bornes des niveaux dans le champ normalisé

rng = np.random.default_rng(23)

# Every octave wraps, so the field is genuinely periodic.
field = np.zeros((N, N))
for sigma, weight in [(38, 1.0), (19, 0.42), (9, 0.14)]:
    field += weight * gaussian_filter(rng.normal(size=(N, N)), sigma=sigma, mode="wrap")

# Duplicate the first row/column at the end so the seam values are identical,
# not merely adjacent — that is what makes the contours line up when tiled.
field = np.vstack([field, field[0:1]])
field = np.hstack([field, field[:, 0:1]])
field = (field - field.min()) / (field.max() - field.min())

fig, ax = plt.subplots()
cs = ax.contour(field, levels=np.linspace(LO, HI, LEVELS))
s = TILE / (field.shape[0] - 1)


def thin(seg):
    if len(seg) <= 8 or DECIMATE < 2:
        return seg
    kept = seg[::DECIMATE]
    if not np.array_equal(kept[-1], seg[-1]):
        kept = np.vstack([kept, seg[-1]])
    return kept


def to_path(seg, close, dy):
    pts = " L ".join(f"{x * s:.0f} {y * s + dy:.0f}" for x, y in seg)
    return f"M {pts}" + (" Z" if close else "")


def area(seg):
    x, y = seg[:, 0] * s, seg[:, 1] * s
    return 0.5 * abs(np.dot(x, np.roll(y, 1)) - np.dot(y, np.roll(x, 1)))


# --- La tuile -----------------------------------------------------------------
groups = []
for i, segs in enumerate(cs.allsegs):
    is_index = (i % INDEX_EVERY == 0)
    # Le niveau i est remonté de i*STEP. La tuile se répétant tous les TILE, on
    # dessine chaque niveau deux fois — à dy et dy+TILE — ce qui suffit à couvrir
    # la bande visible sans trou, et garde donc la couture invisible.
    dy = -i * STEP
    paths, lakes = [], []
    for seg in segs:
        if len(seg) < 5:
            continue
        closed = bool(np.allclose(seg[0], seg[-1]))
        a = area(seg) if closed else 0
        seg = thin(seg)
        is_lake = closed and i <= LEVELS // 3 and MIN_LAKE_AREA < a < MAX_LAKE_AREA
        for wrap in (0, TILE):
            (lakes if is_lake else paths).append(to_path(seg, closed, dy + wrap))

    depth = i / (LEVELS - 1)
    stroke = (0.34 + 0.34 * depth) if is_index else (0.16 + 0.30 * depth)
    width = 2.0 if is_index else 1.1
    if paths:
        groups.append(
            f'<g fill="none" stroke="rgba(6,13,34,{stroke:.3f})" stroke-width="{width}"'
            ' stroke-linejoin="round" stroke-linecap="round">'
            + "".join(f'<path d="{d}"/>' for d in paths)
            + "</g>"
        )
    if lakes:
        groups.append(
            '<g fill="rgba(6,13,34,.045)" stroke="rgba(6,13,34,.2)" stroke-width="1.6">'
            + "".join(f'<path d="{d}"/>' for d in lakes)
            + "</g>"
        )

plt.close(fig)

tile = (
    f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {TILE} {TILE}"'
    f' width="{TILE}" height="{TILE}">' + "".join(groups) + "</svg>"
)
out = REPO / "assets" / "trail-relief.svg"
open(out, "w").write(tile)


# --- Le tracé, posé sur le terrain -------------------------------------------
def height_at(x, y):
    """Altitude du terrain sous un point de la carte, par interpolation bilinéaire.
    Le motif se répète tous les TILE, donc on ramène le point dans la tuile."""
    u = (x % TILE) / s
    v = (y % TILE) / s
    i0, j0 = int(v), int(u)
    fv, fu = v - i0, u - j0
    i1 = min(i0 + 1, field.shape[0] - 1)
    j1 = min(j0 + 1, field.shape[1] - 1)
    return (
        field[i0, j0] * (1 - fv) * (1 - fu)
        + field[i0, j1] * (1 - fv) * fu
        + field[i1, j0] * fv * (1 - fu)
        + field[i1, j1] * fv * fu
    )


html_path = REPO / "index.html"
html = open(html_path).read()
flat_path = REPO / "assets" / "route-flat.path"

if flat_path.exists():
    flat_d = open(flat_path).read().strip()
else:
    flat_d = re.search(r'class="trail__track" d="([^"]+)"', html).group(1)
    open(flat_path, "w").write(flat_d)

pts = [(float(a), float(b)) for a, b in re.findall(r"(-?[\d.]+) (-?[\d.]+)", flat_d)]
raised = []
for x, y in pts:
    # Même barème que les courbes : un point à l'altitude h monte de
    # h*(LEVELS-1)*STEP, donc le chemin épouse l'empilement dessiné dans la tuile.
    lvl = float(np.clip((height_at(x, y) - LO) / (HI - LO), 0, 1)) * (LEVELS - 1)
    raised.append(f"{x:.0f} {y - lvl * STEP:.0f}")
raised_d = "M " + " L ".join(raised)

for cls in ("trail__track", "trail__track-done"):
    html = re.sub(rf'(class="{cls}" d=")[^"]+(")',
                  lambda m: m.group(1) + raised_d + m.group(2), html)
open(html_path, "w").write(html)

print(
    f"tuile={TILE}px niveaux={LEVELS} relief={(LEVELS - 1) * STEP}px"
    f" KB={round(os.path.getsize(out) / 1024)} | tracé relevé sur {len(pts)} points"
)
