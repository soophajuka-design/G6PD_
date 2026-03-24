const video = document.getElementById("video");
const template = document.getElementById("template");

let stream = null;
let grid = [];

// ===== CAMERA =====
async function startCamera(){

  try{
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: "environment" } }
    });

    video.srcObject = stream;

    video.onloadedmetadata = () => {
      syncTemplate();
      initGrid();
      drawTemplateGrid();
    };

  }catch(err){
    alert("Camera error: " + err);
  }
}

function stopCamera(){
  if(stream){
    stream.getTracks().forEach(t => t.stop());
    stream = null;
  }
}

// ===== SYNC =====
function syncTemplate(){
  const rect = video.getBoundingClientRect();
  template.width = rect.width;
  template.height = rect.height;
}

// ===== INIT GRID =====
function initGrid(){

  grid = [];

  const W = template.width;
  const H = template.height;

  const ratio = 7/12.6;

  let drawW = W;
  let drawH = W / ratio;

  if(drawH > H){
    drawH = H;
    drawW = H * ratio;
  }

  const offsetX = (W - drawW)/2;
  const offsetY = (H - drawH)/2;

  const cols = 4;
  const rows = 6;

  const marginX = drawW * 0.12;
  const marginY = drawH * 0.10;

  const stepX = (drawW - marginX*2)/cols;
  const stepY = (drawH - marginY*2)/rows;

  let idx = 0;

  for(let r=0;r<rows;r++){
    for(let c=0;c<cols;c++){

      grid.push({
        index: idx++,
        x: offsetX + marginX + stepX*(c+0.5),
        y: offsetY + marginY + stepY*(r+0.5),
        r: Math.min(stepX,stepY)*0.38
      });
    }
  }
}

// ===== DRAW =====
function drawTemplateGrid(){

  const ctx = template.getContext("2d");
  ctx.clearRect(0,0,template.width,template.height);

  ctx.strokeStyle = "lime";

  grid.forEach(g=>{
    ctx.beginPath();
    ctx.arc(g.x,g.y,g.r,0,Math.PI*2);
    ctx.stroke();
  });

  // center cross
  ctx.strokeStyle = "red";
  ctx.beginPath();
  ctx.moveTo(template.width/2,0);
  ctx.lineTo(template.width/2,template.height);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(0,template.height/2);
  ctx.lineTo(template.width,template.height/2);
  ctx.stroke();
}

// ===== IMAGE PROCESS =====
function getGrayFrame(){

  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  const ctx = canvas.getContext("2d");
  ctx.drawImage(video,0,0);

  const img = ctx.getImageData(0,0,canvas.width,canvas.height);
  const data = img.data;

  const gray = new Uint8ClampedArray(canvas.width*canvas.height);

  for(let i=0,j=0;i<data.length;i+=4,j++){
    gray[j] = (data[i]+data[i+1]+data[i+2])/3;
  }

  return {gray, w:canvas.width, h:canvas.height};
}

function edgeDetect(gray,w,h){

  const edge = new Uint8ClampedArray(w*h);

  for(let y=1;y<h-1;y++){
    for(let x=1;x<w-1;x++){

      const i = y*w+x;

      const gx =
        -gray[i-w-1] -2*gray[i-1] -gray[i+w-1] +
         gray[i-w+1] +2*gray[i+1] +gray[i+w+1];

      const gy =
        -gray[i-w-1] -2*gray[i-w] -gray[i-w+1] +
         gray[i+w-1] +2*gray[i+w] +gray[i+w+1];

      const g = Math.sqrt(gx*gx+gy*gy);

      edge[i] = g > 50 ? 255 : 0;
    }
  }

  return edge;
}

// ===== LSQ =====
function collectEdgePoints(cx,cy,r,edge,w,h){

  const pts = [];
  const searchR = r*1.3;

  for(let y=-searchR;y<=searchR;y++){
    for(let x=-searchR;x<=searchR;x++){

      const px = Math.round(cx+x);
      const py = Math.round(cy+y);

      if(px<0||py<0||px>=w||py>=h) continue;

      const dist = Math.sqrt(x*x+y*y);

      if(Math.abs(dist-r)<4){
        const i = py*w+px;
        if(edge[i]===255){
          pts.push([px,py]);
        }
      }
    }
  }

  return pts;
}

function fitCircleLSQ(points){

  const n = points.length;
  if(n<20) return null;

  let sumX=0,sumY=0,sumX2=0,sumY2=0,sumXY=0;
  let sumX3=0,sumY3=0,sumX1Y2=0,sumX2Y1=0;

  points.forEach(([x,y])=>{
    const x2=x*x,y2=y*y;
    sumX+=x; sumY+=y;
    sumX2+=x2; sumY2+=y2;
    sumXY+=x*y;
    sumX3+=x2*x;
    sumY3+=y2*y;
    sumX1Y2+=x*y2;
    sumX2Y1+=x2*y;
  });

  const C = n*sumX2 - sumX*sumX;
  const D = n*sumXY - sumX*sumY;
  const E = n*(sumX3 + sumX1Y2) - (sumX2+sumY2)*sumX;
  const G = n*sumY2 - sumY*sumY;
  const H = n*(sumX2Y1 + sumY3) - (sumX2+sumY2)*sumY;

  const denom = (C*G - D*D);
  if(Math.abs(denom)<1e-6) return null;

  const a = (H*D - E*G)/denom;
  const b = (H*C - E*D)/(D*D - G*C);

  const cx = -a/2;
  const cy = -b/2;

  const r = Math.sqrt(
    (sumX2+sumY2 - a*sumX - b*sumY)/n + (a*a+b*b)/4
  );

  return {x:cx,y:cy,r:r};
}

// ===== MAIN =====
function refineGridLSQ(){

  const frame = getGrayFrame();
  const edge = edgeDetect(frame.gray,frame.w,frame.h);

  grid.forEach(g=>{

    const pts = collectEdgePoints(g.x,g.y,g.r,edge,frame.w,frame.h);
    const fit = fitCircleLSQ(pts);

    if(fit){
      g.x = fit.x;
      g.y = fit.y;
      g.r = fit.r;
    }

  });
}

function runLSQ(){

  for(let i=0;i<2;i++){
    refineGridLSQ();
  }

  drawTemplateGrid();
}

// ===== RESIZE =====
let resizeTimer;

window.addEventListener("resize", () => {

  clearTimeout(resizeTimer);

  resizeTimer = setTimeout(() => {
    if(video.videoWidth>0){
      syncTemplate();
      initGrid();
      drawTemplateGrid();
    }
  },150);

});