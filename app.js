const video = document.getElementById("video");
const overlay = document.getElementById("overlay");
const ctx = overlay.getContext("2d");
const resultBox = document.getElementById("result");

let stream=null;

let frame=null;      // warped image
let gray=null;

let samples=[];
let control={normal:null,deficient:null};

let scaleX=1, scaleY=1;

let state="idle";

// ===== CAMERA =====
async function startCamera(){

  stream = await navigator.mediaDevices.getUserMedia({
    video:{facingMode:"environment"}
  });

  video.srcObject = stream;
  await video.play();

  overlay.width = video.clientWidth;
  overlay.height = video.clientHeight;

  state="camera";
}

// ===== STOP =====
function stopCamera(){

  if(stream){
    stream.getTracks().forEach(t=>t.stop());
  }

  stream=null;
  video.srcObject=null;

  frame=null;
  gray=null;
  samples=[];
  control={normal:null,deficient:null};

  ctx.clearRect(0,0,overlay.width,overlay.height);

  state="idle";
}

// ===== CAPTURE =====
function captureFrame(){

  const w=video.videoWidth;
  const h=video.videoHeight;

  const c=document.createElement("canvas");
  c.width=w; c.height=h;

  const cctx=c.getContext("2d");
  cctx.drawImage(video,0,0);

  let raw=cctx.getImageData(0,0,w,h);

  raw = normalizeFrame(raw);
  gray = toGray(raw);

  const corners = detectPaperCorners();

  if(!corners){
    resultBox.textContent="no paper";
    return;
  }

  frame = warpPerspective(raw,corners);
  gray = toGray(frame);

  scaleX = frame.width / overlay.width;
  scaleY = frame.height / overlay.height;

  video.pause();
  state="captured";

  draw();
}

// ===== TAP =====
overlay.addEventListener("click",(e)=>{

  if(state!=="captured") return;

  const rect=overlay.getBoundingClientRect();

  const dx = e.clientX-rect.left;
  const dy = e.clientY-rect.top;

  // map → image space
  const x = dx * scaleX;
  const y = dy * scaleY;

  let found=null;

  for(let s of samples){
    if(Math.hypot(s.x-x,s.y-y)<25){
      found=s;
      break;
    }
  }

  // set control
  if(found){

    if(!control.normal){
      control.normal=found;
    }else if(!control.deficient){
      control.deficient=found;
    }else{
      control.normal=found;
      control.deficient=null;
    }

    draw();
    return;
  }

  // add sample
  const rgb = readRGB(frame,x,y,25);

  samples.push({x,y,r:25,rgb});

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
    ctx.arc(dx,dy,25/scaleX,0,Math.PI*2);
    ctx.stroke();

    ctx.fillStyle="yellow";
    ctx.fillText(i,dx+5,dy);

    if(control.normal===s){
      ctx.fillStyle="lime";
      ctx.fillText("N",dx+15,dy);
    }

    if(control.deficient===s){
      ctx.fillStyle="red";
      ctx.fillText("D",dx+15,dy);
    }
  });
}

// ===== AUTO GRID =====
function autoGridAlign(){

  if(!frame) return;

  samples=[];

  const rows=5, cols=4;

  const dx=frame.width/(cols+1);
  const dy=frame.height/(rows+1);

  for(let r=1;r<=rows;r++){
    for(let c=1;c<=cols;c++){

      const x=c*dx;
      const y=r*dy;

      const rgb = readRGB(frame,x,y,25);

      samples.push({x,y,r:25,rgb});
    }
  }

  draw();
}

// ===== UTIL =====
function toGray(img){
  const g=new Uint8ClampedArray(img.width*img.height);
  for(let i=0,j=0;i<img.data.length;i+=4,j++){
    g[j]=(img.data[i]+img.data[i+1]+img.data[i+2])/3;
  }
  return g;
}

function normalizeFrame(frame){
  return frame;
}

function readRGB(frame,x,y,r){

  let R=0,G=0,B=0,count=0;

  for(let dy=-r;dy<=r;dy++){
    for(let dx=-r;dx<=r;dx++){

      if(dx*dx+dy*dy<=r*r){

        const px=Math.floor(x+dx);
        const py=Math.floor(y+dy);

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