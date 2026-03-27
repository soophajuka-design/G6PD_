async function startCameraDirect(){

  try {

    if(!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia){
      alert("Camera API not supported");
      return;
    }

    if(currentStream){
      currentStream.getTracks().forEach(t=>t.stop());
    }

    // 🔥 สำคัญ: ไม่ใช้ await ก่อน getUserMedia
    navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment" },
      audio:false
    })
    .then(stream => {

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

      console.error("❌ Camera error:", err);

      alert("Camera error:\n" + err.name + "\n" + err.message);

    });

  } catch(e){
    console.error(e);
  }
}
