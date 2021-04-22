import { Serializable } from '../engine/serialization'
import { Pushable, State } from '../engine/sync'

@Serializable()
export class NetworkState extends State {
  private worldName: string = 'Pandora'
  @Pushable()
  setWorldName(value: string) {
    this.worldName = value
  }
}
