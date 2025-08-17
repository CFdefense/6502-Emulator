import { Hardware } from "./Hardware";
import { ClockListener } from "./imp/ClockListener";
import { MMU } from "./MMU";

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
export class Memory extends Hardware implements ClockListener {
  private MEMORY: Uint8Array = new Uint8Array(0x10000); // 65536 in decimal
  private MAR: number = 0x0000;
  private MDR: number = 0x00;
  private isReadPending: boolean = false;
  private isWritePending: boolean =false;
  private mmu: MMU | null = null;

  constructor(debugMode: boolean) {
    super("0", "MEM", debugMode, 0);
  }

  // Pulse Method From Clock Listener
  public pulse(): void {
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
  public init() {
    for (let i = 0x00; i < this.MEMORY.length; i++) {
      this.MEMORY[i] = 0x00;
    }
  }

  // Method to Display Contents in Memory from 0x00 to a Set End Point Inclusive
  public displayMemory(start: number, end: number) {
    // Iterate through each hex in the range and try to index it from memory
    for (let i = start; i <= end; i++) {
      try {
        this.log(
          "Address : " +
            this.hexLog(i, 2) +
            " Contains Value: " +
            "[" +
            this.hexLog(this.MEMORY[i], 2) +
            "]: number " +
            this.MEMORY[i]
        );
        // If it cannot index it from memory -> Error Out -> Maybe Stop System: NOT IMPL
      } catch {
        this.log(
          "Address : " +
            this.hexLog(i, 2) +
            " Contains Value: " +
            "[ERR]: number undefined"
        );
        return;
      }
    }
  }

  public read(): void {
    this.isReadPending = true;
  }

  public write(): void {
    this.isWritePending = true;
  }

  private executeRead(): void {
    // Actual read happens during clock pulse
    this.MDR = this.MEMORY[this.MAR];
    this.log(`Read value ${this.hexLog(this.MDR, 2)} from address ${this.hexLog(this.MAR, 4)}`);
    // Log the actual memory contents for debugging
    this.log(`Memory contents at ${this.hexLog(this.MAR, 4)}: ${this.hexLog(this.MEMORY[this.MAR], 2)}`);
    // Log the full memory state
    this.log(`Memory state - MAR: ${this.hexLog(this.MAR, 4)}, MDR: ${this.hexLog(this.MDR, 2)}, Memory[${this.hexLog(this.MAR, 4)}]: ${this.hexLog(this.MEMORY[this.MAR], 2)}`);
  }

  private executeWrite(): void {
    // Actual write happens during clock pulse
    this.MEMORY[this.MAR] = this.MDR;
    this.log(`Wrote value ${this.hexLog(this.MDR, 2)} to address ${this.hexLog(this.MAR, 4)}`);
    // Verify the write by reading back immediately
    const verifyValue = this.MEMORY[this.MAR];
    this.log(`Verify write: Address ${this.hexLog(this.MAR, 4)} contains ${this.hexLog(verifyValue, 2)}`);
  }

  public getMAR(): number {
    return this.MAR; // Get MAR address
  }
  
  public setMAR(mar: number): void {
    this.MAR = mar; // Set MAR address
  }

  public getMDR(): number {
    return this.MDR; // Get MDR data
  }

  public setMDR(mdr: number): void {  
    this.MDR = mdr; // Set MDR data 
  }

  public getAddressableSpace(): number {
    // Get Total Addressable Space of Memory Array 
    return this.MEMORY.length; 
  }

  public reset(): void {
    this.init(); // Re-initialize the memory
  }

  public setMMU(mmu: MMU): void {
    this.mmu = mmu;
  }

  public hasWritePending(): boolean {
    return this.isWritePending;
  }

  public getMMU(): MMU {
    return this.mmu;
  }
}