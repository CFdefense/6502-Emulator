import { Hardware } from "./Hardware";
import { ClockListener } from "./imp/ClockListener";
import { MMU } from "./MMU";
import { Instruction, InstructionSet } from "../lib/Instructions";
import { Interrupt } from "./imp/Interrupt";
import { decodeAscii, encodeAscii } from "../lib/Ascii";
import { System } from "../System";

/*
  Cpu.ts
  Info: Central Processing Unit implementation with pipeline architecture
  Description: The Cpu class implements a pipelined processor with fetch, decode, execute, writeback, and interrupt checks.

  Cpu Class Members:
    MMU: Memory Management Unit - Interface for memory access and program loading
    aRegister: Accumulator Register - Primary register for arithmetic and logic operations
    xRegister: X Register - General purpose register for indexing and temporary storage
    yRegister: Y Register - General purpose register for indexing and temporary storage
    zRegister: Zero Flag - Indicates if the last operation resulted in zero
    cRegister: Carry Flag - Indicates if the last operation resulted in a carry
    pcRegister: Program Counter - Tracks the current instruction address
    iRegister: Instruction Register - Holds the current instruction being executed
    opcode: Current Opcode - The operation code of the current instruction
    operand: Current Operand - The data bytes for the current instruction
    step: Pipeline Step - Current stage in the instruction pipeline
    currentCyclePulseCount: Cycle Counter - Tracks cycles within the current instruction
    fetchCount: Fetch Counter - Number of bytes to fetch for current instruction
    currentFetch: Current Fetch - Tracks progress through multi-byte fetches
    executeFunction: Execute Function - Function to execute for current instruction
    writeFlag: Write Flag - Indicates if a write operation is pending
    writeAddress: Write Address - Memory address for pending write operation
    pendingInterrupt: Pending Interrupt - Currently queued interrupt to process
    system: System Reference - Reference to the parent system
    outputBuffer: Output Buffer - Temporary storage for program output
    useCarry: Use Carry Flag - Controls whether ADC uses the carry flag

  Cpu Class Methods:
    handleFetch: Manages the instruction fetch stage of the pipeline
    setupDecode: Prepares the decode stage with instruction details
    loadCaseHelper: Helper for load-type instructions
    setInterrupt: Processes incoming hardware interrupts
    pulse: Executes one clock cycle of the CPU
    reset: Resets all CPU state to initial values
    LDA: Load Accumulator instruction
    STA: Store Accumulator instruction
    TXA: Transfer X to Accumulator instruction
    TYA: Transfer Y to Accumulator instruction
    ADC: Add with Carry instruction
    LDX: Load X Register instruction
    TAX: Transfer Accumulator to X instruction
    LDY: Load Y Register instruction
    TAY: Transfer Accumulator to Y instruction
    NOP: No Operation instruction
    BRK: Break instruction
    CPX: Compare X Register instruction
    BNE: Branch if Not Equal instruction
    INC: Increment Memory instruction
    SYS: System Call instruction
    getARegister: Returns the current value of the A register
    getXRegister: Returns the current value of the X register
    getYRegister: Returns the current value of the Y register
    getZFlag: Returns the current state of the Z flag
    getCFlag: Returns the current state of the C flag
    setUseCarry: Sets whether ADC should use the carry flag

  PipelineStep Enum:
    None: No active pipeline stage
    Fetch: Instruction fetch stage
    Decode: Instruction decode stage
    Execute: Instruction execution stage
    Writeback: Memory writeback stage
    InterruptCheck: Interrupt processing stage
*/

enum PipelineStep {
  None,
  Fetch,
  Decode,
  Execute,
  Writeback,
  InterruptCheck,
}

export class Cpu extends Hardware implements ClockListener {
  private MMU: MMU;
  private aRegister: number = 0x00; 
  private xRegister: number = 0x00;
  private yRegister: number = 0x00;
  private zRegister: boolean = false;
  private cRegister: boolean = false;
  private pcRegister: number = 0x0000;
  private iRegister: Instruction = Instruction.NAN;
  private opcode: number = 0x00;
  private operand: number[] = [0x00, 0x00];
  private step: PipelineStep = PipelineStep.Fetch;
  private currentCyclePulseCount: number = 0;
  private fetchCount: number = 0; 
  private currentFetch: number = 0;
  private executeFunction: () => boolean = null;
  private writeFlag: boolean = false;
  private writeAddress: number = null;
  private writeValue: number = null;
  private pendingInterrupt: Interrupt = null;
  private system: System;
  private outputBuffer: string = '';
  private useCarry: boolean = false;

