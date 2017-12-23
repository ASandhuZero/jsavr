import {Input} from './avr-input'
export class App {
  constructor() {
    this.message = 'Hello World!';
    this.input = `Syntax:     LD Rd,X     0«d«31
            LD Rd,Y
            LD Rd,Z

Example:    LDI R26,0x20
            LD R2,-X         ;Load R2 with loc. 0x1F
            LDI R28,0x40
            LD R3,-Y         ;Load R3 with loc. 0x3F
            LDI R30,0x60
            LD R4,-Z         ;Load R4 with loc. 0x5F 
    `;
  }

  run() {
    console.log(this.input.split("\n"));
    
  }
}
