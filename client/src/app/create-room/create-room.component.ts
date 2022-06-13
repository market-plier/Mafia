import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Guid } from 'guid-typescript';
import { HelperService } from '../service/helper.service';
@Component({
  selector: 'app-create-room',
  templateUrl: './create-room.component.html',
  styleUrls: ['./create-room.component.scss'],
  host: {'class': 'container'}
})
export class CreateRoomComponent implements OnInit {

  form: FormGroup ;

  constructor(private formBuilder: FormBuilder, private helpers: HelperService,private router: Router) {
    this.form = formBuilder.group({
      playerName: ['',[Validators.required]]
    })
   }

  ngOnInit(): void {
  }

  createRoom(){
    sessionStorage.setItem( 'username', this.form.get('playerName')?.value);
    let roomLink = Guid.create().toString();
    console.log(roomLink);
    let playerName = sessionStorage.getItem('username');
        console.log(playerName);
    this.router.navigate(['/room'], { queryParams: {room: roomLink} })
  }
}
