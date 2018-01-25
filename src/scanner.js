import tokens from 'text!token-type.json'

export class Scanner {

	constructor() {
    this.tokens = JSON.parse(tokens);
    this.token_reg_exes = {};
  }
  
  Scan(token) {
    console.log(token);
  }

  Error(line, message) {
    console.log(line, message);
  }
}
