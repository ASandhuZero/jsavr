import tokens from 'text!token-type.json'
export class Scanner {
	constructor() {
    this.tokens = JSON.parse(tokens);
    this.token_reg_exes = {}
    console.log(this.tokens);
   for (let token in this.tokens) {
      let reg_ex = new RegExp(token);
      console.log(reg_ex);
      let match = this.tokens[token];
      this.token_reg_exes[reg_ex] = match;
   }
   for (let token in this.tokens) {
    console.log(new RegExp(token).test(" "));
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
