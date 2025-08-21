# Ray Casting Prototype (p5.js)

An interactive 2D ray-casting playground built with p5.js.
Particles bounce inside a field of random line segments while casting rays each frame. Optional visual layers show connectivity, trails, and heatmaps.

### 👉 [Live Demo](https://tahmid406.github.io/Ray-casting-prototype/)

---

## ✨ Features

- **Ray casting**: Each particle emits rays that find the nearest wall intersection.
- **Bouncing particles**: Circle–line collision with velocity reflection.
- **Walls**: Random non-overlapping segments plus border walls.
- **Visual layers**:

  - Mesh network (connects nearby intersections)
  - Trails (fading glow of particle paths)
  - Heatmap (density of intersection hits)

- **Responsive**: Resizes to window and regenerates.

---

## 🎮 Controls

- **M** — toggle Mesh Network
- **T** — toggle Trails
- **H** — toggle Heatmap

---

## ⚙️ Configuration

Adjust values in source to tune behavior and performance:

- **Walls & Particles** (`main.js`):

  - Number of random walls
  - Particle count & rays per particle
  - Heatmap cell size

- **Rays** (`constructors.js`):

  - Maximum ray length

- **Visual layers** (`visuals.js`):

  - Mesh distance & neighbors
  - Trail fade speed & radius
  - Heatmap decay rate & colors

---

## 🧩 How It Works

1. **Walls** are generated with random angle/length, filtered to avoid overlap with existing or border walls.
2. **Particles** move, collide with walls, and bounce.
3. **Rays** cast from each particle, keeping the closest hit per wall.
4. **Layers** consume the intersection points each frame to draw mesh, trails, or heatmap overlays.
