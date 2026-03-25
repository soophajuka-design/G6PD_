const video = document.getElementById("video");
const overlay = document.getElementById("overlay");
const resultBox = document.getElementById("result");

let stream=null;
let cachedFrame=null;
let cachedGray=null;

let samples=[];
let control={normal:null,deficient:null};

function startCamera(){

  navigator.mediaDevices.getUserMedia({
    video:{facingMode:"environment"}
  }).then(s=>{

    stream=s;
    video.srcObject=s;

    setTimeout(syncCanvas,500);

  }).catch(()=>alert("camera error"));
}

function stopCamera(){

  if(stream){
    stream.getTracks().forEach(t=>t.stop());
  }

  video.srcObject=null;

  samples=[];
  control={normal:null,deficient:null};

  overlay.getContext("2d").clearRect(0,0,overlay.width,overlay.height);

  resultBox.textContent="reset";
}

function syncCanvas(){
  overlay.width=video.clientWidth;
  overlay.height=video.clientHeight;
}

function captureFrame(){

  const w=video.videoWidth;
  const h=video.videoHeight;

  const c=document.createElement("canvas");
  c.width=w; c.height=h;

  const ctx=c.getContext("2d");
  ctx.drawImage(video,0,0,w,h);

  let frame = ctx.getImageData(0,0,w,h);

  frame = normalizeFrame(frame);

  cachedGray = toGray(frame);

  // perspective
  const corners = detectPaperCorners();

  if(!corners){
    resultBox.textContent="no paper";
    return;
  }

  cachedFrame = warpPerspective(frame,corners);
  cachedGray = toGray(cachedFrame);

  video.pause();

  resultBox.textContent="captured";
}

// normalize
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

function toGray(img){

  const g=new Uint8ClampedArray(img.width*img.height);

  for(let i=0,j=0;i<img.data.length;i+=4,j++){
    g[j]=(img.data[i]+img.data[i+1]+img.data[i+2])/3;
  }

  return g;
}

// TAP = add OR set control
overlay.addEventListener("click",(e)=>{

  if(!cachedFrame) return;

  const rect=overlay.getBoundingClientRect();
  const x=e.clientX-rect.left;
  const y=e.clientY-rect.top;

  let found=null;

  for(let s of samples){
    if(Math.hypot(s.x-x,s.y-y)<s.r){
      found=s;
      break;
    }
  }

  if(found){

    if(!control.normal){
      control.normal=found;
    }else if(!control.deficient){
      control.deficient=found;
    }else{
      control.normal=found;
      control.deficient=null;
    }

    drawAll();
    return;
  }

  addCircle(x,y);
});

function addCircle(x,y){

  const rgb = readRGB(cachedFrame,x,y,25);

  samples.push({x,y,r:25,rgb,manual:true});
  drawAll();
}

function readRGB(frame,cx,cy,r){

  let R=0,G=0,B=0,count=0;

  for(let y=-r;y<=r;y++){
    for(let x=-r;x<=r;x++){

      if(x*x+y*y<=r*r){

        const px=Math.floor(cx+x);
        const py=Math.floor(cy+y);

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

function drawAll(){

  const ctx=overlay.getContext("2d");
  ctx.clearRect(0,0,overlay.width,overlay.height);

  samples.forEach((s,i)=>{

    ctx.strokeStyle="white";
    ctx.beginPath();
    ctx.arc(s.x,s.y,s.r,0,Math.PI*2);
    ctx.stroke();

    ctx.fillStyle="yellow";
    ctx.fillText(i,s.x+5,s.y);

    if(control.normal===s){
      ctx.fillStyle="lime";
      ctx.fillText("N",s.x+15,s.y);
    }

    if(control.deficient===s){
      ctx.fillStyle="red";
      ctx.fillText("D",s.x+15,s.y);
    }
  });
}

function resetSamples(){
  samples=[];
  control={normal:null,deficient:null};
  drawAll();
}