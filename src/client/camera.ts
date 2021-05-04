import { Vec2 } from '../shared/engine/math'
import { Input } from './drawing/input'
import * as PIXI from 'pixi.js'

export class Camera {
  private readonly input: Input
  private x: number = 0
  private y: number = 0
  private xv: number = 0
  private yv: number = 0
  private readonly vLimit = 25
  private readonly vAcceleration = 90
  private readonly vDeceleration = 1.2
  constructor(input: Input) {
    this.input = input
  }
  render(delta: number) {
    const deltaTimeSeconds = delta / PIXI.settings.TARGET_FPMS! / 1000
    let addingVelocityX = false
    let addingVelocityY = false
    if (this.input.getInputDown('a') && this.xv > -this.vLimit) {
      this.xv -= this.vAcceleration * deltaTimeSeconds
      addingVelocityX = true
    }
    if (this.input.getInputDown('d') && this.xv < this.vLimit) {
      this.xv += this.vAcceleration * deltaTimeSeconds
      addingVelocityX = true
    }
    if (this.input.getInputDown('w') && this.yv > -this.vLimit) {
      this.yv -= this.vAcceleration * deltaTimeSeconds
      addingVelocityY = true
    }
    if (this.input.getInputDown('s') && this.yv < this.vLimit) {
      this.yv += this.vAcceleration * deltaTimeSeconds
      addingVelocityY = true
    }
    if (!addingVelocityX) this.xv /= this.vDeceleration
    if (!addingVelocityY) this.yv /= this.vDeceleration
    this.x += this.xv
    this.y += this.yv
  }
  getPosition(): Vec2 {
    return new Vec2(this.x, this.y)
  }
}
