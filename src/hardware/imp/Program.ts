/*
  Program.ts
  Info: Program representation and execution interface
  Description: The Program class defines the structure for executable programs, including bytecode, expected register values, and execution state.

  Program Interface Members:
    name: Program Name - Display name of the program
    code: Program Code - Array of bytes representing the program
    expectedRegisters?: Expected Registers - Optional expected register values after execution used for test programs
      a: A Register - Expected value of the accumulator
      x: X Register - Expected value of the X register
      y: Y Register - Expected value of the Y register
      z: Z Flag - Expected state of the zero flag
      c: C Flag - Expected state of the carry flag
*/
export interface Program {
    name: string;
    code: number[];
    expectedRegisters?: {
        a: number;
        x: number;
        y: number;
        z: boolean;
        c: boolean;
    };
}