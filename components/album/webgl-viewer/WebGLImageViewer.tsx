'use client'

/**
 * WebGL Image Viewer React Component
 *
 * @reference https://github.com/Afilmory/afilmory
 * @source packages/webgl-viewer/src/WebGLImageViewer.tsx
 * @license MIT
 * @author Afilmory Team
 *
 * Adapted for PicImpact with modifications:
 * - Simplified DebugInfo component (inlined)
 * - Adjusted for Next.js/React 19 compatibility
 */

import * as React from 'react'
import { useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'

import {
  defaultAlignmentAnimation,
  defaultDoubleClickConfig,
  defaultPanningConfig,
  defaultPinchConfig,
  defaultVelocityAnimation,
  defaultWheelConfig,
} from './constants'
import type { DebugInfo, WebGLImageViewerProps, WebGLImageViewerRef } from './interface'
import { WebGLImageViewerEngine } from './WebGLImageViewerEngine'

interface WebGLImageViewerComponentProps extends WebGLImageViewerProps {
  ref?: React.RefObject<WebGLImageViewerRef | null>
}

/**
 * WebGL图像查看器组件
 */
export const WebGLImageViewer = ({
  ref,
  src,
  className = '',
  width,
  height,
  initialScale = 1,
  minScale = 0.1,
  maxScale = 10,
  wheel = defaultWheelConfig,
  pinch = defaultPinchConfig,
  doubleClick = defaultDoubleClickConfig,
  panning = defaultPanningConfig,
  limitToBounds = true,
  centerOnInit = true,
  smooth = true,
  alignmentAnimation = defaultAlignmentAnimation,
  velocityAnimation = defaultVelocityAnimation,
  onZoomChange,
  onImageCopied,
  onLoadingStateChange,
  debug = false,
  ...divProps
}: WebGLImageViewerComponentProps &
  Omit<React.HTMLAttributes<HTMLDivElement>, 'className'>) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const viewerRef = useRef<WebGLImageViewerEngine | null>(null)
  const [tileOutlineEnabled, setTileOutlineEnabled] = useState(false)

  const setDebugInfo = useRef((() => {}) as (debugInfo: DebugInfo) => void)

  const config: Required<WebGLImageViewerProps> = useMemo(
    () => ({
      src,
      className,
      width: width || 0,
      height: height || 0,
      initialScale,
      minScale,
      maxScale,
      wheel: {
        ...defaultWheelConfig,
        ...wheel,
      },
      pinch: { ...defaultPinchConfig, ...pinch },
      doubleClick: { ...defaultDoubleClickConfig, ...doubleClick },
      panning: { ...defaultPanningConfig, ...panning },
      limitToBounds,
      centerOnInit,
      smooth,
      alignmentAnimation: {
        ...defaultAlignmentAnimation,
        ...alignmentAnimation,
      },
      velocityAnimation: { ...defaultVelocityAnimation, ...velocityAnimation },
      onZoomChange: onZoomChange || (() => {}),
      onImageCopied: onImageCopied || (() => {}),
      onLoadingStateChange: onLoadingStateChange || (() => {}),
      debug: debug || false,
    }),
    [
      src,
      className,
      width,
      height,
      initialScale,
      minScale,
      maxScale,
      wheel,
      pinch,
      doubleClick,
      panning,
      limitToBounds,
      centerOnInit,
      smooth,
      alignmentAnimation,
      velocityAnimation,
      onZoomChange,
      onImageCopied,
      onLoadingStateChange,
      debug,
    ],
  )

  useImperativeHandle(ref, () => ({
    zoomIn: (animated?: boolean) => viewerRef.current?.zoomIn(animated),
    zoomOut: (animated?: boolean) => viewerRef.current?.zoomOut(animated),
    resetView: () => viewerRef.current?.resetView(),
    getScale: () => viewerRef.current?.getScale() || 1,
  }))

  useEffect(() => {
    if (!canvasRef.current) return

    const webGLImageViewerEngine = new WebGLImageViewerEngine(
      canvasRef.current,
      config,
      debug ? { current: setDebugInfo.current } : undefined,
    )

    try {
      const preknownWidth = config.width > 0 ? config.width : undefined
      const preknownHeight = config.height > 0 ? config.height : undefined
      webGLImageViewerEngine.loadImage(src, preknownWidth, preknownHeight).catch(console.error)
      viewerRef.current = webGLImageViewerEngine
      setTileOutlineEnabled(webGLImageViewerEngine.isTileOutlineEnabled())
    } catch (error) {
      console.error('Failed to initialize WebGL Image Viewer:', error)
    }

    return () => {
      webGLImageViewerEngine?.destroy()
      viewerRef.current = null
    }
  }, [src, config, debug])

  const handleOutlineToggle = useCallback(
    (enabled: boolean) => {
      setTileOutlineEnabled(enabled)
      viewerRef.current?.setTileOutlineEnabled(enabled)
    },
    [setTileOutlineEnabled],
  )

  return (
    <div
      {...divProps}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        ...divProps.style,
      }}
    >
      <canvas
        ref={canvasRef}
        className={className}
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
          touchAction: 'none',
          border: 'none',
          outline: 'none',
          margin: 0,
          padding: 0,
          imageRendering: 'pixelated',
        }}
      />
      {debug && (
        <DebugInfoComponent
          outlineEnabled={tileOutlineEnabled}
          onToggleOutline={handleOutlineToggle}
          ref={(e) => {
            if (e) {
              setDebugInfo.current = e.updateDebugInfo
            }
          }}
        />
      )}
    </div>
  )
}