  constructor(mmu: MMU, system: System, debugMode: boolean) {
    super("0", "CPU", debugMode, 0);
    this.MMU = mmu;
    this.system = system;
  }

  private handleAdditionalFetches(): void {
    try {
      this.currentCyclePulseCount++;

      if (this.currentCyclePulseCount === 1) {
        // First pulse: Setup memory read
        this.log(`Fetch ${this.currentFetch + 1}/${this.fetchCount}: Setting up memory read at ${this.hexLog(this.pcRegister, 4)}`);
        this.MMU.triggerRead(this.pcRegister);
      } else if (this.currentCyclePulseCount === 2) {
        // Second pulse: Read complete
        const value = this.MMU.getMDR();
        this.log(`Fetch ${this.currentFetch + 1}/${this.fetchCount}: Read complete, got value ${this.hexLog(value, 2)}`);

        // Store the fetched value in operand array
        this.operand[this.currentFetch] = value;
        this.pcRegister++;
        this.currentFetch++;
        this.currentCyclePulseCount = 0;

        // If we've completed all fetches, continue to execute
        if (this.currentFetch >= this.fetchCount) {
          this.fetchCount = 0;
          this.currentFetch = 0;
        }
      }
    } catch (error) {
      this.log(`Fetch Error: ${error.message}`);
      throw error;
    }
  }

  private setupDecode(numOperands: number, currentInstruction: Instruction, nextExecute: () => boolean): void {
    this.fetchCount = numOperands; // Set flag for fetching additional bytes from memory
    this.iRegister = currentInstruction; // Set the instruction register
    this.executeFunction = nextExecute; // Set function to be executed in execute step
  }

  private loadCaseHelper(immCaseOpcode: number, get: () => number, set: (value: number) => void) {
    try {
      if (this.opcode === immCaseOpcode) {
        // Immediate mode - directly use the operand value
        this.log(`Load: Immediate mode, setting value to ${this.hexLog(this.operand[0], 2)}`);
        set(this.operand[0]);
        return false;
      } else {
        // Memory mode
        if (this.currentCyclePulseCount === 1) {
          // Form address from operands (low byte, high byte)
          const address = (this.operand[1] << 8) | this.operand[0];
          this.log(`Load: Reading from memory address ${this.hexLog(address, 4)}`);
          this.MMU.triggerRead(address);
          return true;
        } else if (this.currentCyclePulseCount === 2) {
          const value = this.MMU.getMDR();
          this.log(`Load: Read value ${this.hexLog(value, 2)} from memory`);
          set(value);
          return false;
        }
        return true;
      }
    } catch (error) {
      this.log(`Load Error: ${error.message}`);
      throw error;
    }
  }

  public setInterrupt(interrupt: Interrupt) {
    if(interrupt) {
      this.log(`Received interrupt from ${interrupt.deviceName} with data: ${interrupt.data}`);
      this.pendingInterrupt = interrupt;
    }
  }

