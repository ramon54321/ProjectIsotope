import * as PIXI from 'pixi.js'

const renderLayerTags = ['Background', 'Entities', 'DebugOriginMarkers', 'UI'] as const
export type RenderLayerTag = typeof renderLayerTags[number]

export class RenderLayers {
  private readonly renderLayers = new Map<RenderLayerTag, PIXI.Container>()
  getRenderLayer(renderLayerTag: RenderLayerTag): PIXI.Container {
    return this.renderLayers.get(renderLayerTag)!
  }
  setup(app: PIXI.Application) {
    renderLayerTags.forEach(renderLayerTag => {
      const container = new PIXI.Container()
      app.stage.addChild(container)
      this.renderLayers.set(renderLayerTag, container)
    })
  }
}
