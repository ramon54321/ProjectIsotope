import { NetworkState, NSEntity } from '../../shared/game/network-state'
import { Stats } from '../../shared/game/stats'

type DisplayListItem = {
  name?: string
  value: string
}
export function getEntityDetails(networkState: NetworkState, entity: NSEntity | undefined): string {
  if (entity === undefined) return ''
  const displayName = entity.components.get('Identity')?.displayName
  const speed = (Stats.Entities as any)[entity.kind]?.speed
  const inventory = entity.components
    .get('Inventory')
    ?.items.map((id: string) => {
      const itemKind = networkState.getItem(id)?.kind
      if (itemKind === undefined) return 'unknown'
      return (Stats.Items as any)[itemKind]?.displayName || 'unknown'
    })
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
    .map(item => `${item.name ? item.name + ':\n' : ''}${item.value}\n`)
    .join('\n')
}
