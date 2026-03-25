const video = document.getElementById("video");
const overlay = document.getElementById("overlay");
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

  overlay.width = video.clientWidth;
  overlay.height = video.clientHeight;
}

// ===== STOP =====
function stopCamera(){

  if(stream){
    stream.getTracks().forEach(t=>t.stop());
  }

  stream=null;
  video.srcObject=null;

  frame=null;
  samples=[];

  ctx.clearRect(0,0,overlay.width,overlay.height);
}

// ===== CAPTURE =====
function capture(){

  const w=video.videoWidth;
  const h=video.videoHeight;

  const c=document.createElement("canvas");
  c.width=w; c.height=h;

  const cctx=c.getContext("2d");
  cctx.drawImage(video,0,0);

  frame = cctx.getImageData(0,0,w,h);

  scaleX = w / overlay.width;
  scaleY = h / overlay.height;

  video.pause();
}

// ===== TAP =====
overlay.addEventListener("click",(e)=>{

  if(!frame) return;

  const rect=overlay.getBoundingClientRect();

  const dx = e.clientX-rect.left;
  const dy = e.clientY-rect.top;

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