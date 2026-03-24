const video = document.getElementById("video");
const overlay = document.getElementById("overlay");
const resultBox = document.getElementById("result");

let stream = null;
let samples = [];

const MAX_SAMPLES = 20;
const SAMPLE_RADIUS = 25;

let cachedFrame = null;
let cachedGray = null;

let control = { normal:null, deficient:null };
let selectMode = null;

// ===== CAMERA =====
async function startCamera(){
  stream = await navigator.mediaDevices.getUserMedia({
    video:{ facingMode:{ ideal:"environment" } }
  });

  video.srcObject = stream;

  video.onloadedmetadata = ()=>{
    video.play();
    syncCanvas();
  };
}

function stopCamera(){
  if(stream){
    stream.getTracks().forEach(t=>t.stop());
    stream=null;
  }
}

// ===== SYNC =====
function syncCanvas(){
  const rect = video.getBoundingClientRect();
  overlay.width = rect.width;
  overlay.height = rect.height;
}

// ===== CAPTURE (ONLY ONCE) =====
async function captureFrame(){

  resultBox.textContent = "⏳ Stabilizing...";

  await new Promise(r => setTimeout(r, 800));

  const c = document.createElement("canvas");
  c.width = video.videoWidth;
  c.height = video.videoHeight;

  const ctx = c.getContext("2d");
  ctx.drawImage(video,0,0);

  cachedFrame = ctx.getImageData(0,0,c.width,c.height);
  cachedGray = toGray(cachedFrame);

  resultBox.textContent = "✅ Captured — ready";
}

// ===== TAP =====
overlay.addEventListener("click", (e)=>{

  const rect = overlay.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  // ===== SELECT CONTROL =====
  if(selectMode){

    let nearest=null, min=9999;

    samples.forEach(s=>{
      const d=Math.hypot(s.x-x,s.y-y);
      if(d<min){min=d; nearest=s;}
    });

    if(nearest){
      if(selectMode==="normal") control.normal=nearest;
      if(selectMode==="deficient") control.deficient=nearest;
    }

    selectMode=null;
    drawAll();
    updateResult();
    return;
  }

  // ===== ADD SAMPLE =====
  if(!cachedFrame){
    resultBox.textContent="⚠️ Capture ก่อน";
    return;
  }

  if(samples.length>=MAX_SAMPLES){
    resultBox.textContent="❌ ครบ 20 จุด";
    return;
  }

  addSnappedCircle(x,y);
});

// ===== SNAP =====
function addSnappedCircle(cx,cy){

  if(samples.length>=MAX_SAMPLES) return;

  const frame=cachedFrame;
  const g=cachedGray;

  const rect=overlay.getBoundingClientRect();
  const scale=frame.width/rect.width;

  let x=cx*scale, y=cy*scale;

  let best={x,y}, bestScore=Infinity;

  for(let dy=-6;dy<=6;dy++){
    for(let dx=-6;dx<=6;dx++){

      let score=0;

      for(let a=0;a<360;a+=30){
        const rad=a*Math.PI/180;
        const px=Math.round(x+dx+SAMPLE_RADIUS*Math.cos(rad));
        const py=Math.round(y+dy+SAMPLE_RADIUS*Math.sin(rad));

        if(px<0||py<0||px>=frame.width||py>=frame.height) continue;

        score+=g[py*frame.width+px];
      }

      if(score<bestScore){
        bestScore=score;
        best={x:x+dx,y:y+dy};
      }
    }
  }

  const ox=best.x/scale;
  const oy=best.y/scale;

  const rgb=readRGB(frame,ox,oy,SAMPLE_RADIUS);

  samples.push({x:ox,y:oy,r:SAMPLE_RADIUS,rgb});

  drawAll();
  updateResult();
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

  return {r:~~(R/count),g:~~(G/count),b:~~(B/count)};
}

// ===== GRAY =====
function toGray(img){
  const g=new Uint8ClampedArray(img.width*img.height);
  for(let i=0,j=0;i<img.data.length;i+=4,j++){
    g[j]=(img.data[i]+img.data[i+1]+img.data[i+2])/3;
  }
  return g;
}

// ===== CONTROL =====
function setNormal(){
  selectMode="normal";
  resultBox.textContent="เลือกจุด Normal (N)";
}

function setDeficient(){
  selectMode="deficient";
  resultBox.textContent="เลือกจุด Deficient (D)";
}

// ===== INTENSITY =====
function intensity(rgb){
  return rgb.g/(rgb.r+rgb.g+rgb.b+0.001);
}

// ===== CALC =====
function calculate(){

  if(!control.normal||!control.deficient) return {valid:false};

  const N=intensity(control.normal.rgb);
  const D=intensity(control.deficient.rgb);

  if(N<=D) return {valid:false};

  let results=samples.map((s,i)=>{

    const S=intensity(s.rgb);
    let ratio=(S-D)/((N-D)+0.001);

    let res="Deficient";
    if(ratio>0.8) res="Normal";
    else if(ratio>0.4) res="Partial";

    return {i,ratio:ratio.toFixed(2),res};
  });

  return {valid:true,N,D,results};
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
    ctx.font="13px Arial";

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

  const calc=calculate();

  if(!calc.valid){
    resultBox.textContent="⚠️ ตั้ง Control ไม่ถูกต้อง";
    return;
  }

  let txt=`N:${calc.N.toFixed(3)} D:${calc.D.toFixed(3)}\n\n`;

  calc.results.forEach(r=>{
    txt+=`#${r.i} → ${r.res} (${r.ratio})\n`;
  });

  resultBox.textContent=txt;
}

// ===== RESET =====
function resetSamples(){
  samples=[];
  control={normal:null,deficient:null};
  drawAll();
  resultBox.textContent="";
}

// ===== UNDO =====
function undo(){
  samples.pop();
  drawAll();
  updateResult();
}