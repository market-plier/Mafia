import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { RtcService } from '../service/rtc.service';
import { map, mapTo, tap } from 'rxjs/operators';
import { empty, Observable } from 'rxjs';
import { GameState, PlayerWe, Roles } from '../model/game';
import { HelperService } from '../service/helper.service';

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.scss'],
})
export class GameComponent implements OnInit {
  form: FormGroup;
  gameState = GameState;
  public get gameData() {
    return this.rtc.gameData;
  }

  public get myStream() {
    return this.rtc.myStream;
  }

  get shootPosition() {
    return this.rtc.shootPosition;
  }

  set shootPosition(data) {
    this.rtc.shootPosition = data;
  }

  constructor(public rtc: RtcService, public helper: HelperService) {
    this.form = new FormGroup({
      playerName: new FormControl('', Validators.required),
    });
  }

  ngOnInit(): void {
    if (this.rtc.username) {
      this.rtc.initialize();
    }
  }

  getContent(players: any[] | undefined): any[] | undefined {
    if (players) {
    let playersCopy = [...players];
      for (let index = 0; playersCopy.length < 9; index++) {
        playersCopy.push({ type: 'empty' });
      }
      playersCopy.forEach((x) => {
        return !!x.type ? x : Object.assign(x, { type: 'player', position: players.length });
      });
      return playersCopy;
    } else {
      return Array.from(Array(9).keys()).map((x) => ({ type: 'empty' }));
    }
  }

  getOrder(position: number) {
    switch (position) {
      case 0:
        return 0;
      case 5:
        return 6;
      case 6:
        return 10;
      case 7:
        return 9;
      case 9:
        return 7;
      case 10:
        return 5;
      default:
        return position;
    }
  }

  hasName() {
    return this.rtc.username;
  }

  showMafiaReadyButton() {
    return (
      this.gameData?.gameState === this.gameState.MafiaMeet && this.isMafia()
    );
  }

  isMafia() {
    return (
      this.gameData?.player?.role === Roles.mafia ||
      this.gameData?.player?.role === Roles.don
    );
  }
  isDetective() {
    return this.gameData?.player?.role === Roles.detective;
  }

  canCheckPlayer() {
    return (
      (this.gameData?.gameState === GameState.DetectiveCheck &&
        this.gameData.player.role === Roles.detective) ||
      (this.gameData?.gameState === GameState.DonCheck &&
        this.gameData.player.role === Roles.don)
    );
  }

  joinRoom() {
    sessionStorage.setItem('username', this.form.get('playerName')?.value);
    this.rtc.initialize();
  }

  onPlayerCheck(position: number) {
    if (this.gameData?.gameState === GameState.DetectiveCheck) {
      this.rtc.sendDetectiveCheck(position);
    } else if (this.gameData?.gameState === GameState.DonCheck) {
      this.rtc.sendDonCheck(position);
    }
  }

  canPlayerPutOnVote() {
    return (
      (!this.gameData?.player.putOnVote ||
        !this.gameData?.player.putOnVote.hasPutOnVote) &&
      this.isCurrentTurn() &&
      this.gameData?.gameState === GameState.Day
    );
  }

  canPlayerVote() {
    return (
      (this.gameData?.gameState === GameState.Vote ||
        this.gameData?.gameState === GameState.SecondVote ||
        this.gameData?.gameState === GameState.VoteToHang) &&
      !this.gameData.player.hasVoted
    );
  }

  isCurrentTurn() {
    return (
      this.rtc.gameData?.player.position === this.rtc.gameData?.currentTurn
    );
  }

  onPutOnVote(position: number) {
    this.rtc.sendPutToVote(position);
  }

  onVote(position: number) {
    this.rtc.sendVote(position);
  }

  ready() {
    this.rtc.sendReady();
  }
  nextTurn() {
    this.rtc.sendNextTurn();
  }
  mafiaReady() {
    this.rtc.sendMafiaReady();
  }
  shoot(position: number) {
    this.rtc.sendMafiaShoot(position);
  }
}
