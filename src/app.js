import {Input} from './avr-input'
import {Reader} from './reader'
import {Evaluator} from './evaluator'
import {Register} from './register'
import {avr} from './avr-details'
import {Scanner} from './scanner'
import {inject} from 'aurelia-framework'

@inject(avr)
export class App {
  constructor(isa) {
    this.isa = isa;
    this.message = 'This is suffering';
    this.input = `; some header crap

    .def            io_setup    = r16                       ; used to set up pins as inputs or outputs
    .equ            constant    = 278
    .macro          add16                                   ; start macro definition
                    add         @2,@0                       ; subtract low byte
                    addi        @3,@1                       ; subtract high byte
    .endmacro                                               ; end macro def
    .cseg                                                   ; start of code segment
    .org            0x0000                                  ; reset vector
                    rjmp        setup                       ; jump over interrupt vectors
    .org            0x0100                                  ; start of non-reserved program memory
    
    setup:          ser         io_setup                    ; set all bits in register
                    out         DDRD, io_setup              ; use all pins in PORTD as outputs
                    out         DDRB, io_setup
                    ldi         io_setup, 0
                    ldi         r18, low(constant)
                    ldi         r19, high(constant)
                    
    loop:           add16       r16, r17, r18, r19
                    out         PORTD, r16
                    out         PORTB, r17
                    rjmp        loop
    `;
    this.evaluated_code = 'placeholder';
    this.registers = this.isa.registers;
    
    this.reader = new Reader();
    this.evaluator = new Evaluator(this.registers);
    this.scanner = new Scanner();
    this.labels = {};
    this.definitions = {};
    
    this.Update()
    this.programCounter = this.assemblyCodeArray.length-1;
    
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
    let scannerReturnList = [];
    this.assemblyCodeArray = this.reader.Read(this.input);
    scannerReturnList = this.scanner.Scan(this.assemblyCodeArray);
    console.log(scannerReturnList);
    
  }
  /**
   * Run
   * This runs the evaluation of the source code that has been read from the
   * reader object. 
   * It will also set the 2 to the new output from the evaluator class.
   * @param {*} executedProgramCounter 
   */
  Run(executedProgramCounter=this.assemblyCodeArray.length-1) {
    this.setProgramCounter(executedProgramCounter)
    let new_output = this.evaluator.Evaluate(this.assemblyCodeArray, this.programCounter);
    this.setEvaluatedCode(new_output);
    this.isa.Test(this.evaluated_code);
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
   * setEvaluatedCode
   * Sets the output.
   * @param {*} evaluated_code 
   */
  setEvaluatedCode(evaluated_code) {
    // I want to have some sort of filtering here as well but I don't have the
    // registers done enough to do this. So this is just here for a reminder 
    // that I should filter the output as well.
    this.evaluated_code = evaluated_code;
  }
  Test() {
    console.log(this.assemblyCodeArray);
    
    for (let codeline of this.assemblyCodeArray) {
      this.evaluator.Evaluate(codeline)
    }
  }
}
