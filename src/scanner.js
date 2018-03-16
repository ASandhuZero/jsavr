import tokens from 'text!token-type.json'

export class Scanner {

	constructor() {
    // This will keep track of the previous read input.
    this.lastRead;
    // This will be the array of data.
    this.data_array = [];
    // This will be the array of code.
    this.code_array = [];
    // This will be used to have a mapping of the labels to line number.
    this.labels = {};
    // This will be used for the directive mapping.
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
		// All this is doing is just stripping the comments.
		// Then trimming it to remove any excess whitespace.
		sanitizedArray = sanitizedArray.map(line => line.replace(/;.*/,'').trim());
		// This is removing JUST newlines from the array.
    sanitizedArray = sanitizedArray.filter(line => /[^\n]/.test(line));

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
  Scan(input) {
    // let index = 0;
    let source_code_array = this.Read(input);
    let temp_array = [];
    
    for (let i = 0; i < source_code_array.length; i++) {

      let line = source_code_array[i];
      line = line.split(/\s|,/);
      let array_to_push = line.filter(line => /[^\s]/.test(line));
      array_to_push = this.MakeSenseLabel(array_to_push, i);
      temp_array.push(array_to_push);
    }
    for (let i = 0; i < temp_array.length; i++) {
      this.MakeSenseDirective(temp_array, i);

    }
    return [temp_array, this.labels, this.directives];
  }

  MakeSenseLabel(temp_array, array_index) {
    let index_to_check = temp_array[0];
    
    if (index_to_check.indexOf(':') > -1) {
      index_to_check = index_to_check.slice(0,-1);
      this.labels[index_to_check] = array_index;
      temp_array.shift();
    }
    return temp_array;
  }

  MakeSenseDirective(source_code_array, index) {
    let line = source_code_array[index];
    
    let index_to_check = line[0];
    
    switch(index_to_check) {
      case ".def":
        this.setDef(line);
        break;
      case ".equ":
        this.setEqu(line);
        break;
      case ".macro":
        let endMacroIndex = 0;
        console.log(source_code_array);
        for (let i = 0; i < source_code_array.length; i++) {
          let array_to_check = source_code_array[i];
          
          if (array_to_check[0] == ".endmacro") {
            endMacroIndex = i;
          }
        }
        this.setMacro(source_code_array.slice(index, endMacroIndex));
        break;
    }
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
  setMacro(sub_array) {
    
    let macro_line = sub_array.shift();
    let macro_def = macro_line[1];
    this.directives[macro_def] = [];
    
    for (let line of sub_array) {
      this.directives[macro_def].push(line);
    }
  }
}
