import pathlib
REPO = pathlib.Path(__file__).resolve().parent.parent
import numpy as np
from scipy.ndimage import gaussian_filter
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

rng = np.random.default_rng(7)

# Field resolution / extent — landscape-ish aspect matching hero panel (1472x599 -> use similar ratio, wider)
W, H = 1472, 700
nx, ny = 220, 105

# Build a smooth random field via multiple octaves of smoothed noise (cheap Perlin-like)
field = np.zeros((ny, nx))
for octave, (sigma, weight) in enumerate([(28, 1.0), (14, 0.5), (7, 0.25)]):
    noise = rng.normal(size=(ny, nx))
    smooth = gaussian_filter(noise, sigma=sigma, mode="wrap")
    field += weight * smooth

field = (field - field.min()) / (field.max() - field.min())

fig, ax = plt.subplots(figsize=(W/100, H/100), dpi=100)
fig.patch.set_alpha(0)
ax.set_position([0, 0, 1, 1])
ax.axis("off")
ax.set_xlim(0, nx - 1)
ax.set_ylim(0, ny - 1)

levels = np.linspace(0.08, 0.92, 16)
color = "#22345f"
cs = ax.contour(field, levels=levels, colors=color, linewidths=1.1, antialiased=True)

fig.savefig(
    REPO / "assets" / "hero-topo-raw.svg",
    transparent=True,
    dpi=100,
)
print("done")
