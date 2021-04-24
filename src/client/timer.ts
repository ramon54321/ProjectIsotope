export class Timer {
  private time = Date.now()
  lap() {
    this.time = Date.now()
  }
  getLapTime(): number {
    return Date.now() - this.time
  }
}
