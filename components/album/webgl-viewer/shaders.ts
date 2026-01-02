/**
 * WebGL Shaders
 *
 * @reference https://github.com/Afilmory/afilmory
 * @source packages/webgl-viewer/src/shaders.ts
 * @license MIT
 * @author Afilmory Team
 */

/**
 * 顶点着色器源码
 */
export const VERTEX_SHADER_SOURCE = `
  attribute vec2 a_position;
  attribute vec2 a_texCoord;
  
  uniform mat3 u_matrix;
  
  varying vec2 v_texCoord;
  
  void main() {
    vec3 position = u_matrix * vec3(a_position, 1.0);
    gl_Position = vec4(position.xy, 0, 1);
    v_texCoord = a_texCoord;
  }
`

/**
 * 片段着色器源码
 */
export const FRAGMENT_SHADER_SOURCE = `
  precision mediump float;
  
  uniform sampler2D u_image;
  uniform int u_renderMode;
  uniform vec4 u_solidColor;
  varying vec2 v_texCoord;
  
  void main() {
    if (u_renderMode == 0) {
      gl_FragColor = texture2D(u_image, v_texCoord);
    } else {
      gl_FragColor = u_solidColor;
    }
  }
`

/**
 * 创建WebGL着色器
 */
export function createShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader {
  const shader = gl.createShader(type)!
  gl.shaderSource(shader, source)
  gl.compileShader(shader)

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const error = gl.getShaderInfoLog(shader)
    gl.deleteShader(shader)
    throw new Error(`Shader compilation failed: ${error}`)
  }

  return shader
}
