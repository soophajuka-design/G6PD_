const video = document.getElementById("video");
const camBtn = document.getElementById("camBtn");
const overlay = document.getElementById("overlay");
const ctx = overlay.getContext("2d");

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

    stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: "environment" }
      },
      audio:false
    });

    debug("Back camera OK");

  }catch(e){

    debug("Fallback camera");

    try{
      stream = await navigator.mediaDevices.getUserMedia({
        video:true,
        audio:false
      });
    }catch(err){
      alert("Camera error: " + err.message);
      return;
    }
  }

  video.srcObject = stream;

  video.onloadedmetadata = async () => {

    try{
      await video.play();
      debug("Video playing");
    }catch(e){
      debug("Play error: " + e.message);
    }

    overlay.width = video.videoWidth;
    overlay.height = video.videoHeight;

    const track = stream.getVideoTracks()[0];
    const settings = track.getSettings();

    if(settings.facingMode === "user"){
      video.style.transform = "scaleX(-1)";
      debug("Front camera (mirrored)");
    }else{
      video.style.transform = "none";
      debug("Back camera");
    }

    drawLoop();
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

// ===== OVERLAY =====
function drawOverlay(){

  const w = overlay.width;
  const h = overlay.height;

  ctx.clearRect(0,0,w,h);

  ctx.strokeStyle = "lime";
  ctx.lineWidth = 2;

  ctx.strokeRect(w*0.1, h*0.1, w*0.8, h*0.8);

  ctx.beginPath();
  ctx.moveTo(w/2, 0);
  ctx.lineTo(w/2, h);
  ctx.moveTo(0, h/2);
  ctx.lineTo(w, h/2);
  ctx.stroke();
}

// ===== LOOP =====
function drawLoop(){
  if(!cameraOn) return;

  drawOverlay();
  requestAnimationFrame(drawLoop);
}