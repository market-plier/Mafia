import { Component, HostBinding, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-button',
  templateUrl: './button.component.html',
  styleUrls: ['./button.component.scss']
})
export class ButtonComponent implements OnInit {

  @Input() text = ''

  @HostBinding('class.disabled') @Input() disabled: boolean = false;
  constructor() {

   }

  ngOnInit(): void {
  }

}
