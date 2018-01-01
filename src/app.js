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
    this.output = "placeholder";
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
  Update() {
    let new_output = this.evaluator.Evaluate(this.assemblyCodeArray, this.programCounter);
    this.setOutput(new_output);
  }
  Run() {
    let executedProgramCounter = this.assemblyCodeArray.length - 1;
    this.setProgramCounter(executedProgramCounter);
    this.assemblyCodeArray = this.reader.Read(this.input);
    // TODO:
    // Mostly a note to self. This is the only area where the program will
    // actually evaluate the code. This could be a problem because what if
    // the user wishes to see the evaluation per program counter step
    this.Update();
  }
  StepBack() {
    let executedProgramCounter = this.programCounter - 1;
    this.setProgramCounter(executedProgramCounter);
    this.Update();
  }
  StepForward() {
    let executedProgramCounter = this.programCounter + 1;
    this.setProgramCounter(executedProgramCounter);
    this.Update();
  }
 setProgramCounter(number) {
   if (this.assemblyCodeArray.length > number 
    && number >= 0) {
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
