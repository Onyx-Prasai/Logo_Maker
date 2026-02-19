from physics import sph
from rendering import renderer
from scene import scene
import time

def main_taichi():
    import taichi as ti
    ti.init(arch=ti.gpu)
    window = ti.ui.Window('GPU SPH Demo', (1024, 768))
    canvas = window.get_canvas()
    scene.setup_example_scene()
    slow_motion = False
    last = time.time()
    while window.running:
        now = time.time()
        dt = 1.0 / 60.0
        if slow_motion:
            dt *= 0.2
        sph.step(dt)
        canvas.clear(0x112233)
        renderer.draw_particles(window, canvas)
        n = int(sph.particle_count[None])
        if now - last > 0.5:
            print(f"FPS ~ {1.0 / max(1e-6, now - last):.1f}  Particles: {n}")
            last = now
        window.show()

def main_matplotlib():
    import matplotlib.pyplot as plt
    scene.setup_example_scene()
    fig, ax = plt.subplots()
    ax.set_xlim(0, 1)
    ax.set_ylim(0, 1)
    scatter = ax.scatter([], [])
    plt.ion()
    plt.show()
    last = time.time()
    while plt.fignum_exists(fig.number):
        now = time.time()
        dt = 1.0 / 30.0
        sph.step(dt)
        renderer.draw_particles(ax=ax, scatter=scatter)
        if now - last > 0.5:
            n = sph.particle_count if not getattr(sph, 'TAICHI_AVAILABLE', False) else int(sph.particle_count[None])
            print(f"FPS ~ {1.0 / max(1e-6, now - last):.1f}  Particles: {n}")
            last = now
        plt.pause(0.001)

def main():
    if getattr(sph, 'TAICHI_AVAILABLE', False):
        main_taichi()
    else:
        print('Taichi not found — using NumPy fallback renderer (matplotlib).')
        main_matplotlib()

if __name__ == '__main__':
    main()
