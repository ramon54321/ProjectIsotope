import { NetServer, Connection } from '../shared/engine/networking'
import { NetworkState } from '../shared/game/network-state'
import { serialize } from '../shared/engine/serialization'
import { ServerState } from './game/server-state'
import { GameLogic } from './game/game-logic'

const TICK_RATE = 5
const TICKS_PER_SLOW_TICK = 5

const network = new NetServer(8081)
const networkState = new NetworkState('WRITER')
const serverState = new ServerState(networkState, (payload: any) => sendClassBInstant(network, payload))
const gameLogic = new GameLogic(serverState)
network.open()

network.on('connect', (connection: Connection) => sendFullState(network, connection, networkState))
network.on('action', payload => {
  console.log(payload)
  gameLogic.pushAction(payload)
})

networkState.setServerTickRate(TICK_RATE)
networkState.setTeams(['Blue', 'Red', 'Yellow'])

setInterval(tick, 1000 / networkState.getServerTickRate())

let tickCount = 0
function tick() {
  tickCount++
  gameLogic.tick()
  if (tickCount % TICKS_PER_SLOW_TICK === 0) {
    gameLogic.tickSlow()
  }
  sendDeltaState(network, networkState)
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

function sendClassBInstant(network: NetServer, payload: any) {
  const message = {
    tag: 'classBInstant',
    payload: payload,
  }
  network.emitOnAllClients(message)
}
