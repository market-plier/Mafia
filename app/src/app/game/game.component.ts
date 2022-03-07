import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { RtcService } from '../service/rtc.service';

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.scss']
})
export class GameComponent implements OnInit {

  form: FormGroup;
  constructor(private rtc: RtcService ) { 
        this.form = new FormGroup({
          playerName: new FormControl('', Validators.required)
        })
  }

  getMyStream(){
    return this.rtc.myStream;
  }

  getVideos(){
    return this.rtc.videos.values();
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
}
