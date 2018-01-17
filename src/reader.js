export class Reader {
	constructor() {
    this.lastRead = '';
    this.lastCodeArray = [];
	}

	/**
	* Sanitizes the input for the Reader.
	* This method will return an array of strings to
	* be read
	* @param input - string
	* @return array of strings
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
}
