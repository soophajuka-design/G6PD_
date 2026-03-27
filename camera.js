let video;
let currentStream = null;

function initCameraElement(){
  video = document.getElementById("video");
}

async function startCamera(){

  // 🔥 ปิดกล้องเก่า
  if(currentStream){
    currentStream.getTracks().forEach(track=>track.stop());
  }

  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: { ideal: "environment" } }
  });

  currentStream = stream;

  video.srcObject = stream;

  return new Promise(resolve=>{
    video.onloadedmetadata = ()=>{
      video.play();
      resolve();
    };
  });
}
