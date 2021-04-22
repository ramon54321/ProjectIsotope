import { NetClient } from '../shared/engine/networking'
import { NetworkState } from '../shared/game/network-state'
import { deserialize } from '../shared/engine/serialization'
import { replaceObject } from '../shared/engine/utils'

const network = new NetClient('localhost', 8081)
const networkState = new NetworkState('READER')

network.on('deltaState', payload => payload.actions.forEach((action: any) => networkState.applyAction(action)))
network.on('fullState', payload => replaceObject(networkState, deserialize(payload.state)))

network.on('deltaState', payload => console.log(JSON.stringify(networkState, null, 2)))

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
