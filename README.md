# GPU-Accelerated Real-Time Fluid Simulation Engine (Taichi SPH)

This project is a modular, Taichi-based GPU-accelerated Smoothed Particle Hydrodynamics (SPH) engine designed for real-time, cinematic water simulation and interactive scenes.

Features included in this scaffold:
- GPU-accelerated SPH implementation using Taichi kernels
- Uniform spatial hashing grid for near O(n) neighbor search
- Pressure, viscosity, surface tension, buoyancy (temperature-dependent)
- Temperature field and heat diffusion coupling to buoyancy
- Simple splash/droplet spawning system
- Taichi-based rendering (metaball-like splatting) and UI sliders
- Example scene with bridge, pebbles, and interactive controls

This is an extensible foundation implementing the required physics and optimization patterns. See `requirements.txt` for dependencies and `main.py` to run.

Run:

1. Create a Python environment and install requirements:

```bash
pip install -r requirements.txt
```

2. Run the demo:

```bash
python main.py
```

Notes:
- This scaffold uses Taichi for GPU kernels and GUI. It is optimized for many particles using a uniform grid and Taichi parallel kernels.
- The engine is modular; expand `physics/`, `gpu_kernels/`, `rendering/`, and `scene/` for advanced shaders and effects.



