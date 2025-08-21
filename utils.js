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

function circleLineCollision(circle, wall) {
  // Circle = {x, y, r}, Wall has start {x,y}, end {x,y}
  const ax = wall.start.x;
  const ay = wall.start.y;
  const bx = wall.end.x;
  const by = wall.end.y;
  const cx = circle.x;
  const cy = circle.y;
  const r = circle.r;

  // Line vector
  const abx = bx - ax;
  const aby = by - ay;

  // Project point C onto AB, clamp t between [0,1]
  const t = ((cx - ax) * abx + (cy - ay) * aby) / (abx * abx + aby * aby);
  const tClamped = constrain(t, 0, 1);

  // Closest point on segment
  const px = ax + tClamped * abx;
  const py = ay + tClamped * aby;

  // Distance to circle center
  const distSq = (cx - px) * (cx - px) + (cy - py) * (cy - py);
  return distSq <= r * r ? { hit: true, px, py } : { hit: false };
}

function reflectVelocity(velocity, wall) {
  const vx = velocity.x;
  const vy = velocity.y;

  const wx = wall.end.x - wall.start.x;
  const wy = wall.end.y - wall.start.y;

  // Normalize wall normal
  const wallLen = sqrt(wx * wx + wy * wy);
  const nx = -wy / wallLen;
  const ny = wx / wallLen;

  // Reflect: v' = v - 2*(v·n)*n
  const dot = vx * nx + vy * ny;
  return {
    x: vx - 2 * dot * nx,
    y: vy - 2 * dot * ny,
  };
}
