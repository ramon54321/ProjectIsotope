import * as WebSocket from 'websocket'
import * as http from 'http'
import { EventEmitter } from 'events'

export class NetClient extends EventEmitter {
  private readonly socket: WebSocket.client
  private connection?: WebSocket.connection
  constructor(host: string, port: number) {
    super()
    this.socket = new WebSocket.client()
    this.socket.connect(`ws://${host}:${port}/`)
    this.socket.on('connect', connection => {
      this.connection = connection
      connection.on('message', messageJSON => {
        const message = JSON.parse(messageJSON.utf8Data!)
        const eventName = `${message.tag}`
        this.emit(eventName, message.payload)
      })
    })
  }
  emitOnServer(netClientMessage: any) {
    this.connection?.sendUTF(JSON.stringify(netClientMessage))
  }
  close() {
    this.connection?.close()
  }
}

export class NetServer extends EventEmitter {
  private httpServer: http.Server
  private server: WebSocket.server
  constructor(port: number) {
    super()
    this.httpServer = http.createServer()
    this.httpServer.listen(port)
    this.server = new WebSocket.server({
      httpServer: this.httpServer,
      autoAcceptConnections: true,
    })
    this.server.on('connect', connection => {
      connection.on('message', messageJSON => {
        const message = JSON.parse(messageJSON.utf8Data!)
        const eventName = `${message.tag}`
        this.emit(eventName, message.payload, connection)
      })
      this.emit('connect', connection)
    })
  }
  emitOnClient(connection: WebSocket.connection, netServerMessage: any) {
    connection.sendUTF(JSON.stringify(netServerMessage))
  }
  emitOnAllClients(netServerMessage: any) {
    this.server.broadcastUTF(JSON.stringify(netServerMessage))
  }
  shutDown() {
    this.server.shutDown()
    this.httpServer.close()
  }
}

type Connection = WebSocket.connection

export { Connection }
