import { NSEntity } from '../../shared/game/network-state'
import { Stats } from '../../shared/game/stats'

export function getEntityDetails(entity: NSEntity | undefined): string {
  if (entity === undefined) return ''
  return `${entity.components.get('Identity').displayName}\nSpeed: ${(Stats.Entities as any)[entity.kind]?.speed}`
}
