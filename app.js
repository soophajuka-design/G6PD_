const video = document.getElementById('video');
const overlay = document.getElementById('overlay');
const octx = overlay.getContext('2d');
const camBtn = document.getElementById('camBtn');

let stream = null;
let cameraOn = false;

// ===== CAMERA CONTROL =====
async function startCamera() {
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;
    cameraOn = true;
    camBtn.innerText = "Stop Camera";
    console.log("Camera ON");
  } catch (err) {
    alert("Camera error: " + err);
    console.error(err);
  }
}

function stopCamera() {
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
  }
  video.srcObject = null;
  cameraOn = false;
  camBtn.innerText = "Start Camera";
  console.log("Camera OFF");
}

function toggleCamera() {
  if (cameraOn) {
    stopCamera();
  } else {
    startCamera();
  }
}

// ===== ROI =====
const ROIs = [
  {name:"Normal", x:60, y:140},
  {name:"Sample", x:160, y:140},
  {name:"Deficient", x:260, y:140}
];

// ===== OVERLAY =====
function drawOverlay(){
  octx.clearRect(0,0,320,320);

  ROIs.forEach((roi, i)=>{
    octx.beginPath();
    octx.arc(roi.x+15, roi.y+15, 20, 0, Math.PI*2);
    octx.strokeStyle = ["#00ff00","#ffff00","#ff0000"][i];
    octx.lineWidth = 3;
    octx.stroke();

    octx.fillStyle = "white";
    octx.font = "12px Arial";
    octx.fillText(roi.name, roi.x, roi.y-5);
  });

  // crosshair
  octx.beginPath();
  octx.moveTo(160,0);
  octx.lineTo(160,320);
  octx.moveTo(0,160);
  octx.lineTo(320,160);
  octx.strokeStyle = "rgba(255,255,255,0.3)";
  octx.stroke();
}

function loop(){
  drawOverlay();
  requestAnimationFrame(loop);
}
loop();

// ===== ANALYSIS =====
function getF(ctx,x,y){
  let size=30;
  let d=ctx.getImageData(x,y,size,size).data;

  let r=0,g=0,b=0,c=0;

  for(let i=0;i<d.length;i+=4){
    r+=d[i];
    g+=d[i+1];
    b+=d[i+2];
    c++;
  }

  if(c===0) return 0;

  r/=c; g/=c; b/=c;

  return b/(r+g+b);
}

// ===== CAPTURE =====
function capture(){
  if (!cameraOn) {
    alert("Please start camera first");
    return;
  }

  if (!video.videoWidth) {
    alert("Camera not ready");
    return;
  }

  const canvas=document.getElementById('canvas');
  const ctx=canvas.getContext('2d');

  ctx.drawImage(video,0,0,320,320);

  let val={};

  ROIs.forEach(r=>{
    val[r.name]=getF(ctx,r.x,r.y);
  });

  let ratio = val.Sample / (val.Normal || 1);

  let res="Complete Deficient";

  if(ratio>0.8) res="Normal";
  else if(ratio>0.4) res="Partial Deficient";

  document.getElementById('result').innerText =
    `Ratio: ${ratio.toFixed(2)} → ${res}`;
}
// ===== AUTO DETECT =====
function autoDetect(){
  if (!cameraOn || !video.videoWidth) {
    alert("Camera not ready");
    return;
  }

  const canvas=document.getElementById('canvas');
  const ctx=canvas.getContext('2d');

  // capture frame
  ctx.drawImage(video,0,0,320,320);

  const imgData = ctx.getImageData(0,0,320,320).data;

  let candidates = [];

  // scan image (step ลดภาระ CPU)
  for(let y=0; y<320; y+=10){
    for(let x=0; x<320; x+=10){

      let idx = (y*320 + x)*4;

      let r = imgData[idx];
      let g = imgData[idx+1];
      let b = imgData[idx+2];

      let f = b/(r+g+b+1);

      // เก็บเฉพาะจุดสว่าง
      if(f > 0.4){
        candidates.push({x,y,f});
      }
    }
  }

  if(candidates.length < 3){
    alert("Detect failed");
    return;
  }

  // เรียงตามความสว่าง
  candidates.sort((a,b)=>b.f - a.f);

  // เอา top 3
  let top = candidates.slice(0,20);

  // จัดกลุ่มโดย x (ซ้าย→ขวา)
  top.sort((a,b)=>a.x - b.x);

  // เลือก 3 จุดห่างกัน
  let selected = [];
  let minDist = 50;

  top.forEach(p=>{
    if(selected.every(s=>Math.abs(s.x - p.x) > minDist)){
      selected.push(p);
    }
  });

  if(selected.length < 3){
    alert("Detect unstable");
    return;
  }

  // assign ROI
  ROIs[0].x = selected[0].x;
  ROIs[0].y = selected[0].y;

  ROIs[1].x = selected[1].x;
  ROIs[1].y = selected[1].y;

  ROIs[2].x = selected[2].x;
  ROIs[2].y = selected[2].y;

  console.log("Auto detect done");
}
