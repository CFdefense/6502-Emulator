"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Hardware = void 0;
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
class Hardware {
    constructor(id, name, debug, tick = 0 // Initialize tick to 0
    ) {
        this.id = id;
        this.name = name;
        this.debug = debug;
        this.tick = tick;
    }
    incrementTick() {
        this.tick++;
    }
    getTick() {
        return this.tick;
    }
    log(message) {
        // Log method to console log a message, the hardware that is sending the message and the time.
        if (this.debug == true) {
            let now = new Date();
            console.log(`[HW - ${this.name} id: ${this.id} tick: ${this.tick} - ${now.toLocaleTimeString()}]: ${message}`);
        }
    }
    hexLog(num, length) {
        // Method to set a number to hex of a certain length
        return `0x${num.toString(16).padStart(length, "0").toUpperCase()}`;
    }
    setDebug(state) {
        this.debug = state; // set debug state 
    }
    reset() {
        this.tick = 0;
        this.log("Hardware reset");
    }
}
exports.Hardware = Hardware;
//# sourceMappingURL=Hardware.js.map