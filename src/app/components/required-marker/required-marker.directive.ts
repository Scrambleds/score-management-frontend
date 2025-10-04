import { Directive, ElementRef, Input, OnInit, Renderer2 } from '@angular/core';
import { AbstractControl } from '@angular/forms';

@Directive({
  selector: '[appRequiredMarker]',
})
export class RequiredMarkerDirective implements OnInit {
  @Input() appRequiredMarker!: AbstractControl | null;

  constructor(private el: ElementRef, private renderer: Renderer2) {}

  ngOnInit() {
    if (this.appRequiredMarker && this.appRequiredMarker.validator) {
      const validator = this.appRequiredMarker.validator({} as AbstractControl);
      if (validator && validator['required']) {
        const span = this.renderer.createElement('span');
        const text = this.renderer.createText('*');
        this.renderer.setStyle(span, 'color', 'red');
        this.renderer.appendChild(span, text);
        this.renderer.appendChild(this.el.nativeElement, span);
      }
    }
  }
}