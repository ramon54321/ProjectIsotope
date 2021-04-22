import { NetServer, Connection } from '../shared/engine/networking'
import { NetworkState } from '../shared/game/network-state'
import { serialize } from '../shared/engine/serialization'

const network = new NetServer(8081)
const networkState = new NetworkState('WRITER')

network.on('connect', (connection: Connection) => sendFullState(network, connection, networkState))
network.on('action', action => console.log(action))

setTimeout(() => {
  networkState.setWorldName('Artimes')
}, 4250)

setTimeout(() => {
  networkState.addEntity({
    id: 'alpha',
    position: {
      x: 200,
      y: 100,
    },
  })
}, 5000)
setTimeout(() => {
  networkState.addEntity({
    id: 'bravo',
    position: {
      x: -200,
      y: 100,
    },
  })
}, 8000)
setTimeout(() => {
  networkState.removeEntity('alpha')
}, 12000)

setInterval(() => {
  networkState.moveEntity('bravo', 25, 0)
  sendDeltaState(network, networkState)
}, 1000)

function sendFullState(network: NetServer, connection: Connection, state: any) {
  const message = {
    tag: 'fullState',
    payload: {
      state: serialize(state),
    },
  }
  network.emitOnClient(connection, message)
}

function sendDeltaState(network: NetServer, state: any) {
  const message = {
    tag: 'deltaState',
    payload: {
      actions: state.popActions(),
    },
  }
  network.emitOnAllClients(message)
}
