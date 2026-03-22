const video = document.getElementById('video');
const overlay = document.getElementById('overlay');
const octx = overlay.getContext('2d');

// เปิดกล้อง (เวอร์ชันเสถียร)
async function startCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true
    });
    video.srcObject = stream;
    console.log("Camera started");
  } catch (err) {
    alert("Camera error: " + err);
    console.error(err);
  }
}

startCamera();

// ROI
const ROIs = [
  {name:"Normal", x:60, y:140},
  {name:"Sample", x:160, y:140},
  {name:"Deficient", x:260, y:140}
];

// วาด overlay
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

// loop
function loop(){
  drawOverlay();
  requestAnimationFrame(loop);
}
loop();

// fluorescence
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

// capture
function capture(){
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
