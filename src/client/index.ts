import { NetClient } from '../shared/engine/networking'
import { NetworkState } from '../shared/game/network-state'
import { deserialize } from '../shared/engine/serialization'
import { replaceObject } from '../shared/engine/utils'
import { Graphics } from './drawing'

const network = new NetClient('localhost', 8081)
const networkState = new NetworkState('READER')
const graphics = new Graphics(networkState)

network.on('deltaState', payload => payload.actions.forEach((action: any) => networkState.applyAction(action)))
network.on('fullState', payload => {
  replaceObject(networkState, deserialize(payload.state))
  networkState.update()
})

setTimeout(() => sendAction(network), 500)

function sendAction(network: NetClient) {
  const message = {
    tag: 'action',
    payload: {
      kind: 'Build',
    },
  }
  network.emitOnServer(message)
}
