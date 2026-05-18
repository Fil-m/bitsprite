// BitSprite Core-0 16-bit Virtual CPU Emulator
class VirtualCPU {
  constructor() {
    this.RAM = new Uint16Array(65536); // 64KB virtual RAM
    this.registers = {
      A: 0,   // Accumulator
      B: 0,   // Secondary register
      PC: 0,  // Program Counter (tracks player position)
      SP: 0x3C00, // Stack Pointer (starts below the restricted zone)
      CLK: 0  // Clock cycle tick counter
    };
    
    // Seed some memory addresses with symbolic dummy bytecode for visual debug panels
    for (let i = 0; i < 256; i++) {
      this.RAM[i] = Math.floor(Math.random() * 65536);
    }
  }

  reset() {
    this.registers.A = 0;
    this.registers.B = 0;
    this.registers.PC = 0;
    this.registers.SP = 0x3C00;
    this.registers.CLK = 0;
  }

  tick() {
    this.registers.CLK++;
  }

  setPC(value) {
    this.registers.PC = Math.floor(value) & 0xFFFF;
  }

  evaluateStack(stackInstructions) {
    // Expected target vertical sequence: ["MOV", "ADD", "RET"]
    if (
      stackInstructions &&
      stackInstructions.length === 3 &&
      stackInstructions[0] === "MOV" &&
      stackInstructions[1] === "ADD" &&
      stackInstructions[2] === "RET"
    ) {
      // SP Register Overflow! Stack pointer is pushed beyond safe bounds
      this.registers.SP = 0x4000; 
      return true; // Triggers Overflow Exploit
    } else {
      // Normal stack pointer push modifications
      this.registers.SP = 0x3C00 - (stackInstructions ? stackInstructions.length * 16 : 0);
      return false;
    }
  }

  readMemory(address) {
    return this.RAM[address & 0xFFFF];
  }

  writeMemory(address, value) {
    this.RAM[address & 0xFFFF] = value & 0xFFFF;
  }
}

// Global Core-0 virtual CPU instance
const CPU = new VirtualCPU();
window.CPU = CPU;
