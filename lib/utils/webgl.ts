/**
 * 检测 WebGL 是否可用
 */
export function canUseWebGL(): boolean {
  if (typeof window === 'undefined') {
    return false
  }

  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
    return !!gl
  } catch {
    return false
  }
}

/**
 * 检测 WebGL 并缓存结果
 */
let webGLSupported: boolean | null = null

export function isWebGLSupported(): boolean {
  if (webGLSupported === null) {
    webGLSupported = canUseWebGL()
  }
  return webGLSupported
}
