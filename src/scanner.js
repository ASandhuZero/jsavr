import tokens from 'text!token-type.json'

export class Scanner {

	constructor() {
    // this.tokens = JSON.parse(tokens);
    // console.log(this.tokens);
    
    // this.token_reg_exes = {};

    // for (let token_key in this.tokens) {
    //   let token = this.tokens[token_key];
    //   console.log(token);
      
    //   this.token_reg_exes[token["token"]] = new RegExp(token["reg_ex"]);
    // }
    // for (let reg in this.token_reg_exes) {
    //   console.log(reg);
      
      
    // }
    
  }
  
  Scan(line) {
    console.log(line.split(""));
    for (let char of line.split("")) {
      if (char == " ") {
        console.log(char);
      }
    }
    
    console.log(line);
  }

  Error(line, message) {
    console.log(line, message);
  }
}
