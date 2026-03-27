let video;

function initCameraElement(){
  video = document.getElementById('video');
}

async function startCamera(){

  try{

    // 🔥 FIX iOS: ต้องเรียกจาก user gesture + ใช้ constraints แบบนี้
    const constraints = {
      audio:false,
      video:{
        facingMode: "environment",   // fallback universal
        width: { ideal: 1280 },
        height:{ ideal: 720 }
      }
    };

    const stream = await navigator.mediaDevices.getUserMedia(constraints);

    video.srcObject = stream;

    await video.play();

    console.log("✅ Camera started (rear preferred)");

  }catch(err){
    alert("Camera error: " + err.message);
    console.error(err);
  }
}