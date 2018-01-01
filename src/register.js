import {customAttribute} from 'aurelia-framework';
import {inject} from 'aurelia-framework';
@customAttribute('register')
@inject(Element)
export class Register {
  constructor(element) {
    this.element = element;
    console.log(this);
    
    // this.style.width = this.style.height = '100px';
  }
}
