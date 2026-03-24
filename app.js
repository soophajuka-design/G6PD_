const video = document.getElementById("video");
const overlay = document.getElementById("overlay");

let stream=null;
let grid=[];

// ===== CAMERA =====
async function startCamera(){
  stream = await navigator.mediaDevices.getUserMedia({
    video:{ facingMode:{ideal:"environment"} }
  });
  video.srcObject = stream;

  video.onloadedmetadata = ()=>{
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

// ===== FRAME =====
function getFrame(){
  const c=document.createElement("canvas");
  c.width=video.videoWidth;
  c.height=video.videoHeight;
  const ctx=c.getContext("2d");
  ctx.drawImage(video,0,0);
  return ctx.getImageData(0,0,c.width,c.height);
}

// ===== GRAYSCALE =====
function gray(img){
  const g=new Uint8ClampedArray(img.width*img.height);
  for(let i=0,j=0;i<img.data.length;i+=4,j++){
    g[j]=(img.data[i]+img.data[i+1]+img.data[i+2])/3;
  }
  return g;
}

// ===== THRESHOLD (adaptive แบบง่าย) =====
function threshold(g,w,h){
  const out=new Uint8ClampedArray(w*h);
  for(let i=0;i<g.length;i++){
    out[i]=g[i]<180?255:0;
  }
  return out;
}

// ===== DETECT PAPER (improved) =====
function detectPaper(bin,w,h){

  let minX=w, minY=h, maxX=0, maxY=0;

  for(let y=0;y<h;y++){
    for(let x=0;x<w;x++){
      if(bin[y*w+x]){
        if(x<minX)minX=x;
        if(y<minY)minY=y;
        if(x>maxX)maxX=x;
        if(y>maxY)maxY=y;
      }
    }
  }

  return {minX,minY,maxX,maxY};
}

// ===== NORMALIZE (สำคัญ) =====
function normalize(frame,box){

  const ratio=7/12.6;
  const H=500;
  const W=Math.round(H*ratio);

  const c=document.createElement("canvas");
  c.width=W;
  c.height=H;

  const ctx=c.getContext("2d");

  ctx.drawImage(video,
    box.minX, box.minY,
    box.maxX-box.minX,
    box.maxY-box.minY,
    0,0,W,H
  );

  return ctx.getImageData(0,0,W,H);
}

// ===== TEMPLATE GRID (FIXED) =====
function createTemplate(w,h){

  const rows=6;
  const cols=4;

  const marginX=w*0.15;
  const marginY=h*0.12;

  const stepX=(w-2*marginX)/(cols-1);
  const stepY=(h-2*marginY)/(rows-1);

  const circles=[];

  for(let r=0;r<rows;r++){
    for(let c=0;c<cols;c++){

      circles.push({
        x:marginX + c*stepX,
        y:marginY + r*stepY,
        r:stepX*0.28
      });
    }
  }

  return circles;
}

// ===== SCORE วง (ใช้ intensity จริง) =====
function scoreCircle(g,w,h,c){

  let sum=0,count=0;

  for(let y=-c.r;y<=c.r;y++){
    for(let x=-c.r;x<=c.r;x++){

      const dx=c.x+x;
      const dy=c.y+y;

      if(dx<0||dy<0||dx>=w||dy>=h) continue;

      if(x*x+y*y <= c.r*c.r){
        sum+=g[Math.floor(dy)*w+Math.floor(dx)];
        count++;
      }
    }
  }

  return sum/count;
}

// ===== AUTO ALIGN (สำคัญมาก) =====
function refineGrid(g,w,h,grid){

  grid.forEach(c=>{

    let best=c;
    let bestScore=999;

    for(let dy=-5;dy<=5;dy++){
      for(let dx=-5;dx<=5;dx++){

        const test={
          x:c.x+dx,
          y:c.y+dy,
          r:c.r
        };

        const s=scoreCircle(g,w,h,test);

        if(s<bestScore){
          bestScore=s;
          best=test;
        }
      }
    }

    c.x=best.x;
    c.y=best.y;
  });
}

// ===== MAP TO SCREEN =====
function mapToScreen(grid,w,h){

  const rect=video.getBoundingClientRect();

  const sx=rect.width/w;
  const sy=rect.height/h;

  return grid.map(g=>({
    x:g.x*sx,
    y:g.y*sy,
    r:g.r*sx
  }));
}

// ===== DRAW =====
function draw(grid){

  const ctx=overlay.getContext("2d");
  ctx.clearRect(0,0,overlay.width,overlay.height);

  ctx.strokeStyle="lime";
  ctx.lineWidth=2;

  grid.forEach(c=>{
    ctx.beginPath();
    ctx.arc(c.x,c.y,c.r,0,Math.PI*2);
    ctx.stroke();
  });
}

// ===== MAIN =====
function detectAndLock(){

  const frame=getFrame();
  const g=gray(frame);
  const bin=threshold(g,frame.width,frame.height);

  // 1 detect paper
  const box=detectPaper(bin,frame.width,frame.height);

  // 2 normalize
  const norm=normalize(frame,box);
  const g2=gray(norm);

  // 3 template
  let template=createTemplate(norm.width,norm.height);

  // 4 refine align (สำคัญ)
  refineGrid(g2,norm.width,norm.height,template);

  // 5 map
  const mapped=mapToScreen(template,norm.width,norm.height);

  draw(mapped);
}