const video = document.getElementById("video");
const overlay = document.getElementById("overlay");
const resultBox = document.getElementById("result");

let stream = null;
let samples = [];

const SAMPLE_RADIUS = 25;

// ===== CAMERA =====
async function startCamera(){
  stream = await navigator.mediaDevices.getUserMedia({
    video:{ facingMode:{ideal:"environment"} }
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

// ===== TAP =====
overlay.addEventListener("click", (e)=>{

  const rect = overlay.getBoundingClientRect();

  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  // ป้องกัน tap ซ้อน
  for(let s of samples){
    const d = Math.hypot(s.x-x, s.y-y);
    if(d < 20) return;
  }

  addSnappedCircle(x,y);
});

// ===== LONG PRESS DELETE =====
overlay.addEventListener("contextmenu", (e)=>{
  e.preventDefault();

  const rect = overlay.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  samples = samples.filter(s=>{
    const d = Math.hypot(s.x-x, s.y-y);
    return d > s.r;
  });

  drawAll();
  updateResult();
});

// ===== SNAP + ADD =====
function addSnappedCircle(cx, cy){

  const frame = getFrame();
  const g = toGray(frame);

  const rect = overlay.getBoundingClientRect();

  const scaleX = frame.width / rect.width;
  const scaleY = frame.height / rect.height;

  let x = cx * scaleX;
  let y = cy * scaleY;

  let r = SAMPLE_RADIUS;

  let best = {x,y};
  let bestScore = Infinity;

  // ===== CENTER SNAP =====
  for(let dy=-8;dy<=8;dy++){
    for(let dx=-8;dx<=8;dx++){

      let score = 0;

      for(let a=0;a<360;a+=20){

        const rad = a*Math.PI/180;

        const px = Math.round(x+dx + r*Math.cos(rad));
        const py = Math.round(y+dy + r*Math.sin(rad));

        if(px<0||py<0||px>=frame.width||py>=frame.height) continue;

        const center = g[Math.round(y)*frame.width + Math.round(x)];
        const edge   = g[py*frame.width + px];

        score += Math.abs(edge - center);
      }

      if(score < bestScore){
        bestScore = score;
        best = {x:x+dx, y:y+dy};
      }
    }
  }

  // ===== RADIUS SNAP =====
  let bestR = r;
  let bestRScore = Infinity;

  for(let rr=18; rr<=35; rr++){

    let score = 0;

    for(let a=0;a<360;a+=20){

      const rad = a*Math.PI/180;

      const px = Math.round(best.x + rr*Math.cos(rad));
      const py = Math.round(best.y + rr*Math.sin(rad));

      if(px<0||py<0||px>=frame.width||py>=frame.height) continue;

      score += g[py*frame.width + px];
    }

    if(score < bestRScore){
      bestRScore = score;
      bestR = rr;
    }
  }

  // ===== MAP BACK =====
  const ox = best.x / scaleX;
  const oy = best.y / scaleY;
  const or = bestR / scaleX;

  const rgb = readRGB(ox, oy, or);

  samples.push({
    x:ox,
    y:oy,
    r:or,
    rgb
  });

  drawAll();
  updateResult();
}

// ===== FRAME =====
function getFrame(){
  const c=document.createElement("canvas");
  c.width=video.videoWidth;
  c.height=video.videoHeight;
  const ctx=c.getContext("2d");
  ctx.drawImage(video,0,0);
  return ctx.getImageData(0,0,c.width,c.height);
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
function readRGB(cx, cy, r){

  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  const ctx = canvas.getContext("2d");
  ctx.drawImage(video,0,0);

  const img = ctx.getImageData(0,0,canvas.width,canvas.height);

  let R=0,G=0,B=0,count=0;

  const scaleX = canvas.width / overlay.width;
  const scaleY = canvas.height / overlay.height;

  const x0 = cx * scaleX;
  const y0 = cy * scaleY;
  const rr = r * scaleX;

  for(let y=-rr;y<=rr;y++){
    for(let x=-rr;x<=rr;x++){

      if(x*x+y*y <= rr*rr){

        const px = Math.floor(x0 + x);
        const py = Math.floor(y0 + y);

        if(px<0||py<0||px>=canvas.width||py>=canvas.height) continue;

        const i = (py*canvas.width + px)*4;

        R += img.data[i];
        G += img.data[i+1];
        B += img.data[i+2];
        count++;
      }
    }
  }

  return {
    r:Math.round(R/count),
    g:Math.round(G/count),
    b:Math.round(B/count)
  };
}

// ===== DRAW =====
function drawAll(){

  const ctx = overlay.getContext("2d");
  ctx.clearRect(0,0,overlay.width,overlay.height);

  samples.forEach((s,i)=>{

    ctx.strokeStyle="lime";
    ctx.lineWidth=2;

    ctx.beginPath();
    ctx.arc(s.x,s.y,s.r,0,Math.PI*2);
    ctx.stroke();

    ctx.fillStyle="yellow";
    ctx.font="12px Arial";
    ctx.fillText(`#${i}`, s.x+5, s.y-5);
  });
}

// ===== RESULT =====
function updateResult(){

  let txt = "";

  samples.forEach((s,i)=>{
    txt += `#${i} → R:${s.rgb.r} G:${s.rgb.g} B:${s.rgb.b}\n`;
  });

  resultBox.textContent = txt;
}

// ===== RESET =====
function resetSamples(){
  samples=[];
  drawAll();
  resultBox.textContent="";
}

// ===== UNDO =====
function undo(){
  samples.pop();
  drawAll();
  updateResult();
}