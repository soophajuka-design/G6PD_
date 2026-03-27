let video;
let currentStream = null;

async function startCameraDirect(){

  video = document.getElementById("video");

  if(!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia){
    alert("Camera API not supported");
    return;
  }

  try {

    // 🔥 STOP กล้องเก่าก่อน (สำคัญ)
    if(currentStream){
      currentStream.getTracks().forEach(t => t.stop());
      currentStream = null;
    }

    // 🔥 ใช้ ideal ก่อน (ไม่ใช้ exact)
    let stream;

    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" }
        },
        audio:false
      });
    } catch(e) {
      console.warn("Fallback camera:", e);

      // 🔥 fallback (บาง iPhone ต้องใช้แบบนี้)
      stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio:false
      });
    }

    currentStream = stream;

    video.srcObject = stream;

    // 🔥 iOS fix
    video.setAttribute("playsinline", true);
    video.muted = true;

    await video.play();

    console.log("✅ Camera started");

    // 🔥 global state
    isCameraOn = true;

    // 🔥 reset state ทุกครั้ง
    resetApp();

    // 🔥 start render loop
    startLoop();

  } catch(err){

    console.error("❌ Camera error:", err);

    alert(
      "Camera Error\n\n" +
      err.name + "\n" +
      err.message
    );
  }
}

// 🔥 export global
window.startCameraDirect = startCameraDirect;
