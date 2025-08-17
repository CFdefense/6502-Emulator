"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InstructionSet = exports.Instruction = void 0;
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
var Instruction;
(function (Instruction) {
    Instruction[Instruction["NAN"] = 0] = "NAN";
    Instruction[Instruction["LDA"] = 1] = "LDA";
    Instruction[Instruction["STA"] = 2] = "STA";
    Instruction[Instruction["TXA"] = 3] = "TXA";
    Instruction[Instruction["TYA"] = 4] = "TYA";
    Instruction[Instruction["ADC"] = 5] = "ADC";
    Instruction[Instruction["LDX"] = 6] = "LDX";
    Instruction[Instruction["TAX"] = 7] = "TAX";
    Instruction[Instruction["LDY"] = 8] = "LDY";
    Instruction[Instruction["TAY"] = 9] = "TAY";
    Instruction[Instruction["NOP"] = 10] = "NOP";
    Instruction[Instruction["BRK"] = 11] = "BRK";
    Instruction[Instruction["CPX"] = 12] = "CPX";
    Instruction[Instruction["BNE"] = 13] = "BNE";
    Instruction[Instruction["INC"] = 14] = "INC";
    Instruction[Instruction["SYS"] = 15] = "SYS";
})(Instruction || (exports.Instruction = Instruction = {}));
class InstructionSet {
    static decodeMapper(cpu, setupDecode) {
        return {
            0xA9: () => setupDecode(1, Instruction.LDA, cpu.LDA.bind(cpu)), // LDA immediate
            0xAD: () => setupDecode(2, Instruction.LDA, cpu.LDA.bind(cpu)), // LDA absolute
            0x8D: () => setupDecode(2, Instruction.STA, cpu.STA.bind(cpu)), // STA absolute
            0x8A: () => setupDecode(0, Instruction.TXA, cpu.TXA.bind(cpu)), // TXA zero-cost
            0x98: () => setupDecode(0, Instruction.TYA, cpu.TYA.bind(cpu)), // TYA zero-cost
            0x6D: () => setupDecode(2, Instruction.ADC, cpu.ADC.bind(cpu)), // ADC absolute
            0xA2: () => setupDecode(1, Instruction.LDX, cpu.LDX.bind(cpu)), // LDX immediate
            0xAE: () => setupDecode(2, Instruction.LDX, cpu.LDX.bind(cpu)), // LDX absolute
            0xAA: () => setupDecode(0, Instruction.TAX, cpu.TAX.bind(cpu)), // TAX zero-cost
            0xA0: () => setupDecode(1, Instruction.LDY, cpu.LDY.bind(cpu)), // LDY immediate
            0xAC: () => setupDecode(2, Instruction.LDY, cpu.LDY.bind(cpu)), // LDY absolute
            0xA8: () => setupDecode(0, Instruction.TAY, cpu.TAY.bind(cpu)), // TAY zero-cost
            0xEA: () => setupDecode(0, Instruction.NOP, cpu.NOP.bind(cpu)), // NOP zero-cost
            0x00: () => setupDecode(0, Instruction.BRK, cpu.BRK.bind(cpu)), // BRK zero-cost
            0xEC: () => setupDecode(2, Instruction.CPX, cpu.CPX.bind(cpu)), // CPX absolute
            0xD0: () => setupDecode(1, Instruction.BNE, cpu.BNE.bind(cpu)), // BNE immediate
            0xEE: () => setupDecode(2, Instruction.INC, cpu.INC.bind(cpu)), // INC absolute
            0xFF: () => {
                // For SYS, we need to check X register to determine number of operands
                if (cpu.getXRegister() === 0x03) {
                    setupDecode(2, Instruction.SYS, cpu.SYS.bind(cpu)); // Two operands for string print
                }
                else {
                    setupDecode(0, Instruction.SYS, cpu.SYS.bind(cpu)); // Default to no operands 0x01 or 0x02
                }
            }
        };
    }
}
exports.InstructionSet = InstructionSet;
//# sourceMappingURL=Instructions.js.map