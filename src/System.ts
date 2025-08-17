import { Cpu } from "./hardware/Cpu";
import { Memory } from "./hardware/Memory";
import { Hardware } from "./hardware/Hardware";
import { Clock } from "./hardware/Clock";
import { MMU } from "./hardware/MMU";
import { InterruptController } from "./hardware/InterruptController";
import { Keyboard } from "./hardware/Keyboard";
import { ProgramMenu } from "./lib/ProgramMenu";
import { Program } from "./hardware/imp/Program";

/*
  System.ts
  Info: Core system class that manages hardware components and program execution
  Description: The System class serves as the central coordinator for all hardware components, managing program execution, interrupts, and user interaction through a menu-driven interface.

  System Class Members:
    _CPU: CPU Reference Object - For interfacing with our CPU object
    _MEMORY: MEMORY Reference Object - For interfacing with our MEMORY object
    _CLOCK: CLOCK Reference Object - For interfacing with our CLOCK object
    _MMU: MMU Reference Object - For interfacing with our MMU object

  System Class Methods:
    create
    updateAllHardwareTicks
    startSystem
    stopSystem
    handleProgramCompletion
    runProgramMenu

  Constants:
    CLOCK_INTERVAL: Clock cycle interval - This is in ms (milliseconds) so 1000 = 1 second, 100 = 1/10 second
    system: System Objects - Initializes the instance of system
*/

const CLOCK_INTERVAL = .5;

export class System extends Hardware {
  private _CPU: Cpu;
  private _MEMORY: Memory;
  private _CLOCK: Clock;
  private _MMU: MMU;
  private _INTERRUPTCONTROLLER : InterruptController;
  private _KEYBOARD: Keyboard;
  private hardwareComponents: Hardware[] = [];
  public  running: boolean;
  private programMenu: ProgramMenu;
  private currentProgram: Program | null = null;
  private programOutput: string = '';

  private constructor(debugMode: boolean) {
    super("0", "SYS", debugMode);

    this._MEMORY = new Memory(debugMode);
    this._MMU = new MMU(this._MEMORY, debugMode);
    this._CPU = new Cpu(this._MMU, this, debugMode);
    this._CLOCK = new Clock(CLOCK_INTERVAL, debugMode);
    this._INTERRUPTCONTROLLER = new InterruptController(this._CPU, debugMode);
    this._KEYBOARD = new Keyboard(this._INTERRUPTCONTROLLER, debugMode);
    this.running = false;
    this._KEYBOARD.setSilentMode(true);
    this.programMenu = new ProgramMenu(this._CPU, this._INTERRUPTCONTROLLER, debugMode);
    
    // Add all hardware components to the list
    this.hardwareComponents = [
      this._MEMORY,
      this._MMU,
      this._CPU,
      this._INTERRUPTCONTROLLER,
      this._KEYBOARD,
    ];

    // Set the system reference in the clock
    this._CLOCK.setSystem(this);
    
    /*
        Start the system (Analogous to pressing the power button and having voltages flow through the components)
        When power is applied to the system clock, it begins sending pulses to all clock observing hardware
        components so they can act on each clock cycle.
    */
    this.startSystem();
  }

  public static create(): Promise<System> {
    // Set up stdin to wait for input
    process.stdin.setRawMode(true);
    process.stdin.resume();
    
    // Simple console I/O for debug mode
    process.stdout.write("Enter Debug Mode? Enter '1': \n" );
    
    return new Promise((resolve) => {
      process.stdin.once('data', (data) => {
        const debugMode = data.toString().trim() === "1";
        
        // Ask about carry flag usage
        process.stdout.write("Use carry flag in ADC operations? Enter '1' for yes: \n");
        process.stdin.once('data', (carryData) => {
          const useCarry = carryData.toString().trim() === "1";
          
          process.stdin.setRawMode(false);
          process.stdin.pause();
          const system = new System(debugMode);
          system._CPU.setUseCarry(useCarry);
          resolve(system);
        });
      });
    });
  }

  public updateAllHardwareTicks(): void {
    // First increment the system's own tick
    this.incrementTick();
    
    // Then update all hardware components' ticks
    this.hardwareComponents.forEach(component => {
      component.incrementTick();
    });
  }

  public startSystem(): boolean {
    try {
      this._MEMORY.log(`Created - Addressable Space: ${this._MEMORY.getAddressableSpace()}`);
      this._MMU.log("Created");
      this._CPU.log("Created");
      this._CLOCK.log("Created");
      this._INTERRUPTCONTROLLER.log("Created");
      this._KEYBOARD.log("Created");
      this.log("Created");

      // Initialize Memory
      try {
        this._MEMORY.init();
        this._MEMORY.log("Memory Initialized");
      } catch {
        this._MEMORY.log("Memory Failed to Initialize");
        return false;
      }

      // Register clock listeners
      this._CLOCK.registerListener(this._CPU)
        ? this._CLOCK.log("Registered Clock Listener: CPU")
        : this._CLOCK.log("Failed to Register Clock Listener: CPU");
      this._CLOCK.registerListener(this._MEMORY)
        ? this._CLOCK.log("Registered Clock Listener: MEMORY")
        : this._CLOCK.log("Failed to Register Clock Listener: MEMORY");
      this._CLOCK.registerListener(this._INTERRUPTCONTROLLER)
        ? this._CLOCK.log("Registered Clock Listener: INTERRUPTCONTROLLER")
        : this._CLOCK.log("Failed to Register Clock Listener: INTERRUPTCONTROLLER");

      this.running = true;
      this.runProgramMenu();

      return true;
    } catch {
      this.log("System Failed to Initialize");
      return false;
    }
  }

