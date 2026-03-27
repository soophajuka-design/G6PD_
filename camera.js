let video;
let currentStream = null;

function startCameraDirect(){

  video = document.getElementById("video");

  if(!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia){
    alert("Camera API not supported");
    return;
  }

  navigator.mediaDevices.getUserMedia({
    video: {
      facingMode: { exact: "environment" }
    },
    audio:false
  })
  .then(stream => {

    if(currentStream){
      currentStream.getTracks().forEach(t=>t.stop());
    }

    currentStream = stream;

    video.srcObject = stream;

    video.setAttribute("playsinline", true);

    return video.play();

  })
  .then(()=>{

    console.log("✅ Camera started");

    isCameraOn = true;
    resetApp();
    startLoop();

  })
  .catch(err=>{

    console.error("❌ Camera error:", err);

    alert(
      err.name + "\n" +
      err.message
    );
  });
}

window.startCameraDirect = startCameraDirect;
