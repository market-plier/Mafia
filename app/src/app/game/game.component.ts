import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { RtcService } from '../service/rtc.service';
import { map, mapTo, tap } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { GameState, Roles } from '../model/game';
import { HelperService } from '../service/helper.service';

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

  get shootPosition(){
    return this.rtc.shootPosition;
  }
  set shootPosition(data){
    this.rtc.shootPosition = data;
  }

  constructor(private rtc: RtcService, public helper: HelperService ) {
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
    this.isMafia();
  }

  isMafia(){
    return this.gameData?.player?.role === Roles.mafia || this.gameData?.player?.role === Roles.don;
  }
  isDetective(){
    return this.gameData?.player?.role === Roles.detective;

  }

  canCheckPlayer(){
    return (this.gameData?.gameState === GameState.DetectiveCheck && this.gameData.player.role === Roles.detective) ||
    (this.gameData?.gameState === GameState.DonCheck && this.gameData.player.role === Roles.don)
  }

  joinRoom(){
    console.log('join room')
    sessionStorage.setItem( 'username', this.form.get('playerName')?.value);
    this.rtc.initialize();
  }

  onPlayerClick(position: number){
    console.log('click', position)
    if(this.gameData?.gameState === GameState.DetectiveCheck){
      this.rtc.sendDetectiveCheck(position);
    }
    else if(this.gameData?.gameState === GameState.DonCheck){
      this.rtc.sendDonCheck(position);
    }
  }

  canPlayerPutOnVote(){
    return (!this.gameData?.player.putOnVote || !this.gameData?.player.putOnVote.hasPutOnVote)  && this.isCurrentTurn() && this.gameData?.gameState === GameState.Day
  }

  isCurrentTurn(){
    return this.rtc.gameData?.player.position === this.rtc.gameData?.currentTurn
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
  shoot(position: number){
    this.rtc.sendMafiaShoot(position)
  }
}
