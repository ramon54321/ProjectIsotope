import * as WebSocket from 'websocket'
import * as http from 'http'
import { EventEmitter } from 'events'

export class NetClient extends EventEmitter {
  private readonly host: string
  private readonly port: number
  private socket!: WebSocket.client
  private connection?: WebSocket.connection
  constructor(host: string, port: number) {
    super()
    this.host = host
    this.port = port
  }
  open() {
    this.socket = new WebSocket.client()
    this.socket.connect(`ws://${this.host}:${this.port}/`)
    this.socket.on('connect', connection => {
      this.connection = connection
      connection.on('error', reason => console.log(reason))
      connection.on('message', messageJSON => {
        console.log(messageJSON.utf8Data!.length)
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
  private readonly port: number
  private httpServer!: http.Server
  private server!: WebSocket.server
  constructor(port: number) {
    super()
    this.port = port
  }
  open() {
    this.httpServer = http.createServer()
    this.httpServer.listen(this.port)
    this.server = new WebSocket.server({
      httpServer: this.httpServer,
      autoAcceptConnections: true,
    })
    this.server.on('connect', connection => {
      connection.on('error', reason => console.log(reason))
      connection.on('message', messageJSON => {
        const message = JSON.parse(messageJSON.utf8Data!)
        const eventName = `${message.tag}`
        this.emit(eventName, message.payload, connection)
      })
      this.emit('connect', connection)
    })
  }
  emitOnClient(connection: WebSocket.connection, netServerMessage: any) {
    console.log(JSON.stringify(netServerMessage).length)
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
