import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { timeout } from 'rxjs/operators';
import { io } from 'socket.io-client';
import { GameData, PlayerWe, Roles } from '../model/game';
import { RoleDialogComponent } from '../role-dialog/role-dialog.component';
import { HelperService } from './helper.service';
@Injectable({
  providedIn: 'root',
})
export class RtcService {
  room: any;
  username: string | null = '';
  peerConnection: RTCPeerConnection[] = [];
  peerConnectionIds: string[] = [];
  myStream: MediaStream | undefined;
  socketId: any;
  private videosSubject = new Subject<Map<any, any>>();
  videos$ = this.videosSubject.asObservable();
  socket = io('http://localhost:3000');
  gameData?: GameData;
  shootPosition = 0;
  intervalId: any;

  constructor(
    private h: HelperService,
    private activatedRoute: ActivatedRoute,
    private dialog: MatDialog
  ) {
    this.socket.on('connect', () => {
      this.socketId = this.socket.io.engine.id;
    });
    this.activatedRoute.queryParams.subscribe((params) => {
      this.room = params['room'];
    });
    this.username = sessionStorage.getItem('username');

    this.h.getUserFullMedia().then(async (stream) => {
      //save my stream
      this.myStream = stream;
    });
  }

  initialize() {
    this.username = sessionStorage.getItem('username');
    //set socketId

    this.socket.on('game data', (data: GameData) => {
      this.updateGameData(data);
      console.log(this.gameData);
    });

    this.socket.on('game start', (data: GameData) => {
      this.updateGameData(data);
      this.openDialog(data.player.role);
    });

    this.socket.on('detective check', (data: Roles) => {
      this.openDialog(data);
    });

    this.socket.on('don check', (data: Roles) => {
      this.openDialog(data);
    });

    this.socket.on('new user', (data: { socketId: any }) => {
      this.socket.emit('newUserStart', {
        to: data.socketId,
        sender: this.socketId,
      });
      this.init(true, data.socketId);
    });

    this.socket.on('newUserStart', (data: { sender: any }) => {
      this.init(false, data.sender);
    });

    this.socket.on(
      'ice candidates',
      async (data: {
        candidate: RTCIceCandidateInit | undefined;
        sender: any;
      }) => {
        data.candidate
          ? await this.peerConnection[data.sender].addIceCandidate(
              new RTCIceCandidate(data.candidate)
            )
          : '';
      }
    );

    this.socket.on(
      'sdp',
      async (data: { description: RTCSessionDescriptionInit; sender: any }) => {
        if (data.description.type === 'offer') {
          data.description
            ? await this.peerConnection[data.sender].setRemoteDescription(
                new RTCSessionDescription(data.description)
              )
            : '';

          this.h
            .getUserFullMedia()
            .then(async (stream) => {
              //save my stream
              this.myStream = stream;

              stream.getTracks().forEach((track) => {
                this.peerConnection[data.sender].addTrack(track, stream);
              });

              let answer = await this.peerConnection[
                data.sender
              ].createAnswer();

              await this.peerConnection[data.sender].setLocalDescription(
                answer
              );

              this.socket.emit('sdp', {
                description: this.peerConnection[data.sender].localDescription,
                to: data.sender,
                sender: this.socketId,
              });
            })
            .catch((e) => {
              console.error(e);
            });
        } else if (data.description.type === 'answer') {
          await this.peerConnection[data.sender].setRemoteDescription(
            new RTCSessionDescription(data.description)
          );
        }
      }
    );

    this.socket.on('ready', (data) => {
      const player = this.gameData?.players.find((x) => x.name === data.sender);
      if (player) {
        player.isReady = data.ready;
      }
      if (this.gameData && this.gameData.player.name === data.sender) {
        this.gameData.player.isReady = data.ready;
      }
    });
    this.socket.on('end day', (_) => {
      if (
        this.gameData?.player.role === Roles.mafia ||
        this.gameData?.player.role === Roles.don
      )
        this.startMafiaShoot();
    });

    this.socket.on('put to vote', (data) =>{
      const player = this.gameData?.players.find((x) => x.name === data.sender);
      if (player) {
        player.putOnVote = {hasPutOnVote: data.vote, showAnimation: true};
        setTimeout(() => player.putOnVote.showAnimation = false, 3000);
      }
      if (this.gameData && this.gameData.player.name === data.sender) {
        this.gameData.player.putOnVote = {hasPutOnVote: data.vote, showAnimation: true};
        setTimeout(() => this.gameData!.player.putOnVote.showAnimation = false, 3000);

      }

    });

    this.socket.on('mafia ready', (data) => {
      const player = this.gameData?.players.find((x) => x.name === data.sender);
      if (player) {
        player.isReady = data.ready;
      }
      if (this.gameData && this.gameData.player.name === data.sender) {
        this.gameData.player.isReady = data.ready;
      }
      console.log('mafia ready', data, this.gameData);
    });

    if (this.socketId) {
      this.socket.emit('subscribe', {
        room: this.room,
        socketId: this.socket.io.engine.id,
        username: this.username,
      });
    } else {
      this.socket.on('connect', () => {
        this.socket.emit('subscribe', {
          room: this.room,
          socketId: this.socket.io.engine.id,
          username: this.username,
        });
      });
    }
  }

