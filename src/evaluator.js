import * as RAM_address from '../src/resources/m328PB'
export class Evaluator {
	constructor(isa) {
    this.isa = isa;
    console.log(RAM_address);
    this.opMap = this.isa.operator_map;
	}

	Evaluate(codeline) {
    let executed = [];
    let executedProgramCounter = 0;
    /**
     * Because I don't feel like typing out too much.
     * A solution to this problem is have each line evaluated
     * and ran over and over again. 
     * That way it can handle infinite loops.
     */
      executedProgramCounter++;
      console.log(executed);
  }
}

