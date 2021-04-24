import { NetServer, Connection } from '../shared/engine/networking'
import { NetworkState } from '../shared/game/network-state'
import { serialize } from '../shared/engine/serialization'
import { Vec2 } from '../shared/engine/math'

const TICK_RATE = 5

const network = new NetServer(8081)
const networkState = new NetworkState('WRITER')
const actionPayloadQueue: any[] = []
network.open()

network.on('connect', (connection: Connection) => sendFullState(network, connection, networkState))
network.on('action', payload => {
  console.log(payload)
  actionPayloadQueue.push(payload)
})

networkState.setServerTickRate(TICK_RATE)

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

const target = new Vec2(0, 0)

setInterval(() => {
  let actionPayload = actionPayloadQueue.shift()
  while (actionPayload) {
    if (actionPayload.action === 'move') {
      const e = networkState.getEntity(actionPayload.entityId)
      if (e) {
        target.x = actionPayload.target.x
        target.y = actionPayload.target.y
      }
    }
    actionPayload = actionPayloadQueue.shift()
  }

  const e = networkState.getEntity('bravo')
  if (e) {
    const difference = e.position.differenceTo(target)
    const magnitude = difference.magnitude()
    const speed = 50
    const tickMovementDistance = speed / networkState.getServerTickRate()
    const movement = magnitude < tickMovementDistance ? difference : difference.normalized().scale(tickMovementDistance)
    networkState.moveEntity(e.id, movement.x, movement.y)
  }
  sendDeltaState(network, networkState)
}, 1000 / networkState.getServerTickRate())

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
