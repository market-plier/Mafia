import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppComponent } from './app.component';
import { HeaderComponent } from './header/header.component';
import { CreateRoomComponent } from './create-room/create-room.component';
import { ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatFormFieldModule } from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import { AppRoutingModule } from './app-routing.module';
import { NotFoundComponent } from './not-found-component/not-found.component';
import { GameComponent } from './game/game.component';
@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    CreateRoomComponent,
    NotFoundComponent,
    GameComponent
  ],
  imports: [
    AppRoutingModule,
    BrowserModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    BrowserAnimationsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
