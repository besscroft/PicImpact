/**
 * WebGL Image Viewer Constants
 *
 * @reference https://github.com/Afilmory/afilmory
 * @source packages/webgl-viewer/src/constants.ts
 * @license MIT
 * @author Afilmory Team
 */

import type {
  AlignmentAnimationConfig,
  DoubleClickConfig,
  PanningConfig,
  PinchConfig,
  VelocityAnimationConfig,
  WheelConfig,
} from './interface'

/**
 * 默认滚轮配置
 */
export const defaultWheelConfig: WheelConfig = {
  step: 0.1,
  wheelDisabled: false,
  touchPadDisabled: false,
}

/**
 * 默认手势缩放配置
 */
export const defaultPinchConfig: PinchConfig = {
  step: 0.5,
  disabled: false,
}

/**
 * 默认双击配置
 */
export const defaultDoubleClickConfig: DoubleClickConfig = {
  step: 2,
  disabled: false,
  mode: 'toggle',
  animationTime: 200,
}

/**
 * 默认平移配置
 */
export const defaultPanningConfig: PanningConfig = {
  disabled: false,
  velocityDisabled: true,
}

/**
 * 默认对齐动画配置
 */
export const defaultAlignmentAnimation: AlignmentAnimationConfig = {
  sizeX: 0,
  sizeY: 0,
  velocityAlignmentTime: 0.2,
}

/**
 * 默认速度动画配置
 */
export const defaultVelocityAnimation: VelocityAnimationConfig = {
  sensitivity: 1,
  animationTime: 0.2,
}
