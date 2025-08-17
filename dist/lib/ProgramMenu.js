"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProgramMenu = void 0;
const Keyboard_1 = require("../hardware/Keyboard");
/*
  ProgramMenu.ts
  Info: Program selection and management interface
  Description: The ProgramMenu class provides a user interface for selecting and running programs, including built-in and custom programs.

  ProgramMenu Class Members:
    mmu: MMU Reference - Reference to the Memory Management Unit
    keyboard: Keyboard Reference - Reference to the keyboard for input
    programs: Program List - Array of available programs
    cpu: CPU Reference - Reference to the CPU
    interruptController: Interrupt Controller Reference - Reference to the interrupt controller
    debugMode: Debug Mode - Controls whether debug logging is enabled

  ProgramMenu Class Methods:
    displayMenu: Displays the program selection menu
    loadProgram: Loads a selected program into memory
    validateProgramResults: Validates program execution results
    addCustomProgram: Adds a new custom program to the menu

  InputState Enum:
    NAME: Program name input state
    BYTES: Program bytecode input state
    REGISTERS_QUESTION: Register input prompt state
    A_REGISTER: A register value input state
    X_REGISTER: X register value input state
    Y_REGISTER: Y register value input state
    Z_FLAG: Z flag value input state
    C_FLAG: C flag value input state
    COMPLETE: Program addition complete state
*/
var InputState;
(function (InputState) {
    InputState[InputState["NAME"] = 0] = "NAME";
    InputState[InputState["BYTES"] = 1] = "BYTES";
    InputState[InputState["REGISTERS_QUESTION"] = 2] = "REGISTERS_QUESTION";
    InputState[InputState["A_REGISTER"] = 3] = "A_REGISTER";
    InputState[InputState["X_REGISTER"] = 4] = "X_REGISTER";
    InputState[InputState["Y_REGISTER"] = 5] = "Y_REGISTER";
    InputState[InputState["Z_FLAG"] = 6] = "Z_FLAG";
    InputState[InputState["C_FLAG"] = 7] = "C_FLAG";
    InputState[InputState["COMPLETE"] = 8] = "COMPLETE";
})(InputState || (InputState = {}));
class ProgramMenu {
    constructor(cpu, interruptController, debugMode) {
        this.cpu = cpu;
        this.interruptController = interruptController;
        this.debugMode = debugMode;
        this.programs = [
            {
                name: "Basic Arithmetic Program",
                code: [
                    0xA9, 0x05, // LDA #$05
                    0xAA, // TAX
                    0xA9, 0x03, // LDA #$03
                    0x8A, // TXA
                    0x00 // BRK
                ],
                expectedRegisters: {
                    a: 0x05,
                    x: 0x05,
                    y: 0x00,
                    z: false,
                    c: false
                }
            },
            {
                name: "String Output Program",
                code: [
                    0xA2, 0x03, // LDX #$03
                    0xFF, 0x06, 0x00, // SYS $0006 
                    0x00, // BRK
                    0x48, 0x65, 0x6C, 0x6C, 0x6F, 0x21, 0x00 // "Hello!"
                ],
                expectedRegisters: {
                    a: 0x00,
                    x: 0x03,
                    y: 0x00,
                    z: false,
                    c: false
                }
            },
            {
                name: "Powers Program (Requires Carry Flag)",
                code: [
                    0xA9, 0x00, // load constant 0
                    0x8D, 0x40, 0x00, // write acc (0) to 0040
                    0xA9, 0x01, // load constant 1
                    0x6D, 0x40, 0x00, // add acc to mem 0040
                    0x8D, 0x40, 0x00, // write acc to 0040
                    0xAC, 0x40, 0x00, // Load y from memory 0040
                    0xA2, 0x01, // Load x with constant 1 (first system call)
                    0xFF, // make system call to print value in y register
                    0xA2, 0x03, // Load x with constant 3 (second system call)
                    0xFF, // make system call to print string
                    0x50, 0x00, // BVC $00
                    0xD0, 0xED, // BNE $ED (Branch Not Equal)
                    0x00, // BRK
                    // Fill up to address 0x50
                    ...new Array(0x35).fill(0x00),
                    0x2C, 0x20, 0x00, 0x00 // Data at address 0x50-0x53
                ]
            },
            {
                name: "SystemCallProgram",
                code: [
                    0xA9, 0x0A, // LDA #$0A (load 10)
                    0x8D, 0x40, 0x00, // STA $0040 (store at 0x0040)
                    0xAC, 0x40, 0x00, // LDY $0040 (load Y from 0x0040)
                    0xA2, 0x01, // LDX #$01 (set X=1 for integer print)
                    0xFF, // SYS (print integer from Y)
                    0xA2, 0x03, // LDX #$03 (set X=3 for string print)
                    0xFF, // SYS (print string)
                    0x51, 0x00, // BVC $00
                    0x00, // BRK
                    // Fill up to address 0x51
                    ...new Array(0x51 - 0x11).fill(0x00),
                    // "Hello World!\n" string at 0x0051
                    0x48, 0x65, 0x6C, 0x6C, 0x6F, 0x20, 0x57, 0x6F, 0x72, 0x6C, 0x64, 0x21, 0x0A, 0x00
                ],
                expectedRegisters: {
                    a: 0x0A,
                    x: 0x03,
                    y: 0x0A,
                    z: false,
                    c: false
                }
            },
            {
                name: "FizzBuzzProgram (Don't Use Carry Flag)",
                code: [
                    0xEE, 0xF2, 0x00, // INC $00F2
                    0xA9, 0x00, // LDA #$00
                    0x8D, 0xFF, 0x00, // STA $00FF
                    0xA9, 0x7A, // LDA #$7A
                    0x8D, 0xFE, 0x00, // STA $00FE
                    0xA9, 0x7A, // LDA #$7A
                    0x8D, 0xFD, 0x00, // STA $00FD
                    0xA9, 0x75, // LDA #$75
                    0x8D, 0xFC, 0x00, // STA $00FC
                    0xA9, 0x42, // LDA #$42
                    0x8D, 0xFB, 0x00, // STA $00FB
                    0xA9, 0x00, // LDA #$00
                    0x8D, 0xFA, 0x00, // STA $00FA
                    0xA9, 0x7A, // LDA #$7A
                    0x8D, 0xF9, 0x00, // STA $00F9
                    0xA9, 0x7A, // LDA #$7A
                    0x8D, 0xF8, 0x00, // STA $00F8
                    0xA9, 0x69, // LDA #$69
                    0x8D, 0xF7, 0x00, // STA $00F7
                    0xA9, 0x46, // LDA #$46
                    0x8D, 0xF6, 0x00, // STA $00F6
                    0xA9, 0x00, // LDA #$00
                    0x8D, 0xF4, 0x00, // STA $00F4
                    0x8D, 0xF3, 0x00, // STA $00F3
                    0xEE, 0xF5, 0x00, // INC $00F5
                    0xA2, 0x10, // LDX #$10
                    0xEC, 0xF5, 0x00, // CPX $00F5
                    0xD0, 0x07, // BNE $07
                    0xA2, 0x01, // LDX #$01
                    0xEC, 0xF0, 0x00, // CPX $00F0
                    0xD0, 0x2A, // BNE $2A
                    0xAE, 0xF5, 0x00, // LDX $00F5
                    0xEC, 0xF4, 0x00, // CPX $00F4
                    0xD0, 0x07, // BNE $07
                    0xA2, 0x01, // LDX #$01
                    0xEC, 0xF0, 0x00, // CPX $00F0
                    0xD0, 0x2F, // BNE $2F
                    0xAE, 0xF5, 0x00, // LDX $00F5
                    0xEC, 0xF3, 0x00, // CPX $00F3
                    0xD0, 0x15, // BNE $15
                    0xA2, 0x02, // LDX #$02
                    0xA0, 0xF6, 0xFF, // LDY #$FFF6
                    0xA9, 0x00, // LDA #$00
                    0x8D, 0xF2, 0x00, // STA $00F2
                    0xA2, 0x01, // LDX #$01
                    0xEC, 0xF0, 0x00, // CPX $00F0
                    0xD0, 0x16, // BNE $16
                    0xD0, 0xBD, // BNE $BD
                    0xD0, 0x73, // BNE $73
                    0xA9, 0x03, // LDA #$03
                    0x6D, 0xF3, 0x00, // ADC $00F3
                    0x8D, 0xF3, 0x00, // STA $00F3
                    0xEE, 0xF4, 0x00, // INC $00F4
                    0xA2, 0x01, // LDX #$01
                    0xEC, 0xF0, 0x00, // CPX $00F0
                    0xD0, 0xC2, // BNE $C2
                    0xA9, 0x00, // LDA #$00
                    0x8D, 0xF3, 0x00, // STA $00F3
                    0x8D, 0xF4, 0x00, // STA $00F4
                    0xAE, 0xF5, 0x00, // LDX $00F5
                    0xEC, 0xF4, 0x00, // CPX $00F4
                    0xD0, 0x07, // BNE $07
                    0xA2, 0x01, // LDX #$01
                    0xEC, 0xF0, 0x00, // CPX $00F0
                    0xD0, 0x2B, // BNE $2B
                    0xAE, 0xF5, 0x00, // LDX $00F5
                    0xEC, 0xF3, 0x00, // CPX $00F3
                    0xD0, 0x11, // BNE $11
                    0xA2, 0x02, // LDX #$02
                    0xA0, 0xFB, 0xFF, // LDY #$FFFB
                    0xA9, 0x00, // LDA #$00
                    0x8D, 0xF2, 0x00, // STA $00F2
                    0xA2, 0x01, // LDX #$01
                    0xEC, 0xF0, 0x00, // CPX $00F0
                    0xD0, 0x12, // BNE $12
                    0xA9, 0x05, // LDA #$05
                    0x6D, 0xF3, 0x00, // ADC $00F3
                    0x8D, 0xF3, 0x00, // STA $00F3
                    0xEE, 0xF4, 0x00, // INC $00F4
                    0xA2, 0x01, // LDX #$01
                    0xEC, 0xF0, 0x00, // CPX $00F0
                    0xD0, 0xC6, // BNE $C6
                    0xA2, 0x01, // LDX #$01
                    0xEC, 0xF2, 0x00, // CPX $00F2
                    0xA9, 0x01, // LDA #$01
                    0x8D, 0xF2, 0x00, // STA $00F2
                    0xD0, 0x9C, // BNE $9C
                    0xA2, 0x01, // LDX #$01
                    0xAC, 0xF5, 0x00, // LDY $00F5
                    0xFF, // SYS
                    0xA2, 0x01, // LDX #$01
                    0xEC, 0xF0, 0x00, // CPX $00F0
                    0xD0, 0xF1, // BNE $F1
                    0x00 // BRK
                ]
            }
        ];
        // Get the MMU instance from the CPU
        this.mmu = cpu['MMU'];
        this.keyboard = new Keyboard_1.Keyboard(interruptController, debugMode);
    }
    displayMenu() {
        console.log("\nAvailable Programs:");
        this.programs.forEach((program, index) => {
            console.log(`${index + 1}. ${program.name}`);
        });
        console.log("0. Exit");
        console.log("A. Add Custom Program");
        console.log("\nSelect a program (0-" + this.programs.length + ", or A to add custom):");
    }
    loadProgram(index) {
        const programIndex = index - 1;
        if (programIndex < 0 || programIndex >= this.programs.length) {
            return null;
        }
        const program = this.programs[programIndex];
        // Use MMU's setProgram method to load the program
        this.mmu.setProgram(program.code);
        return program;
    }
    validateProgramResults(program, actualRegisters) {
        // If no expected registers are defined, consider the program passed
        if (!program.expectedRegisters) {
            return true;
        }
        const expected = program.expectedRegisters;
        return (actualRegisters.a === expected.a &&
            actualRegisters.x === expected.x &&
            actualRegisters.y === expected.y &&
            actualRegisters.z === expected.z &&
            actualRegisters.c === expected.c);
    }
    addCustomProgram(onComplete) {
        console.log("\nAdding Custom Program");
        console.log("Enter program name (press Enter when done):");
        // Enable silent mode and echo input
        this.keyboard.setSilentMode(true);
        // State machine for program input
        let InputState;
        (function (InputState) {
            InputState[InputState["NAME"] = 0] = "NAME";
            InputState[InputState["BYTES"] = 1] = "BYTES";
            InputState[InputState["REGISTERS_QUESTION"] = 2] = "REGISTERS_QUESTION";
            InputState[InputState["A_REGISTER"] = 3] = "A_REGISTER";
            InputState[InputState["X_REGISTER"] = 4] = "X_REGISTER";
            InputState[InputState["Y_REGISTER"] = 5] = "Y_REGISTER";
            InputState[InputState["Z_FLAG"] = 6] = "Z_FLAG";
            InputState[InputState["C_FLAG"] = 7] = "C_FLAG";
            InputState[InputState["COMPLETE"] = 8] = "COMPLETE";
        })(InputState || (InputState = {}));
        let state = InputState.NAME;
        let name = '';
        let inputBuffer = '';
        let code = [];
        let registers = {
            a: 0x00,
            x: 0x00,
            y: 0x00,
            z: false,
            c: false
        };
        const isValidHexByte = (str) => {
            return /^[0-9A-Fa-f]{1,2}$/.test(str);
        };
        const handleInput = (key) => {
            switch (state) {
                case InputState.NAME:
                    if (key === '\r' || key === '\n') {
                        console.log('');
                        name = inputBuffer.trim();
                        inputBuffer = '';
                        console.log("\nEnter program bytes (space-separated hex values, e.g. A9 05 AA):");
                        state = InputState.BYTES;
                    }
                    else if (key === '\x7f' || key === '\b') {
                        if (inputBuffer.length > 0) {
                            inputBuffer = inputBuffer.slice(0, -1);
                            process.stdout.write('\b \b');
                        }
                    }
                    else {
                        inputBuffer += key;
                        process.stdout.write(key);
                    }
                    break;
                case InputState.BYTES:
                    if (key === '\r' || key === '\n') {
                        console.log('');
                        const bytes = inputBuffer.trim().split(' ');
                        const invalidBytes = bytes.filter(byte => !isValidHexByte(byte));
                        if (invalidBytes.length > 0) {
                            console.log("\nInvalid hex bytes found:", invalidBytes.join(', '));
                            console.log("Please enter valid hex values (e.g. A9 05 AA):");
                            inputBuffer = '';
                        }
                        else {
                            code = bytes.map(byte => parseInt(byte, 16));
                            inputBuffer = '';
                            console.log("\nAdd expected registers? (y/n):");
                            state = InputState.REGISTERS_QUESTION;
                        }
                    }
                    else if (key === '\x7f' || key === '\b') {
                        if (inputBuffer.length > 0) {
                            inputBuffer = inputBuffer.slice(0, -1);
                            process.stdout.write('\b \b');
                        }
                    }
                    else {
                        inputBuffer += key;
                        process.stdout.write(key);
                    }
                    break;
                case InputState.REGISTERS_QUESTION:
                    if (key === '\r' || key === '\n') {
                        console.log('');
                        const addRegs = inputBuffer.trim().toLowerCase() === 'y';
                        inputBuffer = '';
                        if (addRegs) {
                            console.log("\nEnter expected register values:");
                            console.log("A register (hex, e.g. 05):");
                            state = InputState.A_REGISTER;
                        }
                        else {
                            this.programs.push({
                                name,
                                code,
                                expectedRegisters: registers
                            });
                            console.log(`\nAdded program: ${name}`);
                            this.keyboard.setSilentMode(false);
                            onComplete();
                            state = InputState.COMPLETE;
                        }
                    }
                    else if (key === '\x7f' || key === '\b') {
                        if (inputBuffer.length > 0) {
                            inputBuffer = inputBuffer.slice(0, -1);
                            process.stdout.write('\b \b');
                        }
                    }
                    else {
                        inputBuffer += key;
                        process.stdout.write(key);
                    }
                    break;
                case InputState.A_REGISTER:
                    if (key === '\r' || key === '\n') {
                        console.log('');
                        const value = inputBuffer.trim();
                        if (!isValidHexByte(value)) {
                            console.log("\nInvalid hex value. Please enter a valid hex byte (e.g. 05):");
                            inputBuffer = '';
                        }
                        else {
                            registers.a = parseInt(value, 16);
                            inputBuffer = '';
                            console.log("X register (hex, e.g. 03):");
                            state = InputState.X_REGISTER;
                        }
                    }
                    else if (key === '\x7f' || key === '\b') {
                        if (inputBuffer.length > 0) {
                            inputBuffer = inputBuffer.slice(0, -1);
                            process.stdout.write('\b \b');
                        }
                    }
                    else {
                        inputBuffer += key;
                        process.stdout.write(key);
                    }
                    break;
                case InputState.X_REGISTER:
                    if (key === '\r' || key === '\n') {
                        console.log('');
                        const value = inputBuffer.trim();
                        if (!isValidHexByte(value)) {
                            console.log("\nInvalid hex value. Please enter a valid hex byte (e.g. 03):");
                            inputBuffer = '';
                        }
                        else {
                            registers.x = parseInt(value, 16);
                            inputBuffer = '';
                            console.log("Y register (hex, e.g. 00):");
                            state = InputState.Y_REGISTER;
                        }
                    }
                    else if (key === '\x7f' || key === '\b') {
                        if (inputBuffer.length > 0) {
                            inputBuffer = inputBuffer.slice(0, -1);
                            process.stdout.write('\b \b');
                        }
                    }
                    else {
                        inputBuffer += key;
                        process.stdout.write(key);
                    }
                    break;
                case InputState.Y_REGISTER:
                    if (key === '\r' || key === '\n') {
                        console.log('');
                        const value = inputBuffer.trim();
                        if (!isValidHexByte(value)) {
                            console.log("\nInvalid hex value. Please enter a valid hex byte (e.g. 00):");
                            inputBuffer = '';
                        }
                        else {
                            registers.y = parseInt(value, 16);
                            inputBuffer = '';
                            console.log("Z flag (t/f, e.g. f):");
                            state = InputState.Z_FLAG;
                        }
                    }
                    else if (key === '\x7f' || key === '\b') {
                        if (inputBuffer.length > 0) {
                            inputBuffer = inputBuffer.slice(0, -1);
                            process.stdout.write('\b \b');
                        }
                    }
                    else {
                        inputBuffer += key;
                        process.stdout.write(key);
                    }
                    break;
                case InputState.Z_FLAG:
                    if (key === '\r' || key === '\n') {
                        console.log('');
                        const value = inputBuffer.trim().toLowerCase();
                        if (value !== 't' && value !== 'f') {
                            console.log("\nInvalid value. Please enter 't' or 'f':");
                            inputBuffer = '';
                        }
                        else {
                            registers.z = value === 't';
                            inputBuffer = '';
                            console.log("C flag (t/f, e.g. f):");
                            state = InputState.C_FLAG;
                        }
                    }
                    else if (key === '\x7f' || key === '\b') {
                        if (inputBuffer.length > 0) {
                            inputBuffer = inputBuffer.slice(0, -1);
                            process.stdout.write('\b \b');
                        }
                    }
                    else {
                        inputBuffer += key;
                        process.stdout.write(key);
                    }
                    break;
                case InputState.C_FLAG:
                    if (key === '\r' || key === '\n') {
                        console.log('');
                        const value = inputBuffer.trim().toLowerCase();
                        if (value !== 't' && value !== 'f') {
                            console.log("\nInvalid value. Please enter 't' or 'f':");
                            inputBuffer = '';
                        }
                        else {
                            registers.c = value === 't';
                            this.programs.push({
                                name,
                                code,
                                expectedRegisters: registers
                            });
                            console.log(`\nAdded program: ${name}`);
                            this.keyboard.setSilentMode(false);
                            onComplete();
                            state = InputState.COMPLETE;
                        }
                    }
                    else if (key === '\x7f' || key === '\b') {
                        if (inputBuffer.length > 0) {
                            inputBuffer = inputBuffer.slice(0, -1);
                            process.stdout.write('\b \b');
                        }
                    }
                    else {
                        inputBuffer += key;
                        process.stdout.write(key);
                    }
                    break;
                case InputState.COMPLETE:
                    process.stdin.removeListener('data', handleInput);
                    break;
            }
        };
        process.stdin.on('data', handleInput);
    }
}
exports.ProgramMenu = ProgramMenu;
//# sourceMappingURL=ProgramMenu.js.map