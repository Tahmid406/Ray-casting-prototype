// Visual layers: Mesh network, Trails, Heatmap
// p5.js global mode assumed

class MeshNetwork {
  constructor() {
    this.enabled = true;
    this.maxDist = 80; // connection radius
    this.maxNeighbors = 3; // nearest neighbors per point
    this.strokeAlpha = 90;
  }

  render(points) {
    if (!this.enabled || !points || points.length < 2) return;

    stroke(100, 180, 255, this.strokeAlpha);
    noFill();

    // Build neighbor connections
    for (let i = 0; i < points.length; i++) {
      const pi = points[i];
      // Collect neighbors with distance
      const neighbors = [];
      for (let j = i + 1; j < points.length; j++) {
        const pj = points[j];
        const dx = pi.x - pj.x;
        const dy = pi.y - pj.y;
        const d2 = dx * dx + dy * dy;
        if (d2 <= this.maxDist * this.maxDist) {
          neighbors.push({ j, d2 });
        }
      }
      // Sort by distance and take up to maxNeighbors
      neighbors.sort((a, b) => a.d2 - b.d2);
      const count = Math.min(this.maxNeighbors, neighbors.length);
      for (let k = 0; k < count; k++) {
        const n = neighbors[k];
        const pj = points[n.j];
        const d = Math.sqrt(n.d2);
        const a = map(d, 0, this.maxDist, this.strokeAlpha, 10);
        stroke(100, 180, 255, a);
        line(pi.x, pi.y, pj.x, pj.y);
      }
    }
  }
}

class TrailsLayer {
  constructor(w, h) {
    this.enabled = false;
    this.fade = 12; // smaller -> longer trails
    this.radius = 3;
    this.buffer = createGraphics(w, h);
    this.buffer.clear();
    this._initStyles();
  }

  _initStyles() {
    const g = this.buffer;
    g.noStroke();
  }

  resize(w, h) {
    // Recreate buffer on resize
    this.buffer = createGraphics(w, h);
    this.buffer.clear();
    this._initStyles();
  }

  // Add points to trails and optionally the particle position
  add(points, particlePos) {
    if (!this.enabled) return;
    const g = this.buffer;

    // Fade previous frame
    g.push();
    g.noStroke();
    g.fill(0, this.fade);
    g.rect(0, 0, g.width, g.height);
    g.pop();

    if (points && points.length) {
      // Draw soft dots for each point (simple glow)
      g.fill(120, 200, 255, 45);
      for (let i = 0; i < points.length; i++) {
        const p = points[i];
        g.circle(p.x, p.y, this.radius * 2);
      }
    }

    if (particlePos) {
      // Particle glow trail
      g.fill(255, 255, 255, 30);
      g.circle(particlePos.x, particlePos.y, this.radius * 3);
    }
  }

  render() {
    if (!this.enabled) return;
    image(this.buffer, 0, 0);
  }

  clear() {
    this.buffer.clear();
  }
}

class HeatmapLayer {
  constructor(w, h, cellSize = 16) {
    this.enabled = false;
    this.cellSize = cellSize;
    this.cols = Math.ceil(w / cellSize);
    this.rows = Math.ceil(h / cellSize);
    this.grid = new Float32Array(this.cols * this.rows);
    this.decay = 0.985; // per frame decay
    this.maxObserved = 1; // for normalization
    this.buffer = createGraphics(w, h);
    this.buffer.clear();
  }

  indexFromXY(x, y) {
    const cx = Math.floor(
      constrain(x, 0, this.cols * this.cellSize - 1) / this.cellSize
    );
    const cy = Math.floor(
      constrain(y, 0, this.rows * this.cellSize - 1) / this.cellSize
    );
    return cy * this.cols + cx;
  }

  add(points) {
    if (!this.enabled || !points || !points.length) return;
    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      const idx = this.indexFromXY(p.x, p.y);
      const val = this.grid[idx] + 1;
      this.grid[idx] = val;
      if (val > this.maxObserved) this.maxObserved = val;
    }
  }

  resize(w, h) {
    this.cols = Math.ceil(w / this.cellSize);
    this.rows = Math.ceil(h / this.cellSize);
    this.grid = new Float32Array(this.cols * this.rows);
    this.maxObserved = 1;
    this.buffer = createGraphics(w, h);
    this.buffer.clear();
  }

  updateAndRender() {
    if (!this.enabled) return;
    const g = this.buffer;
    g.push();
    g.noStroke();

    // Decay values
    for (let i = 0; i < this.grid.length; i++) {
      this.grid[i] *= this.decay;
    }

    // Draw cells
    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        const idx = y * this.cols + x;
        const v = this.grid[idx];
        if (v <= 0.05) continue;
        // Normalize with a soft cap
        const t = constrain(v / (this.maxObserved * 0.6), 0, 1);
        const c = HeatmapLayer.heatColor(t);
        g.fill(c[0], c[1], c[2], 140);
        g.rect(
          x * this.cellSize,
          y * this.cellSize,
          this.cellSize,
          this.cellSize
        );
      }
    }

    g.pop();

    image(this.buffer, 0, 0);
  }

  clear() {
    this.grid.fill(0);
    this.maxObserved = 1;
    this.buffer.clear();
  }

  static heatColor(t) {
    // Simple 5-stop gradient: navy -> blue -> cyan -> yellow -> red/white
    // Stops
    const stops = [
      { r: 0, g: 0, b: 40 }, // navy
      { r: 0, g: 90, b: 255 }, // blue
      { r: 0, g: 255, b: 255 }, // cyan
      { r: 255, g: 255, b: 0 }, // yellow
      { r: 255, g: 60, b: 0 }, // red
    ];

    const n = stops.length - 1;
    const scaled = t * n;
    const i = Math.floor(scaled);
    const frac = constrain(scaled - i, 0, 1);
    const a = stops[constrain(i, 0, n)];
    const b = stops[constrain(i + 1, 0, n)];

    const r = a.r + (b.r - a.r) * frac;
    const g = a.g + (b.g - a.g) * frac;
    const bb = a.b + (b.b - a.b) * frac;
    return [r, g, bb];
  }
}

// Export-like globals (p5 global mode)
window.MeshNetwork = MeshNetwork;
window.TrailsLayer = TrailsLayer;
window.HeatmapLayer = HeatmapLayer; // Visual layers: Mesh network, Trails, Heatmap
// p5.js global mode assumed
