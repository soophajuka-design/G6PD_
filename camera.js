let video;

function initCameraElement(){
  video = document.getElementById('video');
}

async function startCamera(){

  const stream = await navigator.mediaDevices.getUserMedia({
    video:{
      facingMode:{ ideal:"environment" } // ✅ กล้องหลัง
    },
    audio:false
  });

  video.srcObject = stream;
  await video.play();

  console.log("Camera started (rear)");
}