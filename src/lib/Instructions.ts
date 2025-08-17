import { Cpu } from "../hardware/Cpu";

/*
  Instructions.ts
  Info: Instruction set definition and implementation
  Description: The Instructions module defines the CPU's instruction set, including opcodes, mnemonics, and execution logic for each instruction.

  Instruction Enum:
    NAN: Not an instruction
    LDA: Load Accumulator
    STA: Store Accumulator
    TXA: Transfer X to Accumulator
    TYA: Transfer Y to Accumulator
    ADC: Add with Carry
    LDX: Load X Register
    TAX: Transfer Accumulator to X
    LDY: Load Y Register
    TAY: Transfer Accumulator to Y
    NOP: No Operation
    BRK: Break
    CPX: Compare X Register
    BNE: Branch if Not Equal
    INC: Increment Memory
    SYS: System Call

  DecodeFunction Type:
    Function type for instruction decode handlers

  InstructionSet Class Methods:
    decodeMapper: Maps opcodes to their decode functions
*/

export enum Instruction {
    NAN,
    LDA,
    STA,
    TXA,
    TYA,
    ADC,
    LDX,
    TAX,
    LDY,
    TAY,
    NOP,
    BRK,
    CPX,
    BNE,
    INC,
    SYS,
}

export type DecodeFunction = () => void;

export class InstructionSet {
    static decodeMapper(cpu: Cpu, setupDecode: (numOperands: number, currentInstruction: Instruction, nextExecute: () => boolean) => void): Record<number, DecodeFunction> {
        return {
            0xA9: () => setupDecode(1, Instruction.LDA, cpu.LDA.bind(cpu)),  // LDA immediate
            0xAD: () => setupDecode(2, Instruction.LDA, cpu.LDA.bind(cpu)),  // LDA absolute
            0x8D: () => setupDecode(2, Instruction.STA, cpu.STA.bind(cpu)),  // STA absolute
            0x8A: () => setupDecode(0, Instruction.TXA, cpu.TXA.bind(cpu)),  // TXA zero-cost
            0x98: () => setupDecode(0, Instruction.TYA, cpu.TYA.bind(cpu)),  // TYA zero-cost
            0x6D: () => setupDecode(2, Instruction.ADC, cpu.ADC.bind(cpu)),  // ADC absolute
            0xA2: () => setupDecode(1, Instruction.LDX, cpu.LDX.bind(cpu)),  // LDX immediate
            0xAE: () => setupDecode(2, Instruction.LDX, cpu.LDX.bind(cpu)),  // LDX absolute
            0xAA: () => setupDecode(0, Instruction.TAX, cpu.TAX.bind(cpu)),  // TAX zero-cost
            0xA0: () => setupDecode(1, Instruction.LDY, cpu.LDY.bind(cpu)),  // LDY immediate
            0xAC: () => setupDecode(2, Instruction.LDY, cpu.LDY.bind(cpu)),  // LDY absolute
            0xA8: () => setupDecode(0, Instruction.TAY, cpu.TAY.bind(cpu)),  // TAY zero-cost
            0xEA: () => setupDecode(0, Instruction.NOP, cpu.NOP.bind(cpu)),  // NOP zero-cost
            0x00: () => setupDecode(0, Instruction.BRK, cpu.BRK.bind(cpu)),  // BRK zero-cost
            0xEC: () => setupDecode(2, Instruction.CPX, cpu.CPX.bind(cpu)),  // CPX absolute
            0xD0: () => setupDecode(1, Instruction.BNE, cpu.BNE.bind(cpu)),  // BNE immediate
            0xEE: () => setupDecode(2, Instruction.INC, cpu.INC.bind(cpu)),  // INC absolute
            0xFF: () => {
                // For SYS, we need to check X register to determine number of operands
                if (cpu.getXRegister() === 0x03) {
                    setupDecode(2, Instruction.SYS, cpu.SYS.bind(cpu));  // Two operands for string print
                } else {
                    setupDecode(0, Instruction.SYS, cpu.SYS.bind(cpu));  // Default to no operands 0x01 or 0x02
                }
            }
        };
    }
}