export class Evaluator {
	constructor() {
	}

	Evaluate(assemblyCodeArray, programCounter) {
    let output = "";
    for (let i = 0; i < assemblyCodeArray.length; i++) {
			if (programCounter >= i) {
				output += assemblyCodeArray[i] + "\n";
      }
    }
    return output;
	}
}
