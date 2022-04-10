import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { RtcService } from '../service/rtc.service';
import { map, mapTo, tap } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { GameState, Roles } from '../model/game';

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.scss']
})
export class GameComponent implements OnInit {

  form: FormGroup;
  gameState = GameState;
  public get gameData(){
    return this.rtc.gameData
  }

  public get myStream(){
    return this.rtc.myStream
  }

  constructor(private rtc: RtcService ) {
        this.form = new FormGroup({
          playerName: new FormControl('', Validators.required)
        })
  }

  ngOnInit(): void {
    console.log('on init')
    if (this.rtc.username){
      this.rtc.initialize()
    }
  }

  hasName(){
    return this.rtc.username
  }

  showMafiaReadyButton()
  {
    return this.gameData?.gameState === this.gameState.MafiaMeet && 
    (this.gameData?.player?.role === Roles.mafia || this.gameData?.player?.role === Roles.don)
  }

  joinRoom(){
    console.log('join room')
    sessionStorage.setItem( 'username', this.form.get('playerName')?.value);
    this.rtc.initialize();
  }
  ready(){
    this.rtc.sendReady();
  }
  nextTurn(){
    this.rtc.sendNextTurn();
  }
  mafiaReady(){
    this.rtc.sendMafiaReady();
  }
}
