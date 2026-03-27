let video;
let streamRef = null;

function initCameraElement(){
  video = document.getElementById("video");
}

async function startCamera(){

  // 🔥 stop old camera
  if(streamRef){
    streamRef.getTracks().forEach(t=>t.stop());
  }

  const stream = await navigator.mediaDevices.getUserMedia({
    video:{ facingMode:{ideal:"environment"} }
  });

  streamRef = stream;
  video.srcObject = stream;

  return new Promise(resolve=>{
    video.onloadedmetadata = ()=>{
      video.play();
      resolve();
    };
  });
}

function captureFrame(){
  let canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  let ctx = canvas.getContext("2d");
  ctx.drawImage(video,0,0);

  return canvas;
}let video;

function initCameraElement(){
  video = document.getElementById("video");
}

async function startCamera(){

  const stream = await navigator.mediaDevices.getUserMedia({
    video: {
      facingMode: { ideal: "environment" }
    }
  });

  video.srcObject = stream;

  return new Promise(resolve=>{
    video.onloadedmetadata = ()=>{
      video.play();
      resolve();
    };
  });
}

function captureFrame(){

  let canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  let ctx = canvas.getContext("2d");
  ctx.drawImage(video,0,0);

  return canvas;
}
