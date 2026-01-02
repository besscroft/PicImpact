/**
 * WebGL Image Viewer Engine
 *
 * @reference https://github.com/Afilmory/afilmory
 * @source packages/webgl-viewer/src/WebGLImageViewerEngine.ts
 * @license MIT
 * @author Afilmory Team
 *
 * Adapted for PicImpact with modifications:
 * - Changed Worker loading method for Next.js compatibility
 * - Minor type fixes
 */

import { LoadingState } from './enum'
import { ImageViewerEngineBase } from './ImageViewerEngineBase'
import type { DebugInfo, WebGLImageViewerProps } from './interface'
import { createShader, FRAGMENT_SHADER_SOURCE, VERTEX_SHADER_SOURCE } from './shaders'

// 瓦片系统配置
const TILE_SIZE = 512
const MAX_TILES_PER_FRAME = 4
const TILE_CACHE_SIZE = 32

interface TileInfo {
  x: number
  y: number
  lodLevel: number
  texture: WebGLTexture | null
  lastUsed: number
  isLoading: boolean
  priority: number
}

type TileKey = string

const SIMPLE_LOD_LEVELS = [
  { scale: 0.25 },
  { scale: 0.5 },
  { scale: 1 },
  { scale: 2 },
  { scale: 4 },
] as const

export class WebGLImageViewerEngine extends ImageViewerEngineBase {
  private canvas: HTMLCanvasElement
  private gl: WebGLRenderingContext
  private program!: WebGLProgram
  private texture: WebGLTexture | null = null
  private imageLoaded = false
  private originalImageSrc = ''

  private scale = 1
  private translateX = 0
  private translateY = 0
  private imageWidth = 0
  private imageHeight = 0
  private canvasWidth = 0
  private canvasHeight = 0
  private devicePixelRatio = 1

  private isDragging = false
  private lastMouseX = 0
  private lastMouseY = 0
  private lastTouchDistance = 0
  private lastDoubleClickTime = 0
  private isOriginalSize = false

  private lastTouchTime = 0
  private lastTouchX = 0
  private lastTouchY = 0

  private isAnimating = false
  private animationStartTime = 0
  private animationDuration = 300
  private startScale = 1
  private targetScale = 1
  private startTranslateX = 0
  private startTranslateY = 0
  private targetTranslateX = 0
  private targetTranslateY = 0
  private animationStartLOD = -1

  private currentLOD = 1
  private lodTextures = new Map<number, WebGLTexture>()

  private config: Required<WebGLImageViewerProps>
  private onZoomChange?: (originalScale: number, relativeScale: number) => void
  private onImageCopied?: () => void
  private onLoadingStateChange?: (
    isLoading: boolean,
    state?: LoadingState,
    quality?: 'high' | 'medium' | 'low' | 'unknown',
  ) => void
  private onDebugUpdate?: React.RefObject<(debugInfo: DebugInfo) => void>

  private currentQuality: 'high' | 'medium' | 'low' | 'unknown' = 'unknown'
  private isLoadingTexture = true
  private worker: Worker | null = null
  private textureWorkerInitialized = false

  private positionBuffer: WebGLBuffer | null = null
  private texCoordBuffer: WebGLBuffer | null = null
  private tileOutlineBuffer: WebGLBuffer | null = null
  private positionLocation = -1
  private texCoordLocation = -1
  private matrixLocation!: WebGLUniformLocation
  private imageLocation!: WebGLUniformLocation
  private renderModeLocation!: WebGLUniformLocation
  private solidColorLocation!: WebGLUniformLocation
  private tileOutlineEnabled = false

  private boundHandleMouseDown: (e: MouseEvent) => void
  private boundHandleMouseMove: (e: MouseEvent) => void
  private boundHandleMouseUp: () => void
  private boundHandleWheel: (e: WheelEvent) => void
  private boundHandleDoubleClick: (e: MouseEvent) => void
  private boundHandleTouchStart: (e: TouchEvent) => void
  private boundHandleTouchMove: (e: TouchEvent) => void
  private boundHandleTouchEnd: (e: TouchEvent) => void
  private boundResizeCanvas: () => void

  private tileCache = new Map<TileKey, TileInfo>()
  private loadingTiles = new Map<TileKey, { priority: number }>()
  private pendingTileRequests: Array<{ key: TileKey; priority: number }> = []
  private tileProcessingFrameId: number | null = null

  private currentVisibleTiles = new Set<TileKey>()
  private lastViewportHash = ''

  private loadImageResolve: (() => void) | null = null
  private loadImageReject: ((error: Error) => void) | null = null

  private resizeObserver: ResizeObserver | null = null
  private lastTileUpdateTime = 0

  constructor(
    canvas: HTMLCanvasElement,
    config: Required<WebGLImageViewerProps>,
    onDebugUpdate?: React.RefObject<(debugInfo: DebugInfo) => void>,
  ) {
    super()
    this.canvas = canvas
    this.config = config
    this.onZoomChange = config.onZoomChange
    this.onImageCopied = config.onImageCopied
    this.onLoadingStateChange = config.onLoadingStateChange
    this.onDebugUpdate = onDebugUpdate

    const gl = canvas.getContext('webgl', {
      alpha: true,
      premultipliedAlpha: false,
      antialias: true,
      powerPreference: 'default',
    })
    if (!gl) {
      throw new Error('WebGL not supported')
    }
    this.gl = gl

    this.boundHandleMouseDown = (e: MouseEvent) => this.handleMouseDown(e)
    this.boundHandleMouseMove = (e: MouseEvent) => this.handleMouseMove(e)
    this.boundHandleMouseUp = () => this.handleMouseUp()
    this.boundHandleWheel = (e: WheelEvent) => this.handleWheel(e)
    this.boundHandleDoubleClick = (e: MouseEvent) => this.handleDoubleClick(e)
    this.boundHandleTouchStart = (e: TouchEvent) => this.handleTouchStart(e)
    this.boundHandleTouchMove = (e: TouchEvent) => this.handleTouchMove(e)
    this.boundHandleTouchEnd = () => this.handleTouchEnd()
    this.boundResizeCanvas = () => this.resizeCanvas()

    this.setupCanvas()
    this.initWebGL()
    this.initWorker()
    this.setupEventListeners()

    this.isLoadingTexture = false
    this.notifyLoadingStateChange(false)
  }

