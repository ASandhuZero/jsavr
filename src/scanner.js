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
    // This will be used to have a mapping of the labels to line number.
    this.labels = {};
    // This will be a mapping of definitions and what they equate to.
    this.definitions = {};

    
  }
  
  Scan(scource_code_array) {
    // let index = 0;
    let temp_array = [];
    // console.log(scource_code_array);
  
    for (let i = 0; i < scource_code_array.length; i++) {
      let line = scource_code_array[i];
      line = line.split(/\s|,/);
      let array_to_push = line.filter(line => /[^\s]/.test(line));
      array_to_push = this.MakeSenseLabel(array_to_push, i);
      temp_array.push(array_to_push);
    }
    console.log(temp_array);
    return [temp_array, this.labels, this.definitions];
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
}