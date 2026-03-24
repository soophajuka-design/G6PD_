const video = document.getElementById("video");
const overlay = document.getElementById("overlay");
const stage = document.getElementById("stage");
const resultBox = document.getElementById("result");

let stream=null;
let cachedFrame=null;
let cachedGray=null;

let samples=[];
let control={normal:null,deficient:null};

let isCaptured=false;

// zoom
let scale=1;
let offsetX=0;
let offsetY=0;
let lastDist=null;

const SAMPLE_RADIUS=25;
const MAX_SAMPLES=20;

// ===== CAMERA =====
async function startCamera(){
  try{

    if(stream){
      stream.getTracks().forEach(t=>t.stop());
    }

    stream = await navigator.mediaDevices.getUserMedia({
      video:{ facingMode:"environment" },
      audio:false
    });

    video.srcObject = stream;
    video.setAttribute("playsinline", true);

    await video.play();

    syncCanvas();

    resultBox.textContent="✅ Camera ON";

  }catch(e){
    console.log(e);
    resultBox.textContent="❌ Camera error";
  }
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
  overlay.width = video.clientWidth;
  overlay.height = video.clientHeight;
}

// ===== CAPTURE =====
async function captureFrame(){

  if(!video.srcObject){
    resultBox.textContent="⚠️ Start camera first";
    return;
  }

  await new Promise(r=>setTimeout(r,200));

  const w=video.videoWidth;
  const h=video.videoHeight;

  if(!w||!h){
    resultBox.textContent="❌ video not ready";
    return;
  }

  const c=document.createElement("canvas");
  c.width=w; c.height=h;

  const ctx=c.getContext("2d");
  ctx.drawImage(video,0,0,w,h);

  cachedFrame=ctx.getImageData(0,0,w,h);
  cachedGray=toGray(cachedFrame);

  video.pause();
  isCaptured=true;

  resultBox.textContent="✅ Captured";
}

// ===== TOUCH ZOOM =====
stage.addEventListener("touchmove",(e)=>{

  if(e.touches.length===2){

    const dx=e.touches[0].clientX-e.touches[1].clientX;
    const dy=e.touches[0].clientY-e.touches[1].clientY;
    const dist=Math.sqrt(dx*dx+dy*dy);

    if(lastDist){
      scale *= dist/lastDist;
      scale=Math.max(1,Math.min(4,scale));
    }

    lastDist=dist;
  }

  if(e.touches.length===1){
    offsetX += e.touches[0].movementX||0;
    offsetY += e.touches[0].movementY||0;
  }

  applyTransform();

},{passive:false});

stage.addEventListener("touchend",()=>{ lastDist=null; });

// ===== APPLY =====
function applyTransform(){
  stage.style.transform =
    `translate(${offsetX}px,${offsetY}px) scale(${scale})`;
}

// ===== IMAGE =====
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

  const scale=frame.width/overlay.width;

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

// ===== CONTROL =====
function autoAssignControl(){

  if(samples.length<2) return;

  const arr=samples.map(s=>({s,v:intensity(s.rgb)}));
  arr.sort((a,b)=>b.v-a.v);

  control.normal=arr[0].s;
  control.deficient=arr[arr.length-1].s;

  drawAll();
  updateResult();
}

// ===== INTENSITY =====
function intensity(rgb){
  return rgb.g/(rgb.r+rgb.g+rgb.b+0.001);
}

// ===== RESULT =====
function updateResult(){

  if(!control.normal||!control.deficient){
    resultBox.textContent="⚠️ Set control";
    return;
  }

  const N=intensity(control.normal.rgb);
  const D=intensity(control.deficient.rgb);

  let txt="";

  samples.forEach((s,i)=>{
    const S=intensity(s.rgb);
    let r=(S-D)/((N-D)+0.001);

    let res="Deficient";
    if(r>0.8) res="Normal";
    else if(r>0.4) res="Partial";

    txt+=`#${i} ${res} (${r.toFixed(2)})\n`;
  });

  resultBox.textContent=txt;
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

    ctx.fillStyle="yellow";
    ctx.fillText(`#${i}`,s.x+5,s.y-5);

    if(control.normal===s){
      ctx.fillStyle="lime";
      ctx.fillText("N",s.x+20,s.y-5);
    }

    if(control.deficient===s){
      ctx.fillStyle="red";
      ctx.fillText("D",s.x+20,s.y-5);
    }
  });
}

// ===== RESET =====
function resetSamples(){
  samples=[];
  control={normal:null,deficient:null};
  drawAll();
}