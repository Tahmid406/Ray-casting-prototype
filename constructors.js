class Wall {
  constructor(x1, y1, x2, y2) {
    this.start = { x: x1, y: y1 };
    this.end = { x: x2, y: y2 };

    // Precompute AABB for broad-phase checks
    const minX = Math.min(x1, x2);
    const minY = Math.min(y1, y2);
    const maxX = Math.max(x1, x2);
    const maxY = Math.max(y1, y2);
    this.aabb = { minX, minY, maxX, maxY };
  }

  render() {
    line(this.start.x, this.start.y, this.end.x, this.end.y);
  }
}

class Particle {
  constructor(x, y, rayCount) {
    this.position = { x: x, y: y };
    this.radius = 5;
    const angle = random(PI * 2);
    this.velocity = { x: cos(angle) * 3, y: sin(angle) * 3 };

    this.sensor = new Rays(rayCount, this.position);
  }

  castRay(wall) {
    this.sensor.getIntersection(wall);
  }

  update(walls) {
    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;
    this.sensor.startPoint = this.position;

    // Check collision with each wall
    for (let wall of walls) {
      const collision = circleLineCollision(
        { x: this.position.x, y: this.position.y, r: this.radius },
        wall
      );
      if (collision.hit) {
        this.velocity = reflectVelocity(this.velocity, wall);

        // Push particle slightly outside wall to prevent sticking
        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;
      }
    }

    // Reset intersections/minT for this frame (directions are precomputed once)
    this.sensor.resetFrame();
  }

  render() {
    circle(this.position.x, this.position.y, this.radius * 2);
    this.sensor.render();
  }
}

class Rays {
  constructor(rayCount, position) {
    this.rayCount = rayCount;
    this.startPoint = position;
    this.spread = PI * 2;

    this.rayLength = 150; // max ray length

    // Precompute direction unit vectors for all rays (no trig per frame)
    this.dirX = new Float32Array(rayCount);
    this.dirY = new Float32Array(rayCount);
    for (let i = 0; i < rayCount; i++) {
      const t = this.rayCount == 1 ? 1 : i / (this.rayCount - 1);
      const angle = lerp(
        -this.spread / 2 + PI / this.rayCount,
        this.spread / 2 - PI / this.rayCount,
        t
      );
      this.dirX[i] = cos(angle);
      this.dirY[i] = sin(angle);
    }

    // Per-frame state
    this.intersections = new Array(rayCount); // {x,y} or undefined
    this.minT = new Float32Array(rayCount); // closest t in [0,1]
    this.resetFrame();
  }

  // Clear per-frame buffers
  resetFrame() {
    for (let i = 0; i < this.rayCount; i++) {
      this.intersections[i] = undefined;
      this.minT[i] = Infinity;
    }
  }

  // Simple AABB overlap check for broad-phase culling
  static _aabbOverlap(ax0, ay0, ax1, ay1, bx0, by0, bx1, by1) {
    return ax0 <= bx1 && ax1 >= bx0 && ay0 <= by1 && ay1 >= by0;
  }

  getIntersection(wall) {
    const x1 = this.startPoint.x;
    const y1 = this.startPoint.y;

    const x3 = wall.start.x;
    const y3 = wall.start.y;
    const x4 = wall.end.x;
    const y4 = wall.end.y;

    const wAABB = wall.aabb;

    for (let i = 0; i < this.rayCount; i++) {
      // If we already found a hit with t == 0, can't get closer
      if (this.minT[i] === 0) continue;

      // End point for this ray segment (for broad-phase + rendering fallback)
      const dx = this.dirX[i] * this.rayLength;
      const dy = this.dirY[i] * this.rayLength;
      const x2 = x1 + dx;
      const y2 = y1 + dy;

      // Broad-phase AABB test: skip if no overlap
      const minX = x1 < x2 ? x1 : x2;
      const minY = y1 < y2 ? y1 : y2;
      const maxX = x1 > x2 ? x1 : x2;
      const maxY = y1 > y2 ? y1 : y2;
      if (
        !Rays._aabbOverlap(
          minX,
          minY,
          maxX,
          maxY,
          wAABB.minX,
          wAABB.minY,
          wAABB.maxX,
          wAABB.maxY
        )
      ) {
        continue;
      }

      // Line-line intersection (segment x1->x2 with segment x3->x4)
      const denominator = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
      if (denominator === 0) continue; // Parallel

      const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denominator; // on ray
      const u = ((x1 - x3) * (y1 - y2) - (y1 - y3) * (x1 - x2)) / denominator; // on wall

      // We want intersection within our finite ray segment [0,1] and wall segment [0,1]
      if (t > 0 && t <= 1 && u >= 0 && u <= 1) {
        if (t < this.minT[i]) {
          this.minT[i] = t;
          this.intersections[i] = {
            x: x1 + t * dx,
            y: y1 + t * dy,
          };

          // If we hit very close to origin, no closer hit possible
          if (t <= 1e-6) {
            this.minT[i] = 0;
          }
        }
      }
    }
  }

  render() {
    stroke(255, 50);
    for (let i = 0; i < this.rayCount; i++) {
      if (this.intersections[i]) {
        line(
          this.startPoint.x,
          this.startPoint.y,
          this.intersections[i].x,
          this.intersections[i].y
        );
      }
    }
  }
}
