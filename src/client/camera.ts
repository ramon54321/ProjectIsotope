import { Vec2 } from '../shared/engine/math'
import { Input } from './input'
import * as PIXI from 'pixi.js'
import { Gtx } from './graphics'
import { createLine } from './drawing/line'

export class Camera {
  private readonly gtx: Gtx
  private readonly input: Input
  private readonly containers: PIXI.Container[]
  private readonly width: number
  private readonly height: number
  private readonly originVertical: PIXI.Graphics
  private readonly originHorizontal: PIXI.Graphics
  constructor(gtx: Gtx, input: Input) {
    this.gtx = gtx
    this.input = input

    // Origin Markers
    this.width = this.gtx.app.renderer.width / this.gtx.app.renderer.resolution
    this.height = this.gtx.app.renderer.height / this.gtx.app.renderer.resolution
    this.originVertical = createLine(0, 0, 0, this.height, { colorName: 'OriginMarker' })
    this.originHorizontal = createLine(0, 0, this.width, 0, { colorName: 'OriginMarker' })
    const debugOriginMarkersLayer = this.gtx.renderLayers.getRenderLayer('DebugOriginMarkers')
    debugOriginMarkersLayer.addChild(this.originVertical)
    debugOriginMarkersLayer.addChild(this.originHorizontal)
    const setAlpha = () => {
      const alpha = this.gtx.gameOptions.getIsDevMode()
      this.originVertical.visible = alpha
      this.originHorizontal.visible = alpha
    }
    this.gtx.gameOptions.getEventEmitter().on('isDevMode', setAlpha)
    setAlpha()

    // DevMode Zoom
    this.gtx.gameOptions.getEventEmitter().on('isZoomedOut', () => this.setZoomMode())

    // World Container
    this.containers = [this.gtx.renderLayers.getRenderLayer('Entities'), this.gtx.renderLayers.getRenderLayer('Fixtures')]
    this.gtx.app.ticker.add(delta => this.tick(delta))
  }
  setZoomMode() {
    if (this.gtx.gameOptions.getIsZoomedOut()) {
      this.gtx.app.stage.position.set(
        this.gtx.app.renderer.width / (2 * this.gtx.app.renderer.resolution),
        this.gtx.app.renderer.height / (2 * this.gtx.app.renderer.resolution),
      )
      this.gtx.app.stage.scale.set(0.1, 0.1)
    } else {
      this.gtx.app.stage.position.set(0, 0)
      this.gtx.app.stage.scale.set(1, 1)
    }
  }
  getWidth(): number {
    return this.width
  }
  getHeight(): number {
    return this.height
  }
  getMouseScreenPosition(): Vec2 {
    const rawPosition = this.gtx.app.renderer.plugins.interaction.mouse.global
    return new Vec2(rawPosition.x, rawPosition.y)
  }
  getMouseWorldPosition(): Vec2 {
    const rawPosition = this.gtx.app.renderer.plugins.interaction.mouse.global
    const x = rawPosition.x + this.x - this.gtx.app.renderer.width / 2 / this.gtx.app.renderer.resolution
    const y = rawPosition.y + this.y - this.gtx.app.renderer.height / 2 / this.gtx.app.renderer.resolution
    return new Vec2(x, y)
  }
  getPosition(): Vec2 {
    return new Vec2(this.x, this.y)
  }
  private x: number = 0
  private y: number = 0
  private xv: number = 0
  private yv: number = 0
  private readonly vLimit = 25
  private readonly vAcceleration = 90
  private readonly vDeceleration = 1.2
  private tick(delta: number) {
    const deltaTimeSeconds = delta / PIXI.settings.TARGET_FPMS! / 1000
    let addingVelocityX = false
    let addingVelocityY = false
    if (this.input.getInputDown('a')) {
      if (this.xv > -this.vLimit) {
        this.xv -= this.vAcceleration * deltaTimeSeconds
      }
      addingVelocityX = true
    }
    if (this.input.getInputDown('d')) {
      if (this.xv < this.vLimit) {
        this.xv += this.vAcceleration * deltaTimeSeconds
      }
      addingVelocityX = true
    }
    if (this.input.getInputDown('w')) {
      if (this.yv > -this.vLimit) {
        this.yv -= this.vAcceleration * deltaTimeSeconds
      }
      addingVelocityY = true
    }
    if (this.input.getInputDown('s')) {
      if (this.yv < this.vLimit) {
        this.yv += this.vAcceleration * deltaTimeSeconds
      }
      addingVelocityY = true
    }
    if (!addingVelocityX) this.xv /= this.vDeceleration
    if (!addingVelocityY) this.yv /= this.vDeceleration
    this.x += this.xv
    this.y += this.yv
    const containerX = -this.x + this.gtx.app.renderer.width / (this.gtx.app.renderer.resolution * 2)
    const containerY = -this.y + this.gtx.app.renderer.height / (this.gtx.app.renderer.resolution * 2)
    this.containers.forEach(container => container.position.set(containerX, containerY))
    this.originVertical.position.x = -this.x + this.width / 2
    this.originHorizontal.position.y = -this.y + this.height / 2
  }
}
