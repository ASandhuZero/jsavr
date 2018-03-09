export class AVR {
  constructor() {
    this.fns_map = {
        "MOV" : this.MOV,
        "LDI" : this.LDI
      }
  }
  getMap() {
    return this.fns_map;
  }
  MOV(params) {
    for (let param of params) {
      console.log(param);
    }
  }
  LDI(params) {
    let register = params.registers;
    if (typeof(regsiters) === Array) {
      console.log('this should be an error');
    }
    let value = params.value;
    
    return {
      'register':1,
      'value':5
    }
  }
}
