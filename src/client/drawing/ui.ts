import { NetworkState, NSEntity } from '../../shared/game/network-state'
import { Stats } from '../../shared/game/stats'
import { ClientState } from '../client-state'
import { GameOptions } from '../game-options'

type DisplayListItem = {
  name?: string
  value: string
}

function getArrayDetails(arr: any[]): any {
  if (arr === undefined || !Array.isArray(arr)) return undefined
  if (arr.length > 0) return arr
}

export function getEntityDetails(networkState: NetworkState, entity: NSEntity | undefined): string {
  if (entity === undefined) return ''
  const displayName = entity.components.get('Identity')?.displayName
  const speed = (Stats.Entities as any)[entity.kind]?.speed
  const factory = entity.components.get('Factory')?.orders.map((order: any) => `${order.kind}: ${(order.percent * 100).toFixed(0)}%`)
  const inventory = entity.components.get('Inventory')?.items.map((id: string) => {
    const item = networkState.getItem(id) as any
    if (item === undefined) return 'unknown'
    const itemKind = item.kind
    const label = (Stats.Items as any)[itemKind]?.displayName || 'unknown'
    const quantity = item.quantity
    return `${label}${quantity ? ' x' + quantity : ''}`
  })
  const list: DisplayListItem[] = [
    {
      value: displayName,
    },
    {
      name: 'Speed',
      value: speed,
    },
    {
      name: 'Production',
      value: getArrayDetails(factory)?.join('\n\t'),
    },
    {
      name: 'Inventory',
      value: getArrayDetails(inventory)?.join('\n\t'),
    },
  ]
  return list
    .filter(item => item.value !== undefined)
    .map(item => `${item.name ? item.name + ':\n' : ''}${item.value}\n`)
    .join('\n')
}

export function getGameDetails(
  networkState: NetworkState,
  gameOptions: GameOptions,
  clientState: ClientState,
  selectedEntity?: NSEntity,
): string {
  const tickRate = `Tick Rate: ${networkState.getServerTickRate()}`
  const selectedEntityId = selectedEntity ? `Selected Entity ID: ${selectedEntity.id}` : undefined
  const team = `Team: ${networkState.getTeams()[clientState.getTeam()]}`
  const list = [gameOptions.getIsDevMode() ? tickRate : undefined, gameOptions.getIsDevMode() ? selectedEntityId : undefined, team]
  return list.filter(item => item !== undefined).join('\n')
}
