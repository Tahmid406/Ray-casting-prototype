class Wall {
  constructor(x1, y1, x2, y2) {
    this.start = { x: x1, y: y1 };
    this.end = { x: x2, y: y2 };
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

  update() {
    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;
    if (this.position.x > width - 3 || this.position.x < 3) this.velocity.x *= -1;
    if (this.position.y > height - 3 || this.position.y < 3) this.velocity.y *= -1;
    this.sensor.startPoint = this.position;

    for (let i = 0; i < this.sensor.rayCount; i++) {
      const angle = lerp(
        -this.sensor.spread / 2 + PI / this.sensor.rayCount,
        this.sensor.spread / 2 - PI / this.sensor.rayCount,
        this.sensor.rayCount == 1 ? 1 : i / (this.sensor.rayCount - 1)
      );
      this.sensor.rayEndPoints[i] = {
        x: this.sensor.startPoint.x + cos(angle) * this.sensor.rayLenth,
        y: this.sensor.startPoint.y + sin(angle) * this.sensor.rayLenth,
      };
    }

    this.sensor.intersections = [];
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
    this.rayEndPoints = [];

    this.rayLenth = 100; //temp
    this.intersections = [];
  }

  getIntersection(wall) {
    this.rayEndPoints.forEach((endPoint, i) => {
      const x1 = this.startPoint.x;
      const y1 = this.startPoint.y;
      const x2 = endPoint.x;
      const y2 = endPoint.y;
      const x3 = wall.start.x;
      const y3 = wall.start.y;
      const x4 = wall.end.x;
      const y4 = wall.end.y;

      const denominator = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
      if (denominator == 0) return this.intersections[i];
      const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denominator;
      const u = ((x1 - x3) * (y1 - y2) - (y1 - y3) * (x1 - x2)) / denominator;

      if (t > 0 && u > 0 && u < 1) {
        const x = x1 + t * (x2 - x1);
        const y = y1 + t * (y2 - y1);
        if (
          !this.intersections[i] ||
          dist(x1, y1, x, y) < dist(x1, y1, this.intersections[i].x, this.intersections[i].y)
        ) {
          this.intersections[i] = { x: x, y: y };
        }
      }
    });
  }

  render() {
    stroke(255, 50);
    for (let i = 0; i < this.rayCount; i++) {
      if (this.intersections[i])
        line(
          this.startPoint.x,
          this.startPoint.y,
          this.intersections[i].x,
          this.intersections[i].y
        );
    }
  }
}

//Utility function
function detectIntersection(A, B, C, D) {
  const tTop = (D.x - C.x) * (A.y - C.y) - (D.y - C.y) * (A.x - C.x);
  const uTop = (C.y - A.y) * (A.x - B.x) - (C.x - A.x) * (A.y - B.y);
  const bottom = (D.y - C.y) * (B.x - A.x) - (D.x - C.x) * (B.y - A.y);

  if (bottom != 0) {
    const t = tTop / bottom;
    const u = uTop / bottom;
    return t >= 0 && t <= 1 && u >= 0 && u <= 1;
  }

  return true;
}
