import { Injectable } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { timeout } from 'rxjs/operators';
import { io } from 'socket.io-client';
import { HelperService } from './helper.service';
@Injectable({
  providedIn: 'root',
})
export class RtcService {
  room: any;
  username: string | null = '';
  randomNumber: string = '';
  peerConnection: RTCPeerConnection[] = [];
  peerConnectionIds: string[] = [];
  screen: MediaStream | undefined;
  myStream: MediaStream | undefined;
  socketId: any;
  videos = new Map();
  private videosSubject = new Subject<Map<any,any>>();
  videos$ = this.videosSubject.asObservable();
  socket = io('http://localhost:3000');
  constructor(
    private h: HelperService,
    private activatedRoute: ActivatedRoute
  ) {
    this.activatedRoute.queryParams.subscribe((params) => {
      this.room = params['room'];
    });
    this.username = sessionStorage.getItem('username');
    this.h
    .getUserFullMedia()
    .then(async (stream) => {
      //save my stream
      this.myStream = stream;
    });
  }

  initialize() {
    this.username = sessionStorage.getItem('username');
    this.randomNumber = `__${this.h.generateRandomString()}__${this.h.generateRandomString()}__`; //TODO smth with dat
    //set socketId
    this.socketId = this.socket.io.engine.id;

    this.socket.on('game data', (data) => {
      console.log(data);
    });

    this.socket.on('new user', (data: { socketId: any }) => {
      console.log('new user');
      this.socket.emit('newUserStart', {
        to: data.socketId,
        sender: this.socketId,
      });
      this.init(true, data.socketId);
    });

    this.socket.on('newUserStart', (data: { sender: any }) => {
      console.log('newUserStart');
      this.init(false, data.sender);
    });

    this.socket.on(
      'ice candidates',
      async (data: {
        candidate: RTCIceCandidateInit | undefined;
        sender: any;
      }) => {
        console.log('ice candidates');
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
        console.log('sdp');
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

    setTimeout(() => {
      this.socket.emit('subscribe', {
        room: this.room,
        socketId: this.socketId,
        username: `${this.username} (${this.randomNumber})`,
      })
    }, 1);
  }
  init(createOffer: boolean, partnerName: any) {
    this.peerConnection[partnerName] = new RTCPeerConnection(
      this.h.getIceServer()
    );
    if (this.screen && this.screen.getTracks().length) {
      this.screen.getTracks().forEach((track) => {
        this.peerConnection[partnerName].addTrack(track, this.screen!); //should trigger negotiationneeded event
      });
    } else if (this.myStream) {
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
      this.videos.set(partnerName, str);
      this.videosSubject.next(this.videos);
    };

    this.peerConnection[partnerName].onconnectionstatechange = (d) => {
      switch (this.peerConnection[partnerName].iceConnectionState) {
        case 'disconnected':
        case 'failed':
          this.h.closeVideo(partnerName);//TODO
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
  sendMsg(msg: any) {
    let data = {
      room: this.room,
      msg: msg,
      sender: `${this.username} (${this.randomNumber})`,
    };
  }

  sendReady() {
    this.socket.emit('ready', {
      room: this.room,
      sender: `${this.username} (${this.randomNumber})`,
    });
  }

}
