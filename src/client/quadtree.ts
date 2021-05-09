interface XY {
  x: number
  y: number
}

export class AABB {
  readonly x: number
  readonly y: number
  readonly halfDimension: number
  readonly xMin: number
  readonly xMax: number
  readonly yMin: number
  readonly yMax: number
  constructor(x: number, y: number, halfDimension: number) {
    this.x = x
    this.y = y
    this.halfDimension = halfDimension
    this.xMin = this.x - this.halfDimension
    this.xMax = this.x + this.halfDimension
    this.yMin = this.y - this.halfDimension
    this.yMax = this.y + this.halfDimension
  }
  containsPoint(point: XY): boolean {
    return point.x <= this.xMax && point.x >= this.xMin && point.y <= this.yMax && point.y >= this.yMin
  }
  intersectsAABB(aabb: AABB): boolean {
    if (aabb.xMax <= this.xMin) return false
    if (this.xMax <= aabb.xMin) return false
    if (aabb.yMax <= this.yMin) return false
    if (this.yMax <= aabb.yMin) return false
    return true
  }
}

export class QuadTree<T> {
  readonly boundary: AABB
  private readonly capacity: number
  constructor(boundary: AABB, capacity: number = 16) {
    this.boundary = boundary
    this.capacity = capacity
  }
  private readonly points = new Map<string, [XY, T]>()
  private northWest?: QuadTree<T>
  private northEast?: QuadTree<T>
  private southWest?: QuadTree<T>
  private southEast?: QuadTree<T>
  count(): number {
    return (
      this.points.size +
      (this.northWest?.count() || 0) +
      (this.northEast?.count() || 0) +
      (this.southWest?.count() || 0) +
      (this.southEast?.count() || 0)
    )
  }
  add(position: XY, id: string, data: T): boolean {
    if (!this.boundary.containsPoint(position)) return false
    if (this.points.size < this.capacity && !this.northWest) {
      this.points.set(id, [position, data])
      return true
    }
    if (!this.northWest) this.subdivide()
    if (this.northWest!.add(position, id, data)) return true
    if (this.northEast!.add(position, id, data)) return true
    if (this.southWest!.add(position, id, data)) return true
    if (this.southEast!.add(position, id, data)) return true
    return false
  }
  get(id: string, area?: AABB): T | undefined {
    if (area && !this.boundary.intersectsAABB(area)) return undefined
    if (this.points.has(id)) return this.points.get(id)![1]
    if (!this.northWest) return undefined
    return this.northWest!.get(id) || this.northEast!.get(id) || this.southWest!.get(id) || this.southEast!.get(id)
  }
  remove(id: string, area?: AABB): boolean {
    if (area && !this.boundary.intersectsAABB(area)) return false
    if (this.points.delete(id)) return true
    if (!this.northWest) return false
    return this.northWest!.remove(id) || this.northEast!.remove(id) || this.southWest!.remove(id) || this.southEast!.remove(id)
  }
  query(area: AABB): [string, T][] {
    if (!this.boundary.intersectsAABB(area)) return []
    const idsInArea: [string, T][] = []
    this.points.forEach(([position, data], id) => {
      if (area.containsPoint(position)) idsInArea.push([id, data])
    })
    if (!this.northWest) return idsInArea
    return idsInArea
      .concat(this.northWest.query(area))
      .concat(this.northEast!.query(area))
      .concat(this.southWest!.query(area))
      .concat(this.southEast!.query(area))
  }
  private subdivide() {
    const quaterDimension = this.boundary.halfDimension / 2
    this.northWest = new QuadTree(new AABB(this.boundary.x - quaterDimension, this.boundary.y + quaterDimension, quaterDimension))
    this.northEast = new QuadTree(new AABB(this.boundary.x + quaterDimension, this.boundary.y + quaterDimension, quaterDimension))
    this.southWest = new QuadTree(new AABB(this.boundary.x - quaterDimension, this.boundary.y - quaterDimension, quaterDimension))
    this.southEast = new QuadTree(new AABB(this.boundary.x + quaterDimension, this.boundary.y - quaterDimension, quaterDimension))
  }
}
