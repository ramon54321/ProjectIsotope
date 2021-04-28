import { NSEntity } from '../../shared/game/network-state'
import { Stats } from '../../shared/game/stats'

type DisplayListItem = {
  name?: string
  value: string
}
export function getEntityDetails(entity: NSEntity | undefined): string {
  if (entity === undefined) return ''
  const displayName = entity.components.get('Identity')?.displayName
  const speed = (Stats.Entities as any)[entity.kind]?.speed
  const inventory = entity.components
    .get('Inventory')
    ?.items.map((item: any) => item.id)
    .join('\n\t')
  const list: DisplayListItem[] = [
    {
      value: displayName,
    },
    {
      name: 'Speed',
      value: speed,
    },
    {
      name: 'Inventory',
      value: inventory,
    },
  ]
  return list
    .filter(item => item.value !== undefined)
    .map(item => item.value)
    .join('\n')
}
