import { NetServer, Connection } from '../shared/engine/networking'
import { NetworkState } from '../shared/game/network-state'
import { serialize } from '../shared/engine/serialization'
import { ServerState } from './game/server-state'
import { Vec2 } from '../shared/engine/math'

const TICK_RATE = 5

const network = new NetServer(8081)
const networkState = new NetworkState('WRITER')
const serverState = new ServerState(networkState)
const actionPayloadQueue: any[] = []
network.open()

network.on('connect', (connection: Connection) => sendFullState(network, connection, networkState))
network.on('action', payload => {
  console.log(payload)
  actionPayloadQueue.push(payload)
})

networkState.setServerTickRate(TICK_RATE)

setInterval(tick, 1000 / networkState.getServerTickRate())

function tick() {
  tickActions(actionPayloadQueue)
  serverState.tick()
  sendDeltaState(network, networkState)
}

function tickActions(actionPayloadQueue: any[]) {
  let actionPayload = actionPayloadQueue.shift()
  while (actionPayload) {
    if (actionPayload.action === 'move') {
      serverState.setEntityMoveTarget(actionPayload.entityId, actionPayload.target)
    } else if (actionPayload.action === 'spawn') {
      serverState.createEntity(new Vec2(actionPayload.position.x, actionPayload.position.y))
    }
    actionPayload = actionPayloadQueue.shift()
  }
}

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