  public stopSystem() {
    if (this.running) {
      this.log("Stopping system...");
      this.running = false;  // Set running to false first
      this._CLOCK.stopClock();  // Then stop the clock
      this._KEYBOARD.setSilentMode(true);
      this.log("System stopped");

      if (this.currentProgram) {
        this.handleProgramCompletion();
        this.currentProgram = null;  // Clear current program
        }
    }
  }

  public appendProgramOutput(output: string): void {
    this.programOutput += output;
  }

  public handleProgramCompletion(): void {
    if (this.currentProgram) {
      const actualRegisters = {
        a: this._CPU.getARegister(),
        x: this._CPU.getXRegister(),
        y: this._CPU.getYRegister(),
        z: this._CPU.getZFlag(),
        c: this._CPU.getCFlag()
      };

      const passed = this.programMenu.validateProgramResults(this.currentProgram, actualRegisters);
      console.log("\nProgram Results:");
      if (this.programOutput) {
        console.log("Program Output:", this.programOutput);
      }
      console.log(`Program: ${this.currentProgram.name}`);
      console.log(`Status: ${passed ? "PASSED" : "FAILED"}`);
      if (this.currentProgram.expectedRegisters) {
        console.log("Expected Registers:", this.currentProgram.expectedRegisters);
        console.log("Actual Registers:", actualRegisters);
      }
      this.programOutput = ''; // Clear output for next run
    }
    
    // Ensure proper cleanup before starting next program
    this._KEYBOARD.setSilentMode(true);  // Disable keyboard input
    this._INTERRUPTCONTROLLER.clearInterrupts();  // Clear any pending interrupts
    this.running = false;  // Set running to false
    
    // Wait a moment to ensure all state is cleared
    setTimeout(() => {
      this.runProgramMenu();
    }, 100);
  }

  private runProgramMenu(): void {
    this.programMenu.displayMenu();
    let isAddingProgram = false;
    
    this._KEYBOARD.onKeyPress((key: string) => {
      this.log(`Key pressed in menu: '${key}'`);
      
      // If we're in the middle of adding a program, ignore this key press
      if (isAddingProgram) {
        return;  // Just return without logging
      }

      if (key.toLowerCase() === 'a') {
        this.log("Starting program addition process");
        isAddingProgram = true;
        this._KEYBOARD.setSilentMode(true);  // Mute keyboard during program addition
        this._KEYBOARD.setDebug(false);  // Disable keyboard debug logging
        this._INTERRUPTCONTROLLER.setDebug(false);  // Disable interrupt controller debug logging
        this.setDebug(false);  // Disable system debug logging
        this.programMenu.addCustomProgram(() => {
          isAddingProgram = false;
          this._KEYBOARD.setSilentMode(false);  // Unmute keyboard after program addition
          this._KEYBOARD.setDebug(true);  // Re-enable keyboard debug logging
          this._INTERRUPTCONTROLLER.setDebug(true);  // Re-enable interrupt controller debug logging
          this.setDebug(true);  // Re-enable system debug logging
          this.programMenu.displayMenu();
        });
        return;
      }

      const selection = parseInt(key);
      if (isNaN(selection)) {
        this.log(`Invalid selection: '${key}'`);
        return;
      }

      if (selection === 0) {
        this.log("Exiting program");
        process.exit(0);
      }

      this.log(`Selected program ${selection}`);
      
      // Reset System state before loading new program
      this.log("Resetting system state...");
      this._CPU.reset();
      this._MMU.reset();
      this._MEMORY.reset();
      this._INTERRUPTCONTROLLER.reset();
      this._KEYBOARD.setSilentMode(true);  // Disable keyboard input during reset
      this.log("System state reset complete");

      // Load the new program - selection is already 1-indexed
      this.log(`Loading program ${selection}...`);
      this.currentProgram = this.programMenu.loadProgram(selection);
      if (this.currentProgram) {
        this.log(`Successfully loaded program: ${this.currentProgram.name}`);
        console.log(`\nRunning Program: ${this.currentProgram.name}`);
        console.log("Press 'q' to stop the program and display output");
        
        // Clear any pending interrupts before starting the program
        this._INTERRUPTCONTROLLER.clearInterrupts();
        
        // Start the program execution
        this.log("Starting program execution...");
        this.running = true;
        this._CLOCK.startClock();
        
        // Re-enable keyboard input after everything is set up
        this._KEYBOARD.setSilentMode(false);
      } else {
        this.log(`Failed to load program ${selection}`);
        console.log("\nInvalid program selection. Please try again.");
        this.programMenu.displayMenu();
      }
    });
  }
}

const system = System.create();