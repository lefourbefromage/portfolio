"""Generate an organic GPS-like hiking track: a smooth spine with switchbacks,
displaced sideways by fractal noise so it wanders like a real recorded trace."""
import re
import pathlib
REPO = pathlib.Path(__file__).resolve().parent.parent
import numpy as np
from scipy.ndimage import gaussian_filter

rng = np.random.default_rng(5)

SAMPLES = 1600

# Spine: bottom-left up to the top-right, with two switchback clusters.
# No segment doubles back over another, so the track never crosses itself.
SPINE = [
    (2150, 5250), (2470, 5090), (2790, 4980), (3130, 4820),
    (3410, 4580),                      # first hairpin, swinging right
    (3160, 4370), (2850, 4290), (2600, 4090),
    (2500, 3860),                      # second hairpin, swinging left
    (2700, 3690), (3030, 3610), (3360, 3480),
    (3640, 3290),                      # third hairpin, right again
    (3450, 3070), (3160, 2970),
    (3100, 2770),                      # fourth hairpin, left
    (3360, 2630), (3680, 2580),
    (3980, 2700),                      # a saddle: the ground drops again
    (4260, 2600), (4450, 2410),
    (4720, 2490),                      # and one last dip before the finish
    (4960, 2320), (5130, 2150), (5250, 2040),
]


def catmull_rom(points, samples):
    """Smooth interpolation through every control point."""
    p = np.array(points, dtype=float)
    p = np.vstack([p[0] + (p[0] - p[1]), p, p[-1] + (p[-1] - p[-2])])
    out = []
    segs = len(p) - 3
    for i in range(segs):
        p0, p1, p2, p3 = p[i], p[i + 1], p[i + 2], p[i + 3]
        for t in np.linspace(0, 1, samples // segs, endpoint=False):
            t2, t3 = t * t, t * t * t
            out.append(0.5 * ((2 * p1) + (-p0 + p2) * t
                              + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2
                              + (-p0 + 3 * p1 - 3 * p2 + p3) * t3))
    out.append(p[-2])
    return np.array(out)


spine = catmull_rom(SPINE, SAMPLES)

# Perpendicular direction at every sample
d = np.gradient(spine, axis=0)
lengths = np.hypot(d[:, 0], d[:, 1])
lengths[lengths == 0] = 1
normals = np.stack([-d[:, 1] / lengths, d[:, 0] / lengths], axis=1)

# Fractal sideways noise: broad wander + medium kinks + fine jitter
n = len(spine)
offset = np.zeros(n)
for sigma, amp in [(64, 34), (24, 30), (8, 24), (3, 14), (1.4, 6)]:
    offset += amp * gaussian_filter(rng.normal(size=n), sigma=sigma, mode="nearest")

# Normalise so the amplitudes above mean what they say
offset /= np.abs(offset).max() / 96

# Taper to zero at both ends so the track keeps its start and finish
taper = np.minimum(1.0, np.minimum(np.arange(n), np.arange(n)[::-1]) / 40)
offset *= taper

track = spine + normals * offset[:, None]

# Light smoothing pass to kill any sampling spikes
track[:, 0] = gaussian_filter(track[:, 0], sigma=0.5, mode="nearest")
track[:, 1] = gaussian_filter(track[:, 1], sigma=0.5, mode="nearest")

# Decimate: keep enough points for the wiggle, not so many that the file bloats
step = 2
pts = track[::step]
if not np.array_equal(pts[-1], track[-1]):
    pts = np.vstack([pts, track[-1]])

d_attr = "M " + " L ".join(f"{x:.0f} {y:.0f}" for x, y in pts)

print("points:", len(pts))
print("x range:", int(pts[:, 0].min()), int(pts[:, 0].max()))
print("y range:", int(pts[:, 1].min()), int(pts[:, 1].max()))
print("path chars:", len(d_attr))

INDEX = REPO / "index.html"
html = open(INDEX).read()

# Replace the d attribute on both the reveal mask path and the visible track
html, n1 = re.subn(r'(<path class="trail__track-done" d=")[^"]+(")', lambda m: m.group(1) + d_attr + m.group(2), html)
html, n2 = re.subn(r'(<path class="trail__track" d=")[^"]+(")', lambda m: m.group(1) + d_attr + m.group(2), html)
if (n1, n2) != (1, 1):
    raise SystemExit(f"Unexpected replacement counts: {n1}, {n2}")
open(INDEX, "w").write(html)
print("index.html updated")
