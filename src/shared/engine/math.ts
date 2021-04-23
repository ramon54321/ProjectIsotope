export class Vec2 {
  x: number
  y: number
  constructor(x: number, y: number) {
    this.x = x
    this.y = y
  }
  directionTo(target: Vec2): Vec2 {
    const dx = target.x - this.x
    const dy = target.y - this.y
    return new Vec2(dx, dy).normalized()
  }
  magnitude(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y)
  }
  normalized(): Vec2 {
    const magnitude = this.magnitude()
    return new Vec2(this.x / magnitude, this.y / magnitude)
  }
}
