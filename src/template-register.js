export class TemplateRegister {
  
  constructor(id) {
    this.id = id
    this.value = 0;
    this.previous_values = {};
  }

  setPreviousValue(value, programCounter) {
    if (this.value != value) {
      this.previous_values[programCounter] = value;
    }
  }
}
