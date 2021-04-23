export class Input {
  private readonly inputDown: any = {}
  private readonly inputOnce: any = {}
  constructor() {
    this.inputDown = {}
    this.inputOnce = {}
    document.addEventListener('keydown', (e: KeyboardEvent) => {
      this.inputDown[e.key] = true
      this.inputOnce[e.key] = true
    })
    document.addEventListener('keyup', (e: KeyboardEvent) => {
      this.inputDown[e.key] = false
    })
    window.addEventListener('mousedown', (e: MouseEvent) => {
      this.inputDown['click'] = true
      this.inputOnce['click'] = true
    })
    window.addEventListener('mouseup', (e: MouseEvent) => {
      this.inputDown['click'] = false
    })
  }
  getInputDown(key: string) {
    return this.inputDown[key]
  }
  getInputOnce(key: string) {
    return this.inputOnce[key]
  }
}
