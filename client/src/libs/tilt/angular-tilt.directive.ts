import { VanillaTiltSettings } from "./angular-tilt-settings.model";
import { Directive, ElementRef, Input } from "@angular/core";
import { VanillaTilt } from "./angular-tilt";

@Directive({
  selector: "[aTilt]"
})
export class AngularTiltDirective {
  tilt: any;
  @Input("tiltSettings") tiltSettings: VanillaTiltSettings | undefined;
  constructor(private el: ElementRef) {}

  ngOnInit() {
    this.tilt = new VanillaTilt(this.el.nativeElement, this.tiltSettings);
  }
}
