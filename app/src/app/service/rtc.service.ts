import { Injectable } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HelperService } from './helper.service';
import { io } from "socket.io-client";
@Injectable({
  providedIn: 'root'
})
export class RtcService {
  room: any;
  username: string | null='';
  randomNumber: string='';
  peerConnection: RTCPeerConnection[] = [];
  screen: MediaStream | undefined;
  myStream: MediaStream | undefined;
  socketId: any;
  socket = io('http://localhost:3000');
  constructor(private h: HelperService, private activatedRoute: ActivatedRoute) {
    this.activatedRoute.queryParams.subscribe(params => {
      this.room = params['room'];
    });
    this.username = sessionStorage.getItem('username');
  }
  initialize(){
    this.username = sessionStorage.getItem('username');
    this.randomNumber = `__${this.h.generateRandomString()}__${this.h.generateRandomString()}__`; //todo smth with dat
      //set socketId
      this.socketId = this.socket.io.engine.id;
      this.socket.emit('message','message from client');

      this.socket.emit('subscribe', {
        room: this.room,
        socketId: this.socketId
      });


      this.socket.on('new user', (data: { socketId: any; }) => {
        this.socket.emit('newUserStart', { to: data.socketId, sender: this.socketId });
        this.peerConnection.push(data.socketId);
        this.init(true, data.socketId);
      });


      this.socket.on('newUserStart', (data: { sender: any; }) => {
        this.peerConnection.push(data.sender);
        this.init(false, data.sender);
      });


      this.socket.on('ice candidates', async (data: { candidate: RTCIceCandidateInit | undefined; sender: any; }) => {
        data.candidate ? await this.peerConnection[data.sender].addIceCandidate(new RTCIceCandidate(data.candidate)) : '';
      });


      this.socket.on('sdp', async (data: { description: RTCSessionDescriptionInit; sender: any; }) => {
        if (data.description.type === 'offer') {
          data.description ? await this.peerConnection[data.sender].setRemoteDescription(new RTCSessionDescription(data.description)) : '';

          this.h.getUserFullMedia().then(async (stream) => {
            this.h.setLocalStream(stream);

            //save my stream
            this.myStream = stream;

            stream.getTracks().forEach((track) => {
              this.peerConnection[data.sender].addTrack(track, stream);
            });

            let answer = await this.peerConnection[data.sender].createAnswer();

            await this.peerConnection[data.sender].setLocalDescription(answer);

            this.socket.emit('sdp', { description: this.peerConnection[data.sender].localDescription, to: data.sender, sender: this.socketId });
          }).catch((e) => {
            console.error(e);
          });
        }

        else if (data.description.type === 'answer') {
          await this.peerConnection[data.sender].setRemoteDescription(new RTCSessionDescription(data.description));
        }
      });
  }
  init(createOffer: boolean, partnerName: any) {
    this.peerConnection[partnerName] = new RTCPeerConnection(this.h.getIceServer());

    if (this.screen && this.screen.getTracks().length) {
      this.screen.getTracks().forEach((track) => {
        this.peerConnection[partnerName].addTrack(track, this.screen!);//should trigger negotiationneeded event
      });
    }

    else if (this.myStream) {
      this.myStream.getTracks().forEach((track) => {
        this.peerConnection[partnerName].addTrack(track, this.myStream!);//should trigger negotiationneeded event
      });
    }

    else {
      this.h.getUserFullMedia().then((stream) => {
        //save my stream
        this.myStream = stream;

        stream.getTracks().forEach((track) => {
          this.peerConnection[partnerName].addTrack(track, stream);//should trigger negotiationneeded event
        });

        this.h.setLocalStream(stream);
      }).catch((e) => {
        console.error(`stream error: ${e}`);
      });
    }



    //create offer
    if (createOffer) {
      this.peerConnection[partnerName].onnegotiationneeded = async () => {
        let offer = await this.peerConnection[partnerName].createOffer();

        await this.peerConnection[partnerName].setLocalDescription(offer);

        this.socket.emit('sdp', { description: this.peerConnection[partnerName].localDescription, to: partnerName, sender: this.socketId });
      };
    }



    //send ice candidate to partnerNames
    this.peerConnection[partnerName].onicecandidate = ({ candidate }) => {
      this.socket.emit('ice candidates', { candidate: candidate, to: partnerName, sender: this.socketId });
    };



    //add
    this.peerConnection[partnerName].ontrack = (e) => {
      let str = e.streams[0];
      if (document.getElementById(`${partnerName}-video`)) {
        //todo  document.getElementById( `${ partnerName }-video` ).srcObject = str;
      }

      else {
        //video elem
        let newVid = document.createElement('video');
        newVid.id = `${partnerName}-video`;
        newVid.srcObject = str;
        newVid.autoplay = true;
        newVid.className = 'remote-video';

        //video controls elements
        let controlDiv = document.createElement('div');
        controlDiv.className = 'remote-video-controls';
        controlDiv.innerHTML = `<i class="fa fa-microphone text-white pr-3 mute-remote-mic" title="Mute"></i>
                <i class="fa fa-expand text-white expand-remote-video" title="Expand"></i>`;

        //create a new div for card
        let cardDiv = document.createElement('div');
        cardDiv.className = 'card card-sm';
        cardDiv.id = partnerName;
        cardDiv.appendChild(newVid);
        cardDiv.appendChild(controlDiv);

        //put div in main-section elem
        //todo document.getElementById( 'videos' ).appendChild( cardDiv );

      }
    };



    this.peerConnection[partnerName].onconnectionstatechange = (d) => {
      switch (this.peerConnection[partnerName].iceConnectionState) {
        case 'disconnected':
        case 'failed':
          this.h.closeVideo(partnerName);
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
      sender: `${this.username} (${this.randomNumber})`
    }
  }


  broadcastNewTracks(stream: MediaStream, type: string, mirrorMode = true) {
    this.h.setLocalStream(stream, mirrorMode);

    let track = type == 'audio' ? stream.getAudioTracks()[0] : stream.getVideoTracks()[0];

    for (let p in this.peerConnection) {
      this.h.replaceTrack(track, this.peerConnection[p]);
    }
  }
  getAndSetUserStream() {
    this.h.getUserFullMedia().then((stream) => {
      //save my stream
      this.myStream = stream;

      this.h.setLocalStream(stream);
    }).catch((e) => {
      console.error(`stream error: ${e}`);
    });
  }
}