/*
  Ascii.ts
  Info: ASCII encoding and decoding utilities
  Description: The Ascii module provides functions for converting between ASCII characters and their numeric byte representations.
              It includes a comprehensive ASCII character map and utility functions for encoding/decoding operations.

  Constants:
    AsciiMap: Record<string, string> - A bidirectional mapping between ASCII characters and their hex representations
      Format: { "0xXX": "char", "char": "0xXX" } where XX is the hex value
      Example: { "0x41": "A", "A": "0x41" }
      Includes all printable ASCII characters (0x20-0x7E) and common control characters (0x09-0x0D)

  Functions:
    decodeAscii(char: string): number
      Description: Converts a single ASCII character to its numeric byte value
      Parameters:
        char: string - Single character to decode (must be a valid ASCII character)
      Returns:
        number - Byte value of the character (0-255)
      Throws:
        Error - If input is not a single character or is not a valid ASCII character
      Example:
        decodeAscii("A") -> 65
        decodeAscii("!") -> 33

    encodeAscii(byte: number): string
      Description: Converts a byte value to its ASCII character representation
      Parameters:
        byte: number - Byte value to encode (must be 0-255)
      Returns:
        string - ASCII character representation
      Throws:
        Error - If byte value is outside valid range (0-255)
      Example:
        encodeAscii(65) -> "A"
        encodeAscii(33) -> "!"

    createAsciiMap<T extends Record<string, string>>(map: T): Record<string, string>
      Description: Creates a bidirectional mapping between ASCII characters and their hex representations
      Parameters:
        map: T - Initial mapping of hex values to characters
      Returns:
        Record<string, string> - Proxy object that provides bidirectional lookup
      Implementation:
        - Creates forward mapping (hex -> char)
        - Creates reverse mapping (char -> hex)
        - Returns a proxy that combines both mappings
      Example:
        createAsciiMap({ "0x41": "A" }) -> { "0x41": "A", "A": "0x41" }
*/

export function decodeAscii(char: string): number {
  if (char.length !== 1) {
    throw new Error(`Expected a single character, got: "${char}"`);
  }
  try {
    return parseInt(AsciiMap[char]);
  } catch {
    throw new Error(`Invalid ascii char: ${char}`);
  }
}

export function encodeAscii(byte: number): string {
  if (byte < 0 || byte > 255) {
    throw new Error(`Invalid byte value: ${byte}`);
  }
  return AsciiMap[`0x${byte.toString(16).padStart(2, "0").toUpperCase()}`];
}

function createAsciiMap<T extends Record<string, string>>(map: T) {
  const forward = map;
  const reverse: Record<string, string> = {};

  for (const [hex, char] of Object.entries(map)) {
    reverse[char] = hex;
  }

  return new Proxy({ ...forward, ...reverse }, {
    get(target, prop: string) {
      return target[prop];
    }
  });
}

const AsciiMap = createAsciiMap({
  "0x09": "\t",  // HT (Horizontal Tab)
  "0x0A": "\n",  // LF (Line Feed)
  "0x0B": "\v",  // VT (Vertical Tab)
  "0x0C": "\f",  // FF (Form Feed)
  "0x0D": "\r",  // CR (Carriage Return)
  "0x20": " ",   // SP (Space)
  "0x21": "!",   // Exclamation mark
  "0x22": '"',   // Double quotes
  "0x23": "#",   // Hash/Pound
  "0x24": "$",   // Dollar
  "0x25": "%",   // Percent
  "0x26": "&",   // Ampersand
  "0x27": "'",   // Single quote
  "0x28": "(",   // Left Parenthesis
  "0x29": ")",   // Right Parenthesis
  "0x2A": "*",   // Asterisk
  "0x2B": "+",   // Plus
  "0x2C": ",",   // Comma
  "0x2D": "-",   // Minus
  "0x2E": ".",   // Period
  "0x2F": "/",   // Slash
  "0x30": "0",   // Zero
  "0x31": "1",   // One
  "0x32": "2",   // Two
  "0x33": "3",   // Three
  "0x34": "4",   // Four
  "0x35": "5",   // Five
  "0x36": "6",   // Six
  "0x37": "7",   // Seven
  "0x38": "8",   // Eight
  "0x39": "9",   // Nine
  "0x3A": ":",   // Colon
  "0x3B": ";",   // Semicolon
  "0x3C": "<",   // Less Than
  "0x3D": "=",   // Equals
  "0x3E": ">",   // Greater Than
  "0x3F": "?",   // Question mark
  "0x40": "@",   // At symbol
  "0x41": "A",   // Uppercase A
  "0x42": "B",   // Uppercase B
  "0x43": "C",   // Uppercase C
  "0x44": "D",   // Uppercase D
  "0x45": "E",   // Uppercase E
  "0x46": "F",   // Uppercase F
  "0x47": "G",   // Uppercase G
  "0x48": "H",   // Uppercase H
  "0x49": "I",   // Uppercase I
  "0x4A": "J",   // Uppercase J
  "0x4B": "K",   // Uppercase K
  "0x4C": "L",   // Uppercase L
  "0x4D": "M",   // Uppercase M
  "0x4E": "N",   // Uppercase N
  "0x4F": "O",   // Uppercase O
  "0x50": "P",   // Uppercase P
  "0x51": "Q",   // Uppercase Q
  "0x52": "R",   // Uppercase R
  "0x53": "S",   // Uppercase S
  "0x54": "T",   // Uppercase T
  "0x55": "U",   // Uppercase U
  "0x56": "V",   // Uppercase V
  "0x57": "W",   // Uppercase W
  "0x58": "X",   // Uppercase X
  "0x59": "Y",   // Uppercase Y
  "0x5A": "Z",   // Uppercase Z
  "0x5B": "[",   // Left Square Bracket
  "0x5C": "\\",  // Backslash
  "0x5D": "]",   // Right Square Bracket
  "0x5E": "^",   // Caret
  "0x5F": "_",   // Underscore
  "0x60": "`",   // Backtick
  "0x61": "a",   // Lowercase a
  "0x62": "b",   // Lowercase b
  "0x63": "c",   // Lowercase c
  "0x64": "d",   // Lowercase d
  "0x65": "e",   // Lowercase e
  "0x66": "f",   // Lowercase f
  "0x67": "g",   // Lowercase g
  "0x68": "h",   // Lowercase h
  "0x69": "i",   // Lowercase i
  "0x6A": "j",   // Lowercase j
  "0x6B": "k",   // Lowercase k
  "0x6C": "l",   // Lowercase l
  "0x6D": "m",   // Lowercase m
  "0x6E": "n",   // Lowercase n
  "0x6F": "o",   // Lowercase o
  "0x70": "p",   // Lowercase p
  "0x71": "q",   // Lowercase q
  "0x72": "r",   // Lowercase r
  "0x73": "s",   // Lowercase s
  "0x74": "t",   // Lowercase t
  "0x75": "u",   // Lowercase u
  "0x76": "v",   // Lowercase v
  "0x77": "w",   // Lowercase w
  "0x78": "x",   // Lowercase x
  "0x79": "y",   // Lowercase y
  "0x7A": "z",   // Lowercase z
  "0x7B": "{",   // Left Curly Brace
  "0x7C": "|",   // Pipe
  "0x7D": "}",   // Right Curly Brace
  "0x7E": "~",   // Tilde
});
