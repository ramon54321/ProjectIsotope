import { NSItem } from '../../shared/game/network-state'
import { Stats } from '../../shared/game/stats'

export function getItemStats(item: NSItem | undefined): any {
  if (item === undefined || item.kind === undefined) return
  return (Stats.Items as any)[item.kind]
}

export function lerp(v0: number, v1: number, t: number): number {
  return v0 + t * (v1 - v0)
}

export function inverseLerp(v0: number, v1: number, t: number): number {
  return (t - v0) / (v1 - v0)
}

export function clamp(min: number, max: number, t: number): number {
  return Math.max(min, Math.min(max, t))
}
