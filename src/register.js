import {avr} from './avr-details'
import {inject} from 'aurelia-framework'

@inject(avr)
export class Register {
  constructor(isa) {
    this.isa = isa;
    this.registers = this.isa.getRegisters();
  } 
}
