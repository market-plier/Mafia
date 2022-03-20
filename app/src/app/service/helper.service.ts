import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class HelperService {


  constructor() { }

  closeVideo( elemId: string ) {
    if ( document.getElementById( elemId ) ) {
     //TODO   document.getElementById( elemId ).remove();
    }
}
  generateRandomString() {
    const crypto = window.crypto;
    let array = new Uint32Array(1);

    return crypto.getRandomValues(array);
  }

  getQString(url = '', keyToReturn = '') {
    url = url ? url : location.href;
    let queryStrings = decodeURIComponent(url).split('#', 2)[0].split('?', 2)[1];

    if (queryStrings) {
      let splittedQStrings = queryStrings.split('&');

      if (splittedQStrings.length) {
        let queryStringObj: any = {};

        splittedQStrings.forEach(function (keyValuePair) {
          let keyValue = keyValuePair.split('=', 2);

          if (keyValue.length) {
            queryStringObj[keyValue[0]] = keyValue[1];
          }
        });

        return keyToReturn ? (queryStringObj[keyToReturn] ? queryStringObj[keyToReturn] : null) : queryStringObj;
      }

      return null;
    }

    return null;
  }

  getUserFullMedia() {
      return navigator.mediaDevices.getUserMedia({
        video: true,
        audio: {
          echoCancellation: true,
          noiseSuppression: true
        }
      });
    }


  getUserAudio() {
      return navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true
        }
      });
  }


  getIceServer() {
    return {
      iceServers: [
        {
          urls: ["stun:eu-turn4.xirsys.com"]
        },
        {
          username: "ijUXy3I07hpTqb386hCdViUnpSytt2cWTyGIEj2qrsn_TKziFtGqAMvil5HO1HU3AAAAAGIjrGNnbGVibWFrc2ltbmVrbw==",
          urls: [
            "stun:fr-turn1.xirsys.com",
            "turn:fr-turn1.xirsys.com:80?transport=udp",
            "turn:fr-turn1.xirsys.com:3478?transport=udp",
            "turn:fr-turn1.xirsys.com:80?transport=tcp",
            "turn:fr-turn1.xirsys.com:3478?transport=tcp",
            "turns:fr-turn1.xirsys.com:443?transport=tcp",
            "turns:fr-turn1.xirsys.com:5349?transport=tcp"
          ],
          credential: "6729819c-9cb2-11ec-8a35-0242ac120004"
        }
      ]
    };
  }

  replaceTrack(stream: { kind: any; }, recipientPeer: { getSenders: () => any[]; }) {
    let sender = recipientPeer.getSenders ? recipientPeer.getSenders().find(s => s.track && s.track.kind === stream.kind) : false;

    sender ? sender.replaceTrack(stream) : '';
  }

  maximiseStream(e: { target: { parentElement: { previousElementSibling: any; }; }; }) {
    let elem = e.target.parentElement.previousElementSibling;

    elem.requestFullscreen() || elem.mozRequestFullScreen() || elem.webkitRequestFullscreen() || elem.msRequestFullscreen();
  }


  singleStreamToggleMute(e: { target: { classList: { contains: (arg0: string) => any; add: (arg0: string) => void; remove: (arg0: string) => void; }; parentElement: { previousElementSibling: { muted: boolean; }; }; }; }) {
    if (e.target.classList.contains('fa-microphone')) {
      e.target.parentElement.previousElementSibling.muted = true;
      e.target.classList.add('fa-microphone-slash');
      e.target.classList.remove('fa-microphone');
    }

    else {
      e.target.parentElement.previousElementSibling.muted = false;
      e.target.classList.add('fa-microphone');
      e.target.classList.remove('fa-microphone-slash');
    }
  }
}
