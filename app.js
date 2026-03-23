const video = document.getElementById('video');
const overlay = document.getElementById('overlay');
const octx = overlay.getContext('2d');
const camBtn = document.getElementById('camBtn');

let stream = null;
let cameraOn = false;

// ===== CAMERA =====
async function startCamera() {
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: "user" }
      }
    });
    video.srcObject = stream;
    cameraOn = true;
    camBtn.innerText = "Stop Camera";
  } catch (err) {
    alert("Camera error: " + err);
  }
}

function stopCamera() {
  if (stream) stream.getTracks().forEach(t => t.stop());
  video.srcObject = null;
  cameraOn = false;
  camBtn.innerText = "Start Camera";
}

function toggleCamera() {
  cameraOn ? stopCamera() : startCamera();
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

  octx.save();
  octx.translate(320, 0);
  octx.scale(-1, 1);

  ROIs.forEach((roi,i)=>{
    octx.beginPath();
    octx.arc(roi.x+15, roi.y+15, 20, 0, Math.PI*2);
    octx.strokeStyle = ["#00ff00","#ffff00","#ff0000"][i];
    octx.lineWidth = 3;
    octx.stroke();

    octx.fillStyle="white";
    octx.fillText(roi.name, roi.x, roi.y-5);
  });

  octx.restore();
}

(function loop(){ drawOverlay(); requestAnimationFrame(loop); })();

// ===== FLUORESCENCE =====
function getF(ctx,x,y){
  let size=30;
  let d=ctx.getImageData(x,y,size,size).data;

  let r=0,g=0,b=0,c=0;
  for(let i=0;i<d.length;i+=4){
    r+=d[i]; g+=d[i+1]; b+=d[i+2]; c++;
  }
  if(c===0) return 0;

  r/=c; g/=c; b/=c;

  let sum = r+g+b+1;
  let f1 = b/sum;
  let f2 = (b-(r+g)/2)/sum;

  return (f1*0.7 + f2*0.3);
}

// ===== AUTO DETECT (IMPROVED) =====
function autoDetect(){
  if (!cameraOn || !video.videoWidth) {
    alert("Camera not ready");
    return;
  }

  const canvas=document.getElementById('canvas');
  const ctx=canvas.getContext('2d');

  ctx.drawImage(video,0,0,320,320);
  const data = ctx.getImageData(0,0,320,320).data;

  let pts=[];

  for(let y=0;y<320;y+=6){
    for(let x=0;x<320;x+=6){
      let i=(y*320+x)*4;
      let r=data[i], g=data[i+1], b=data[i+2];
      let f=b/(r+g+b+1);

      if(f>0.45 && b>60){
        pts.push({x,y,f});
      }
    }
  }

  if(pts.length<20){
    alert("Detect failed");
    return;
  }

  pts.sort((a,b)=>b.f-a.f);
  let top=pts.slice(0,100);
  top.sort((a,b)=>a.x-b.x);

  let centers=[
    {...top[0]},
    {...top[Math.floor(top.length/2)]},
    {...top[top.length-1]}
  ];

  for(let k=0;k<5;k++){
    let g=[[],[],[]];

    top.forEach(p=>{
      let d0=Math.abs(p.x-centers[0].x);
      let d1=Math.abs(p.x-centers[1].x);
      let d2=Math.abs(p.x-centers[2].x);

      let idx=0;
      if(d1<d0&&d1<d2) idx=1;
      else if(d2<d0&&d2<d1) idx=2;

      g[idx].push(p);
    });

    for(let i=0;i<3;i++){
      if(g[i].length===0) continue;
      let sx=0, sy=0;
      g[i].forEach(p=>{sx+=p.x; sy+=p.y;});
      centers[i]={x:sx/g[i].length,y:sy/g[i].length};
    }
  }

  centers.sort((a,b)=>a.x-b.x);

  for(let i=0;i<3;i++){
    ROIs[i].x=Math.round(centers[i].x);
    ROIs[i].y=Math.round(centers[i].y);
  }
}

// ===== CAPTURE + QC =====
function capture(){

  if(!cameraOn){ alert("Start camera first"); return; }
  if(!video.videoWidth){ alert("Camera not ready"); return; }

  const canvas=document.getElementById('canvas');
  const ctx=canvas.getContext('2d');

  //ctx.drawImage(video,0,0,320,320);
ctx.save();

// flip horizontal
ctx.translate(320, 0);
ctx.scale(-1, 1);

ctx.drawImage(video, 0, 0, 320, 320);

ctx.restore();
  let val={};
  ROIs.forEach(r=>{
    val[r.name]=getF(ctx,r.x,r.y);
  });

  let Fn=val.Normal;
  let Fs=val.Sample;
  let Fd=val.Deficient;

  let ratio=(Fs-Fd)/((Fn-Fd)+0.001);

  let sampleResult="Complete Deficient";
  if(ratio>0.8) sampleResult="Normal";
  else if(ratio>0.4) sampleResult="Partial Deficient";

  let normalCtrl = (Fn>0.5)?"Pass":"Fail";
  let deficientCtrl = (Fd<0.2)?"Pass":"Fail";
  let delta = Fn-Fd;
  let validSignal = (delta>0.25);

  let validity="VALID";
  if(normalCtrl==="Fail"||deficientCtrl==="Fail"||!validSignal){
    validity="INVALID";
  }

  if(validity==="INVALID"){
    alert("Invalid test run กรุณาทดสอบใหม่");
    return;
  }

  document.getElementById('result').innerText =
`Sample: ${sampleResult}
Ratio: ${ratio.toFixed(2)}

Normal Ctrl: ${normalCtrl}
Deficient Ctrl: ${deficientCtrl}
Δ Signal: ${delta.toFixed(2)}

Result: ${validity}`;
}
