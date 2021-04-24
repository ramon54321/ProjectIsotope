export class Vec2 {
  x: number
  y: number
  constructor(x: number, y: number) {
    this.x = x
    this.y = y
  }
  differenceTo(target: Vec2): Vec2 {
    const dx = target.x - this.x
    const dy = target.y - this.y
    return new Vec2(dx, dy)
  }
  directionTo(target: Vec2): Vec2 {
    return this.differenceTo(target).normalized()
  }
  scale(scale: number): Vec2 {
    return new Vec2(this.x * scale, this.y * scale)
  }
  magnitude(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y)
  }
  normalized(): Vec2 {
    const magnitude = this.magnitude()
    return new Vec2(Math.abs(this.x) < 0.001 ? 0 : this.x / magnitude, Math.abs(this.y) < 0.001 ? 0 : this.y / magnitude)
  }
}
