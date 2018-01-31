import tokens from 'text!token-type.json'

export class Scanner {

	constructor() {
    this.tokens = JSON.parse(tokens);
    console.log(this.tokens);
    
    this.token_reg_exes = {};
    for (let token_key in this.tokens) {
      let token = this.tokens[token_key];
      console.log(token);
      
      this.token_reg_exes[token["token"]] = new RegExp(token["reg_ex"]);
    }
    console.log(this.token_reg_exes);
    
  }
  
  Scan(token) {
    console.log(token);
  }

  Error(line, message) {
    console.log(line, message);
  }
}
