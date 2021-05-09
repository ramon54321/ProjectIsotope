import * as PIXI from 'pixi.js'

const renderLayerTags = ['Background', 'Fixtures', 'Entities', 'DebugOriginMarkers', 'UI'] as const
export type RenderLayerTag = typeof renderLayerTags[number]

export class RenderLayers {
  private readonly renderLayers = new Map<RenderLayerTag, PIXI.Container>()
  getRenderLayer(renderLayerTag: RenderLayerTag): PIXI.Container {
    return this.renderLayers.get(renderLayerTag)!
  }
  setup(app: PIXI.Application) {
    renderLayerTags.forEach((renderLayerTag, index) => {
      const container = new PIXI.Container()
      container.zIndex = index
      app.stage.addChild(container)
      this.renderLayers.set(renderLayerTag, container)
    })
  }
  addSprite(sprite: PIXI.Container, renderLayer: RenderLayerTag) {
    const container = this.getRenderLayer(renderLayer)
    container.addChild(sprite)
  }
  removeSprite(sprite: PIXI.Container, renderLayer: RenderLayerTag) {
    const container = this.getRenderLayer(renderLayer)
    container.removeChild(sprite)
  }
}