  private setupCanvas() {
    this.resizeCanvas()
    window.addEventListener('resize', this.boundResizeCanvas)
    if (this.resizeObserver) {
      this.resizeObserver.disconnect()
    }
    this.resizeObserver = new ResizeObserver((e) => {
      if (e[0].target !== this.canvas) return
      this.boundResizeCanvas()
    })
    this.resizeObserver.observe(this.canvas)
  }

  private resizeCanvas() {
    const rect = this.canvas.getBoundingClientRect()
    this.devicePixelRatio = window.devicePixelRatio || 1

    this.canvasWidth = rect.width
    this.canvasHeight = rect.height

    const actualWidth = Math.round(rect.width * this.devicePixelRatio)
    const actualHeight = Math.round(rect.height * this.devicePixelRatio)

    this.canvas.width = actualWidth
    this.canvas.height = actualHeight
    this.gl.viewport(0, 0, actualWidth, actualHeight)

    if (this.imageLoaded) {
      this.constrainScaleAndPosition()
      this.render()
      this.notifyZoomChange()
    }
  }

  private initWebGL() {
    const { gl } = this

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER_SOURCE)
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER_SOURCE)

    this.program = gl.createProgram()!
    gl.attachShader(this.program, vertexShader)
    gl.attachShader(this.program, fragmentShader)
    gl.linkProgram(this.program)

    if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
      throw new Error(`Program linking failed: ${gl.getProgramInfoLog(this.program)}`)
    }

    gl.useProgram(this.program)

    this.positionLocation = gl.getAttribLocation(this.program, 'a_position')
    this.texCoordLocation = gl.getAttribLocation(this.program, 'a_texCoord')

    if (this.positionLocation === -1 || this.texCoordLocation === -1) {
      throw new Error('Failed to get attribute locations')
    }

    const matrixLocation = gl.getUniformLocation(this.program, 'u_matrix')
    const imageLocation = gl.getUniformLocation(this.program, 'u_image')
    const renderModeLocation = gl.getUniformLocation(this.program, 'u_renderMode')
    const solidColorLocation = gl.getUniformLocation(this.program, 'u_solidColor')

    if (!matrixLocation || !imageLocation || !renderModeLocation || !solidColorLocation) {
      throw new Error('Failed to get uniform locations')
    }

    this.matrixLocation = matrixLocation
    this.imageLocation = imageLocation
    this.renderModeLocation = renderModeLocation
    this.solidColorLocation = solidColorLocation

    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

    const positions = new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1])
    const texCoords = new Float32Array([0, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 0])

    const positionBuffer = gl.createBuffer()
    if (!positionBuffer) {
      throw new Error('Failed to create position buffer')
    }
    this.positionBuffer = positionBuffer
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW)

    const texCoordBuffer = gl.createBuffer()
    if (!texCoordBuffer) {
      throw new Error('Failed to create texCoord buffer')
    }
    this.texCoordBuffer = texCoordBuffer
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.STATIC_DRAW)

    const outlinePositions = new Float32Array([-1, -1, 1, -1, 1, 1, -1, 1])
    const outlineBuffer = gl.createBuffer()
    if (!outlineBuffer) {
      throw new Error('Failed to create outline buffer')
    }
    this.tileOutlineBuffer = outlineBuffer
    gl.bindBuffer(gl.ARRAY_BUFFER, outlineBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, outlinePositions, gl.STATIC_DRAW)

    gl.enableVertexAttribArray(this.positionLocation)
    gl.enableVertexAttribArray(this.texCoordLocation)

    this.bindQuadBuffers()
    gl.uniform1i(this.renderModeLocation, 0)
  }

  private bindQuadBuffers() {
    if (!this.positionBuffer || !this.texCoordBuffer) return

    const { gl } = this
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer)
    gl.vertexAttribPointer(this.positionLocation, 2, gl.FLOAT, false, 0, 0)
    gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer)
    gl.vertexAttribPointer(this.texCoordLocation, 2, gl.FLOAT, false, 0, 0)
  }

  private bindOutlineBuffer() {
    if (!this.tileOutlineBuffer) return

    const { gl } = this
    gl.bindBuffer(gl.ARRAY_BUFFER, this.tileOutlineBuffer)
    gl.vertexAttribPointer(this.positionLocation, 2, gl.FLOAT, false, 0, 0)
  }

  private drawTileOutlines(tileMatrices: Float32Array[]) {
    if (!this.tileOutlineEnabled || tileMatrices.length === 0 || !this.tileOutlineBuffer) {
      return
    }

    const { gl } = this
    gl.uniform1i(this.renderModeLocation, 1)
    gl.uniform4f(this.solidColorLocation, 1, 0.4, 0, 0.7)
    this.bindOutlineBuffer()
    gl.lineWidth(1)

    for (const matrix of tileMatrices) {
      gl.uniformMatrix3fv(this.matrixLocation, false, matrix)
      gl.drawArrays(gl.LINE_LOOP, 0, 4)
    }

    this.bindQuadBuffers()
    gl.uniform1i(this.renderModeLocation, 0)
  }

  private initWorker() {
    this.worker = new Worker(new URL('./texture.worker.ts', import.meta.url), {
      type: 'module',
      name: 'texture-worker',
    })

    this.worker.onmessage = (e: MessageEvent) => {
      this.handleWorkerMessage(e)
    }

    this.worker.onerror = (e: ErrorEvent) => {
      console.error('[Worker] Error:', e.message, e.error)
    }
  }

  private handleWorkerMessage(e: MessageEvent) {
    const { type, payload } = e.data

    if (type === 'image-loaded') {
      const { imageBitmap, imageWidth, imageHeight, lodLevel } = payload
      try {
        if (!this.imageWidth || !this.imageHeight) {
          this.imageWidth = imageWidth
          this.imageHeight = imageHeight
          this.setupInitialScaling()
        }

        this.notifyLoadingStateChange(true, LoadingState.CREATE_TEXTURE)

        const texture = this.createWebGLTexture(imageBitmap)
        imageBitmap.close()

        if (texture) {
          this.cleanupLODTextures()
          this.lodTextures.set(lodLevel, texture)
          this.texture = texture
          this.currentLOD = lodLevel
          this.currentQuality =
            SIMPLE_LOD_LEVELS[lodLevel].scale >= 2 ? 'high' : SIMPLE_LOD_LEVELS[lodLevel].scale >= 1 ? 'medium' : 'low'
        }

        this.imageLoaded = true
        this.isLoadingTexture = false
        this.notifyLoadingStateChange(false)
        this.render()
        this.notifyZoomChange()
        if (this.loadImageResolve) {
          this.loadImageResolve()
        }
      } catch (error) {
        if (this.loadImageReject) {
          this.loadImageReject(error as Error)
        }
      }
      return
    }

    if (type === 'load-error') {
      this.isLoadingTexture = false
      this.notifyLoadingStateChange(false)
      if (this.loadImageReject) {
        this.loadImageReject(new Error('Failed to load image in worker'))
      }
      return
    }

    if (type === 'init-done') {
      this.textureWorkerInitialized = true
      this.updateTileCache()
      return
    }

    if (type === 'tile-created') {
      const { key, imageBitmap, lodLevel } = payload
      const loadingInfo = this.loadingTiles.get(key)
      const tileInfoInCache = this.tileCache.get(key)

      if (!this.currentVisibleTiles.has(key)) {
        imageBitmap.close()
        if (loadingInfo) {
          this.loadingTiles.delete(key)
        }
        return
      }

      const texture = this.createWebGLTexture(imageBitmap)
      imageBitmap.close()

      if (texture) {
        const [x, y] = key.split('-').map(Number)
        const tileInfo: TileInfo = {
          x,
          y,
          lodLevel,
          texture,
          lastUsed: performance.now(),
          isLoading: false,
          priority: loadingInfo ? loadingInfo.priority : tileInfoInCache ? tileInfoInCache.priority : 0,
        }
        this.tileCache.set(key, tileInfo)

        if (loadingInfo) {
          this.loadingTiles.delete(key)
        }

        if (this.currentVisibleTiles.has(key)) {
          this.render()
        }
      } else if (loadingInfo) {
        this.loadingTiles.delete(key)
      }
    } else if (type === 'tile-error') {
      const { key } = payload
      this.loadingTiles.delete(key)
    }
  }

  async loadImage(url: string, preknownWidth?: number, preknownHeight?: number) {
    this.originalImageSrc = url
    this.isLoadingTexture = true
    this.notifyLoadingStateChange(true, LoadingState.IMAGE_LOADING)

    if (preknownWidth && preknownHeight) {
      this.imageWidth = preknownWidth
      this.imageHeight = preknownHeight
      this.setupInitialScaling()
    }

    return new Promise<void>((resolve, reject) => {
      this.loadImageResolve = resolve
      this.loadImageReject = reject

      this.worker?.postMessage({
        type: 'load-image',
        payload: { url },
      })
    })
  }

  private setupInitialScaling() {
    if (this.config.centerOnInit) {
      this.fitImageToScreen()
    } else {
      const fitToScreenScale = this.getFitToScreenScale()
      this.scale = fitToScreenScale * this.config.initialScale
    }
  }

  private createWebGLTexture(source: HTMLCanvasElement | HTMLImageElement | ImageBitmap): WebGLTexture | null {
    const { gl } = this

    const texture = gl.createTexture()
    if (!texture) return null

    gl.bindTexture(gl.TEXTURE_2D, texture)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source)

    return texture
  }

  private cleanupLODTextures() {
    for (const texture of this.lodTextures.values()) {
      this.gl.deleteTexture(texture)
    }
    this.lodTextures.clear()
  }

  private selectOptimalLOD(): number {
    if (this.isAnimating && this.animationStartLOD > -1) {
      return this.animationStartLOD
    }
    if (!this.imageLoaded) return 1

    const requiredScale = this.scale * this.devicePixelRatio

    for (const [i, SIMPLE_LOD_LEVEL] of SIMPLE_LOD_LEVELS.entries()) {
      if (SIMPLE_LOD_LEVEL.scale >= requiredScale) {
        return i
      }
    }

    return SIMPLE_LOD_LEVELS.length - 1
  }

  private easeOutQuart(t: number): number {
    return 1 - Math.pow(1 - t, 4)
  }

  private startAnimation(
    targetScale: number,
    targetTranslateX: number,
    targetTranslateY: number,
    animationTime?: number,
  ) {
    this.isAnimating = true
    this.animationStartTime = performance.now()
    this.animationDuration = animationTime || (this.config.smooth ? 300 : 0)
    this.startScale = this.scale
    this.targetScale = targetScale
    this.startTranslateX = this.translateX
    this.startTranslateY = this.translateY
    this.targetTranslateX = targetTranslateX
    this.targetTranslateY = targetTranslateY
    this.animationStartLOD = this.selectOptimalLOD()

    const tempScale = this.scale
    const tempTranslateX = this.translateX
    const tempTranslateY = this.translateY

    this.scale = targetScale
    this.translateX = targetTranslateX
    this.translateY = targetTranslateY
    this.constrainImagePosition()

    this.targetTranslateX = this.translateX
    this.targetTranslateY = this.translateY

    this.scale = tempScale
    this.translateX = tempTranslateX
    this.translateY = tempTranslateY

    this.animate()
  }

  private animate() {
    if (!this.isAnimating) return

    const now = performance.now()
    const elapsed = now - this.animationStartTime
    const progress = Math.min(elapsed / this.animationDuration, 1)
    const easedProgress = this.config.smooth ? this.easeOutQuart(progress) : progress

    this.scale = this.startScale + (this.targetScale - this.startScale) * easedProgress
    this.translateX = this.startTranslateX + (this.targetTranslateX - this.startTranslateX) * easedProgress
    this.translateY = this.startTranslateY + (this.targetTranslateY - this.startTranslateY) * easedProgress

    this.render()
    this.notifyZoomChange()

    if (progress < 1) {
      requestAnimationFrame(() => this.animate())
    } else {
      this.isAnimating = false
      this.animationStartLOD = -1
      this.scale = this.targetScale
      this.translateX = this.targetTranslateX
      this.translateY = this.targetTranslateY
      this.render()
      this.notifyZoomChange()
      this.updateTileCache()
    }
  }

  private fitImageToScreen() {
    const scaleX = this.canvasWidth / this.imageWidth
    const scaleY = this.canvasHeight / this.imageHeight
    const fitToScreenScale = Math.min(scaleX, scaleY)

    this.scale = fitToScreenScale * this.config.initialScale
    this.translateX = 0
    this.translateY = 0
    this.isOriginalSize = false
  }

  private createMatrix(): Float32Array {
    const scaleX = (this.imageWidth * this.scale) / this.canvasWidth
    const scaleY = (this.imageHeight * this.scale) / this.canvasHeight
    const translateX = (this.translateX * 2) / this.canvasWidth
    const translateY = -(this.translateY * 2) / this.canvasHeight

    return new Float32Array([scaleX, 0, 0, 0, scaleY, 0, translateX, translateY, 1])
  }

  private getFitToScreenScale(): number {
    const scaleX = this.canvasWidth / this.imageWidth
    const scaleY = this.canvasHeight / this.imageHeight
    return Math.min(scaleX, scaleY)
  }

  private constrainImagePosition() {
    if (!this.config.limitToBounds) return

    const fitScale = this.getFitToScreenScale()

    if (this.scale <= fitScale) {
      this.translateX = 0
      this.translateY = 0
      return
    }

    const scaledWidth = this.imageWidth * this.scale
    const scaledHeight = this.imageHeight * this.scale
    const maxTranslateX = Math.max(0, (scaledWidth - this.canvasWidth) / 2)
    const maxTranslateY = Math.max(0, (scaledHeight - this.canvasHeight) / 2)

    this.translateX = Math.max(-maxTranslateX, Math.min(maxTranslateX, this.translateX))
    this.translateY = Math.max(-maxTranslateY, Math.min(maxTranslateY, this.translateY))
  }

  private constrainScaleAndPosition() {
    const fitToScreenScale = this.getFitToScreenScale()
    const absoluteMinScale = fitToScreenScale * this.config.minScale
    const originalSizeScale = 1
    const userMaxScale = fitToScreenScale * this.config.maxScale
    const effectiveMaxScale = Math.max(userMaxScale, originalSizeScale)

    if (this.scale < absoluteMinScale) {
      this.scale = absoluteMinScale
    } else if (this.scale > effectiveMaxScale) {
      this.scale = effectiveMaxScale
    }

    this.constrainImagePosition()
  }

  private getTileKey(x: number, y: number, lodLevel: number): TileKey {
    return `${x}-${y}-${lodLevel}`
  }

  private getTileGridSize(lodLevel: number): { cols: number; rows: number } {
    const lodConfig = SIMPLE_LOD_LEVELS[lodLevel]
    const scaledWidth = this.imageWidth * lodConfig.scale
    const scaledHeight = this.imageHeight * lodConfig.scale

    const cols = Math.ceil(scaledWidth / TILE_SIZE)
    const rows = Math.ceil(scaledHeight / TILE_SIZE)

    return { cols, rows }
  }

  private calculateVisibleTiles(): Array<{
    x: number
    y: number
    lodLevel: number
    priority: number
  }> {
    if (!this.imageLoaded) return []

    const lodLevel = this.selectOptimalLOD()
    const { cols, rows } = this.getTileGridSize(lodLevel)

    const imageCenterInCanvasX = this.canvasWidth / 2 + this.translateX
    const imageCenterInCanvasY = this.canvasHeight / 2 + this.translateY

    const scaledImageWidth = this.imageWidth * this.scale
    const scaledImageHeight = this.imageHeight * this.scale

    const imageLeftInCanvas = imageCenterInCanvasX - scaledImageWidth / 2
    const imageTopInCanvas = imageCenterInCanvasY - scaledImageHeight / 2

    const viewLeft = Math.max(0, -imageLeftInCanvas / this.scale)
    const viewTop = Math.max(0, -imageTopInCanvas / this.scale)
    const viewRight = Math.min(this.imageWidth, (this.canvasWidth - imageLeftInCanvas) / this.scale)
    const viewBottom = Math.min(this.imageHeight, (this.canvasHeight - imageTopInCanvas) / this.scale)

    const tileWidthInImage = this.imageWidth / cols
    const tileHeightInImage = this.imageHeight / rows

    const margin = 1
    const startTileX = Math.max(0, Math.floor(viewLeft / tileWidthInImage) - margin)
    const endTileX = Math.min(cols - 1, Math.ceil(viewRight / tileWidthInImage) + margin)
    const startTileY = Math.max(0, Math.floor(viewTop / tileHeightInImage) - margin)
    const endTileY = Math.min(rows - 1, Math.ceil(viewBottom / tileHeightInImage) + margin)

    const visibleTiles: Array<{
      x: number
      y: number
      lodLevel: number
      priority: number
    }> = []

    const viewCenterX = (viewLeft + viewRight) / 2
    const viewCenterY = (viewTop + viewBottom) / 2

    for (let y = startTileY; y <= endTileY; y++) {
      for (let x = startTileX; x <= endTileX; x++) {
        const tileCenterX = (x + 0.5) * tileWidthInImage
        const tileCenterY = (y + 0.5) * tileHeightInImage
        const distance = Math.sqrt(Math.pow(tileCenterX - viewCenterX, 2) + Math.pow(tileCenterY - viewCenterY, 2))

        visibleTiles.push({
          x,
          y,
          lodLevel,
          priority: distance,
        })
      }
    }

    visibleTiles.sort((a, b) => a.priority - b.priority)

    return visibleTiles
  }

  private async updateTileCache(): Promise<void> {
    const visibleTiles = this.calculateVisibleTiles()
    const newVisibleTiles = new Set<TileKey>()

    const viewportHash = `${this.scale.toFixed(3)}-${this.translateX.toFixed(1)}-${this.translateY.toFixed(1)}`
    const viewportChanged = viewportHash !== this.lastViewportHash
    this.lastViewportHash = viewportHash

    let addedNewRequest = false

    for (const tile of visibleTiles) {
      const key = this.getTileKey(tile.x, tile.y, tile.lodLevel)
      newVisibleTiles.add(key)

      const pendingRequest = this.pendingTileRequests.find((request) => request.key === key)

      if (!this.tileCache.has(key) && !this.loadingTiles.has(key) && !pendingRequest) {
        this.pendingTileRequests.push({ key, priority: tile.priority })
        addedNewRequest = true
      } else if (pendingRequest) {
        pendingRequest.priority = Math.min(pendingRequest.priority, tile.priority)
      } else if (this.tileCache.has(key)) {
        const tileInfo = this.tileCache.get(key)!
        tileInfo.lastUsed = performance.now()
      }
    }

    this.currentVisibleTiles = newVisibleTiles
    this.cleanupOldTiles()

    if (viewportChanged || addedNewRequest || this.pendingTileRequests.length > 0) {
      this.processPendingTileRequests()
    }
  }

  private cleanupOldTiles(): void {
    const now = performance.now()
    const maxAge = 30000

    if (this.tileCache.size > TILE_CACHE_SIZE) {
      const tilesToRemove = Array.from(this.tileCache.entries())
        .filter(([key]) => !this.currentVisibleTiles.has(key))
        .sort(([, a], [, b]) => a.lastUsed - b.lastUsed)
        .slice(0, this.tileCache.size - TILE_CACHE_SIZE + 5)

      for (const [key, tileInfo] of tilesToRemove) {
        if (tileInfo.texture) {
          this.gl.deleteTexture(tileInfo.texture)
        }
        this.tileCache.delete(key)
      }
    }

    for (const [key, tileInfo] of this.tileCache.entries()) {
      if (!this.currentVisibleTiles.has(key) && now - tileInfo.lastUsed > maxAge) {
        if (tileInfo.texture) {
          this.gl.deleteTexture(tileInfo.texture)
        }
        this.tileCache.delete(key)
      }
    }
  }

  private processPendingTileRequests(): void {
    if (!this.worker || !this.textureWorkerInitialized) {
      return
    }

    if (this.pendingTileRequests.length === 0) {
      if (this.tileProcessingFrameId !== null) {
        cancelAnimationFrame(this.tileProcessingFrameId)
        this.tileProcessingFrameId = null
      }
      return
    }

    this.pendingTileRequests.sort((a, b) => a.priority - b.priority)

    const halfCount = Math.max(1, Math.ceil(this.pendingTileRequests.length / 2))
    const batchSize = Math.min(MAX_TILES_PER_FRAME, halfCount)
    const batch = this.pendingTileRequests.splice(0, batchSize)

    for (const request of batch) {
      const { key, priority } = request
      if (this.loadingTiles.has(key) || this.tileCache.has(key)) {
        continue
      }

      this.loadingTiles.set(key, { priority })

      const [x, y, lodLevel] = key.split('-').map(Number)
      const lodConfig = SIMPLE_LOD_LEVELS[lodLevel]

      this.worker.postMessage({
        type: 'create-tile',
        payload: {
          x,
          y,
          lodLevel,
          lodConfig,
          imageWidth: this.imageWidth,
          imageHeight: this.imageHeight,
          key,
        },
      })
    }

    if (this.pendingTileRequests.length > 0 && this.tileProcessingFrameId === null) {
      this.tileProcessingFrameId = requestAnimationFrame(() => {
        this.tileProcessingFrameId = null
        this.processPendingTileRequests()
      })
    }
  }

  private render() {
    const { gl } = this

    if (!this.positionBuffer || !this.texCoordBuffer) {
      return
    }

    gl.viewport(0, 0, this.canvas.width, this.canvas.height)
    gl.clearColor(0, 0, 0, 0)
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.useProgram(this.program)
    this.bindQuadBuffers()
    gl.uniform1i(this.renderModeLocation, 0)

    if (this.texture) {
      gl.uniformMatrix3fv(this.matrixLocation, false, this.createMatrix())
      gl.uniform1i(this.imageLocation, 0)
      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, this.texture)
      gl.drawArrays(gl.TRIANGLES, 0, 6)
    }

    const lodLevel = this.selectOptimalLOD()
    const outlinedTileMatrices: Float32Array[] = []

    for (const tileKey of this.currentVisibleTiles) {
      const tileInfo = this.tileCache.get(tileKey)
      if (!tileInfo || !tileInfo.texture || tileInfo.lodLevel !== lodLevel) {
        continue
      }

      const tileMatrix = this.createTileMatrix(tileInfo.x, tileInfo.y, tileInfo.lodLevel)
      gl.uniformMatrix3fv(this.matrixLocation, false, tileMatrix)

      gl.uniform1i(this.imageLocation, 0)
      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, tileInfo.texture)
      gl.drawArrays(gl.TRIANGLES, 0, 6)
      if (this.tileOutlineEnabled) {
        outlinedTileMatrices.push(tileMatrix)
      }
    }

    this.drawTileOutlines(outlinedTileMatrices)
    this.updateDebugInfo()

    if (!this.isAnimating && performance.now() - this.lastTileUpdateTime > 100) {
      this.lastTileUpdateTime = performance.now()
      setTimeout(() => this.updateTileCache(), 0)
    }
  }

  private createTileMatrix(tileX: number, tileY: number, lodLevel: number): Float32Array {
    const { cols, rows } = this.getTileGridSize(lodLevel)

    const tileWidthInImage = this.imageWidth / cols
    const tileHeightInImage = this.imageHeight / rows

    const tileLeftInImage = tileX * tileWidthInImage
    const tileTopInImage = tileY * tileHeightInImage
    const tileRightInImage = Math.min(this.imageWidth, tileLeftInImage + tileWidthInImage)
    const tileBottomInImage = Math.min(this.imageHeight, tileTopInImage + tileHeightInImage)

    const actualTileWidth = tileRightInImage - tileLeftInImage
    const actualTileHeight = tileBottomInImage - tileTopInImage

    const tileCenterInImageX = tileLeftInImage + actualTileWidth / 2
    const tileCenterInImageY = tileTopInImage + actualTileHeight / 2

    const tileCenterRelativeX = tileCenterInImageX - this.imageWidth / 2
    const tileCenterRelativeY = tileCenterInImageY - this.imageHeight / 2

    const tileCenterInCanvasX = this.canvasWidth / 2 + this.translateX + tileCenterRelativeX * this.scale
    const tileCenterInCanvasY = this.canvasHeight / 2 + this.translateY + tileCenterRelativeY * this.scale

    const tileWidthInCanvas = actualTileWidth * this.scale
    const tileHeightInCanvas = actualTileHeight * this.scale

    const scaleX = tileWidthInCanvas / this.canvasWidth
    const scaleY = tileHeightInCanvas / this.canvasHeight

    const translateX = (tileCenterInCanvasX * 2) / this.canvasWidth - 1
    const translateY = -((tileCenterInCanvasY * 2) / this.canvasHeight - 1)

    return new Float32Array([scaleX, 0, 0, 0, scaleY, 0, translateX, translateY, 1])
  }

  public zoomIn(animated = false) {
    const centerX = this.canvasWidth / 2
    const centerY = this.canvasHeight / 2
    this.zoomAt(centerX, centerY, 1 + this.config.wheel.step, animated)
  }

  public zoomOut(animated = false) {
    const centerX = this.canvasWidth / 2
    const centerY = this.canvasHeight / 2
    this.zoomAt(centerX, centerY, 1 - this.config.wheel.step, animated)
  }

  public resetView() {
    const fitToScreenScale = this.getFitToScreenScale()
    const targetScale = fitToScreenScale * this.config.initialScale
    this.startAnimation(targetScale, 0, 0)
  }

  public getScale(): number {
    return this.scale
  }

  public setTileOutlineEnabled(enabled: boolean) {
    this.tileOutlineEnabled = enabled
    this.render()
  }

  public isTileOutlineEnabled(): boolean {
    return this.tileOutlineEnabled
  }

  public destroy() {
    window.removeEventListener('resize', this.boundResizeCanvas)
    this.canvas.removeEventListener('mousedown', this.boundHandleMouseDown)
    this.canvas.removeEventListener('mousemove', this.boundHandleMouseMove)
    this.canvas.removeEventListener('mouseup', this.boundHandleMouseUp)
    this.canvas.removeEventListener('wheel', this.boundHandleWheel)
    this.canvas.removeEventListener('dblclick', this.boundHandleDoubleClick)
    this.canvas.removeEventListener('touchstart', this.boundHandleTouchStart)
    this.canvas.removeEventListener('touchmove', this.boundHandleTouchMove)
    this.canvas.removeEventListener('touchend', this.boundHandleTouchEnd)

    this.cleanupLODTextures()
    if (this.texture) {
      this.gl.deleteTexture(this.texture)
    }
    if (this.positionBuffer) {
      this.gl.deleteBuffer(this.positionBuffer)
      this.positionBuffer = null
    }
    if (this.texCoordBuffer) {
      this.gl.deleteBuffer(this.texCoordBuffer)
      this.texCoordBuffer = null
    }
    if (this.tileOutlineBuffer) {
      this.gl.deleteBuffer(this.tileOutlineBuffer)
      this.tileOutlineBuffer = null
    }
    if (this.program) {
      this.gl.deleteProgram(this.program)
    }
    if (this.resizeObserver) {
      this.resizeObserver.disconnect()
    }

    if (this.tileProcessingFrameId !== null) {
      cancelAnimationFrame(this.tileProcessingFrameId)
      this.tileProcessingFrameId = null
    }

    this.worker?.terminate()
  }

  private updateDebugInfo() {
    if (!this.onDebugUpdate?.current) return

    const fitToScreenScale = this.getFitToScreenScale()
    const relativeScale = this.scale / fitToScreenScale
    const userMaxScale = fitToScreenScale * this.config.maxScale
    const originalSizeScale = 1
    const effectiveMaxScale = Math.max(userMaxScale, originalSizeScale)

    const tileMemoryMB = this.tileCache.size * 4
    const totalMemoryMB = tileMemoryMB + this.lodTextures.size * 16
    const memoryBudget = 256

    const tileSystemInfo = {
      cacheSize: this.tileCache.size,
      visibleTiles: this.currentVisibleTiles.size,
      loadingTiles: this.loadingTiles.size,
      pendingRequests: this.pendingTileRequests.length,
      cacheLimit: TILE_CACHE_SIZE,
      maxTilesPerFrame: MAX_TILES_PER_FRAME,
      tileSize: TILE_SIZE,
      cacheKeys: Array.from(this.tileCache.keys()),
      visibleKeys: Array.from(this.currentVisibleTiles),
      loadingKeys: Array.from(this.loadingTiles.keys()),
      pendingKeys: this.pendingTileRequests.map((req) => req.key),
    }

    this.onDebugUpdate.current({
      scale: this.scale,
      relativeScale,
      translateX: this.translateX,
      translateY: this.translateY,
      currentLOD: this.currentLOD,
      lodLevels: SIMPLE_LOD_LEVELS.length,
      canvasSize: { width: this.canvasWidth, height: this.canvasHeight },
      imageSize: { width: this.imageWidth, height: this.imageHeight },
      fitToScreenScale,
      userMaxScale,
      effectiveMaxScale,
      originalSizeScale,
      renderCount: performance.now(),
      maxTextureSize: this.gl.getParameter(this.gl.MAX_TEXTURE_SIZE),
      quality: this.currentQuality,
      isLoading: this.isLoadingTexture,
      memory: {
        textures: totalMemoryMB,
        estimated: totalMemoryMB,
        budget: memoryBudget,
        pressure: (totalMemoryMB / memoryBudget) * 100,
        activeLODs: this.lodTextures.size,
        maxConcurrentLODs: 3,
        onDemandStrategy: true,
      },
      tileOutlinesEnabled: this.tileOutlineEnabled,
      tileSystem: tileSystemInfo,
    })
  }

  private notifyZoomChange() {
    if (this.onZoomChange) {
      const originalScale = this.scale
      const fitToScreenScale = this.getFitToScreenScale()
      const relativeScale = this.scale / fitToScreenScale
      this.onZoomChange(originalScale, relativeScale)
    }
  }

  private notifyLoadingStateChange(
    isLoading: boolean,
    state?: LoadingState,
    quality?: 'high' | 'medium' | 'low' | 'unknown',
  ) {
    if (this.onLoadingStateChange) {
      this.onLoadingStateChange(isLoading, state, quality || this.currentQuality)
    }
  }

  private setupEventListeners() {
    this.canvas.addEventListener('mousedown', this.boundHandleMouseDown)
    this.canvas.addEventListener('mousemove', this.boundHandleMouseMove)
    this.canvas.addEventListener('mouseup', this.boundHandleMouseUp)
    this.canvas.addEventListener('wheel', this.boundHandleWheel)
    this.canvas.addEventListener('dblclick', this.boundHandleDoubleClick)
    this.canvas.addEventListener('touchstart', this.boundHandleTouchStart)
    this.canvas.addEventListener('touchmove', this.boundHandleTouchMove)
    this.canvas.addEventListener('touchend', this.boundHandleTouchEnd)
  }

  private handleMouseDown(e: MouseEvent) {
    if (this.isAnimating) {
      this.isAnimating = false
      this.animationStartLOD = -1
    }
    if (this.config.panning.disabled) return

    this.isDragging = true
    this.lastMouseX = e.clientX
    this.lastMouseY = e.clientY
  }

  private handleMouseMove(e: MouseEvent) {
    if (!this.isDragging || this.config.panning.disabled) return

    const deltaX = e.clientX - this.lastMouseX
    const deltaY = e.clientY - this.lastMouseY

    this.translateX += deltaX
    this.translateY += deltaY

    this.lastMouseX = e.clientX
    this.lastMouseY = e.clientY

    this.constrainImagePosition()
    this.render()
  }

  private handleMouseUp() {
    this.isDragging = false
  }

  private handleWheel(e: WheelEvent) {
    e.preventDefault()
    if (this.config.wheel.wheelDisabled) return

    if (this.isAnimating) {
      this.isAnimating = false
      this.animationStartLOD = -1
    }

    const rect = this.canvas.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top

    const scaleFactor = e.deltaY > 0 ? 1 - this.config.wheel.step : 1 + this.config.wheel.step
    this.zoomAt(mouseX, mouseY, scaleFactor)
  }

  private handleDoubleClick(e: MouseEvent) {
    e.preventDefault()
    if (this.config.doubleClick.disabled) return

    const now = Date.now()
    if (now - this.lastDoubleClickTime < 300) return
    this.lastDoubleClickTime = now

    const rect = this.canvas.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top

    this.performDoubleClickAction(mouseX, mouseY)
  }

  private handleTouchStart(e: TouchEvent) {
    e.preventDefault()

    if (this.isAnimating) {
      this.isAnimating = false
      this.animationStartLOD = -1
      return
    }

    if (e.touches.length === 1 && !this.config.panning.disabled) {
      const touch = e.touches[0]
      const now = Date.now()

      if (
        !this.config.doubleClick.disabled &&
        now - this.lastTouchTime < 300 &&
        Math.abs(touch.clientX - this.lastTouchX) < 50 &&
        Math.abs(touch.clientY - this.lastTouchY) < 50
      ) {
        this.handleTouchDoubleTap(touch.clientX, touch.clientY)
        this.lastTouchTime = 0
        return
      }

      this.isDragging = true
      this.lastMouseX = touch.clientX
      this.lastMouseY = touch.clientY

      this.lastTouchTime = now
      this.lastTouchX = touch.clientX
      this.lastTouchY = touch.clientY
    } else if (e.touches.length === 2 && !this.config.pinch.disabled) {
      this.isDragging = false
      const touch1 = e.touches[0]
      const touch2 = e.touches[1]
      this.lastTouchDistance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) + Math.pow(touch2.clientY - touch1.clientY, 2),
      )
    }
  }

  private handleTouchMove(e: TouchEvent) {
    e.preventDefault()

    if (e.touches.length === 1 && this.isDragging && !this.config.panning.disabled) {
      const deltaX = e.touches[0].clientX - this.lastMouseX
      const deltaY = e.touches[0].clientY - this.lastMouseY

      this.translateX += deltaX
      this.translateY += deltaY

      this.lastMouseX = e.touches[0].clientX
      this.lastMouseY = e.touches[0].clientY

      this.constrainImagePosition()
      this.render()
    } else if (e.touches.length === 2 && !this.config.pinch.disabled) {
      const touch1 = e.touches[0]
      const touch2 = e.touches[1]
      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) + Math.pow(touch2.clientY - touch1.clientY, 2),
      )

      if (this.lastTouchDistance > 0) {
        const scaleFactor = distance / this.lastTouchDistance
        const centerX = (touch1.clientX + touch2.clientX) / 2
        const centerY = (touch1.clientY + touch2.clientY) / 2

        const rect = this.canvas.getBoundingClientRect()
        this.zoomAt(centerX - rect.left, centerY - rect.top, scaleFactor)
      }

      this.lastTouchDistance = distance
    }
  }

  private handleTouchEnd() {
    this.isDragging = false
    this.lastTouchDistance = 0
  }

  private handleTouchDoubleTap(clientX: number, clientY: number) {
    if (this.config.doubleClick.disabled) return

    const rect = this.canvas.getBoundingClientRect()
    const touchX = clientX - rect.left
    const touchY = clientY - rect.top

    this.performDoubleClickAction(touchX, touchY)
  }

  private performDoubleClickAction(x: number, y: number) {
    this.isAnimating = false
    this.animationStartLOD = -1

    if (this.config.doubleClick.mode === 'toggle') {
      const fitToScreenScale = this.getFitToScreenScale()
      const absoluteMinScale = fitToScreenScale * this.config.minScale
      const originalSizeScale = 1
      const userMaxScale = fitToScreenScale * this.config.maxScale
      const effectiveMaxScale = Math.max(userMaxScale, originalSizeScale)

      if (this.isOriginalSize) {
        const targetScale = Math.max(absoluteMinScale, Math.min(effectiveMaxScale, fitToScreenScale))
        const zoomX = (x - this.canvasWidth / 2 - this.translateX) / this.scale
        const zoomY = (y - this.canvasHeight / 2 - this.translateY) / this.scale
        const targetTranslateX = x - this.canvasWidth / 2 - zoomX * targetScale
        const targetTranslateY = y - this.canvasHeight / 2 - zoomY * targetScale

        this.startAnimation(targetScale, targetTranslateX, targetTranslateY, this.config.doubleClick.animationTime)
        this.isOriginalSize = false
      } else {
        const targetScale = Math.max(absoluteMinScale, Math.min(effectiveMaxScale, originalSizeScale))
        const zoomX = (x - this.canvasWidth / 2 - this.translateX) / this.scale
        const zoomY = (y - this.canvasHeight / 2 - this.translateY) / this.scale
        const targetTranslateX = x - this.canvasWidth / 2 - zoomX * targetScale
        const targetTranslateY = y - this.canvasHeight / 2 - zoomY * targetScale

        this.startAnimation(targetScale, targetTranslateX, targetTranslateY, this.config.doubleClick.animationTime)
        this.isOriginalSize = true
      }
    } else {
      this.zoomAt(x, y, this.config.doubleClick.step, true)
    }
  }

  public zoomAt(x: number, y: number, scaleFactor: number, animated = false) {
    const newScale = this.scale * scaleFactor
    const fitToScreenScale = this.getFitToScreenScale()
    const absoluteMinScale = fitToScreenScale * this.config.minScale
    const originalSizeScale = 1
    const userMaxScale = fitToScreenScale * this.config.maxScale
    const effectiveMaxScale = Math.max(userMaxScale, originalSizeScale)

    if (newScale < absoluteMinScale || newScale > effectiveMaxScale) return

    if (animated && this.config.smooth) {
      const zoomX = (x - this.canvasWidth / 2 - this.translateX) / this.scale
      const zoomY = (y - this.canvasHeight / 2 - this.translateY) / this.scale
      const targetTranslateX = x - this.canvasWidth / 2 - zoomX * newScale
      const targetTranslateY = y - this.canvasHeight / 2 - zoomY * newScale

      this.startAnimation(newScale, targetTranslateX, targetTranslateY)
    } else {
      const zoomX = (x - this.canvasWidth / 2 - this.translateX) / this.scale
      const zoomY = (y - this.canvasHeight / 2 - this.translateY) / this.scale

      this.scale = newScale
      this.translateX = x - this.canvasWidth / 2 - zoomX * this.scale
      this.translateY = y - this.canvasHeight / 2 - zoomY * this.scale

      this.constrainImagePosition()
      this.render()
      this.notifyZoomChange()
    }
  }

  async copyOriginalImageToClipboard() {
    try {
      const response = await fetch(this.originalImageSrc)
      const blob = await response.blob()

      if (!navigator.clipboard || !navigator.clipboard.write) {
        console.warn('Clipboard API not supported')
        return
      }

      const clipboardItem = new ClipboardItem({ [blob.type]: blob })
      await navigator.clipboard.write([clipboardItem])

      if (this.onImageCopied) {
        this.onImageCopied()
      }
    } catch (error) {
      console.error('Failed to copy image to clipboard:', error)
    }
  }
}
