import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { RtcService } from '../service/rtc.service';
import { map, mapTo, tap } from 'rxjs/operators';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.scss']
})
export class GameComponent implements OnInit {

  form: FormGroup;
  videos$: Observable<any[]>;
  constructor(private rtc: RtcService ) {
        this.form = new FormGroup({
          playerName: new FormControl('', Validators.required)
        })
        this.videos$ = rtc.videos$.pipe(
          map(x => Array.from(x.values()))
        );
  }

  getMyStream(){
    return this.rtc.myStream;
  }

  ngOnInit(): void {
    if (this.rtc.username){
      this.rtc.initialize();
    }
  }

  hasName(){
    return this.rtc.username
  }

  joinRoom(){
    sessionStorage.setItem( 'username', this.form.get('playerName')?.value);
    this.rtc.initialize();
  }
  ready(){
    this.rtc.sendReady();
  }
}
