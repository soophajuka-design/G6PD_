let video;
let currentStream = null;

function initCameraElement(){
  video = document.getElementById("video");
}

// 🔥 MUST be direct call from click
async function startCameraDirect(){

  try {

    if(currentStream){
      currentStream.getTracks().forEach(t=>t.stop());
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment" },
      audio: false
    });

    currentStream = stream;
    video.srcObject = stream;

    await video.play();

    console.log("✅ Camera started");

    // 🔥 start system
    isCameraOn = true;
    resetApp();
    startLoop();

  } catch(err) {

    console.error("❌ Camera error:", err);
    alert("Camera blocked: " + err.message);

  }
}

window.startCameraDirect = startCameraDirect;
