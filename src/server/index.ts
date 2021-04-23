import { NetServer, Connection } from '../shared/engine/networking'
import { NetworkState } from '../shared/game/network-state'
import { serialize } from '../shared/engine/serialization'
import { Vec2 } from '../shared/engine/math'

const network = new NetServer(8081)
const networkState = new NetworkState('WRITER')

network.on('connect', (connection: Connection) => sendFullState(network, connection, networkState))
network.on('action', action => console.log(action))

setTimeout(() => {
  networkState.setWorldName('Artimes')
}, 2250)

setTimeout(() => {
  networkState.addEntity({
    id: 'alpha',
    kind: 'dummy',
    position: new Vec2(200, 100),
  })
}, 3000)
setTimeout(() => {
  networkState.addEntity({
    id: 'bravo',
    kind: 'insta',
    position: new Vec2(-200, 100),
  })
}, 6000)
setTimeout(() => {
  networkState.removeEntity('alpha')
}, 12000)

const target = new Vec2(0, 0)
const setRandomTarget = () => {
  target.x = -300 + Math.random() * 600
  target.y = -300 + Math.random() * 600
  setTimeout(setRandomTarget, 8 + Math.random() * 6000)
}
setTimeout(setRandomTarget, 1000)

setInterval(() => {
  const e = networkState.getEntity('bravo')
  if (e) {
    const direction = e.position.directionTo(target)
    networkState.moveEntity('bravo', direction.x * 15, direction.y * 15)
  }
  sendDeltaState(network, networkState)
}, 200)

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