  public pulse(): void {
    try {
      // First check if system is still running
      if (!this.system.running) {
        return;  // Skip this pulse if system is not running
      }

      // Then check if program is still loading
      if (this.MMU.isProgramLoading()) {
        this.log("Waiting for program to finish loading...");
        return;  // Skip this pulse if program is still loading
      }

      // Handle any pending fetches first
      if (this.fetchCount > 0) {
        this.handleAdditionalFetches();
        return;
      }

      // Increment this counter to handle multi-pulse events
      this.currentCyclePulseCount++;
      
      switch(this.step) {
        case PipelineStep.Fetch:
          if (this.currentCyclePulseCount === 1) {
            this.log("Fetch: Setting up memory read");
            this.MMU.triggerRead(this.pcRegister);
          } else if (this.currentCyclePulseCount === 2) {
            this.log(`Fetch: Read complete, got opcode ${this.hexLog(this.MMU.getMDR(), 2)}`);
            this.opcode = this.MMU.getMDR();
            this.pcRegister++;
            
            this.currentCyclePulseCount = 0;
            this.step = PipelineStep.Decode;
          }
          break;

        case PipelineStep.Decode:
          // Use InstructionSet's decodeMapper to set up fetch count and instruction
          const instructionMap = InstructionSet.decodeMapper(this, this.setupDecode.bind(this));
          const decodeFunction = instructionMap[this.opcode];

          if (decodeFunction) {
            decodeFunction();
          } else {
            throw new Error(`Unknown Opcode ${this.hexLog(this.opcode, 2)}`);
          }
          
          this.currentCyclePulseCount = 0;
          this.step = PipelineStep.Execute;
          break;

        case PipelineStep.Execute:
          if (!this.executeFunction) {
            throw new Error("Execute function not set during decode phase");
          }

          // if execution is false were done and reset the cycle and go to next step
          if (!this.executeFunction()) {
            this.currentCyclePulseCount = 0;
            this.step = this.writeAddress && this.writeValue ? PipelineStep.Writeback : PipelineStep.InterruptCheck;
          }
          break;

        case PipelineStep.Writeback:
          this.currentCyclePulseCount = 0;
          if (this.writeAddress != null || this.writeValue != null) {
            this.MMU.writeImmediate(this.writeAddress, this.writeValue)
            this.log(`Wrote back value: ${this.hexLog(this.writeValue, 2)} to address: ${this.hexLog(this.writeAddress, 4)}`)
            this.writeAddress = null;
            this.writeValue = null;
          } else {
            this.log(`Writeback failed with address: ${this.writeAddress} and value: ${this.writeValue}`)
          }
          this.step = PipelineStep.InterruptCheck;
          break;
        case PipelineStep.InterruptCheck:
          // Check for keyboard interrupt (q pressed)
          if (this.pendingInterrupt && this.pendingInterrupt.deviceName === "Keyboard") {
            const key = String.fromCharCode(this.pendingInterrupt.data);
            this.log(`Processing keyboard interrupt with key: '${key}'`);
            if (key.toLowerCase() === 'q') {
              this.log("Quit command received - stopping system");
              this.system.stopSystem();
              this.pendingInterrupt = null;
              return;
            }
          }
          // Handle other interrupts
          if (this.pendingInterrupt) {
            this.log(`Interrupt pending from ${this.pendingInterrupt.deviceName} (IRQ: ${this.pendingInterrupt.irqNumber}, Priority: ${this.pendingInterrupt.priority})`);
          }
          this.pendingInterrupt = null;
          this.currentCyclePulseCount = 0;
          this.step = PipelineStep.Fetch;
          break;
      }

      // Log CPU state at the end of each pulse
      this.log(`CPU | Pulse: ${this.currentCyclePulseCount} | PC: ${this.hexLog(this.pcRegister, 4)} | IR: ${Instruction[this.iRegister]} | Opcode: ${this.hexLog(this.opcode, 2)} | Operand(s): ${this.hexLog(this.operand[0], 2)} ${this.hexLog(this.operand[1], 2)} | A: ${this.hexLog(this.aRegister, 2)} X: ${this.hexLog(this.xRegister, 2)} Y: ${this.hexLog(this.yRegister, 2)} Z: ${this.zRegister} | Step: ${PipelineStep[this.step]} | Output Buffer: ${this.outputBuffer}`);
    } catch (error) {
      this.log(`CPU Error: ${error.message}`);
    }
  }

  public LDA(): boolean {
    this.log(`LDA: Starting execution with opcode ${this.hexLog(this.opcode, 2)}`);
    return this.loadCaseHelper(
      0xA9, // immediate mode opcode
      () => this.aRegister,
      (val: number) => {
        this.log(`LDA: Setting A register to ${this.hexLog(val, 2)}`);
        this.aRegister = val & 0xFF;
      }
    );
  }

  public STA(): boolean {
    try {
      const address = (this.operand[1] << 8) | this.operand[0];
      if (this.currentCyclePulseCount === 1) {
        const valueToStore = this.aRegister;
        this.log(`STA: Storing value ${this.hexLog(valueToStore, 2)} (A register) to memory address ${this.hexLog(address, 4)}`);
        this.MMU.writeImmediate(address, valueToStore);
        return true;
      } else {
        return false;
      }
    } catch (error) {
      this.log(`STA Error: ${error.message}`);
      throw error;
    }
  }

  public TXA(): boolean {
    this.log(`TXA: Transferring X (${this.hexLog(this.xRegister, 2)}) to A`);
    this.aRegister = this.xRegister & 0xFF;
    return false;
  }

  public TYA(): boolean {
    this.log(`TYA: Transferring Y (${this.hexLog(this.yRegister, 2)}) to A`);
    this.aRegister = this.yRegister & 0xFF;
    return false;
  }

