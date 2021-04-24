import { Vec2 } from '../shared/engine/math'
import { Input } from './drawing/input'

export class Camera {
  private readonly input: Input
  private x: number = 0
  private y: number = 0
  constructor(input: Input) {
    this.input = input
  }
  render(delta: number) {
    if (this.input.getInputDown('a')) {
      this.x -= 16 * delta
    }
    if (this.input.getInputDown('d')) {
      this.x += 16 * delta
    }
    if (this.input.getInputDown('w')) {
      this.y -= 16 * delta
    }
    if (this.input.getInputDown('s')) {
      this.y += 16 * delta
    }
  }
  getPosition(): Vec2 {
    return new Vec2(this.x, this.y)
  }
}
