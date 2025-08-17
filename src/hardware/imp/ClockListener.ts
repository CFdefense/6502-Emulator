/*
  ClockListener.ts
  Info: Clock synchronization interface
  Description: The ClockListener interface defines the contract for hardware components that need to respond to clock pulses.

  Methods:
    pulse(): void - Called by the clock on each tick to synchronize hardware components
*/

export interface ClockListener {
  pulse(): void;
}
