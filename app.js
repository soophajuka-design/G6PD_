const video = document.getElementById("video");
const overlay = document.getElementById("overlay");
const viewer = document.getElementById("viewer");
const resultBox = document.getElementById("result");

let stream=null;
let samples=[];
let cachedFrame=null;
let cachedGray=null;

let isCaptured=false;
let control={normal:null,deficient:null};

const SAMPLE_RADIUS=25;
const MAX_SAMPLES=20;

// ===== CAMERA =====
async function startCamera(){

  isCaptured=false;

  stream = await navigator.mediaDevices.getUserMedia({
    video:{ facingMode:{ ideal:"environment"} }
  });

  video.srcObject=stream;

  video.onloadedmetadata=()=>{
    video.play();
    syncCanvas();
  };

  resultBox.textContent="📷 Camera ready";
}

function stopCamera(){
  if(stream){
    stream.getTracks().forEach(t=>t.stop());
    stream=null;
  }
  video.srcObject=null;
}

// ===== SYNC =====
function syncCanvas(){
  overlay.width=viewer.clientWidth;
  overlay.height=viewer.clientHeight;
}

// ===== CAPTURE (FREEZE) =====
async function captureFrame(){

  if(!video.srcObject){
    resultBox.textContent="⚠️ Start camera first";
    return;
  }

  await new Promise(r=>setTimeout(r,300));

  const w=video.videoWidth;
  const h=video.videoHeight;

  const c=document.createElement("canvas");
  c.width=w; c.height=h;

  const ctx=c.getContext("2d");
  ctx.drawImage(video,0,0,w,h);

  cachedFrame=ctx.getImageData(0,0,w,h);
  cachedGray=toGray(cachedFrame);

  video.pause();
  isCaptured=true;

  resultBox.textContent="✅ Captured (Frozen)";
}

// ===== GRAY =====
function toGray(img){
  const g=new Uint8ClampedArray(img.width*img.height);
  for(let i=0,j=0;i<img.data.length;i+=4,j++){
    g[j]=(img.data[i]+img.data[i+1]+img.data[i+2])/3;
  }
  return g;
}

// ===== RGB =====
function readRGB(frame,cx,cy,r){

  let R=0,G=0,B=0,count=0;

  const rect=overlay.getBoundingClientRect();
  const scale=frame.width/rect.width;

  const x0=cx*scale, y0=cy*scale, rr=r*scale;

  for(let y=-rr;y<=rr;y++){
    for(let x=-rr;x<=rr;x++){

      if(x*x+y*y<=rr*rr){

        const px=Math.floor(x0+x);
        const py=Math.floor(y0+y);

        if(px<0||py<0||px>=frame.width||py>=frame.height) continue;

        const i=(py*frame.width+px)*4;

        R+=frame.data[i];
        G+=frame.data[i+1];
        B+=frame.data[i+2];
        count++;
      }
    }
  }

  return {r:R/count,g:G/count,b:B/count};
}

// ===== INTENSITY =====
function intensity(rgb){
  return rgb.g/(rgb.r+rgb.g+rgb.b+0.001);
}

// ===== AUTO CONTROL =====
function autoAssignControl(){

  if(samples.length<2) return;

  const arr = samples.map(s=>({s,v:intensity(s.rgb)}));

  arr.sort((a,b)=>b.v-a.v);

  control.normal = arr[0].s;
  control.deficient = arr[arr.length-1].s;

  drawAll();
  updateResult();
}

// ===== CALC =====
function calculate(){

  if(!control.normal||!control.deficient) return null;

  const N=intensity(control.normal.rgb);
  const D=intensity(control.deficient.rgb);

  if(N<=D) return null;

  return samples.map((s,i)=>{
    const S=intensity(s.rgb);
    let ratio=(S-D)/((N-D)+0.001);

    let res="Deficient";
    if(ratio>0.8) res="Normal";
    else if(ratio>0.4) res="Partial";

    return {i,ratio:ratio.toFixed(2),res};
  });
}

// ===== DRAW =====
function drawAll(){

  const ctx=overlay.getContext("2d");
  ctx.clearRect(0,0,overlay.width,overlay.height);

  samples.forEach((s,i)=>{

    ctx.strokeStyle="white";
    ctx.beginPath();
    ctx.arc(s.x,s.y,s.r,0,Math.PI*2);
    ctx.stroke();

    const x=s.x+6,y=s.y-6;

    ctx.fillStyle="yellow";
    const t=`#${i}`;
    ctx.fillText(t,x,y);

    const w=ctx.measureText(t).width;

    if(control.normal===s){
      ctx.fillStyle="lime";
      ctx.fillText(" N",x+w,y);
    }

    if(control.deficient===s){
      ctx.fillStyle="red";
      ctx.fillText(" D",x+w,y);
    }
  });
}

// ===== RESULT =====
function updateResult(){

  const res=calculate();

  if(!res){
    resultBox.textContent="⚠️ Set control";
    return;
  }

  let txt="";
  res.forEach(r=>{
    txt+=`#${r.i} ${r.res} (${r.ratio})\n`;
  });

  resultBox.textContent=txt;
}

// ===== RESET =====
function resetSamples(){
  samples=[];
  control={normal:null,deficient:null};
  drawAll();
}