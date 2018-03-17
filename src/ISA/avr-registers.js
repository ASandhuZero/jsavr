/**
 * This is an AVR details file. It will be used to inject into the register
 * and app components what the AVR Instruction set should be emulating.
 * As in the register and what data is encapsulated within it.
 */

let id = 0;
/**
 * I really don't like how this is set up.
 * Might be worth it to have the registers just do this normally?
 */
function getId() {
  return id++;
}



export class avr_reg {
  constructor() {
    this.register_nums = 32;
    this.registers = [];
    for (let i = 0; i < this.register_nums; i++) {
      this.registers.push(new TemplateRegister(getId()));
    }
  }

  getRegisters() {
    return this.registers;
  }

  Test(code) {
    let changedObj = {
      1:2,
      2:3,
      3:4
    };
    console.log(code);
    for (let i in changedObj) {
      this.registers[i].value = changedObj[i];
    }
  }
}
