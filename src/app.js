import {Input} from './avr-input'
import {Reader} from './reader'
import {Evaluator} from './evaluator'
import {Register} from './register'
import {avr} from './avr-details'
import {inject} from 'aurelia-framework'

@inject(avr)
export class App {
  constructor(isa) {
    this.isa = isa;
    this.message = 'This is AVR land!';
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
    this.output = 'placeholder';
    this.reader = new Reader();
    this.assemblyCodeArray = this.reader.Read(this.input);
    this.programCounter = this.assemblyCodeArray.length-1;
    this.evaluator = new Evaluator();
    this.registers = this.isa.registers;
  }
  /**
   * Update
   * This function is a callback function. 
   * Whenever the text field for the user input changes, as in the source code
   * has changed, and the text field is no longer in the focus of the user,
   * Update will be called to call the reader object.
   * The reader object will then read in the input and update accordingly.
   */
  Update() {
    this.assemblyCodeArray = this.reader.Read(this.input);
  }
  /**
   * Run
   * This runs the evaluation of the source code that has been read from the
   * reader object. 
   * It will also set the output to the new output from the evaluator class.
   * @param {*} executedProgramCounter 
   */
  Run(executedProgramCounter=this.assemblyCodeArray.length-1) {
    this.setProgramCounter(executedProgramCounter)
    let new_output = this.evaluator.Evaluate(this.assemblyCodeArray, this.programCounter);
    this.setOutput(new_output);
    this.isa.Test(this.output);
  }
  /**
   * Reset
   * A user option to reset the program counter to -1 or effectively the beginning
   * of the program.
   */
  Reset() {
    let executedProgramCounter = -1;
    this.Run(executedProgramCounter);
  }
  /**
   * StepBack
   * A user option to step back the program counter by one.
   */
  StepBack() {
    let executedProgramCounter = this.programCounter - 1;
    this.Run(executedProgramCounter);
  }
  /**
   * StepForward
   * a user option to step the program counter up by one.
   */
  StepForward() {
    let executedProgramCounter = this.programCounter + 1;
    this.Run(executedProgramCounter);
  }
  /**
   * setProgramCounter
   * Sets the program counter and clamps the value to the approiate value.
   * @param {*} number 
   */
  setProgramCounter(number=0) {
    if (this.assemblyCodeArray.length - 1 < number) {
      this.programCounter = this.assemblyCodeArray.length - 1;
    }
    else if (number < -1) {
      this.programCounter = -1;
    }
    else {
      this.programCounter = number;
    }
    console.log(this.programCounter);
  }
  /**
   * setOutput
   * Sets the output.
   * @param {*} output 
   */
  setOutput(output) {
    // I want to have some sort of filtering here as well but I don't have the
    // registers done enough to do this. So this is just here for a reminder 
    // that I should filter the output as well.
    this.output = output;
  }
  
}
