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
// ===== AUTO DETECT (IMPROVED) =====
function autoDetect(){
  if (!cameraOn || !video.videoWidth) {
    alert("Camera not ready");
    return;
  }

  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');

  // capture frame
  ctx.drawImage(video,0,0,320,320);
  const data = ctx.getImageData(0,0,320,320).data;

  let points = [];

  // ===== 1) Sampling + Threshold =====
  for(let y=0; y<320; y+=6){
    for(let x=0; x<320; x+=6){

      let i = (y*320 + x)*4;

      let r = data[i];
      let g = data[i+1];
      let b = data[i+2];

      let sum = r+g+b+1;
      let f = b/sum;

      // ตัด noise: ต้องทั้ง "ฟ้าเด่น" + "สว่างพอ"
      if(f > 0.45 && b > 60){
        points.push({x,y,f});
      }
    }
  }

  if(points.length < 20){
    alert("Detect failed (low signal)");
    return;
  }

  // ===== 2) เลือก top intensity =====
  points.sort((a,b)=>b.f - a.f);
  let top = points.slice(0,100);

  // ===== 3) K-means clustering (k=3 แบบง่าย) =====
  // init seeds (ซ้าย กลาง ขวา)
  top.sort((a,b)=>a.x - b.x);

  let centers = [
    {...top[0]},
    {...top[Math.floor(top.length/2)]},
    {...top[top.length-1]}
  ];

  for(let iter=0; iter<5; iter++){
    let groups = [[],[],[]];

    top.forEach(p=>{
      let d0 = Math.abs(p.x - centers[0].x);
      let d1 = Math.abs(p.x - centers[1].x);
      let d2 = Math.abs(p.x - centers[2].x);

      let idx = 0;
      if(d1 < d0 && d1 < d2) idx = 1;
      else if(d2 < d0 && d2 < d1) idx = 2;

      groups[idx].push(p);
    });

    // update centroid
    for(let i=0;i<3;i++){
      if(groups[i].length === 0) continue;

      let sx=0, sy=0;
      groups[i].forEach(p=>{
        sx+=p.x;
        sy+=p.y;
      });

      centers[i] = {
        x: sx/groups[i].length,
        y: sy/groups[i].length
      };
    }
  }

  // ===== 4) sort left → right =====
  centers.sort((a,b)=>a.x - b.x);

  // ===== 5) update ROIs =====
  for(let i=0;i<3;i++){
    ROIs[i].x = Math.round(centers[i].x);
    ROIs[i].y = Math.round(centers[i].y);
  }

  console.log("Auto detect improved done");
}
