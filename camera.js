let video;
let currentStream = null;

function initCameraElement(){
  video = document.getElementById("video");
}

async function startCameraDirect(){

  try {

    if(!navigator.mediaDevices){
      alert("Camera API not supported");
      return;
    }

    if(currentStream){
      currentStream.getTracks().forEach(t=>t.stop());
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: "environment" }
      },
      audio:false
    });

    currentStream = stream;

    video.srcObject = stream;

    await video.play();

    console.log("✅ Camera started");

    isCameraOn = true;
    resetApp();
    startLoop();

  } catch(err) {

    console.error("❌ Camera error:", err);

    alert(
      "Camera blocked\n\n" +
      "1. Use Safari\n" +
      "2. Use HTTPS\n" +
      "3. Allow Camera in Settings\n\n" +
      "Error: " + err.message
    );
  }
}

window.startCameraDirect = startCameraDirect;
