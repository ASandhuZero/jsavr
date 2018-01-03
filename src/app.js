import {Input} from './avr-input'
import {Reader} from './reader'
import {Evaluator} from './evaluator'
import {Register} from './register'
export class App {
  constructor() {
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
    this.assemblyCodeArray = [];
    this.programCounter = 0;
    this.reader = new Reader();
    this.evaluator = new Evaluator();

    this.Run();

    this.registers = [];
    for (let i = 0; i< 32; i++) {
      this.registers.push(new Register());
    }
  }

  //TODO 
  // I HATE THIS FEELING.
  // I noticed that I was using this code more than once within the functions
  // so I wanted to just make this a funciton and call it within the function.
  // Although what I really want to do is get some sort of logic flow that
  // within this program.
  // This really should take program counter
  Update(programCounter) {
    this.setProgramCounter(programCounter);
    let new_output = this.evaluator.Evaluate(this.assemblyCodeArray, this.programCounter);
    this.setOutput(new_output);
  }
  Run() {
    this.assemblyCodeArray = this.reader.Read(this.input);
    let executedProgramCounter = this.assemblyCodeArray.length-1;
    this.Update(executedProgramCounter);
  }
  Reset() {
    let executedProgramCounter = 0;
    this.Update(executedProgramCounter);
  }
  StepBack() {
    this.assemblyCodeArray = this.reader.Read(this.input);
    let executedProgramCounter = this.programCounter - 1;
    this.Update(executedProgramCounter);
  }
  StepForward() {
    this.assemblyCodeArray = this.reader.Read(this.input);
    let executedProgramCounter = this.programCounter + 1;
    this.Update(executedProgramCounter);
  }
  setProgramCounter(number) {
    if (this.assemblyCodeArray.length - 1 < number) {
      this.programCounter = this.assemblyCodeArray.length - 1;
    }
    else if (number < 0) {
      this.programCounter = 0;
    }
    else {
      this.programCounter = number;
    }
    console.log(this.programCounter);
  }
  setOutput(output) {
    // I want to have some sort of filtering here as well but I don't have the
    // registers done enough to do this. So this is just here for a reminder 
    // that I should filter the output as well.
    this.output = output;
  }
  
}
