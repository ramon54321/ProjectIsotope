import { NetServer, Connection } from '../shared/engine/networking'
import { NetworkState } from '../shared/game/network-state'
import { serialize } from '../shared/engine/serialization'
import { ServerState } from './game/server-state'
import { GameLogic } from './game/game-logic'
import { Vec2 } from '../shared/engine/math'
import gen from 'random-seed'

const R = gen.create('12345')

setInterval(() => {
  const used = process.memoryUsage().heapUsed / 1024 / 1024
  const total = process.memoryUsage().heapTotal / 1024 / 1024
  console.log(`Heap: ${used.toFixed(1)}/${total.toFixed(1)} MB`)
}, 5000)

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
  for (let i = 0; i < 100; i++) {
    const position = new Vec2(R.random() * 10000 - 5000, R.random() * 10000 - 5000)
    serverState.createFixture('PATCH_L_0', position, R.random() * 2 * Math.PI, (0.75 + R.random() / 2) * 32)
  }
  for (let i = 0; i < 100000; i++) {
    const position = new Vec2(R.random() * 10000 - 5000, R.random() * 10000 - 5000)
    serverState.createFixture('GRASS_S_0', position, 0, 0.75 + R.random() / 2)
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

function sendFullState(network: NetServer, connection: Connection, state: NetworkState) {
  const _state = Object.assign({}, state, { fixtures: undefined })
  const message = {
    tag: 'fullState',
    payload: {
      state: serialize(_state),
    },
  }
  network.emitOnClient(connection, message)
  const fixtures = state.getFixtures()
  const chunkSize = 1000
  for (let i = 0; i < fixtures.length; i += chunkSize) {
    const chunk = fixtures.slice(i, i + chunkSize)
    const actions = chunk.map(fixture => ['createFixture', fixture.id, fixture.kind, fixture.position, fixture.rotation, fixture.scale])
    const messageDeltaChunk = {
      tag: 'deltaState',
      payload: {
        actions: actions,
      },
    }
    network.emitOnClient(connection, messageDeltaChunk)
  }
}

function sendDeltaState(network: NetServer, state: NetworkState) {
  const actions = state.popActions()
  const message = {
    tag: 'deltaState',
    payload: {
      actions: actions,
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
