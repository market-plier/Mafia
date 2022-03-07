import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { CreateRoomComponent } from './create-room/create-room.component';
import { NotFoundComponent } from './not-found-component/not-found.component';
import { GameComponent } from './game/game.component';


const routes: Routes = [
  { path: '', component: CreateRoomComponent },
  { path: 'room', component: GameComponent},
  {path: '404', component: NotFoundComponent},
  {path: '**', redirectTo: '/404'}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
