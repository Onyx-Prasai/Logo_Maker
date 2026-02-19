import physics.sph as sph
import numpy as np


def setup_example_scene():
    # Initialize particle block as a stream source and a small pool
    if getattr(sph, 'TAICHI_AVAILABLE', False):
        sph.particle_count[None] = 0
    else:
        sph.particle_count = 0
    sph.init_particles(grid_origin=(1.0, 1.2, 1.0), box=(0.5, 0.25, 0.3), spacing=0.02)

def spawn_pebble(pos=(2.5, 1.5, 1.0), vel=(0.0, -2.0, 0.0)):
    ok = sph.add_particle(pos)
    if not ok:
        return
    # set velocity for new particle depending on backend
    if getattr(sph, 'TAICHI_AVAILABLE', False):
        import taichi as ti
        idx = int(sph.particle_count[None]) - 1
        sph.vel[idx] = ti.Vector([float(vel[0]), float(vel[1]), float(vel[2])])
        sph.mass[idx] = sph.PARTICLE_MASS * 5.0
    else:
        idx = int(sph.particle_count) - 1
        sph.vel[idx] = np.array([float(vel[0]), float(vel[1]), float(vel[2])], dtype=np.float32)
        sph.mass[idx] = sph.PARTICLE_MASS * 5.0
