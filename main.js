function setup() {
  createCanvas(innerWidth, innerHeight);

  walls = [];
  for (let i = 0; i < 6; i++) {
    const x1 = random(width);
    const y1 = random(height);
    const x2 = random(width);
    const y2 = random(height);
    intersected = false;
    walls.forEach((wall) => {
      if (intersected) return;
      if (detectIntersection(wall.start, wall.end, { x: x1, y: y1 }, { x: x2, y: y2 })) {
        intersected = true;
      }
    });
    if (intersected) i -= 1;
    else walls.push(new Wall(x1, y1, x2, y2));
  }
  walls.push(new Wall(0, 0, 0, height));
  walls.push(new Wall(0, height, width, height));
  walls.push(new Wall(width, height, width, 0));
  walls.push(new Wall(width, 0, 0, 0));

  particle = new Particle(random(width), random(height), 1000);
}

function draw() {
  console.log(frameRate());
  background(0);
  stroke(255);
  particle.update();
  walls.forEach((wall) => {
    particle.castRay(wall);
    wall.render();
  });
  particle.render();
}
