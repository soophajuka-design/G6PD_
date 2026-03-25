const video = document.getElementById("video");
const freezeCanvas = document.getElementById("freeze");
const overlay = document.getElementById("overlay");

const fctx = freezeCanvas.getContext("2d");
const ctx = overlay.getContext("2d");

let stream=null;
let frame=null;

let samples=[];

let scaleX=1;
let scaleY=1;

// ===== START =====
async function startCamera(){

  stream = await navigator.mediaDevices.getUserMedia({
    video:{facingMode:"environment"}
  });

  video.srcObject = stream;
  await video.play();

  syncCanvas();
}

// ===== SYNC =====
function syncCanvas(){

  const rect = video.getBoundingClientRect();

  freezeCanvas.width = rect.width;
  freezeCanvas.height = rect.height;

  overlay.width = rect.width;
  overlay.height = rect.height;
}

// ===== CAPTURE (FIX สำคัญสุด) =====
function capture(){

  const w=video.videoWidth;
  const h=video.videoHeight;

  if(!w || !h){
    alert("video not ready");
    return;
  }

  const temp=document.createElement("canvas");
  temp.width=w;
  temp.height=h;

  const tctx=temp.getContext("2d");
  tctx.drawImage(video,0,0,w,h);

  frame = tctx.getImageData(0,0,w,h);

  // scale mapping
  scaleX = w / freezeCanvas.width;
  scaleY = h / freezeCanvas.height;

  // 🔥 draw frozen image
  fctx.clearRect(0,0,freezeCanvas.width,freezeCanvas.height);
  fctx.drawImage(temp,0,0,freezeCanvas.width,freezeCanvas.height);

  // 🔥 hide video (แทน pause)
  video.style.visibility="hidden";
}

// ===== STOP =====
function stopCamera(){

  if(stream){
    stream.getTracks().forEach(t=>t.stop());
  }

  stream=null;
  video.srcObject=null;

  video.style.visibility="visible";

  frame=null;
  samples=[];

  ctx.clearRect(0,0,overlay.width,overlay.height);
  fctx.clearRect(0,0,freezeCanvas.width,freezeCanvas.height);
}

// ===== TAP =====
overlay.addEventListener("click",(e)=>{

  if(!frame) return;

  const rect = overlay.getBoundingClientRect();

  const dx = e.clientX - rect.left;
  const dy = e.clientY - rect.top;

  const x = dx * scaleX;
  const y = dy * scaleY;

  samples.push({x,y});

  draw();
});

// ===== DRAW =====
function draw(){

  ctx.clearRect(0,0,overlay.width,overlay.height);

  samples.forEach((s,i)=>{

    const dx = s.x / scaleX;
    const dy = s.y / scaleY;

    ctx.strokeStyle="white";
    ctx.beginPath();
    ctx.arc(dx,dy,20,0,Math.PI*2);
    ctx.stroke();

    ctx.fillStyle="yellow";
    ctx.fillText(i,dx+5,dy);
  });
}

// ===== GRID =====
function autoGrid(){

  if(!frame) return;

  samples=[];

  const rows=5;
  const cols=4;

  const w=frame.width;
  const h=frame.height;

  const dx=w/(cols+1);
  const dy=h/(rows+1);

  for(let r=1;r<=rows;r++){
    for(let c=1;c<=cols;c++){

      samples.push({
        x:c*dx,
        y:r*dy
      });
    }
  }

  draw();
}

// ===== RESET =====
function reset(){
  samples=[];
  draw();
}