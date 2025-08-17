import { Cpu } from "./Cpu";
import { Hardware } from "./Hardware";
import { Interrupt } from "./imp/Interrupt";
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

export class InterruptController extends Hardware {
    private interruptGenerators: Hardware[] = [];
    private waitingInterrupts: Interrupt[] = [];
    private cpu: Cpu;

    constructor(cpu: Cpu, debugMode: boolean) {
        super("0", "INT", debugMode, 0);
        this.cpu = cpu;
    }

    public registerGenerator(newGenerator: Hardware): boolean {
        if (!this.interruptGenerators.includes(newGenerator)) {
            this.interruptGenerators.push(newGenerator);
            return true;
        }
        return false;
    }

    public acceptInterrupt(newInterrupt: Interrupt) {
        this.log(`Accepting interrupt from ${newInterrupt.deviceName} with data: ${newInterrupt.data}`);
        this.waitingInterrupts.push(newInterrupt);
    }
    
    public clearInterrupts(): void {
        this.waitingInterrupts = [];
    }
    
    public pulse() {
        let runningPriority: number = -1;
        let runningInterrupt: Interrupt = null;
        
        if (this.waitingInterrupts.length > 0) {
            this.log(`Processing ${this.waitingInterrupts.length} waiting interrupts`);
        }
        
        this.waitingInterrupts.forEach(interrupt => {
            if(interrupt.priority > runningPriority) {
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