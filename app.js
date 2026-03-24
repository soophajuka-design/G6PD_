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

  // === aspect ratio กระดาษจริง ===
  const paperRatio = 7/12.6;

  let drawW = W;
  let drawH = W / paperRatio;

  if(drawH > H){
    drawH = H;
    drawW = H * paperRatio;
  }

  const offsetX = (W - drawW)/2;
  const offsetY = (H - drawH)/2;

  // === pattern จากภาพจริง (calibrated) ===
  const cols = 4;
  const rows = 5;

  // 🔥 spacing จริงจากภาพ (ปรับจูนแล้ว)
  const xPos = [0.16, 0.38, 0.60, 0.82];
  const yPos = [0.13, 0.30, 0.47, 0.64, 0.81];

  let idx = 0;

  for(let r=0;r<rows;r++){
    for(let c=0;c<cols;c++){

      const x = offsetX + drawW * xPos[c];
      const y = offsetY + drawH * yPos[r];

      const radius = drawW * 0.075; // 🔥 match วงจริง

      grid.push({
        index: idx++,
        x: x,
        y: y,
        r: radius
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

function findPaperQuad(gray, w, h){
  // threshold ง่ายๆ + edge
  const edge = edgeDetect(gray, w, h);

  // หา bounding box ของ edge หนาแน่นสุด
  let minX=w, minY=h, maxX=0, maxY=0;

  for(let y=0;y<h;y++){
    for(let x=0;x<w;x++){
      const i=y*w+x;
      if(edge[i]){
        if(x<minX) minX=x;
        if(y<minY) minY=y;
        if(x>maxX) maxX=x;
        if(y>maxY) maxY=y;
      }
    }
  }

  // fallback ถ้าไม่เจอ
  if(maxX-minX<50 || maxY-minY<50) return null;

  // ใช้เป็น quad (approx)
  return [
    {x:minX,y:minY},
    {x:maxX,y:minY},
    {x:maxX,y:maxY},
    {x:minX,y:maxY}
  ];
}

function cropToPaper(frame, quad){

  const {w,h} = frame;

  // target size (fix ratio 7:12.6)
  const targetH = 400;
  const targetW = Math.round(targetH * (7/12.6));

  const canvas = document.createElement("canvas");
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext("2d");

  // ใช้ drawImage crop แบบง่ายก่อน (แทน homography เต็ม)
  const minX = quad[0].x;
  const minY = quad[0].y;
  const maxX = quad[2].x;
  const maxY = quad[2].y;

  ctx.drawImage(
    video,
    minX, minY,
    maxX-minX, maxY-minY,
    0, 0,
    targetW, targetH
  );

  return ctx.getImageData(0,0,targetW,targetH);
}
function detectCircles(gray, w, h){

  const edge = edgeDetect(gray,w,h);

  const centers = [];

  const step = 4;

  for(let y=20;y<h-20;y+=step){
    for(let x=20;x<w-20;x+=step){

      let score = 0;

      for(let a=0;a<360;a+=30){
        const rad = a*Math.PI/180;
        const px = Math.round(x + 15*Math.cos(rad));
        const py = Math.round(y + 15*Math.sin(rad));

        if(edge[py*w+px]) score++;
      }

      if(score > 6){
        centers.push({x,y});
      }
    }
  }

  return centers;
}
function clusterGrid(points){

  // sort ตาม Y → แบ่ง row
  points.sort((a,b)=>a.y-b.y);

  const rows = [];

  while(points.length){

    const base = points.shift();

    const group = [base];

    for(let i=points.length-1;i>=0;i--){
      if(Math.abs(points[i].y - base.y) < 20){
        group.push(points[i]);
        points.splice(i,1);
      }
    }

    rows.push(group);
  }

  // sort ในแต่ละ row ตาม X
  rows.forEach(r=>r.sort((a,b)=>a.x-b.x));

  return rows;
}
function buildTemplate(rows, w, h){

  const template = [];

  rows.forEach(row=>{
    row.forEach(p=>{
      template.push({
        x: p.x / w,
        y: p.y / h
      });
    });
  });

  return template;
}
function saveTemplate(tpl){
  localStorage.setItem("g6pd_template", JSON.stringify(tpl));
}

function loadTemplate(){
  const t = localStorage.getItem("g6pd_template");
  return t ? JSON.parse(t) : null;
}
function applyTemplate(tpl){

  grid = [];

  const W = template.width;
  const H = template.height;

  tpl.forEach((p,i)=>{
    grid.push({
      index: i,
      x: p.x * W,
      y: p.y * H,
      r: W * 0.07
    });
  });

  drawTemplateGrid();
}
function autoCalibrate(){

  const frame = getGrayFrame();

  const quad = findPaperQuad(frame.gray, frame.w, frame.h);

  if(!quad){
    alert("ไม่พบกระดาษ");
    return;
  }

  const crop = cropToPaper(frame, quad);

  const gray = new Uint8ClampedArray(crop.width*crop.height);

  for(let i=0,j=0;i<crop.data.length;i+=4,j++){
    gray[j]=(crop.data[i]+crop.data[i+1]+crop.data[i+2])/3;
  }

  const centers = detectCircles(gray, crop.width, crop.height);

  if(centers.length < 10){
    alert("detect วงไม่พอ");
    return;
  }

  const rows = clusterGrid(centers);

  const tpl = buildTemplate(rows, crop.width, crop.height);

  saveTemplate(tpl);

  applyTemplate(tpl);

  alert("Calibrate สำเร็จ");
}
