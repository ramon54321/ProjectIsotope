import { NetworkState } from '../../shared/game/network-state'
import { ServerState } from './server-state'
import gen from 'random-seed'
import { Vec2 } from '../../shared/engine/math'

const R = gen.create('12345')

class SparceGrid<T> {
  private readonly grid = new Map<number, Map<number, T>>()
  private readonly divisor: number
  constructor(divisor: number) {
    this.divisor = divisor
  }
  setCell(x: number, y: number, value: T) {
    const _x = Math.floor(x / this.divisor)
    const _y = Math.floor(y / this.divisor)
    if (!this.grid.has(_x)) this.grid.set(_x, new Map())
    this.grid.get(_x)!.set(_y, value)
  }
  getCell(x: number, y: number): T | undefined {
    const _x = Math.floor(x / this.divisor)
    const _y = Math.floor(y / this.divisor)
    return this.grid.get(_x)?.get(_y)
  }
}

type Cell = [number, number]
type CellList = Cell[]

class GridMath {
  static distance(cellA: Cell, cellB: Cell): number {
    const dx = cellA[0] - cellB[0]
    const dy = cellA[1] - cellB[1]
    return Math.floor(Math.sqrt(dx * dx + dy * dy))
  }
}

class GridUtils {
  static getRect(center: Cell, halfX: number, halfY: number): CellList {
    const cellList: CellList = []
    for (let y = -halfY + 1; y < halfY; y++) {
      for (let x = -halfX + 1; x < halfX; x++) {
        cellList.push([x + center[0], y + center[1]])
      }
    }
    return cellList
  }
  static getCircle(center: Cell, radius: number): CellList {
    const rect = GridUtils.getRect(center, radius, radius)
    return rect.filter(cell => GridMath.distance(center, cell) < radius)
  }
  static featherCircle(center: Cell, radius: number, cells: CellList): CellList {
    return cells.filter(cell => {
      const radiusCoef = GridMath.distance(center, cell) / radius
      return R.random() > radiusCoef
    })
  }
  static thin(factor: number, cells: CellList): CellList {
    return cells.filter(cell => R.random() > factor)
  }
  static combine(cellLists: CellList[]): CellList {
    const cells: CellList = []
    cellLists.forEach(cellList => cellList.forEach(cell => {
      if (!cells.find(_cell => _cell[0] === cell[0] && _cell[1] === cell[1])) cells.push(cell)
    }))
    return cells
  }
}

export class World {
  private readonly divisor = 10
  private readonly serverState: ServerState
  private readonly networkState: NetworkState
  constructor(serverState: ServerState, networkState: NetworkState) {
    this.serverState = serverState
    this.networkState = networkState
  }
  private toPixels(cell: Cell): Cell {
    return [Math.floor(cell[0]) * this.divisor, Math.floor(cell[1]) * this.divisor]
  }
  private readonly gridBlocked = new SparceGrid<boolean>(this.divisor)
  generate() {
    for (let i = 0; i < 100; i++) {
      const position = new Vec2(R.random() * 10000 - 5000, R.random() * 10000 - 5000)
      this.serverState.createFixture('PATCH_L_0', position, R.random() * 2 * Math.PI, (0.75 + R.random() / 2) * 32)
    }

    const patches = []
    for (let i = 0; i < 100; i++) {
      const x = Math.floor(R.random() * 800 - 400)
      const y = Math.floor(R.random() * 800 - 400)
      const r = Math.floor(R.random() * 20 + 10)
      const circle = GridUtils.getCircle([x, y], r)
      const patch = GridUtils.thin(0.95, GridUtils.featherCircle([x, y], r, circle))
      patches.push(patch)
    }

    const patchCombine1 = GridUtils.combine(patches)
    console.log(patchCombine1.length)
    patchCombine1.forEach(cell => this.gridBlocked.setCell(cell[0], cell[1], true))
    patchCombine1.map(cell => this.toPixels(cell)).forEach(cell => this.serverState.createFixture('GRASS_S_0', new Vec2(cell[0], cell[1]), 0, 1))
    // const cells: CellList = [
    //   [0, 0],
    //   [0, 10],
    // ]
    // cells.map(cell => this.toPixels(cell)).forEach(cell => this.serverState.createFixture('GRASS_S_0', new Vec2(cell[0], cell[1]), 0, 1))
  }
}
