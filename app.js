const video = document.getElementById("video");
const overlay = document.getElementById("overlay");
const stage = document.getElementById("stage");
const resultBox = document.getElementById("result");

const btnStart = document.getElementById("btnStart");
const btnCapture = document.getElementById("btnCapture");
const btnStop = document.getElementById("btnStop");
const btnDetect = document.getElementById("btnDetect");
const btnControl = document.getElementById("btnControl");
const btnReset = document.getElementById("btnReset");

let stream=null;
let cachedFrame=null;
let cachedGray=null;

let samples=[];
let control={normal:null,deficient:null};

let scale=1, offsetX=0, offsetY=0;

const SAMPLE_RADIUS=25;

// ===== UI STATE =====
function setUIState(state){

  btnStart.disabled = state!=="idle";
  btnCapture.disabled = state==="idle";
  btnStop.disabled = state==="idle";
  btnDetect.disabled = state!=="captured";
  btnControl.disabled = state!=="captured";
  btnReset.disabled = state==="idle";
}

setUIState("idle");

// ===== CAMERA =====
async function startCamera(){

  try{
    if(stream) stream.getTracks().forEach(t=>t.stop());

    stream = await navigator.mediaDevices.getUserMedia({
      video:{ facingMode:"environment" },
      audio:false
    });

    video.srcObject = stream;
    await video.play();

    syncCanvas();
    setUIState("camera");

    resultBox.textContent="✅ Camera ON";

  }catch(e){
    resultBox.textContent="❌ Camera error";
  }
}

function stopCamera(){

  if(stream){
    stream.getTracks().forEach(t=>t.stop());
    stream=null;
  }

  video.srcObject=null;

  cachedFrame=null;
  cachedGray=null;
  samples=[];
  control={normal:null,deficient:null};

  scale=1; offsetX=0; offsetY=0;
  stage.style.transform="none";

  overlay.getContext("2d").clearRect(0,0,overlay.width,overlay.height);

  setUIState("idle");
  resultBox.textContent="🔄 Reset complete";
}

// ===== SYNC =====
function syncCanvas(){
  overlay.width=video.clientWidth;
  overlay.height=video.clientHeight;
}

// ===== CAPTURE =====
async function captureFrame(){

  if(!video.srcObject) return;

  const w=video.videoWidth;
  const h=video.videoHeight;

  const c=document.createElement("canvas");
  c.width=w; c.height=h;

  const ctx=c.getContext("2d");
  ctx.drawImage(video,0,0,w,h);

  cachedFrame = normalizeFrame(ctx.getImageData(0,0,w,h));
  cachedGray = toGray(cachedFrame);

  video.pause();

  setUIState("captured");
  resultBox.textContent="✅ Captured";
}

// ===== NORMALIZE =====
function normalizeFrame(frame){

  const out=new Uint8ClampedArray(frame.data.length);

  for(let i=0;i<frame.data.length;i+=4){

    const avg=(frame.data[i]+frame.data[i+1]+frame.data[i+2])/3;
    const gain=128/(avg+1);

    out[i]=frame.data[i]*gain;
    out[i+1]=frame.data[i+1]*gain;
    out[i+2]=frame.data[i+2]*gain;
    out[i+3]=255;
  }

  return new ImageData(out,frame.width,frame.height);
}

// ===== TAP ADD =====
overlay.addEventListener("click",(e)=>{

  if(!cachedFrame) return;

  const rect=overlay.getBoundingClientRect();
  const x=e.clientX-rect.left;
  const y=e.clientY-rect.top;

  addCircleSmart(x,y);
});

// ===== SMART ADD =====
function addCircleSmart(cx,cy){

  const scaleF=cachedFrame.width/overlay.width;

  let x=cx*scaleF, y=cy*scaleF;

  let best={x,y}, bestScore=Infinity;

  for(let dy=-5;dy<=5;dy++){
    for(let dx=-5;dx<=5;dx++){

      let s=0;

      for(let a=0;a<360;a+=30){
        const rad=a*Math.PI/180;

        const px=Math.round(x+dx+25*Math.cos(rad));
        const py=Math.round(y+dy+25*Math.sin(rad));

        if(px<0||py<0||px>=cachedFrame.width||py>=cachedFrame.height) continue;

        s+=cachedGray[py*cachedFrame.width+px];
      }

      if(s<bestScore){
        bestScore=s;
        best={x:x+dx,y:y+dy};
      }
    }
  }

  const ox=best.x/scaleF;
  const oy=best.y/scaleF;

  const rgb=readRGB(cachedFrame,ox,oy,25);

  samples.push({x:ox,y:oy,r:25,rgb});

  drawAll();
}

// ===== IMAGE =====
function toGray(img){
  const g=new Uint8ClampedArray(img.width*img.height);
  for(let i=0,j=0;i<img.data.length;i+=4,j++){
    g[j]=(img.data[i]+img.data[i+1]+img.data[i+2])/3;
  }
  return g;
}

function readRGB(frame,cx,cy,r){

  let R=0,G=0,B=0,count=0;
  const scaleF=frame.width/overlay.width;

  const x0=cx*scaleF, y0=cy*scaleF, rr=r*scaleF;

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