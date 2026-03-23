const video = document.getElementById("video");
const camBtn = document.getElementById("camBtn");

let stream = null;
let cameraOn = false;

// ===== DEBUG =====
function debug(msg){
  document.getElementById("debug").innerText += msg + "\n";
  console.log(msg);
}

// ===== START CAMERA =====
async function startCamera(){

  debug("Start camera...");
  debug("mediaDevices: " + !!navigator.mediaDevices);

  if(!navigator.mediaDevices){
    alert("❌ ต้องเปิดผ่าน HTTPS");
    return;
  }

  try{

    // ===== SAFE MODE (สำคัญมาก) =====
    stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false
    });

    debug("Stream OK");

  }catch(e){

    debug("ERROR getUserMedia: " + e.message);
    alert("Camera error: " + e.message);
    return;
  }

  video.srcObject = stream;

  // ===== สำคัญ (iPad) =====
  video.onloadedmetadata = () => {
    video.play().then(()=>{
      debug("Video playing");
    }).catch(e=>{
      debug("Play error: " + e.message);
    });
  };

  cameraOn = true;
  camBtn.innerText = "Stop Camera";

  debug("Camera ON");
}

// ===== STOP =====
function stopCamera(){

  if(stream){
    stream.getTracks().forEach(t=>t.stop());
  }

  video.srcObject = null;
  cameraOn = false;

  camBtn.innerText = "Start Camera";

  debug("Camera OFF");
}

// ===== BUTTON =====
camBtn.addEventListener("click", async ()=>{

  if(!cameraOn){
    await startCamera();
  }else{
    stopCamera();
  }

});