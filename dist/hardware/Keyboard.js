"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Keyboard = void 0;
const Hardware_1 = require("./Hardware");
/*
  Keyboard.ts
  Info: Keyboard input handling implementation
  Description: The Keyboard class manages user input, generating interrupts for key presses and providing input buffering capabilities.

  Keyboard Class Members:
    irqNumber: IRQ Number - Interrupt request number for keyboard
    priority: Interrupt Priority - Priority level for keyboard interrupts
    deviceName: Device Name - Identifier for the keyboard device
    outputBuffer: Output Buffer - Buffer for keyboard input
    controller: Interrupt Controller - Reference to the interrupt controller
    keyPressHandler: Key Press Handler - Callback for key press events
    silentMode: Silent Mode - Controls whether keyboard logging is enabled
    debugMode: Debug Mode - Controls whether debug logging is enabled

  Keyboard Class Methods:
    setSilentMode: Sets whether keyboard logging is enabled
    onKeyPress: Sets the key press handler callback
    removeKeyPressListener: Removes the key press handler
    monitorKeys: Monitors stdin for key presses and generates interrupts
*/
class Keyboard extends Hardware_1.Hardware {
    constructor(controllerRef, debugMode) {
        super("0", "KYB", debugMode, 0);
        this.irqNumber = 1;
        this.priority = 1;
        this.outputBuffer = [];
        this.keyPressHandler = null;
        this.silentMode = false;
        this.debugMode = false;
        this.controller = controllerRef;
        this.deviceName = "Keyboard";
        this.monitorKeys();
    }
    setSilentMode(silent) {
        this.silentMode = silent;
    }
    onKeyPress(handler) {
        this.keyPressHandler = handler;
    }
    removeKeyPressListener() {
        this.keyPressHandler = null;
    }
    monitorKeys() {
        /*
        character stream from stdin code (most of the contents of this function) taken from here
        https://stackoverflow.com/questions/5006821/nodejs-how-to-read-keystrokes-from-stdin

        This takes care of the simulation we need to do to capture stdin from the console and retrieve the character.
        Then we can put it in the buffer and trigger the interrupt.
         */
        var stdin = process.stdin;
        // without this, we would only get streams once enter is pressed
        stdin.setRawMode(true);
        // resume stdin in the parent process (node app won't quit all by itself
        // unless an error or process.exit() happens)
        stdin.resume();
        // i don't want binary, do you?
        //stdin.setEncoding( 'utf8' );
        stdin.setEncoding(null);
        stdin.on('data', function (key) {
            const keyStr = key.toString();
            if (!this.silentMode) {
                this.log("Key pressed - " + keyStr);
            }
            // ctrl-c ( end of text )
            // this let's us break out with ctrl-c
            if (keyStr === '\u0003') {
                process.exit();
            }
            // put the key value in the buffer
            this.outputBuffer.push(keyStr);
            if (!this.silentMode) {
                if (this.debugMode) {
                    this.log(`Keyboard sending interrupt for key '${keyStr}' (ASCII: ${keyStr.charCodeAt(0)})`);
                }
                this.controller.acceptInterrupt({
                    irqNumber: 1,
                    priority: 1,
                    deviceName: "Keyboard",
                    data: keyStr.charCodeAt(0)
                });
            }
            if (this.keyPressHandler) {
                this.keyPressHandler(keyStr);
            }
            // .bind(this) is required when running an asynchronous process in node that wishes to reference an
            // instance of an object.
        }.bind(this));
    }
}
exports.Keyboard = Keyboard;
//# sourceMappingURL=Keyboard.js.map