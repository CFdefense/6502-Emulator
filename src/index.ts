import { System } from "./System";

/*
  index.ts
  Info: System entry point and initialization
  Description: The index file serves as the entry point for the system, initializing the hardware components and starting the program execution.

  Main Function:
    System.create(): Promise<System> - Creates and initializes the system instance
      .then(system => {}) - Handles successful system initialization
      .catch(error => {}) - Handles system initialization errors
*/

System.create().then(system => {
  // System is now running
}).catch(error => {
  console.error("Failed to initialize system:", error);
  process.exit(1);
}); 