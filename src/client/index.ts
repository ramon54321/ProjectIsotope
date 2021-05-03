import { NetClient } from '../shared/engine/networking'
import { NetworkState } from '../shared/game/network-state'
import { deserialize } from '../shared/engine/serialization'
import { replaceObject } from '../shared/engine/utils'
import { Graphics } from './drawing'
import { Actions } from './actions'
import EventEmitter from 'events'
import { GameOptions } from './game-options'

const gameOptions = new GameOptions()
const events = new EventEmitter()
const network = new NetClient('localhost', 8081)
const networkState = new NetworkState('READER')
const actions = new Actions(network)
const graphics = new Graphics(networkState, actions, events, gameOptions)
network.open()

network.on('deltaState', payload => {
  graphics.beforeTick()
  payload.actions.forEach((action: any) => networkState.applyAction(action))
  graphics.afterTick()
  events.emit('state')
  events.emit('state-deltaState')
})
network.on('fullState', payload => {
  graphics.beforeTick()
  replaceObject(networkState, deserialize(payload.state))
  networkState.update()
  graphics.afterTick()
  events.emit('state')
  events.emit('state-fullState')
})
