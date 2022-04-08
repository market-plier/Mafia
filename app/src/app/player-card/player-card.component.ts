import { Component, HostBinding, Input, OnInit } from '@angular/core';
import { GameState } from '../model/game';

@Component({
  selector: 'app-player-card',
  templateUrl: './player-card.component.html',
  styleUrls: ['./player-card.component.scss']
})
export class PlayerCardComponent implements OnInit {

  @HostBinding('class.plauerTurn')
  @Input() playerTurn = false;

  @Input() onVote = false;
  @Input() ready = false;
  @Input() position?: number;
  @Input() voteCount = 0;
  @Input() voteChoise?: number;
  @Input() mediaStream?: MediaStream;
  @Input() name?: string;
  @Input() gameState?: string;
  state = GameState;

     toEmoji(str: any) {
      if (str === undefined || str === null || str === '') {
        return str;
      }
  
      if (typeof str !== 'string') {
        str = str.toString();
      }
  
      if (str === '10') {
        return '🔟';
      }
  
      return str
        .replace(/0/g, '0️⃣')
        .replace(/1/g, '1️⃣')
        .replace(/2/g, '2️⃣')
        .replace(/3/g, '3️⃣')
        .replace(/4/g, '4️⃣')
        .replace(/5/g, '5️⃣')
        .replace(/6/g, '6️⃣')
        .replace(/7/g, '7️⃣')
        .replace(/8/g, '8️⃣')
        .replace(/9/g, '9️⃣');
    }

  constructor() { }


  ngOnInit(): void {
  }

}
