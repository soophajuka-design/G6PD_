let video;
let currentStream = null;

function startCameraDirect(){

  video = document.getElementById("video");

  if(!navigator.mediaDevices){
    alert("Camera not supported");
    return;
  }

  navigator.mediaDevices.getUserMedia({
    video: { facingMode: "environment" },
    audio:false
  })
  .then(stream => {

    if(currentStream){
      currentStream.getTracks().forEach(t=>t.stop());
    }

    currentStream = stream;
    video.srcObject = stream;

    return video.play();
  })
  .then(()=>{

    console.log("✅ Camera started");

    isCameraOn = true;
    resetApp();
    startLoop();

  })
  .catch(err=>{
    console.error(err);
    alert(err.name + ": " + err.message);
  });
}

window.startCameraDirect = startCameraDirect;
