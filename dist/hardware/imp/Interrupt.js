"use strict";
/*
  Interrupt.ts
  Info: Interrupt interface
  Description: The Interrupt interface defines the structure of an interrupt, including its source, data, and priority.

  Interrupt Interface Members:
    irqNumber: number - The interrupt request number identifying the type of interrupt
    priority: number - Priority level of the interrupt (higher numbers = higher priority)
    deviceName: string - Name of the device that generated the interrupt
    interruptBuffer?: string[] - Optional buffer for storing interrupt-related messages
    outputBuffer?: string[] - Optional buffer for storing output messages
    data?: number - Optional data associated with the interrupt
*/
Object.defineProperty(exports, "__esModule", { value: true });
//# sourceMappingURL=Interrupt.js.map