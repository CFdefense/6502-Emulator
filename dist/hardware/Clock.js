"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Clock = void 0;
const Hardware_1 = require("./Hardware");
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
class Clock extends Hardware_1.Hardware {
    constructor(interval, debugMode) {
        super("0", "CLK", debugMode, 0);
        this.listeners = [];
        this.interval = null;
        this.isRunning = false;
        this.system = null;
        this.intervalTime = interval;
    }
    setSystem(system) {
        this.system = system;
    }
    registerListener(listener) {
        if (!this.listeners.includes(listener)) {
            this.listeners.push(listener);
            return true;
        }
        return false;
    }
    startClock() {
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
    stopClock() {
        this.isRunning = false;
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
        this.log("Clock stopped");
    }
    pulse() {
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
    addListener(listener) {
        this.listeners.push(listener);
    }
    reset() {
        super.reset();
        this.log("Clock reset");
    }
}
exports.Clock = Clock;
//# sourceMappingURL=Clock.js.map