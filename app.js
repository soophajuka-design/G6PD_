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

  try{

    // ===== TRY BACK CAMERA =====
    stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: "environment" }
      },
      audio:false
    });

  }catch(e){

    debug("Fallback camera");

    // ===== FALLBACK =====
    stream = await navigator.mediaDevices.getUserMedia({
      video:true
    });
  }

  video.srcObject = stream;

  video.onloadedmetadata = () => {
    video.play();
  };

  cameraOn = true;
  camBtn.innerText = "Stop Camera";
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