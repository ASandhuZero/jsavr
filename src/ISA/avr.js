export class Avr {
  constructor() {
    this.register_count = 32;
    this.operator_map = {
      "MOV" : this.MOV,
      "LDI" : this.LDI
    }
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
