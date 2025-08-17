/*
  Hardware.ts
  Info: Base hardware component implementation
  Description: The Hardware class provides common functionality for all hardware components, including logging, debugging, and tick counting.

  Hardware Class Members:
    id: The Hardware ID Number - Allows for unique dissertation of hardware components
    name: The Hardware Name - Allows for naming of hardware componenets
    debug: Optional Flag - Allows for optional print statements for debugging
    tick: Cycle Tick Counter - Responsible for tracking the current cycle were on

  Hardware Class Methods
    incrementTick
    getTick
    log
    hexLog
    setDebug
    reset
*/
export class Hardware {
  constructor(
    private id: string,
    private name: string,
    private debug: boolean,
    private tick: number = 0  // Initialize tick to 0
  ) {}

  public incrementTick(): void {
    this.tick++;
  }

  public getTick(): number {
    return this.tick;
  }

  public log(message: string): void {
    // Log method to console log a message, the hardware that is sending the message and the time.
    
    if (this.debug == true) {
      let now: Date = new Date();
      console.log(
        `[HW - ${this.name} id: ${
          this.id
        } tick: ${this.tick} - ${now.toLocaleTimeString()}]: ${message}`
      );
    }
  }

  public hexLog(num: number, length: number): string {
    // Method to set a number to hex of a certain length
    return `0x${num.toString(16).padStart(length, "0").toUpperCase()}`;
  }

  public setDebug(state: boolean) {
    this.debug = state; // set debug state 
  }

  public reset(): void {
    this.tick = 0;
    this.log("Hardware reset");
  }
}
