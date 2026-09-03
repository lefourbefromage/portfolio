"""Seamless topographic tile: the noise wraps, so contour lines meet
exactly across the edges and the tile can repeat forever."""
import os
import pathlib
REPO = pathlib.Path(__file__).resolve().parent.parent
import numpy as np
from scipy.ndimage import gaussian_filter
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

TILE = 2400
N = 220              # field resolution (before the wrap duplicate)
LEVELS = 30
INDEX_EVERY = 5
MIN_LAKE_AREA = 900
MAX_LAKE_AREA = 260000
DECIMATE = 2

rng = np.random.default_rng(23)

# Every octave wraps, so the field is genuinely periodic.
field = np.zeros((N, N))
for sigma, weight in [(34, 1.0), (17, 0.55), (8, 0.28), (4, 0.13)]:
    field += weight * gaussian_filter(rng.normal(size=(N, N)), sigma=sigma, mode="wrap")

# Duplicate the first row/column at the end so the seam values are identical,
# not merely adjacent — that is what makes the contours line up when tiled.
field = np.vstack([field, field[0:1]])
field = np.hstack([field, field[:, 0:1]])
field = (field - field.min()) / (field.max() - field.min())

fig, ax = plt.subplots()
cs = ax.contour(field, levels=np.linspace(0.04, 0.97, LEVELS))

s = TILE / (field.shape[0] - 1)


def thin(seg):
    if len(seg) <= 8 or DECIMATE < 2:
        return seg
    kept = seg[::DECIMATE]
    if not np.array_equal(kept[-1], seg[-1]):
        kept = np.vstack([kept, seg[-1]])
    return kept


def to_path(seg, close):
    pts = " L ".join(f"{x * s:.0f} {y * s:.0f}" for x, y in seg)
    return f"M {pts}" + (" Z" if close else "")


def area(seg):
    x, y = seg[:, 0] * s, seg[:, 1] * s
    return 0.5 * abs(np.dot(x, np.roll(y, 1)) - np.dot(y, np.roll(x, 1)))


index_paths, minor_paths, lakes = [], [], []

for i, segs in enumerate(cs.allsegs):
    is_index = (i % INDEX_EVERY == 0)
    for seg in segs:
        if len(seg) < 5:
            continue
        closed = bool(np.allclose(seg[0], seg[-1]))
        a = area(seg) if closed else 0
        seg = thin(seg)
        if closed and i <= LEVELS // 3 and MIN_LAKE_AREA < a < MAX_LAKE_AREA:
            lakes.append(to_path(seg, True))
            continue
        (index_paths if is_index else minor_paths).append(to_path(seg, closed))

plt.close(fig)

svg = [
    f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {TILE} {TILE}" width="{TILE}" height="{TILE}">',
    '<g fill="none" stroke="rgba(6,13,34,.22)" stroke-width="1.1" stroke-linejoin="round" stroke-linecap="round">',
    *(f'<path d="{d}"/>' for d in minor_paths),
    "</g>",
    '<g fill="none" stroke="rgba(6,13,34,.42)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round">',
    *(f'<path d="{d}"/>' for d in index_paths),
    "</g>",
    '<g fill="rgba(6,13,34,.045)" stroke="rgba(6,13,34,.2)" stroke-width="1.6">',
    *(f'<path d="{d}"/>' for d in lakes),
    "</g>",
    "</svg>",
]

out = REPO / "assets" / "trail-map.svg"
open(out, "w").write("".join(svg))
print(f"minor={len(minor_paths)} index={len(index_paths)} lakes={len(lakes)} KB={round(os.path.getsize(out)/1024)}")
