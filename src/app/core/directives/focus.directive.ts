import {AfterViewInit, Directive, ElementRef, OnInit, Renderer2} from '@angular/core';

@Directive({
  selector: '[appFocus]',
  standalone: true
})
export class FocusDirective implements OnInit{

  constructor(public renderer: Renderer2, private el: ElementRef) {}

  ngOnInit(): void {
    setTimeout(() => {
      this.setFocus();
    }, 200);
  }

  private setFocus(): void {
    this.renderer.selectRootElement(this.el.nativeElement)
      .focus();
  }

}
