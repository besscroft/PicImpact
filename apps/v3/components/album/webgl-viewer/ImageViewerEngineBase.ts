/**
 * Image Viewer Engine Base Class
 *
 * @reference https://github.com/Afilmory/afilmory
 * @source packages/webgl-viewer/src/ImageViewerEngineBase.ts
 * @license MIT
 * @author Afilmory Team
 */

export abstract class ImageViewerEngineBase {
  public abstract getScale(): number
  public abstract zoomAt(x: number, y: number, scale: number, animated?: boolean): void
  public abstract loadImage(url: string, preknownWidth?: number, preknownHeight?: number): Promise<void>
  public abstract destroy(): void
}
