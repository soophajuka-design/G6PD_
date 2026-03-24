const video = document.getElementById("video");
const overlay = document.getElementById("overlay");
const resultBox = document.getElementById("result");

let stream = null;
let samples = [];
let selectMode = null; 
// "normal" | "deficient" | null

const MAX_SAMPLES = 20;
const SAMPLE_RADIUS = 25;

// ===== CACHE (สำคัญ) =====
let cachedFrame = null;
let cachedGray = null;

// ===== CONTROL =====
let control = {
  normal: null,
  deficient: null
};

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

// ===== CAPTURE =====
function captureFrame(){

  const c = document.createElement("canvas");
  c.width = video.videoWidth;
  c.height = video.videoHeight;

  const ctx = c.getContext("2d");
  ctx.drawImage(video,0,0);

  cachedFrame = ctx.getImageData(0,0,c.width,c.height);
  cachedGray = toGray(cachedFrame);

  alert("Frame Captured");
}

// ===== TAP =====

overlay.addEventListener("click", (e)=>{

  const rect = overlay.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  // ===== MODE: SELECT CONTROL =====
  if(selectMode){

    let nearest = null;
    let minDist = Infinity;

    samples.forEach((s,i)=>{
      const d = Math.hypot(s.x-x, s.y-y);
      if(d < minDist){
        minDist = d;
        nearest = s;
      }
    });

    if(nearest){
      if(selectMode === "normal"){
        control.normal = nearest;
      }
      if(selectMode === "deficient"){
        control.deficient = nearest;
      }
    }

    selectMode = null;
    drawAll();
    updateResult();
    return;
  }

  // ===== MODE: ADD SAMPLE =====

  if(samples.length >= MAX_SAMPLES){
    resultBox.textContent = "❌ ครบ 20 จุดแล้ว";
    return;
  }

  if(!cachedFrame){
    alert("กด Capture Frame ก่อน");
    return;
  }

  addSnappedCircle(x,y);
});

// ===== SNAP =====
function addSnappedCircle(cx, cy){
  
if(samples.length >= MAX_SAMPLES) return;

  const frame = cachedFrame;
  const g = cachedGray;

  const rect = overlay.getBoundingClientRect();

  const scale = frame.width / rect.width;

  let x = cx * scale;
  let y = cy * scale;

  let best = {x,y};
  let bestScore = Infinity;

  for(let dy=-6;dy<=6;dy++){
    for(let dx=-6;dx<=6;dx++){

      let score = 0;

      for(let a=0;a<360;a+=30){

        const rad = a*Math.PI/180;

        const px = Math.round(x+dx + SAMPLE_RADIUS*Math.cos(rad));
        const py = Math.round(y+dy + SAMPLE_RADIUS*Math.sin(rad));

        if(px<0||py<0||px>=frame.width||py>=frame.height) continue;

        score += g[py*frame.width + px];
      }

      if(score < bestScore){
        bestScore = score;
        best = {x:x+dx, y:y+dy};
      }
    }
  }

  const ox = best.x / scale;
  const oy = best.y / scale;

  const rgb = readRGB(frame, ox, oy, SAMPLE_RADIUS);

  samples.push({x:ox,y:oy,r:SAMPLE_RADIUS,rgb});

  drawAll();
  updateResult();
}

// ===== RGB =====
function readRGB(frame, cx, cy, r){

  let R=0,G=0,B=0,count=0;

  const rect = overlay.getBoundingClientRect();
  const scale = frame.width / rect.width;

  const x0 = cx * scale;
  const y0 = cy * scale;
  const rr = r * scale;

  for(let y=-rr;y<=rr;y++){
    for(let x=-rr;x<=rr;x++){

      if(x*x+y*y <= rr*rr){

        const px = Math.floor(x0 + x);
        const py = Math.floor(y0 + y);

        if(px<0||py<0||px>=frame.width||py>=frame.height) continue;

        const i = (py*frame.width + px)*4;

        R += frame.data[i];
        G += frame.data[i+1];
        B += frame.data[i+2];
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
  selectMode = "normal";
  resultBox.textContent = "👉 เลือกจุดสำหรับ Normal (N)";
}

function setDeficient(){
  selectMode = "deficient";
  resultBox.textContent = "👉 เลือกจุดสำหรับ Deficient (D)";
}

// ===== INTENSITY =====
function intensity(rgb){
  return rgb.g;
}

// ===== CALCULATE =====
function calculate(){

  if(!control.normal || !control.deficient){
    return {valid:false};
  }

  const N = intensity(control.normal.rgb);
  const D = intensity(control.deficient.rgb);

  let valid = true;
  if(N <= D) valid = false;

  let results = samples.map((s,i)=>{

    const S = intensity(s.rgb);

    let ratio = (S - D) / ((N - D) + 0.001);

    let res="Deficient";
    if(ratio > 0.8) res="Normal";
    else if(ratio > 0.4) res="Partial";

    return {i,ratio:ratio.toFixed(2),res};
  });

  return {valid,N,D,results};
}

// ===== DRAW =====

function drawAll(){

  const ctx = overlay.getContext("2d");
  ctx.clearRect(0,0,overlay.width,overlay.height);

  samples.forEach((s,i)=>{

    // ===== วาดวง (สีขาว) =====
    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI*2);
    ctx.stroke();

    // ===== label =====
    const baseX = s.x + 6;
    const baseY = s.y - 6;

    ctx.font = "13px Arial";

    // index
    ctx.fillStyle = "yellow";
    const indexText = `#${i}`;
    ctx.fillText(indexText, baseX, baseY);

    const textWidth = ctx.measureText(indexText).width;

    // N (เขียว)
    if(control.normal === s){
      ctx.fillStyle = "lime";
      ctx.fillText(" N", baseX + textWidth, baseY);
    }

    // D (แดง)
    if(control.deficient === s){
      ctx.fillStyle = "red";
      ctx.fillText(" D", baseX + textWidth, baseY);
    }

  });
}


// ===== RESULT =====
function updateResult(){

  let txt="";

  const calc = calculate();

  if(!calc.valid){
    txt += "INVALID (control ผิด)\n";
    resultBox.textContent = txt;
    return;
  }

  txt += `N:${calc.N} D:${calc.D}\n`;

  calc.results.forEach(r=>{
    txt += `#${r.i} → ${r.res} (${r.ratio})\n`;
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