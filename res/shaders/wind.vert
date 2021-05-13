precision highp float;
attribute vec2 aVertexPosition;
attribute vec2 aTextureCoord;
attribute vec4 aColor;
attribute float aTextureId;
attribute vec2 aVertexLocalPosition;

uniform mat3 projectionMatrix;
uniform mat3 translationMatrix;
uniform float delta;
uniform vec4 tint;

varying vec2 vTextureCoord;
varying vec4 vColor;
varying float vTextureId;

void main(void){
    vec2 position = vec2(aVertexPosition.xy);
    if (aVertexLocalPosition.y < 0.5) {
        if (aVertexLocalPosition.x < 0.5) {
            position.x += 3. * cos(delta + vTextureCoord.x + 3.) + sin((delta + vTextureCoord.y) * 3.4) * 3.5;
        } else {
            position.x += 4.4 * cos(0.5 + delta + vTextureCoord.x) + sin((delta + vTextureCoord.y + 2.2) * 3.4) * 3.5;
        }
    }
    gl_Position = vec4((projectionMatrix * translationMatrix * vec3(position, 1.0)).xy, 0.0, 1.0);

    vTextureCoord = aTextureCoord;
    vTextureId = aTextureId;
    vColor = aColor * tint;
}
