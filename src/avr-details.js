import {TemplateRegister} from './template-register'
/**
 * This is an AVR details file. It will be used to inject into the register
 * and app components what the AVR Instruction set should be emulating.
 * As in the register and what data is encapsulated within it.
 */

let id = 0;

function getId() {
  return id++;
}



export class avr {
  constructor() {
    this.registers = [];
    for (let i = 0; i < 32; i++) {
      this.registers.push(new TemplateRegister(getId()));
    }
  }
  getRegisters() {
    return this.registers;
  }
}