  public ADC(): boolean {
    try {
      if (this.currentCyclePulseCount === 1) {
        const address = (this.operand[1] << 8) | this.operand[0];
        this.log(`ADC: Reading value from address ${this.hexLog(address, 4)}`);
        this.MMU.triggerRead(address);
        return true;
      } else if (this.currentCyclePulseCount === 2) {
        const value = this.MMU.getMDR();
        this.log(`ADC: Got value ${this.hexLog(value, 2)} from MDR at cycle ${this.currentCyclePulseCount}`);
        
        // Add A, memory value, and carry flag if enabled
        const sum = this.aRegister + value + (this.useCarry && this.cRegister ? 1 : 0);
        
        // Set carry flag if sum exceeds 255
        this.cRegister = sum > 0xFF;
        
        // Get 8-bit result (this will wrap around)
        const result = sum & 0xFF;
        
        this.log(`ADC: A(${this.hexLog(this.aRegister, 2)}) + M(${this.hexLog(value, 2)}) + C(${this.useCarry && this.cRegister ? 1 : 0}) = ${this.hexLog(result, 2)}`);
        
        // Update A register
        this.aRegister = result;
        
        this.log(`ADC: Updated A register to ${this.hexLog(this.aRegister, 2)}, C=${this.cRegister}, Z=${this.zRegister}`);
        return false;
      }
    } catch (error) {
      this.log(`ADC Error: ${error.message}`);
      throw error;
    }
  }
  
  public LDX(): boolean {
    this.log(`LDX: Starting execution with opcode ${this.hexLog(this.opcode, 2)}`);
    return this.loadCaseHelper(
      0xA2, // immediate mode opcode
      () => this.xRegister,
      (val: number) => {
        this.log(`LDX: Setting X register to ${this.hexLog(val, 2)}`);
        this.xRegister = val & 0xFF;
      }
    );
  }

  public TAX(): boolean {
    this.log(`TAX: Transferring A (${this.hexLog(this.aRegister, 2)}) to X`);
    this.xRegister = this.aRegister & 0xFF;
    return false;
  }

  public LDY(): boolean {
    this.log(`LDY: Starting execution with opcode ${this.hexLog(this.opcode, 2)}`);
    return this.loadCaseHelper(
      0xA0, // immediate mode opcode
      () => this.yRegister,
      (val: number) => {
        this.log(`LDY: Setting Y register to ${this.hexLog(val, 2)}`);
        this.yRegister = val & 0xFF;
      }
    );
  }

  public TAY(): boolean {
    this.log(`TAY: Transferring A (${this.hexLog(this.aRegister, 2)}) to Y`);
    this.yRegister = this.aRegister & 0xFF;
    return false;
  }

  public NOP(): boolean {
    this.log("NOP: No operation");
    return false;
  }

  public BRK(): boolean {
    this.log("BRK: Stopping system");
    this.system.stopSystem();
    return false;
  }

  public CPX(): boolean {
    try {
      if(this.currentCyclePulseCount === 1) {
        const address = (this.operand[1] << 8) | this.operand[0];
        this.log(`CPX: Reading value from address ${this.hexLog(address, 4)} to compare with X(${this.hexLog(this.xRegister, 2)})`);
        this.MMU.triggerRead(address);
        return true;
      } else if (this.currentCyclePulseCount === 2) {
        const value = this.MMU.getMDR();
        const result = (this.xRegister - value) & 0xFF;
        this.log(`CPX: X(${this.hexLog(this.xRegister, 2)}) - M(${this.hexLog(value, 2)}) = ${this.hexLog(result, 2)}`);
        this.zRegister = result === 0;
        this.cRegister = this.xRegister >= value;
        return false;
      }
    } catch (error) {
      this.log(`CPX Error: ${error.message}`);
      throw error;
    }
  }

  public BNE(): boolean {
    this.log(`BNE: Checking Z flag (${this.zRegister})`);
    if(!this.zRegister) {
      const offset = this.operand[0];
      const signedOffset = offset < 0x80 ? offset : offset - 0x100;
      const newPC = (this.pcRegister + signedOffset) & 0xFFFF;
      this.log(`BNE: Branching to PC=${this.hexLog(newPC, 4)} (offset=${signedOffset})`);
      this.pcRegister = newPC;
    } else {
      this.log("BNE: Not branching (Z flag is set)");
    }
    return false;
  }

