import * as PIXI from 'pixi.js'
import { readFileSync } from 'fs'

const vertex = readFileSync('res/shaders/wind.vert', 'utf8')
const fragment = readFileSync('res/shaders/wind.frag', 'utf8')

export class WindBatchRenderer extends PIXI.AbstractBatchRenderer {
  private readonly vertexLocalPositions = new Float32Array([
    0,
    0, // TL
    1,
    0, // TR
    1,
    1, // BR
    0,
    1, // BL
  ])
  constructor(renderer: PIXI.Renderer) {
    super(renderer)
    this.shaderGenerator = new WindShaderGenerator()
    this.geometryClass = WindBatchGeometry
    this.vertexSize = 8
  }
  update() {
    ;(this.shaderGenerator as WindShaderGenerator).update()
  }
  packInterleavedGeometry(
    element: PIXI.IBatchableElement,
    attributeBuffer: PIXI.ViewableBuffer,
    indexBuffer: Uint16Array,
    aIndex: number,
    iIndex: number,
  ): void {
    const { uint32View, float32View } = attributeBuffer

    const packedVertices = aIndex / this.vertexSize
    const uvs = element.uvs
    const indicies = element.indices
    const vertexData = element.vertexData
    const textureId = element._texture.baseTexture._batchLocation

    const alpha = Math.min(element.worldAlpha, 1.0)
    const argb =
      alpha < 1.0 && element._texture.baseTexture.alphaMode
        ? PIXI.utils.premultiplyTint(element._tintRGB, alpha)
        : element._tintRGB + ((alpha * 255) << 24)

    for (let i = 0; i < vertexData.length; i += 2) {
      float32View[aIndex++] = vertexData[i]
      float32View[aIndex++] = vertexData[i + 1]
      float32View[aIndex++] = uvs[i]
      float32View[aIndex++] = uvs[i + 1]
      uint32View[aIndex++] = argb
      float32View[aIndex++] = textureId
      float32View[aIndex++] = this.vertexLocalPositions[i]
      float32View[aIndex++] = this.vertexLocalPositions[i + 1]
    }

    for (let i = 0; i < indicies.length; i++) {
      indexBuffer[iIndex++] = packedVertices + indicies[i]
    }
  }
}

class WindBatchGeometry extends PIXI.BatchGeometry {
  constructor(_static = false) {
    super()
    this._buffer = new PIXI.Buffer(null as any, _static, false)
    this._indexBuffer = new PIXI.Buffer(null as any, _static, true)
    this.addAttribute('aVertexPosition', this._buffer, 2, false, PIXI.TYPES.FLOAT)
      .addAttribute('aTextureCoord', this._buffer, 2, false, PIXI.TYPES.FLOAT)
      .addAttribute('aColor', this._buffer, 4, true, PIXI.TYPES.UNSIGNED_BYTE)
      .addAttribute('aTextureId', this._buffer, 1, true, PIXI.TYPES.FLOAT)
      .addAttribute('aVertexLocalPosition', this._buffer, 2, false, PIXI.TYPES.FLOAT)
      .addIndex(this._indexBuffer)
  }
}

class WindShaderGenerator extends PIXI.BatchShaderGenerator {
  private readonly uniforms: any
  constructor() {
    super(vertex, fragment)
    this.uniforms = {
      delta: 0.5,
      tint: new Float32Array([1, 1, 1, 1]),
      translationMatrix: new PIXI.Matrix(),
    }
  }
  update() {
    this.uniforms.delta += 0.018
  }
  generateShader(maxTextures: number): PIXI.Shader {
    if (!this.programCache[maxTextures]) {
      const sampleValues = new Int32Array(maxTextures)

      for (let i = 0; i < maxTextures; i++) {
        sampleValues[i] = i
      }

      this.defaultGroupCache[maxTextures] = PIXI.UniformGroup.from({ uSamplers: sampleValues }, true)

      let fragmentSrc = this.fragTemplate

      fragmentSrc = fragmentSrc.replace(/%count%/gi, `${maxTextures}`)
      fragmentSrc = fragmentSrc.replace(/%forloop%/gi, this.generateSampleSrc(maxTextures))

      this.programCache[maxTextures] = new PIXI.Program(this.vertexSrc, fragmentSrc)
    }

    return new PIXI.Shader(this.programCache[maxTextures], this.uniforms)
  }
}
