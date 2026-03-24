const video = document.getElementById("video");
const overlay = document.getElementById("overlay");
const viewer = document.getElementById("viewer");
const resultBox = document.getElementById("result");

let stream = null;
let isCaptured = false;

// ===== CAMERA START (FIX iPad) =====
async function startCamera(){

  try{

    // 🔥 ต้อง reset ก่อน
    if(stream){
      stream.getTracks().forEach(t=>t.stop());
      stream = null;
    }

    resultBox.textContent = "⏳ Starting camera...";

    stream = await navigator.mediaDevices.getUserMedia({
      video:{
        facingMode:{ ideal:"environment" },
        width:{ ideal:1280 },
        height:{ ideal:720 }
      },
      audio:false
    });

    video.srcObject = stream;

    // 🔥 สำคัญมากสำหรับ iPad
    video.setAttribute("playsinline", true);
    video.muted = true;

    // 🔥 wait metadata
    await new Promise(resolve=>{
      video.onloadedmetadata = () => resolve();
    });

    await video.play();

    syncCanvas();

    isCaptured = false;

    resultBox.textContent = "✅ Camera ON";

  }catch(err){

    console.log(err);

    if(err.name === "NotAllowedError"){
      resultBox.textContent = "❌ ไม่อนุญาตใช้กล้อง";
    }else if(err.name === "NotFoundError"){
      resultBox.textContent = "❌ ไม่พบกล้อง";
    }else{
      resultBox.textContent = "❌ Camera error";
    }
  }
}

// ===== STOP =====
function stopCamera(){

  if(stream){
    stream.getTracks().forEach(t=>t.stop());
    stream = null;
  }

  video.srcObject = null;

  resultBox.textContent = "⛔ Camera OFF";
}

// ===== SYNC =====
function syncCanvas(){
  const rect = viewer.getBoundingClientRect();
  overlay.width = rect.width;
  overlay.height = rect.height;
}

// ===== CAPTURE (SAFE) =====
async function captureFrame(){

  if(!video.srcObject){
    resultBox.textContent = "⚠️ Start camera first";
    return;
  }

  if(video.readyState < 2){
    resultBox.textContent = "⏳ Waiting video...";
    return;
  }

  await new Promise(r=>setTimeout(r,200));

  const w = video.videoWidth;
  const h = video.videoHeight;

  if(!w || !h){
    resultBox.textContent = "❌ video size = 0";
    return;
  }

  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;

  const ctx = c.getContext("2d");
  ctx.drawImage(video,0,0,w,h);

  cachedFrame = ctx.getImageData(0,0,w,h);
  cachedGray = toGray(cachedFrame);

  video.pause(); // freeze
  isCaptured = true;

  resultBox.textContent = "✅ Captured";
}

// ===== GRAY =====
function toGray(img){
  const g = new Uint8ClampedArray(img.width*img.height);
  for(let i=0,j=0;i<img.data.length;i+=4,j++){
    g[j]=(img.data[i]+img.data[i+1]+img.data[i+2])/3;
  }
  return g;
}