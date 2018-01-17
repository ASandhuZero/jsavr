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
  /**
   * THIS IS A TEST. 
   * PLEASE REMEMBER THAT THIS IS JUST A PROOF OF CONCEPT THAT 
   * IT IS POSSIBLE TO ALTER THE STATE OF THE REGISTERS
   * WITH AN OBJECT.
   * THE REASON FOR DOING THIS IS THE EVALUATOR MODULE CAN
   * NOW RETURN AN OBJECT OF THE AFFECTED REGISTERS.
   * THIS WILL ALLOW THE CHANGE OF REGISTERS.
   * @param {CODE} code 
   */
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
