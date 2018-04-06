export class Scanner {

	constructor() {
    this.lastReadInput;

    this.dseg = {};
    this.cseg = {};
    this.eseg = {};
    this.labels = {};
    this.directives = {};
  }

  /**
	* Sanitizes the input for the Reader.
	* This method will return an array of strings to
	* be read
	* @param {string} input - string to be read
	* @return {array} santizedArray - array of strings
	*/
	SanitizeInput(input) {
    let sanitizedArray = input.split('\n');

		sanitizedArray = sanitizedArray.map(line => line.replace(/;.*/,'').trim()); // All this is doing is just stripping the comments. Then trimming it to remove any excess whitespace.
    sanitizedArray = sanitizedArray.filter(line => /[^\n]/.test(line)); // This is removing JUST newlines from the array.
    this.lastCodeArray = sanitizedArray;
    this.lastRead = input;

		return sanitizedArray;
  }
  
	/**
	* Read will call SanitizeInput to sanitize input.
	* Takes an input to be sanitized.
	* Upon recieving the sanitized array of strings,
	* the array of strings will be tokenized for the
	* parser.
	*/
	Read(input) {
    if (input == this.lastRead) {
      return this.lastCodeArray;
    }
    let assemblyCodeArray = this.SanitizeInput(input);
		return assemblyCodeArray
  }

  /**
   * Scan
   * Scan will take in a string called input. 
   * It will the read, sanitize, and scan the input.
   * This is a pseudo scanner.
   * @param {String} input 
   */
  Scan(input) {
    // let index = 0;
    let sourceCodeArray = this.Read(input);
    let arrayToReturn = [];
    // TODO: Figure out if this is doing the actual scanning 
    for (let i = 0; i < sourceCodeArray.length; i++) {
      let line = sourceCodeArray[i];
      line = line.split(/\s|,/); // This is removing JUST newlines from the array.
      let array_to_push = line.filter(line => /[^\s]/.test(line)); // removing just whitespace lines.
      array_to_push = this.BindLabels(array_to_push, i); 
      arrayToReturn.push(array_to_push); 
    }
    // Maybe a better way to do this?
    for (let i = 0; i < arrayToReturn.length; i++) {
      this.BindDirectives(arrayToReturn, i);
    }
    return {
      "assemblyCodeArray" : arrayToReturn, 
      "labels" : this.labels, 
      "directives" : this.directives
    };
  }

  BindLabels(temp_array, array_index) {
    let index_to_check = temp_array[0];
    
    if (index_to_check.indexOf(':') > -1) {
      index_to_check = index_to_check.slice(0,-1);
      this.labels[index_to_check] = array_index;
      temp_array.shift();
    }
    return temp_array;
  }

  BindDirectives(sourceCodeArray, index) {
    let line = sourceCodeArray[index];
    let indexToCheck = line[0];
    
    switch(indexToCheck) {
      case ".cseg":
        this.setSeg(sourceCodeArray, index);
        break;
      case ".dseg":
        this.setSeg(sourceCodeArray, index);
        break;  
      case ".eseg":
        this.setSeg(sourceCodeArray, index);
        break;
      case ".def":
        this.setDef(line);
        break;
      case ".equ":
        this.setEqu(line);
        break;
      case ".macro":
        this.setMacro(sourceCodeArray);
        break;
    }
  }
  setSeg(sourceCodeArray, index) {
    let subSourceCodeArray = sourceCodeArray.slice(index);
    let segToSet = subSourceCodeArray.shift();
    segToSet = segToSet[0];
    let seg;
    
    if (segToSet === ".cseg") {
      seg = this.cseg;
    }
    else if (segToSet === ".dseg") {
      seg = this.dseg;
    }
    else if (segToSet === ".eseg") {
      seg = this.eseg;
    }

    for (let i = 0; i < subSourceCodeArray.length; i++) {
      let line = subSourceCodeArray[i];
      if ((new RegExp('seg').test(line))) {
        console.log(seg);
        return;
      }
      seg[i] = line;
    }
    console.log(seg);
  }
  setDef(line) {
    let def = line[1];
    let reg = line[3];
    this.directives[def] = reg;
  }
  setEqu(line) {
    let equ = line[1];
    let value = line[3];
    this.directives[equ] = value;
  }
  setMacro(sourceCodeArray) {
    let endMacroIndex = 0;
    let startMacroIndex = 0;
    for (let i = 0; i < sourceCodeArray.length; i++) {
      let arrayToCheck = sourceCodeArray[i];
      if (arrayToCheck[0] == '.macro') {
        startMacroIndex = i;
      }
      if (arrayToCheck[0] == ".endmacro") {
        endMacroIndex = i;
      }
    }
    let subArray = sourceCodeArray.slice(startMacroIndex, endMacroIndex);
    let macro_line = subArray.shift();
    let macro_def = macro_line[1];
    this.directives[macro_def] = [];
    
    for (let line of subArray) {
      this.directives[macro_def].push(line);
    }
  }
}
