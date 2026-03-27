let video;
let currentStream = null;

function initCameraElement(){
  video = document.getElementById("video");
}

async function startCamera(){

  try {

    // 🔥 stop old stream
    if(currentStream){
      currentStream.getTracks().forEach(t=>t.stop());
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: "environment"
      },
      audio:false
    });

    currentStream = stream;

    video.srcObject = stream;

    await video.play();

    console.log("✅ Camera started");

  } catch(err) {

    console.error("❌ Camera error:", err);
    alert("Camera error: " + err.message);

  }
}

async function startCameraDirect(){

  try {

    if(currentStream){
      currentStream.getTracks().forEach(t=>t.stop());
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment" },
      audio:false
    });

    currentStream = stream;
    video.srcObject = stream;

    await video.play();

    console.log("✅ iPhone camera started");

    // 🔥 start loop หลังจากเปิดกล้อง
    isCameraOn = true;
    resetApp();
    startLoop();

  } catch(err) {

    console.error("❌ Camera error:", err);
    alert("Camera blocked: " + err.message);

  }
}
