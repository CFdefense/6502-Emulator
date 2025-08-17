import { Hardware } from "./Hardware";
import { Memory } from "./Memory";

/*
  MMU.ts
  Info: Memory Management Unit implementation
  Description: The MMU class acts as an interface between the CPU and memory, handling memory access, program loading, and memory operations.

  MMU Class Members:
    _MEMORY: Memory Reference - Reference to the system's memory
    _PROGRAM: Program Buffer - Stack of bytes to load into memory
    _LOAD_ADDRESS: Load Address - Starting address for program loading
    _isLoading: Loading Flag - Indicates if a program is currently being loaded

  MMU Class Methods:
    loadProgram: Loads the next byte of a program into memory
    isProgramLoading: Checks if a program is currently being loaded
    memoryDump: Displays memory contents in a specified range
    setLowOrderByte: Sets the low byte of the Memory Address Register
    setHighOrderByte: Sets the high byte of the Memory Address Register
    triggerRead: Initiates a memory read operation
    triggerWrite: Initiates a memory write operation
    writeImmediate: Performs an immediate memory write
    readImmediate: Performs an immediate memory read
    getMDR: Returns the current Memory Data Register value
    setProgram: Sets up a new program for loading
    reset: Resets the MMU to initial state
*/

export class MMU extends Hardware {
    private _MEMORY: Memory;
    private _PROGRAM: number[] = [];  // Stack of bytes to load
    private _LOAD_ADDRESS: number = 0x0000;  // Starting address for program
    private _isLoading: boolean = false;  // Flag to indicate if we're still loading program

    constructor(memoryRef: Memory, debugMode: boolean) {
        super("0", "MMU", debugMode);
        this._MEMORY = memoryRef;
        memoryRef.setMMU(this);  // Set up the MMU reference in Memory
    }

    public loadProgram(): void {
        if (this._PROGRAM.length > 0) {
            const byte = this._PROGRAM.shift()!;  // Get next byte
            this.writeImmediate(this._LOAD_ADDRESS, byte);
            this._LOAD_ADDRESS++;
            this._isLoading = true;
        } else {
            this._isLoading = false;
            this.log("Program loading complete");
            // Dump memory up to some after program length
            this.memoryDump(0x0000, this._LOAD_ADDRESS + 5);
        }
    }

    public isProgramLoading(): boolean {
        return this._isLoading;
    }

    public memoryDump(start: number, end: number): void {
        this.log("Memory Dump: Debug");
        this.log("--------------------------------------");
        this._MEMORY.displayMemory(start, end);
        this.log("--------------------------------------");
        this.log("Memory Dump: Complete");
    }

    public setLowOrderByte(low_byte: number): void {
        // Setting LOB of MAR with a 8 bit address
        this._MEMORY.setMAR((this._MEMORY.getMAR() & 0xFF00) | low_byte);
    }
    
    public setHighOrderByte(high_byte: number): void {
        // Setting HOB of MAR with a 8 bit address
        this._MEMORY.setMAR((this._MEMORY.getMAR() & 0x00FF) | (high_byte << 8));
    }

    public triggerRead(address: number): void {
        this._MEMORY.setMAR(address) // set address to be read from
        this._MEMORY.read(); // Set read flag
    }
    
    public triggerWrite(value: number): void {
        this._MEMORY.setMDR(value); // Set the value to be written
        this._MEMORY.write(); // Set write flag
    }

    public writeImmediate(address: number, value: number): void {
        this._MEMORY.setMAR(address); // Set addres to be written to
        this._MEMORY.setMDR(value); // Set value to write
        this._MEMORY.write(); // Set write flag
    }

    public readImmediate(address: number) {
        this._MEMORY.setMAR(address); // Set address to read
        this._MEMORY.read(); // Set read flag
    }

    public getMDR(): number {
        return this._MEMORY.getMDR();
    }

    public setProgram(program: number[]): void {
        // Reset the MMU first to clear any existing program
        this.reset();
        
        // Set up the new program
        this._PROGRAM = [...program];
        this._LOAD_ADDRESS = 0x0000;
        this._isLoading = true;
        this.loadProgram();
    }

    public reset(): void {
        this._PROGRAM = [];
        this._LOAD_ADDRESS = 0x0000;
        this._isLoading = false;
        this._MEMORY.reset();
        this.log("MMU reset");
    }
}