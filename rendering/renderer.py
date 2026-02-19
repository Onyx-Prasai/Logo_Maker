import physics.sph as sph

try:
    import taichi as ti
    TI = True
except Exception:
    TI = False

def draw_particles_taichi(window, canvas, camera=None):
    n = int(sph.particle_count[None])
    if n == 0:
        return
    positions = sph.pos.to_numpy()[:n]
    temps = sph.temperature.to_numpy()[:n]
    screen_pts = []
    colors = []
    for i in range(n):
        p = positions[i]
        x = p[0]
        y = p[1]
        sx = x / (sph.grid_size * sph.CELL_SIZE)
        sy = y / (sph.grid_size * sph.CELL_SIZE)
        screen_pts.append([sx, sy])
        t = temps[i]
        c = [0.2 + min(1.0, (t - 10.0) * 0.05), 0.4, 0.9 - min(0.6, (t - 10.0) * 0.02)]
        colors.append(c)
    import numpy as np
    pts = np.array(screen_pts, dtype=np.float32)
    cols = np.array(colors, dtype=np.float32)
    canvas.circles(pts, radius=2.5, color=cols)

def draw_particles_matplotlib(ax, scatter):
    import numpy as np
    n = sph.particle_count if not getattr(sph, 'TAICHI_AVAILABLE', False) else int(sph.particle_count[None])
    if n == 0:
        return
    if getattr(sph, 'TAICHI_AVAILABLE', False):
        positions = sph.pos.to_numpy()[:n]
    else:
        positions = sph.pos[:n]
    xs = positions[:, 0]
    ys = positions[:, 1]
    scatter.set_offsets(np.vstack([xs, ys]).T)

def draw_particles(window=None, canvas=None, ax=None, scatter=None):
    if TI and getattr(sph, 'TAICHI_AVAILABLE', False):
        draw_particles_taichi(window, canvas)
    else:
        draw_particles_matplotlib(ax, scatter)