WebGLImageViewer.displayName = 'WebGLImageViewer'

// 简化的调试信息组件
interface DebugInfoRef {
  updateDebugInfo: (debugInfo: DebugInfo) => void
}

interface DebugInfoProps {
  outlineEnabled?: boolean
  onToggleOutline?: (value: boolean) => void
}

const DebugInfoComponent = React.forwardRef<DebugInfoRef, DebugInfoProps>(
  ({ outlineEnabled, onToggleOutline }, ref) => {
    const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null)
    const [collapsed, setCollapsed] = useState(false)

    React.useImperativeHandle(
      ref,
      useCallback(
        () => ({
          updateDebugInfo: (info: DebugInfo) => {
            setDebugInfo(info)
          },
        }),
        [],
      ),
    )

    const getQualityColor = (quality: string) => {
      switch (quality) {
        case 'high':
          return '#4ade80'
        case 'medium':
          return '#fbbf24'
        case 'low':
          return '#f87171'
        default:
          return '#94a3b8'
      }
    }

    if (!debugInfo) return null

    const currentOutlineEnabled = outlineEnabled !== undefined ? outlineEnabled : (debugInfo.tileOutlinesEnabled ?? false)

    return (
      <div
        style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          background: 'rgba(0, 0, 0, 0.9)',
          color: 'white',
          padding: '8px',
          borderRadius: '6px',
          fontSize: '11px',
          fontFamily: 'monospace',
          lineHeight: '1.3',
          pointerEvents: 'auto',
          zIndex: 1000,
          minWidth: '200px',
          maxWidth: '280px',
          backdropFilter: 'blur(4px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '8px',
            paddingBottom: '4px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
          }}
        >
          <span style={{ fontWeight: 'bold', fontSize: '12px' }}>WebGL Debug</span>
          <button
            type="button"
            style={{
              background: 'none',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              fontSize: '10px',
              padding: '2px 4px',
              borderRadius: '2px',
              opacity: 0.7,
            }}
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? '📈' : '📉'}
          </button>
        </div>

        {!collapsed && (
          <>
            {onToggleOutline && (
              <div style={{ marginBottom: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Tile Outline:</span>
                  <button
                    type="button"
                    style={{
                      background: currentOutlineEnabled ? 'rgba(34, 197, 94, 0.25)' : 'rgba(148, 163, 184, 0.25)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      color: 'white',
                      cursor: 'pointer',
                      fontSize: '10px',
                      padding: '2px 6px',
                      borderRadius: '3px',
                    }}
                    onClick={() => onToggleOutline(!currentOutlineEnabled)}
                  >
                    {currentOutlineEnabled ? 'On' : 'Off'}
                  </button>
                </div>
              </div>
            )}
            <div style={{ marginBottom: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Scale:</span>
                <span>{debugInfo.scale.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>LOD:</span>
                <span>
                  {debugInfo.currentLOD} / {debugInfo.lodLevels - 1}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Quality:</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      backgroundColor: getQualityColor(debugInfo.quality),
                      display: 'inline-block',
                    }}
                  />
                  {debugInfo.quality}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Status:</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      backgroundColor: debugInfo.isLoading ? '#fbbf24' : '#4ade80',
                      display: 'inline-block',
                    }}
                  />
                  {debugInfo.isLoading ? 'Loading' : 'Ready'}
                </span>
              </div>
            </div>
          </>
        )}

        {collapsed && (
          <div style={{ fontSize: '10px', opacity: 0.8 }}>
            <div>
              Scale: {debugInfo.scale.toFixed(2)} | LOD: {debugInfo.currentLOD} | {debugInfo.quality}
            </div>
          </div>
        )}
      </div>
    )
  }
)

DebugInfoComponent.displayName = 'DebugInfo'
