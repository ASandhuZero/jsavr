export class Evaluator {
	constructor(isa) {
    this.isa = isa;
    console.log(this.isa)
    this.opMap = this.isa.operator_map;
	}

	Evaluate(codeline) {
    // console.log(codeline);
    
    // let input = {
    //   "LDI":{
    //     "registers":1,
    //     "value":5
    //   }
    //   // "MOV":{
    //   //   "registers":[2,3]
    //   // }
    // };
    let executed = [];
    let executedProgramCounter = 0;
    /**
     * Because I don't feel like typing out too much.
     * A solution to this problem is have each line evaluated
     * and ran over and over again. 
     * That way it can handle infinite loops.
     */
    // for (let codeline in input) {

    let fnString = codeline;
    let params = input[codeline];
    if (codeline in this.fns_map) {
      let evaluatedCode = this.fns_map[codeline](params)
      evaluatedCode['programCounter'] = executedProgramCounter;
      executed.push(evaluatedCode);
      // } 

      // executed.push([
      //   {
      //     register:input[codeline].register
      //   }
      // ]
      // );
      executedProgramCounter++;
      console.log(executed);
      
    }
    
    
  //   let output = "";
  //   for (let i = 0; i < assemblyCodeArray.length; i++) {
	// 		if (programCounter >= i) {
	// 			output += assemblyCodeArray[i] + "\n";
  //     }
  //   }
  //   return output;
  }

}

