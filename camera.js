let video;

function initCameraElement(){
  video = document.getElementById('video');
}

async function startCamera(){

  try{
    const stream = await navigator.mediaDevices.getUserMedia({
      video:true,
      audio:false
    });

    video.srcObject = stream;
    await video.play();

    console.log("Camera OK");

  }catch(err){
    alert(err.message);
  }
}

function captureFrame(){

  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  const ctx = canvas.getContext('2d');
  ctx.drawImage(video,0,0);

  return cv.imread(canvas);
}