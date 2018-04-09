export class Avr {
  constructor() {
    this.register_count = 32;
    this.operator_map = {
      "MOV" : this.MOV,
      "LDI" : this.LDI
    }
    this.memory = {};
  }
  CreateRegisters() {
    let registers = {};
    registers["general"] = this.CreateGeneralRegisters();
    registers["special"] = this.CreateSpecialRegisters();
    return registers;
  }
  UpdateMemory(data, mem_location) {
    console.log(data, mem_location);
    let new_mem = mem_location + (1).toString(16);
    if (data === "byte") {
      this.memory[new_mem] = data;
    } else {
      if (new_mem/2 !== 0) {
        console.error('fucked')
      }
      this.memory[new_mem] = data;
    }
    console.log(this.memory);
    
  }
  CreateGeneralRegisters() {
    return "General register PLACEHOLDER";
  }
  CreateSpecialRegisters() {
    return "Special register PLACEHOLDER";
  }
  get registerCount() {
    return this.register_count;
  }
  get operatorMap() {
    return this.operator_map;
  }
  MOV(params) {
    for (let param of params) {
      console.log(param);
    }
  }
          
  LDI(params) {
    let register = params.registers;
    if (typeof(registers) === Array) {
      console.log('this should be an error');
    }
    let value = params.value;
    
    return {
      'register':1,
      'value':5
    }
  }
}
