import tokens from 'text!token-type.json'
export class Scanner {
	constructor() {
    this.tokens = JSON.parse(tokens);
    this.token_reg_exes = {}
    console.log(this.tokens);

   for (let token_name in this.tokens) {
     let token_contents = this.tokens[token_name];
     let reg_ex_string = token_contents["reg_ex"];
     let reg_ex = new RegExp(reg_ex_string);
     if (reg_ex.test(" ")) {
       console.log("This works!");
     }
   }
  }
  Scan(token) {
    console.log(token);
    
  }

  Error(line, message) {
    console.log(line, message);
  }
}
