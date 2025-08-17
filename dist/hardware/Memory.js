"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Memory = void 0;
const Hardware_1 = require("./Hardware");
/*
  Memory.ts
  Info: Memory management and storage implementation
  Description: The Memory class provides a byte-addressable memory space with read/write operations and memory state tracking capabilities.

  Memory Class Members:
    MEMORY: Memory Array - Byte-addressable memory space
    MAR: Memory Address Register - Holds the current memory address for operations
    MDR: Memory Data Register - Holds data being read from or written to memory
    isReadPending: Read Pending Flag - Indicates if a read operation is queued
    isWritePending: Write Pending Flag - Indicates if a write operation is queued
    mmu: MMU Reference - Reference to the Memory Management Unit

  Memory Class Methods:
    pulse: Executes pending memory operations on clock pulse
    init: Initializes all memory locations to zero
    displayMemory: Displays memory contents in a specified range
    read: Queues a memory read operation
    write: Queues a memory write operation
    executeRead: Performs the actual memory read operation
    executeWrite: Performs the actual memory write operation
    getMAR: Returns the current Memory Address Register value
    setMAR: Sets the Memory Address Register value
    getMDR: Returns the current Memory Data Register value
    setMDR: Sets the Memory Data Register value
    getAddressableSpace: Returns the total addressable memory space
    reset: Resets memory to initial state
    setMMU: Sets the MMU reference
    hasWritePending: Checks if a write operation is pending
    getMMU: Returns the MMU reference
*/
class Memory extends Hardware_1.Hardware {
    constructor(debugMode) {
        super("0", "MEM", debugMode, 0);
        this.MEMORY = new Uint8Array(0x10000); // 65536 in decimal
        this.MAR = 0x0000;
        this.MDR = 0x00;
        this.isReadPending = false;
        this.isWritePending = false;
        this.mmu = null;
    }
    // Pulse Method From Clock Listener
    pulse() {
        // Execute pending memory operations on clock pulse
        if (this.isWritePending) {
            this.executeWrite();
            this.isWritePending = false;
            // Only trigger program load if MMU is in loading state
            if (this.mmu && this.mmu.isProgramLoading()) {
                this.mmu.loadProgram();
            }
        }
        if (this.isReadPending) {
            this.executeRead();
            this.isReadPending = false;
        }
        // Log MEMORY state at the end of each pulse
        this.log(`MEM | MAR: ${this.hexLog(this.MAR, 4)} | MDR: ${this.hexLog(this.MDR, 2)} | isReadPending?: ${this.isReadPending} | isWritePending?: ${this.isWritePending}`);
    }
    // Initialize Memory With 0x00
    init() {
        for (let i = 0x00; i < this.MEMORY.length; i++) {
            this.MEMORY[i] = 0x00;
        }
    }
    // Method to Display Contents in Memory from 0x00 to a Set End Point Inclusive
    displayMemory(start, end) {
        // Iterate through each hex in the range and try to index it from memory
        for (let i = start; i <= end; i++) {
            try {
                this.log("Address : " +
                    this.hexLog(i, 2) +
                    " Contains Value: " +
                    "[" +
                    this.hexLog(this.MEMORY[i], 2) +
                    "]: number " +
                    this.MEMORY[i]);
                // If it cannot index it from memory -> Error Out -> Maybe Stop System: NOT IMPL
            }
            catch (_a) {
                this.log("Address : " +
                    this.hexLog(i, 2) +
                    " Contains Value: " +
                    "[ERR]: number undefined");
                return;
            }
        }
    }
    read() {
        this.isReadPending = true;
    }
    write() {
        this.isWritePending = true;
    }
    executeRead() {
        // Actual read happens during clock pulse
        this.MDR = this.MEMORY[this.MAR];
        this.log(`Read value ${this.hexLog(this.MDR, 2)} from address ${this.hexLog(this.MAR, 4)}`);
        // Log the actual memory contents for debugging
        this.log(`Memory contents at ${this.hexLog(this.MAR, 4)}: ${this.hexLog(this.MEMORY[this.MAR], 2)}`);
        // Log the full memory state
        this.log(`Memory state - MAR: ${this.hexLog(this.MAR, 4)}, MDR: ${this.hexLog(this.MDR, 2)}, Memory[${this.hexLog(this.MAR, 4)}]: ${this.hexLog(this.MEMORY[this.MAR], 2)}`);
    }
    executeWrite() {
        // Actual write happens during clock pulse
        this.MEMORY[this.MAR] = this.MDR;
        this.log(`Wrote value ${this.hexLog(this.MDR, 2)} to address ${this.hexLog(this.MAR, 4)}`);
        // Verify the write by reading back immediately
        const verifyValue = this.MEMORY[this.MAR];
        this.log(`Verify write: Address ${this.hexLog(this.MAR, 4)} contains ${this.hexLog(verifyValue, 2)}`);
    }
    getMAR() {
        return this.MAR; // Get MAR address
    }
    setMAR(mar) {
        this.MAR = mar; // Set MAR address
    }
    getMDR() {
        return this.MDR; // Get MDR data
    }
    setMDR(mdr) {
        this.MDR = mdr; // Set MDR data 
    }
    getAddressableSpace() {
        // Get Total Addressable Space of Memory Array 
        return this.MEMORY.length;
    }
    reset() {
        this.init(); // Re-initialize the memory
    }
    setMMU(mmu) {
        this.mmu = mmu;
    }
    hasWritePending() {
        return this.isWritePending;
    }
    getMMU() {
        return this.mmu;
    }
}
exports.Memory = Memory;
//# sourceMappingURL=Memory.js.map