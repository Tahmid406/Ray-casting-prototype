let particles = [];
let walls = [];

// Visual layers
let meshLayer;
let trailsLayer;
let heatmapLayer;

function setup() {
  createCanvas(innerWidth, innerHeight);

  // Predefine border walls for intersection checks
  const borderWalls = [
    new Wall(0, 0, 0, height),
    new Wall(0, height, width, height),
    new Wall(width, height, width, 0),
    new Wall(width, 0, 0, 0),
  ];

  walls = [];

  for (let i = 0; i < 24; i++) {
    let x1, y1, x2, y2, length, intersected;
    const minLength = 80;
    const maxLength = 360;

    do {
      x1 = random(width);
      y1 = random(height);

      const angle = random(TWO_PI);
      length = random(minLength, maxLength);

      x2 = x1 + cos(angle) * length;
      y2 = y1 + sin(angle) * length;

      // Clamp into canvas
      x2 = constrain(x2, 0, width);
      y2 = constrain(y2, 0, height);

      intersected = false;

      // Check against existing walls
      for (const wall of walls) {
        if (
          detectIntersection(
            wall.start,
            wall.end,
            { x: x1, y: y1 },
            { x: x2, y: y2 }
          )
        ) {
          intersected = true;
          break;
        }
      }

      // Check against border walls
      if (!intersected) {
        for (const border of borderWalls) {
          if (
            detectIntersection(
              border.start,
              border.end,
              { x: x1, y: y1 },
              { x: x2, y: y2 }
            )
          ) {
            intersected = true;
            break;
          }
        }
      }
    } while (intersected);

    walls.push(new Wall(x1, y1, x2, y2));
  }

  // Finally, add border walls
  walls.push(...borderWalls);

  // Particles
  particles = [];
  for (let i = 0; i < 10; i++) {
    particles.push(new Particle(random(width), random(height), 200));
  }

  // Visual layers
  meshLayer = new MeshNetwork();
  trailsLayer = new TrailsLayer(width, height);
  heatmapLayer = new HeatmapLayer(width, height, 16);
}

function windowResized() {
  resizeCanvas(innerWidth, innerHeight);
  // Recreate border walls with new size
  walls = walls.filter((w) => false); // clear all
  setup(); // quick re-init for simplicity
}

function draw() {
  background(0);

  // Collect all intersections this frame across all particles
  const intersections = [];

  // Update and cast per particle
  for (let p = 0; p < particles.length; p++) {
    const particle = particles[p];
    particle.update(walls);

    for (let wi = 0; wi < walls.length; wi++) {
      const wall = walls[wi];
      particle.castRay(wall);
    }

    // Gather intersections for visuals
    const rays = particle.sensor;
    for (let i = 0; i < rays.rayCount; i++) {
      const hit = rays.intersections[i];
      if (hit) intersections.push(hit);
    }
  }

  // Visual Layers update
  trailsLayer.add(intersections, particles[0] && particles[0].position);
  heatmapLayer.add(intersections);

  // World rendering (walls)
  stroke(255);
  for (let wi = 0; wi < walls.length; wi++) walls[wi].render();

  // Rays and particles
  for (let p = 0; p < particles.length; p++) particles[p].render();

  // Mesh network on top of rays
  meshLayer.render(intersections);

  // Heatmap and trails
  heatmapLayer.updateAndRender();
  trailsLayer.render();

  // HUD
  drawHUD();
}

function drawHUD() {
  noStroke();
  fill(255);
  textSize(12);
  const lines = [
    `Mesh (M): ${meshLayer.enabled ? "ON" : "OFF"}`,
    `Trails (T): ${trailsLayer.enabled ? "ON" : "OFF"}`,
    `Heatmap (H): ${heatmapLayer.enabled ? "ON" : "OFF"}`,
  ];
  for (let i = 0; i < lines.length; i++) {
    text(lines[i], 12, 20 + i * 16);
  }
}

function keyPressed() {
  if (key === "M" || key === "m") meshLayer.enabled = !meshLayer.enabled;
  if (key === "T" || key === "t") trailsLayer.enabled = !trailsLayer.enabled;
  if (key === "H" || key === "h") heatmapLayer.enabled = !heatmapLayer.enabled;
}
