"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InterruptController = void 0;
const Hardware_1 = require("./Hardware");
/*
  InterruptController.ts
  Info: Interrupt handling and management implementation
  Description: The InterruptController class manages hardware interrupts, prioritizing and routing them to the appropriate handlers.

  InterruptController Class Members:
    interruptGenerators: Interrupt Generators - List of hardware components that can generate interrupts
    waitingInterrupts: Waiting Interrupts - Queue of pending interrupts
    cpu: CPU Reference - Reference to the CPU for interrupt delivery

  InterruptController Class Methods:
    registerGenerator: Registers a hardware component as an interrupt generator
    acceptInterrupt: Accepts a new interrupt from a hardware component
    clearInterrupts: Clears all pending interrupts
    pulse: Processes pending interrupts on clock pulse
*/
class InterruptController extends Hardware_1.Hardware {
    constructor(cpu, debugMode) {
        super("0", "INT", debugMode, 0);
        this.interruptGenerators = [];
        this.waitingInterrupts = [];
        this.cpu = cpu;
    }
    registerGenerator(newGenerator) {
        if (!this.interruptGenerators.includes(newGenerator)) {
            this.interruptGenerators.push(newGenerator);
            return true;
        }
        return false;
    }
    acceptInterrupt(newInterrupt) {
        this.log(`Accepting interrupt from ${newInterrupt.deviceName} with data: ${newInterrupt.data}`);
        this.waitingInterrupts.push(newInterrupt);
    }
    clearInterrupts() {
        this.waitingInterrupts = [];
    }
    pulse() {
        let runningPriority = -1;
        let runningInterrupt = null;
        if (this.waitingInterrupts.length > 0) {
            this.log(`Processing ${this.waitingInterrupts.length} waiting interrupts`);
        }
        this.waitingInterrupts.forEach(interrupt => {
            if (interrupt.priority > runningPriority) {
                runningInterrupt = interrupt;
                runningPriority = interrupt.priority;
            }
        });
        if (runningInterrupt) {
            this.log(`Sending interrupt to CPU from ${runningInterrupt.deviceName} with data: ${runningInterrupt.data}`);
        }
        this.cpu.setInterrupt(runningInterrupt);
        // Clear processed interrupts
        this.waitingInterrupts = [];
    }
}
exports.InterruptController = InterruptController;
//# sourceMappingURL=InterruptController.js.map