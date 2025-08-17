import { Hardware } from "./Hardware";
import { System } from "../System";
import { ClockListener } from "./imp/ClockListener";

/*
  Clock.ts
  Info: System clock implementation
  Description: The Clock class provides timing signals to hardware components, managing the execution cycle and synchronization of the system.

  Clock Class Members:
    listeners: Clock Listeners - Array of components that receive clock pulses
    interval: Clock Interval - Timer reference for clock pulses
    isRunning: Running Flag - Indicates if the clock is currently running
    system: System Reference - Reference to the parent system
    intervalTime: Interval Time - Duration between clock pulses in milliseconds

  Clock Class Methods:
    setSystem: Sets the system reference
    registerListener: Registers a component to receive clock pulses
    startClock: Starts the clock pulse generation
    stopClock: Stops the clock pulse generation
    pulse: Generates a clock pulse and updates all listeners
    addListener: Adds a new clock listener
    reset: Resets the clock to initial state
*/
export class Clock extends Hardware {
  private listeners: ClockListener[] = [];
  private interval: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;
  private system: System | null = null;
  private intervalTime: number;

  constructor(interval: number, debugMode: boolean) {
    super("0", "CLK", debugMode, 0);
    this.intervalTime = interval;
  }

  public setSystem(system: System): void {
    this.system = system;
  }

  public registerListener(listener: ClockListener): boolean {
    if (!this.listeners.includes(listener)) {
      this.listeners.push(listener);
      return true;
    }
    return false;
  }

  public startClock(): void {
    this.isRunning = true;
    if (!this.interval) {
      this.interval = setInterval(() => {
        if (this.isRunning) {
          this.pulse();
        }
      }, this.intervalTime);
    }
    this.log("Clock started");
  }

  public stopClock(): void {
    this.isRunning = false;
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.log("Clock stopped");
  }

  private pulse(): void {
    this.incrementTick();
    this.log(`Clock Pulse at tick ${this.getTick()}`);

    // Update all hardware components' ticks through the system
    if (this.system) {
      this.system.updateAllHardwareTicks();
    }

    // Call pulse on all clock listeners
    this.listeners.forEach(listener => {
      listener.pulse();
    });
  }

  public addListener(listener: ClockListener): void {
    this.listeners.push(listener);
  }

  public reset(): void {
    super.reset();
    this.log("Clock reset");
  }
}
