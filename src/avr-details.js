import {Register} from './register'
/**
 * This is an AVR details file. It will be used to inject into the register
 * and app components what the AVR Instruction set should be emulating.
 * As in the register and what data is encapsulated within it.
 */

let id = 0;

function getId() {
  return id++;
}

for (let i = 0; i < 32; i++) {
  console.log(new Register(getId()));
}

export class avr {
  constructor() {

  }
}