  public INC(): boolean {
    try {
      const address = (this.operand[1] << 8) | this.operand[0];

      if (this.currentCyclePulseCount === 1) {
        // First read the current value
        this.log(`INC: Reading value from address ${this.hexLog(address, 4)}`);
        this.MMU.triggerRead(address);
        return true;
      } else if (this.currentCyclePulseCount === 2) {
        // Get the value and increment it
        this.writeValue = (this.MMU.getMDR() + 1) & 0xFF;
        this.writeAddress = address;
        this.log(`INC: Flagging write back to change value at ${this.hexLog(address, 4)} from ${this.hexLog(this.MMU.getMDR(), 2)} to ${this.hexLog(this.writeValue, 2)}`);
        return false;
      }
    } catch (error) {
      this.log(`INC Error: ${error.message}`);
      throw error;
    }
  }

  public SYS(): boolean {
    this.log(`SYS: System call with X=${this.hexLog(this.xRegister, 2)}`);
    try {
      if (this.xRegister === 0x01) {
        // Print integer from Y register
        const value = this.yRegister;
        this.log(`SYS: Printing integer ${value} from Y register`);
        this.system.appendProgramOutput(value.toString());
        return false;
      } else if (this.xRegister === 0x02) {
        // Print string starting from address formed by 0x00 (high byte) and Y register (low byte)
        if (this.currentCyclePulseCount === 1) {
          // Form 16-bit address: 0x00 (high byte) and Y register (low byte)
          this.writeAddress = (0x00 << 8) | this.yRegister;
          this.MMU.triggerRead(this.writeAddress);
          this.log(`SYS: Starting string read from address ${this.hexLog(this.writeAddress, 4)}`);
          return true; // Wait for first read to complete
        } else if (this.currentCyclePulseCount >= 2) {
          const currentChar = this.MMU.getMDR();
          this.log(`SYS: Read character ${this.hexLog(currentChar, 2)} from address ${this.hexLog(this.writeAddress, 4)}`);
          if (currentChar !== 0x00) {
            this.system.appendProgramOutput(encodeAscii(currentChar));
            this.writeAddress++;
            this.MMU.triggerRead(this.writeAddress);
            return true; // Continue reading next character
          } else {
            return false; // String complete
          }
        }
      } else if (this.xRegister === 0x03) {
        // Print string from memory address specified by operand
        if (this.currentCyclePulseCount === 1) {
          const address = (this.operand[1] << 8) | this.operand[0];
          this.writeAddress = address;
          this.MMU.triggerRead(this.writeAddress);
          this.log(`SYS: Starting string read from address ${this.hexLog(this.writeAddress, 4)}`);
          return true; // Wait for first read to complete
        } else if (this.currentCyclePulseCount >= 2) {
          const currentChar = this.MMU.getMDR();
          this.log(`SYS: Read character ${this.hexLog(currentChar, 2)} from address ${this.hexLog(this.writeAddress, 4)}`);
          if (currentChar !== 0x00) {
            this.system.appendProgramOutput(encodeAscii(currentChar));
            this.writeAddress++;
            this.MMU.triggerRead(this.writeAddress);
            return true; // Continue reading next character
          } else {
            return false; // String complete
          }
        }
      } else {
        this.log(`SYS: Unknown system call X=${this.hexLog(this.xRegister, 2)}`);
        return false;
      }
    } catch (error) {
      this.log(`SYS Error: ${error.message}`);
      throw error;
    }
  }

  public getARegister(): number {
    return this.aRegister;
  }

  public getXRegister(): number {
    return this.xRegister;
  }

  public getYRegister(): number {
    return this.yRegister;
  }

  public getZFlag(): boolean {
    return this.zRegister;
  }

  public getCFlag(): boolean {
    return this.cRegister;
  }

  public reset(): void {
    this.aRegister = 0x00;
    this.xRegister = 0x00;
    this.yRegister = 0x00;
    this.pcRegister = 0x0000;
    this.outputBuffer = '';
    this.zRegister = false;
    this.cRegister = false;
    this.currentCyclePulseCount = 0;
    this.fetchCount = 0;
    this.currentFetch = 0;
    this.executeFunction = null;
    this.writeFlag = false;
    this.writeAddress = null;
    this.step = PipelineStep.Fetch;
    this.iRegister = Instruction.NAN;
    this.opcode = 0x00;
    this.operand = [0x00, 0x00];
    this.pendingInterrupt = null;
    
    this.log("CPU reset complete");
  }

  public setUseCarry(useCarry: boolean): void {
    this.useCarry = useCarry;
  }
}