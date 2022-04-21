import { Component, Host, HostBinding, Input, OnInit, Output } from '@angular/core';
import { GameState, PutOnVote, Roles } from '../model/game';
import { HelperService } from '../service/helper.service';

@Component({
  selector: 'app-player-card',
  templateUrl: './player-card.component.html',
  styleUrls: ['./player-card.component.scss']
})
export class PlayerCardComponent implements OnInit {

  @HostBinding('class.playerTurn')
  @Input() playerTurn = false;
  @HostBinding('class.alive')
  @Input() alive = true;
  @Input() canCheckPlayer = false;
  @Input() onVote = false;
  @Input() ready = false;
  @Input() position?: number;
  @Input() voteCount = 0;
  @Input() voteChoise?: number;
  @Input() mediaStream?: MediaStream;
  @Input() name?: string;
  @Input() gameState?: GameState;
  @Input() role?: Roles;
  @Input() putOnVote?: PutOnVote;
  @Input() canPlayerPutOnVote = false;
  state = GameState;

  constructor(public helper: HelperService) { }


  ngOnInit(): void {
  }

  showVideo(){
    return this.alive && ((this.gameState === GameState.Day) ||
     (this.gameState === GameState.Lobby) ||
    ((this.gameState === this.state.MafiaMeet) && (this.role === Roles.mafia || this.role === Roles.don)) ||
    (this.gameState === GameState.DetectiveCheck && this.role === Roles.detective))
  }

  canPutOnVote(){
    return !this.onVote && this.canPlayerPutOnVote
  }

}