  startMafiaShoot() {
    this.intervalId = setInterval(() => {
      this.shootPosition++;
      if (this.shootPosition > this.gameData!.players.length + 1) {
        this.sendMafiaShoot(0);
      }
    }, 5000);
  }

  updateGameData(data: GameData) {
    if (!this.gameData) {
      this.gameData = data;
      return;
    }
    const nameMediaMap = this.gameData.players.reduce(function (
      map: Map<string, MediaStream | undefined>,
      obj
    ) {
      map.set(obj.name, obj.mediaStream);
      return map;
    },
    new Map());
    this.gameData = data;
    this.gameData.players.forEach((x) => {
      x.mediaStream = nameMediaMap.get(x.name);
    });
  }
  init(createOffer: boolean, partnerName: any) {
    this.peerConnection[partnerName] = new RTCPeerConnection(
      this.h.getIceServer()
    );
    if (this.myStream) {
      this.myStream.getTracks().forEach((track) => {
        this.peerConnection[partnerName].addTrack(track, this.myStream!); //should trigger negotiationneeded event
      });
    } else {
      this.h
        .getUserFullMedia()
        .then((stream) => {
          //save my stream
          this.myStream = stream;

          stream.getTracks().forEach((track) => {
            this.peerConnection[partnerName].addTrack(track, stream); //should trigger negotiationneeded event
          });
        })
        .catch((e) => {
          console.error(`stream error: ${e}`);
        });
    }

    //create offer
    if (createOffer) {
      this.peerConnection[partnerName].onnegotiationneeded = async () => {
        let offer = await this.peerConnection[partnerName].createOffer();

        await this.peerConnection[partnerName].setLocalDescription(offer);

        this.socket.emit('sdp', {
          description: this.peerConnection[partnerName].localDescription,
          to: partnerName,
          sender: this.socketId,
        });
      };
    }

    //send ice candidate to partnerNames
    this.peerConnection[partnerName].onicecandidate = ({ candidate }) => {
      this.socket.emit('ice candidates', {
        candidate: candidate,
        to: partnerName,
        sender: this.socketId,
      });
    };

    //add
    this.peerConnection[partnerName].ontrack = (e) => {
      let str = e.streams[0];
      const peer = this.gameData?.players.find((x) => x.wsId === partnerName);
      peer && (peer.mediaStream = str);
      console.log(peer);

      // this.videos.set(partnerName, str);
      // this.videosSubject.next(this.videos);
    };

    this.peerConnection[partnerName].onconnectionstatechange = (d) => {
      switch (this.peerConnection[partnerName].iceConnectionState) {
        case 'disconnected':
        case 'failed':
          this.h.closeVideo(partnerName); //TODO
          break;

        case 'closed':
          this.h.closeVideo(partnerName);
          break;
      }
    };

    this.peerConnection[partnerName].onsignalingstatechange = (d) => {
      switch (this.peerConnection[partnerName].signalingState) {
        case 'closed':
          console.log("Signalling state is 'closed'");
          this.h.closeVideo(partnerName);
          break;
      }
    };
  }

  sendReady() {
    this.socket.emit('ready', {
      room: this.room,
      sender: this.username,
    });
  }

  sendNextTurn() {
    this.socket.emit('next turn', {
      room: this.room,
    });
  }

  sendMafiaReady() {
    this.socket.emit('mafia ready', {
      room: this.room,
      sender: this.username,
    });
  }

  sendDonCheck(position: number) {
    this.socket.emit('don check', {
      room: this.room,
      position,
    });
  }
  sendDetectiveCheck(position: number) {
    this.socket.emit('detective check', {
      room: this.room,
      position,
    });
  }

  sendMafiaShoot(position: number) {
    clearInterval(this.intervalId);
    this.socket.emit('shoot', {
      room: this.room,
      position,
      sender: this.username,
    });
    this.shootPosition = 0;
  }

  sendPutToVote(position: number){
    this.socket.emit('put to vote', {
      room: this.room,
      position,
      sender: this.username
    });
  }

  openDialog(role: Roles): void {
    const dialogRef = this.dialog.open(RoleDialogComponent, {
      width: '400px',
      data: role,
    });
    dialogRef.afterOpened().subscribe((_) => {
      setTimeout(() => {
        dialogRef.close();
      }, 5000);
    });
  }
}
