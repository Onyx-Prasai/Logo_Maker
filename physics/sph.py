"""
Physics SPH module with two backends:
- Taichi backend (if `taichi` is installed)
- NumPy CPU fallback (works on Python 3.14)

The module exposes the same high-level API used by the rest of the project:
- add_particle(pos)
- init_particles(...)
- step(dt)
- particle_count (int-like)
"""

try:
    import taichi as ti
    import numpy as _np
    TAICHI_AVAILABLE = True
except Exception:
    TAICHI_AVAILABLE = False
    import numpy as np

if TAICHI_AVAILABLE:
    ti.init(arch=ti.gpu)
    # -----------------------------
    # Taichi implementation (unchanged)
    # -----------------------------
    MAX_PARTICLES = 40000
    DIM = 3
    REST_DENS = 1000.0
    PARTICLE_MASS = 0.02
    VISCOSITY = 0.1
    G = ti.Vector([0.0, -9.81, 0.0])
    GAS_CONST = 2000.0
    SMOOTH_RADIUS = 0.02
    CELL_SIZE = SMOOTH_RADIUS
    GRID_RES = 128
    MAX_NEIGHBORS = 64

    pos = ti.Vector.field(DIM, dtype=ti.f32, shape=MAX_PARTICLES)
    vel = ti.Vector.field(DIM, dtype=ti.f32, shape=MAX_PARTICLES)
    acc = ti.Vector.field(DIM, dtype=ti.f32, shape=MAX_PARTICLES)
    density = ti.field(dtype=ti.f32, shape=MAX_PARTICLES)
    pressure = ti.field(dtype=ti.f32, shape=MAX_PARTICLES)
    temperature = ti.field(dtype=ti.f32, shape=MAX_PARTICLES)
    mass = ti.field(dtype=ti.f32, shape=MAX_PARTICLES)

    grid_size = GRID_RES
    cell_count = grid_size * grid_size * grid_size
    cell_head = ti.field(dtype=ti.i32, shape=cell_count)
    next_idx = ti.field(dtype=ti.i32, shape=MAX_PARTICLES)

    particle_count = ti.field(dtype=ti.i32, shape=())

    pi = 3.141592653589793
    poly6_co = 315.0 / (64.0 * pi * SMOOTH_RADIUS ** 9)
    spiky_co = -45.0 / (pi * SMOOTH_RADIUS ** 6)
    visco_co = 45.0 / (pi * SMOOTH_RADIUS ** 6)

    @ti.func
    def hash_pos(p):
        i = int(p.x / CELL_SIZE)
        j = int(p.y / CELL_SIZE)
        k = int(p.z / CELL_SIZE)
        i = ti.max(0, ti.min(grid_size - 1, i))
        j = ti.max(0, ti.min(grid_size - 1, j))
        k = ti.max(0, ti.min(grid_size - 1, k))
        return i + j * grid_size + k * grid_size * grid_size

    @ti.kernel
    def reset_grid():
        for i in range(cell_count):
            cell_head[i] = -1

    @ti.kernel
    def build_grid():
        for i in range(particle_count[None]):
            h = hash_pos(pos[i])
            next_idx[i] = cell_head[h]
            cell_head[h] = i

    @ti.func
    def poly6(r, h):
        if r >= 0 and r <= h:
            x = (h * h - r * r)
            return poly6_co * x * x * x
        else:
            return 0.0

    @ti.func
    def spiky_grad(r_vec, h):
        r = r_vec.norm()
        if 0 < r and r <= h:
            return spiky_co * (h - r) ** 2 * (r_vec / r)
        else:
            return ti.Vector([0.0, 0.0, 0.0])

    @ti.func
    def visc_lap(r, h):
        r_norm = r
        if 0 <= r_norm and r_norm <= h:
            return visco_co * (h - r_norm)
        else:
            return 0.0

    @ti.kernel
    def compute_density_pressure():
        for i in range(particle_count[None]):
            rho = 0.0
            pi = pos[i]
            hi = hash_pos(pi)
            gx = hi % grid_size
            gy = (hi // grid_size) % grid_size
            gz = hi // (grid_size * grid_size)
            for ox, oy, oz in ti.ndrange((-1, 2), (-1, 2), (-1, 2)):
                nx = gx + ox
                ny = gy + oy
                nz = gz + oz
                if 0 <= nx < grid_size and 0 <= ny < grid_size and 0 <= nz < grid_size:
                    h = nx + ny * grid_size + nz * grid_size * grid_size
                    j = cell_head[h]
                    while j != -1:
                        r = (pi - pos[j]).norm()
                        rho += mass[j] * poly6(r, SMOOTH_RADIUS)
                        j = next_idx[j]
            density[i] = rho
            pressure[i] = GAS_CONST * (density[i] - REST_DENS)

    @ti.kernel
    def compute_forces():
        for i in range(particle_count[None]):
            f_pressure = ti.Vector([0.0, 0.0, 0.0])
            f_viscosity = ti.Vector([0.0, 0.0, 0.0])
            pi = pos[i]
            vi = vel[i]
            hi = hash_pos(pi)
            gx = hi % grid_size
            gy = (hi // grid_size) % grid_size
            gz = hi // (grid_size * grid_size)
            for ox, oy, oz in ti.ndrange((-1, 2), (-1, 2), (-1, 2)):
                nx = gx + ox
                ny = gy + oy
                nz = gz + oz
                if 0 <= nx < grid_size and 0 <= ny < grid_size and 0 <= nz < grid_size:
                    h = nx + ny * grid_size + nz * grid_size * grid_size
                    j = cell_head[h]
                    while j != -1:
                        if j != i:
                            r_vec = pi - pos[j]
                            r = r_vec.norm()
                            if r < SMOOTH_RADIUS and r > 1e-5:
                                f_pressure += -r_vec.normalized() * mass[j] * (pressure[i] + pressure[j]) / (2.0 * density[j]) * spiky_co * (SMOOTH_RADIUS - r) ** 2
                                f_viscosity += VISCOSITY * mass[j] * (vel[j] - vi) / density[j] * visc_lap(r, SMOOTH_RADIUS)
                        j = next_idx[j]
            buoy = ti.Vector([0.0, 0.0, 0.0])
            t = temperature[i]
            buoy_strength = (t - 20.0) * 0.02
            buoy = ti.Vector([0.0, buoy_strength * mass[i], 0.0])
            a = (f_pressure + f_viscosity) / density[i] + G + buoy / mass[i]
            acc[i] = a

    @ti.kernel
    def integrate(dt: ti.f32):
        for i in range(particle_count[None]):
            vel[i] += dt * acc[i]
            pos[i] += dt * vel[i]
            for d in ti.static(range(DIM)):
                if pos[i][d] < 0.01:
                    pos[i][d] = 0.01
                    vel[i][d] *= -0.3
                if pos[i][d] > (grid_size - 2) * CELL_SIZE:
                    pos[i][d] = (grid_size - 2) * CELL_SIZE
                    vel[i][d] *= -0.3

    @ti.kernel
    def apply_heat_source(center_x: ti.f32, center_y: ti.f32, radius: ti.f32, intensity: ti.f32):
        for i in range(particle_count[None]):
            d = (pos[i].xy - ti.Vector([center_x, center_y])).norm()
            if d < radius:
                temperature[i] += intensity

    @ti.func
    def add_particle(p):
        n = particle_count[None]
        if n >= MAX_PARTICLES:
            return False
        particle_count[None] = n + 1
        pos[n] = ti.Vector([float(p[0]), float(p[1]), float(p[2])])
        vel[n] = ti.Vector([0.0, 0.0, 0.0])
        mass[n] = PARTICLE_MASS
        density[n] = REST_DENS
        pressure[n] = 0.0
        temperature[n] = 20.0
        return True

    def init_particles(grid_origin=(1.0, 1.0, 1.0), box=(0.6, 0.2, 0.6), spacing=0.015):
        sx, sy, sz = grid_origin
        nx = int(box[0] / spacing)
        ny = int(box[1] / spacing)
        nz = int(box[2] / spacing)
        cnt = 0
        for i in range(nx):
            for j in range(ny):
                for k in range(nz):
                    x = sx + i * spacing
                    y = sy + j * spacing
                    z = sz + k * spacing
                    add_particle((x, y, z))
                    cnt += 1
                    if cnt >= MAX_PARTICLES:
                        return

    def step(dt: float):
        reset_grid()
        build_grid()
        compute_density_pressure()
        compute_forces()
        integrate(dt)

else:
    # -----------------------------
    # NumPy CPU fallback implementation
    # -----------------------------
    import numpy as np

    MAX_PARTICLES = 20000
    DIM = 3
    REST_DENS = 1000.0
    PARTICLE_MASS = 0.02
    VISCOSITY = 0.1
    G_VEC = np.array([0.0, -9.81, 0.0], dtype=np.float32)
    GAS_CONST = 2000.0
    SMOOTH_RADIUS = 0.02
    CELL_SIZE = SMOOTH_RADIUS
    GRID_RES = 64

    pos = np.zeros((MAX_PARTICLES, DIM), dtype=np.float32)
    vel = np.zeros((MAX_PARTICLES, DIM), dtype=np.float32)
    acc = np.zeros((MAX_PARTICLES, DIM), dtype=np.float32)
    density = np.zeros((MAX_PARTICLES,), dtype=np.float32)
    pressure = np.zeros((MAX_PARTICLES,), dtype=np.float32)
    temperature = np.full((MAX_PARTICLES,), 20.0, dtype=np.float32)
    mass = np.full((MAX_PARTICLES,), PARTICLE_MASS, dtype=np.float32)

    particle_count = 0

    def _cell_index(p):
        i = int(np.floor(p[0] / CELL_SIZE))
        j = int(np.floor(p[1] / CELL_SIZE))
        k = int(np.floor(p[2] / CELL_SIZE))
        i = max(0, min(GRID_RES - 1, i))
        j = max(0, min(GRID_RES - 1, j))
        k = max(0, min(GRID_RES - 1, k))
        return (i, j, k)

    def _hash_grid():
        cells = {}
        for idx in range(particle_count):
            key = _cell_index(pos[idx])
            if key in cells:
                cells[key].append(idx)
            else:
                cells[key] = [idx]
        return cells

    def poly6_np(r, h):
        if r >= 0 and r <= h:
            x = (h * h - r * r)
            return 315.0 / (64.0 * np.pi * h ** 9) * x * x * x
        return 0.0

    def visc_lap_np(r, h):
        if 0 <= r and r <= h:
            return 45.0 / (np.pi * h ** 6) * (h - r)
        return 0.0

    def compute_density_pressure():
        cells = _hash_grid()
        for i in range(particle_count):
            rho = 0.0
            pi = pos[i]
            ci = _cell_index(pi)
            for ox in (-1, 0, 1):
                for oy in (-1, 0, 1):
                    for oz in (-1, 0, 1):
                        key = (ci[0] + ox, ci[1] + oy, ci[2] + oz)
                        if key in cells:
                            for j in cells[key]:
                                r = np.linalg.norm(pi - pos[j])
                                rho += mass[j] * poly6_np(r, SMOOTH_RADIUS)
            density[i] = rho if rho > 1e-6 else REST_DENS
            pressure[i] = GAS_CONST * (density[i] - REST_DENS)

    def compute_forces():
        cells = _hash_grid()
        for i in range(particle_count):
            f_pressure = np.zeros(3, dtype=np.float32)
            f_viscosity = np.zeros(3, dtype=np.float32)
            pi = pos[i]
            vi = vel[i]
            ci = _cell_index(pi)
            for ox in (-1, 0, 1):
                for oy in (-1, 0, 1):
                    for oz in (-1, 0, 1):
                        key = (ci[0] + ox, ci[1] + oy, ci[2] + oz)
                        if key in cells:
                            for j in cells[key]:
                                if j == i:
                                    continue
                                r_vec = pi - pos[j]
                                r = np.linalg.norm(r_vec)
                                if r < SMOOTH_RADIUS and r > 1e-5:
                                    # pressure
                                    grad = -r_vec / (r + 1e-12) * (-45.0 / (np.pi * SMOOTH_RADIUS ** 6)) * (SMOOTH_RADIUS - r) ** 2
                                    f_pressure += mass[j] * (pressure[i] + pressure[j]) / (2.0 * density[j]) * grad
                                    # viscosity
                                    f_viscosity += VISCOSITY * mass[j] * (vel[j] - vi) / density[j] * visc_lap_np(r, SMOOTH_RADIUS)
            buoy_strength = (temperature[i] - 20.0) * 0.02
            buoy = np.array([0.0, buoy_strength * mass[i], 0.0], dtype=np.float32)
            a = (f_pressure + f_viscosity) / density[i] + G_VEC + buoy / mass[i]
            acc[i] = a

    def integrate(dt: float):
        for i in range(particle_count):
            vel[i] += dt * acc[i]
            pos[i] += dt * vel[i]
            for d in range(DIM):
                low = 0.01
                high = (GRID_RES - 2) * CELL_SIZE
                if pos[i][d] < low:
                    pos[i][d] = low
                    vel[i][d] *= -0.3
                if pos[i][d] > high:
                    pos[i][d] = high
                    vel[i][d] *= -0.3

    def apply_heat_source(center_x: float, center_y: float, radius: float, intensity: float):
        for i in range(particle_count):
            d = np.linalg.norm(pos[i][:2] - np.array([center_x, center_y], dtype=np.float32))
            if d < radius:
                temperature[i] += intensity

    def add_particle(p):
        global particle_count
        n = particle_count
        if n >= MAX_PARTICLES:
            return False
        pos[n] = np.array([float(p[0]), float(p[1]), float(p[2])], dtype=np.float32)
        vel[n] = np.zeros(3, dtype=np.float32)
        mass[n] = PARTICLE_MASS
        density[n] = REST_DENS
        pressure[n] = 0.0
        temperature[n] = 20.0
        particle_count += 1
        return True

    def init_particles(grid_origin=(1.0, 1.0, 1.0), box=(0.6, 0.2, 0.6), spacing=0.015):
        sx, sy, sz = grid_origin
        nx = int(box[0] / spacing)
        ny = int(box[1] / spacing)
        nz = int(box[2] / spacing)
        cnt = 0
        for i in range(nx):
            for j in range(ny):
                for k in range(nz):
                    x = sx + i * spacing
                    y = sy + j * spacing
                    z = sz + k * spacing
                    add_particle((x, y, z))
                    cnt += 1
                    if cnt >= MAX_PARTICLES:
                        return

    def step(dt: float):
        compute_density_pressure()
        compute_forces()
        integrate(dt)

