import { NetServer, Connection } from '../shared/engine/networking'
import { NetworkState } from '../shared/game/network-state'
import { serialize } from '../shared/engine/serialization'
import { ServerState } from './game/server-state'
import { GameLogic } from './game/game-logic'
import { Vec2 } from '../shared/engine/math'
import gen from 'random-seed'

const R = gen.create('12345')

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

spawnWorld()
function spawnWorld() {
  for (let i = 0; i < 40000; i++) {
    const position = new Vec2(R.random() * 10000 - 5000, R.random() * 10000 - 5000)
    serverState.createFixture('PATCH_L_0', position, R.random() * 2 * Math.PI, (0.75 + R.random() / 2) * 0.64)
  }
}

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
