export class Evaluator {
	constructor() {
	}

	Evaluate(assemblyCodeArray, programCounter) {
		for (let i = 0; i < assemblyCodeArray.length; i++) {
			if (programCounter == i) {
				console.log(assemblyCodeArray[i]);
			}
		}
	}
}