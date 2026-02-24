# 🎨 LogoCraft — AI-Powered Logo Designer

A full-stack logo design application built with **React**, **Three.js**, **Canvas API**, and **Node.js** as a Computer Graphics course project.

---

## 📸 Features

- **Type a brand name** → instantly receive multiple unique logo variants
- **Filter System** — filter by colour palette, shape, effect, layout, font style, and background pattern
- **2D Mode** — Canvas API renderer using real CG algorithms
- **3D Mode** — Three.js interactive 3D logos with PBR materials and lighting
- **Download** — export selected logo as **PNG** or **SVG**
- **Responsive UI** — works on desktop and mobile

---

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) v18 or higher
- npm v9 or higher

### 1. Install Dependencies

```bash
# Frontend dependencies
cd logo-designer
npm install

# Backend dependencies (already inside logo-designer/server)
cd server
npm install
cd ..
```

### 2. Start the Backend Server

Open **Terminal 1**:
```bash
cd logo-designer
npm run server
# Server starts at http://localhost:5001
```

### 3. Start the Frontend Dev Server

Open **Terminal 2**:
```bash
cd logo-designer
npm run dev
# Frontend starts at http://localhost:5173
```

### 4. Open the App

Visit **[http://localhost:5173](http://localhost:5173)** in your browser.

---

## 🗂️ Project Structure

```
logo-designer/
├── server/
│   ├── index.js          ← Node.js + Express backend
│   └── package.json
├── src/
│   ├── App.jsx           ← Main React application
│   ├── LogoCanvas.jsx    ← Canvas 2D renderer (CG algorithms)
│   ├── Logo3D.jsx        ← Three.js 3D renderer
│   ├── LogoCard.jsx      ← Individual logo card component
│   ├── FilterPanel.jsx   ← Sidebar filter UI
│   ├── index.css         ← Global dark design system
│   └── main.jsx          ← React entry point
├── index.html
├── vite.config.js
└── package.json
```

---

## 🖥️ Tech Stack

| Layer     | Technology                                      |
|-----------|------------------------------------------------|
| Frontend Framework | React 19 + Vite 7                      |
| 3D Rendering | Three.js + React Three Fiber + Drei    |
| 2D Rendering | HTML5 Canvas API                        |
| Animations | Framer Motion + GSAP                     |
| HTTP Client | Axios                                    |
| Backend    | Node.js + Express 5                       |
| File Export | FileSaver.js                             |

---

## 🎓 Computer Graphics Concepts Used

This project demonstrates the following concepts from the Computer Graphics curriculum:

---

### 1. 🔶 Geometric Transformations (2D & 3D)
**Files:** `LogoCanvas.jsx`, `Logo3D.jsx`

The mathematics of linear transformations are applied throughout:

- **Translation** — `ctx.translate(cx, cy)` repositions the canvas coordinate origin
- **Rotation** — `ctx.rotate(angle)` applies a 2D rotation matrix to draw diagonal text, circular layouts, and rotating 3D meshes
- **Scaling** — `ctx.scale(dpr, dpr)` to handle HiDPI/Retina display pixel scaling
- **3D Model Matrix** — Three.js updates the **rotation.x/y** of meshes every frame (`useFrame`), composing translation, rotation, and scale into a single 4×4 model matrix

---

### 2. 🌀 Bezier Curves
**File:** `LogoCanvas.jsx`

Cubic Bezier curves `ctx.bezierCurveTo(cx1, cy1, cx2, cy2, x, y)` are used:
- **Shield shape** — two cubic Bezier segments form the curved bottom of the shield
- **Infinity/Lemniscate shape** — four Bezier curves trace the figure-8 path
- **Arch shape** — a Bezier arc for the bottom curved edge
- **Decorative arcs** — random Bezier curves overlay the logo for artistic decoration

---

### 3. 🎨 Color Theory (HSL Colour Space)
**Files:** `LogoCanvas.jsx`, `server/index.js`

- **HSL hue rotation** — `shiftHue(hex, degrees)` converts an RGB hex colour → HSL → rotates the hue component → converts back to RGB, enabling palette shifting without losing saturation or brightness
- **Complementary colours** — the server generates palette objects where secondary and accent colours are mathematically related to the primary (offset hue angles)
- **8 named colour palettes** — Vibrant, Neon, Pastel, Monochrome, Golden, Ocean, Fire, Galaxy — each carefully crafted in HSL space

---

### 4. 🖼️ Rasterization (Canvas 2D API)
**File:** `LogoCanvas.jsx`

The Canvas 2D API performs **software rasterization**:
- Polygon scan-line fill: `ctx.fill()` after path construction
- **Regular polygon vertices** computed via `cos(2πi/n)`, `sin(2πi/n)` — the same formula used in polygon rasterization
- **Star polygon** — alternating inner/outer radii at each vertex
- Anti-aliasing applied automatically by the browser's 2D rasterizer

---

### 5. 🔦 Lighting & Shading (3D — Phong/PBR)
**File:** `Logo3D.jsx`

Three.js implements industry-standard lighting:
- **Ambient Light** — flat, directionless illumination simulating indirect bounce light
- **Point Lights** — positional lights attenuating with distance (inverse-square law), implementing the **Phong shading** illumination model (diffuse + specular)
- **PBR Materials** — `MeshStandardMaterial` with `metalness` and `roughness` parameters, implementing the **Cook-Torrance microfacet BRDF** for physically-based rendering

---

### 6. 🌐 Perspective Projection (3D Camera)
**File:** `Logo3D.jsx`

```js
<Canvas camera={{ position: [0, 0, 4.5], fov: 50, near: 0.1, far: 100 }}>
```
- **PerspectiveCamera** — applies the standard view frustum projection matrix
- **Near/far clipping planes** — frustum culling
- **FOV** — field of view angle defining the projection cone
- **Aspect ratio** — automatically adapted from the canvas dimensions

---

### 7. 🌍 Environment Mapping (IBL — Image-Based Lighting)
**File:** `Logo3D.jsx`

```jsx
<Environment preset="city" />
```
- **HDRI Environment Map** — a 360° panoramic image is projected onto a sphere and used both as a background and as a light source (Image-Based Lighting)
- Provides **reflection** on metallic surfaces without explicit reflection rays
- The `envMapIntensity` parameter scales the IBL contribution

---

### 8. 🎮 Interactive Camera — Quaternion Arc-Ball Rotation
**File:** `Logo3D.jsx`

```jsx
<OrbitControls />
```
- **Quaternion-based rotation** — avoids gimbal lock by representing camera orientation as a quaternion rather than Euler angles
- Mouse/touch drag updates the azimuth and elevation angles, then computes a new quaternion for smooth arc-ball navigation

---

### 9. 🌊 Procedural Pattern Generation (Texture Synthesis)
**File:** `LogoCanvas.jsx` — `drawPattern()` function

Procedural patterns are generated mathematically (no raster image textures):
- **Dots** — regular grid of `arc()` calls
- **Grid** — uniform horizontal and vertical line rasterization
- **Triangles** — tiled equilateral triangle wireframe using path commands
- **Hexagons** — offset-row hexagonal tiling (same algorithm as hex-grid maps)
- **Waves** — sine function `sin(x * frequency)` sampled at regular intervals to draw wave lines

---

### 10. ✨ Glow / Bloom Effect
**File:** `LogoCanvas.jsx`, `Logo3D.jsx`

- **2D Glow** — `ctx.shadowBlur` + `ctx.shadowColor` approximates a Gaussian blur convolution around drawn shapes and text — a software simulation of the GPU bloom post-processing pass
- **3D Glow** — emissive material component (`emissiveIntensity`) causes meshes to appear self-luminous, simulating bloom seen in real-time rendering pipelines

---

### 11. 🔲 Clipping (Canvas Path Masking)
**File:** `LogoCanvas.jsx`

`ctx.clip()` restricts subsequent drawing operations to the interior of a previously defined path — used to constrain pattern overlays inside the logo shape boundary.

---

### 12. 📐 Gradient Fill Pipeline (Linear & Radial)
**File:** `LogoCanvas.jsx`

- **Linear gradient** — `ctx.createLinearGradient(x0, y0, x1, y1)` — models light falling across a surface
- **Radial gradient** — `ctx.createRadialGradient(...)` — used for the background vignette, simulating a central light source
- Each gradient is a sequence of colour stops that the rasterizer interpolates between pixel-by-pixel

---

### 13. 📦 3D Geometric Primitives
**File:** `Logo3D.jsx`

Three.js geometry primitives correspond directly to CG textbook primitives:
- `SphereGeometry` — icosphere / UV sphere
- `BoxGeometry` — axis-aligned bounding box mesh
- `CylinderGeometry` — generalized cylinder (hexagon/badge cross-section)
- `TorusGeometry` — surface of revolution
- `TorusKnotGeometry` — parametric tube along a torus knot curve
- `OctahedronGeometry` — Platonic solid (diamond shape)

---

### 14. 🎬 Animation Loop (Per-Frame Transformation Updates)
**File:** `Logo3D.jsx`

```js
useFrame((state, delta) => {
  ref.current.rotation.y += delta * 0.6;  // continuous rotation
});
```
- Each animation frame re-computes the **model matrix** by incrementing rotation
- `delta` (time since last frame in seconds) ensures frame-rate-independent animation — a core principle in real-time rendering

---

## 📦 API Endpoints

| Method | Endpoint        | Description                                 |
|--------|----------------|---------------------------------------------|
| `POST` | `/api/generate` | Generate N logo configs for a given name    |
| `GET`  | `/api/filters`  | Get all available filter options             |
| `GET`  | `/api/palettes` | Get colour palette details                   |
| `GET`  | `/`             | Health check                                 |

### POST `/api/generate` — Request Body

```json
{
  "name": "Nexus",
  "count": 9,
  "filters": {
    "paletteType": "neon",
    "shapeStyle": "hexagon",
    "fontStyle": "sans",
    "effect": "glow",
    "layoutMode": "centered",
    "pattern": "dots"
  }
}
```

---

## 📝 License

MIT — free to use for academic and personal projects.

---

*Built for the Computer Graphics course project — demonstrating real-time 2D/3D rendering, geometric algorithms, colour science, and interactive graphics in a web browser.*
