const video = document.getElementById("video");
const camBtn = document.getElementById("camBtn");
const overlay = document.getElementById("overlay");
const ctx = overlay.getContext("2d");

let stream = null;
let cameraOn = false;

// ===== DEBUG =====
function debug(msg){
  document.getElementById("debug").innerText += msg + "\n";
  console.log(msg);
}

// ===== START CAMERA =====
async function startCamera(){

  debug("Start camera...");
  debug("mediaDevices: " + !!navigator.mediaDevices);

  if(!navigator.mediaDevices){
    alert("❌ ต้องเปิดผ่าน HTTPS");
    return;
  }

  try{

    stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: "environment" }
      },
      audio:false
    });

    debug("Back camera OK");

  }catch(e){

    debug("Fallback camera");

    try{
      stream = await navigator.mediaDevices.getUserMedia({
        video:true,
        audio:false
      });
    }catch(err){
      alert("Camera error: " + err.message);
      return;
    }
  }

  video.srcObject = stream;

  video.onloadedmetadata = async () => {

    try{
      await video.play();
      debug("Video playing");
    }catch(e){
      debug("Play error: " + e.message);
    }

    overlay.width = video.videoWidth;
    overlay.height = video.videoHeight;

    const track = stream.getVideoTracks()[0];
    const settings = track.getSettings();

    if(settings.facingMode === "user"){
      video.style.transform = "scaleX(-1)";
      debug("Front camera (mirrored)");
    }else{
      video.style.transform = "none";
      debug("Back camera");
    }

    drawLoop();
  };

  cameraOn = true;
  camBtn.innerText = "Stop Camera";

  debug("Camera ON");
}

// ===== STOP =====
function stopCamera(){

  if(stream){
    stream.getTracks().forEach(t=>t.stop());
  }

  video.srcObject = null;
  cameraOn = false;

  camBtn.innerText = "Start Camera";

  debug("Camera OFF");
}

// ===== BUTTON =====
camBtn.addEventListener("click", async ()=>{
  if(!cameraOn){
    await startCamera();
  }else{
    stopCamera();
  }
});

// ===== OVERLAY =====
function drawOverlay(){

  const w = overlay.width;
  const h = overlay.height;

  ctx.clearRect(0,0,w,h);

  ctx.strokeStyle = "lime";
  ctx.lineWidth = 2;

  ctx.strokeRect(w*0.1, h*0.1, w*0.8, h*0.8);

  ctx.beginPath();
  ctx.moveTo(w/2, 0);
  ctx.lineTo(w/2, h);
  ctx.moveTo(0, h/2);
  ctx.lineTo(w, h/2);
  ctx.stroke();
}

// ===== LOOP =====
function drawLoop(){
  if(!cameraOn) return;

  drawOverlay();
  requestAnimationFrame(drawLoop);
}
function captureFrame(){

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  ctx.drawImage(video, 0, 0);

  return canvas;
}
function detectGrid(){

  const canvas = captureFrame();
  const ctx = canvas.getContext("2d");
  const img = ctx.getImageData(0,0,canvas.width,canvas.height);

  const data = img.data;
  const points = [];

  // ===== scan pixel =====
  for(let y=0; y<canvas.height; y+=6){
    for(let x=0; x<canvas.width; x+=6){

      const i = (y*canvas.width + x)*4;

      const r = data[i];
      const g = data[i+1];
      const b = data[i+2];

      const brightness = (r+g+b)/3;

      // ===== threshold (ปรับได้) =====
      if(brightness > 180){
        points.push({x,y});
      }

    }
  }

  debug("Bright points: " + points.length);

  const grid = clusterPoints(points);

  drawGrid(grid);

  window.detectedGrid = grid;
}

function clusterPoints(points){

  const clusters = [];
  const dist = 25;

  points.forEach(p=>{

    let found = false;

    for(let c of clusters){

      const dx = c.x - p.x;
      const dy = c.y - p.y;

      if(Math.sqrt(dx*dx + dy*dy) < dist){
        c.x = (c.x + p.x)/2;
        c.y = (c.y + p.y)/2;
        c.count++;
        found = true;
        break;
      }
    }

    if(!found){
      clusters.push({x:p.x, y:p.y, count:1});
    }

  });

  debug("Clusters: " + clusters.length);

  return clusters;
}

function drawGrid(grid){

  ctx.strokeStyle = "red";
  ctx.fillStyle = "yellow";

  grid.forEach((p,i)=>{

    ctx.beginPath();
    ctx.arc(p.x, p.y, 15, 0, Math.PI*2);
    ctx.stroke();

    ctx.fillText(i, p.x+5, p.y+5);

  });

}

function readRGB(){

  if(!window.detectedGrid){
    alert("ยังไม่ detect grid");
    return;
  }

  const canvas = captureFrame();
  const ctx = canvas.getContext("2d");
  const img = ctx.getImageData(0,0,canvas.width,canvas.height);

  const results = [];

  window.detectedGrid.forEach((p,i)=>{

    const size = 10;
    let r=0,g=0,b=0,count=0;

    for(let y=-size; y<size; y++){
      for(let x=-size; x<size; x++){

        const px = Math.floor(p.x + x);
        const py = Math.floor(p.y + y);

        const idx = (py*canvas.width + px)*4;

        r += img.data[idx];
        g += img.data[idx+1];
        b += img.data[idx+2];
        count++;

      }
    }

    r/=count; g/=count; b/=count;

    const brightness = (r+g+b)/3;

    let status = "OK";

    // ===== ND detect =====
    if(brightness < 40){
      status = "ND";
    }

    results.push({
      index:i,
      r:Math.round(r),
      g:Math.round(g),
      b:Math.round(b),
      brightness:Math.round(brightness),
      status
    });

  });

  showResults(results);
}

function showResults(results){

  let txt = "";

  results.forEach(r=>{

    txt += `#${r.index} | RGB(${r.r},${r.g},${r.b}) | B=${r.brightness} | ${r.status}\n`;

  });

  document.getElementById("debug").innerText = txt;
}
function getEdges(canvas){

  const ctx = canvas.getContext("2d");
  const img = ctx.getImageData(0,0,canvas.width,canvas.height);
  const data = img.data;

  const edges = [];

  for(let y=1; y<canvas.height-1; y+=2){
    for(let x=1; x<canvas.width-1; x+=2){

      const i = (y*canvas.width + x)*4;

      const r = data[i];
      const g = data[i+1];
      const b = data[i+2];

      const brightness = (r+g+b)/3;

      const i2 = ((y+1)*canvas.width + (x+1))*4;
      const b2 = (data[i2]+data[i2+1]+data[i2+2])/3;

      if(Math.abs(brightness - b2) > 40){
        edges.push({x,y});
      }

    }
  }

  debug("Edges: " + edges.length);
  return edges;
}
function getCorners(points){

  let tl, tr, bl, br;

  let minSum=999999, maxSum=0;
  let minDiff=999999, maxDiff=-999999;

  points.forEach(p=>{

    const sum = p.x + p.y;
    const diff = p.x - p.y;

    if(sum < minSum){ minSum=sum; tl=p; }
    if(sum > maxSum){ maxSum=sum; br=p; }

    if(diff < minDiff){ minDiff=diff; bl=p; }
    if(diff > maxDiff){ maxDiff=diff; tr=p; }

  });

  return [tl, tr, br, bl];
}

function warpPerspective(srcCanvas, corners){

  const dstCanvas = document.createElement("canvas");
  const ctx = dstCanvas.getContext("2d");

  // ===== scale จริง (cm → pixel) =====
  const W = 350;   // 7 cm
  const H = 630;   // 12.6 cm

  dstCanvas.width = W;
  dstCanvas.height = H;

  const srcCtx = srcCanvas.getContext("2d");
  const src = srcCtx.getImageData(0,0,srcCanvas.width,srcCanvas.height);
  const dst = ctx.createImageData(W,H);

  const [tl,tr,br,bl] = corners;

  for(let y=0; y<H; y++){
    for(let x=0; x<W; x++){

      const u = x / W;
      const v = y / H;

      // bilinear mapping
      const sx =
        (1-u)*(1-v)*tl.x +
        u*(1-v)*tr.x +
        u*v*br.x +
        (1-u)*v*bl.x;

      const sy =
        (1-u)*(1-v)*tl.y +
        u*(1-v)*tr.y +
        u*v*br.y +
        (1-u)*v*bl.y;

      const ix = Math.floor(sx);
      const iy = Math.floor(sy);

      const si = (iy*srcCanvas.width + ix)*4;
      const di = (y*W + x)*4;

      dst.data[di] = src.data[si];
      dst.data[di+1] = src.data[si+1];
      dst.data[di+2] = src.data[si+2];
      dst.data[di+3] = 255;

    }
  }

  ctx.putImageData(dst,0,0);

  return dstCanvas;
}

function processPaper(){

  const src = captureFrame();

  // 1) edges
  const edges = getEdges(src);

  // 2) corners
  const corners = getCorners(edges);

  if(!corners || corners.length < 4){
    alert("หาแผ่นไม่เจอ");
    return;
  }

  debug("Corners detected");

  // 3) warp
  const rectified = warpPerspective(src, corners);

  // แสดงผล
  document.body.appendChild(rectified);

  window.rectifiedCanvas = rectified;
}

function getWorkingCanvas(){
  if(window.rectifiedCanvas){
    return window.rectifiedCanvas;
  }
  return captureFrame();
}
function generateGrid(){

  const canvas = getWorkingCanvas();

  const W = canvas.width;
  const H = canvas.height;

  const rows = 3;     // ปรับตามจริง
  const cols = 4;     // ปรับตามจริง

  const grid = [];

  const marginX = W * 0.1;
  const marginY = H * 0.1;

  const stepX = (W - marginX*2) / (cols-1);
  const stepY = (H - marginY*2) / (rows-1);

  let idx = 0;

  for(let r=0; r<rows; r++){
    for(let c=0; c<cols; c++){

      grid.push({
        index: idx++,
        x: marginX + c*stepX,
        y: marginY + r*stepY
      });

    }
  }

  window.grid = grid;

  drawGridOverlay(grid);
}
function drawGridOverlay(grid){

  const canvas = overlay;
  const ctx = canvas.getContext("2d");

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  ctx.clearRect(0,0,canvas.width,canvas.height);

  ctx.strokeStyle = "red";
  ctx.fillStyle = "yellow";
  ctx.font = "16px Arial";

  grid.forEach(p=>{

    ctx.beginPath();
    ctx.arc(p.x, p.y, 12, 0, Math.PI*2);
    ctx.stroke();

    ctx.fillText(p.index, p.x+5, p.y+5);

  });

}
function readG6PD(){

  const canvas = getWorkingCanvas();
  const ctx = canvas.getContext("2d");
  const img = ctx.getImageData(0,0,canvas.width,canvas.height);

  const results = [];

  grid.forEach(p=>{

    let r=0,g=0,b=0,count=0;
    const size = 8;

    for(let y=-size; y<size; y++){
      for(let x=-size; x<size; x++){

        const px = Math.floor(p.x + x);
        const py = Math.floor(p.y + y);

        const i = (py*canvas.width + px)*4;

        r += img.data[i];
        g += img.data[i+1];
        b += img.data[i+2];
        count++;

      }
    }

    r/=count; g/=count; b/=count;

    const brightness = (r+g+b)/3;

    let status = "OK";
    if(brightness < 40) status = "ND";

    results.push({
      index:p.index,
      r,g,b,
      brightness,
      status
    });

  });

  window.results = results;

  analyzeG6PD(results);
}
function analyzeG6PD(results){

  const ctrl = autoDetectControl(results);

  if(!ctrl){
    alert("หา control ไม่ได้");
    return;
  }

  const normal = ctrl.normVal;
  const deficient = ctrl.defVal;

  let txt = "";
  let validity = "VALID";

  results.forEach(r=>{

    let res = "ND";

    if(r.status !== "ND"){

      let ratio = (r.brightness - deficient) /
                  ((normal - deficient) + 0.001);

      if(ratio > 0.8) res = "Normal";
      else if(ratio > 0.4) res = "Partial Deficient";
      else res = "Complete Deficient";

      // ===== VALIDATION CONTROL =====
      if(r.index === ctrl.normalIdx && res !== "Normal"){
        validity = "INVALID";
      }

      if(r.index === ctrl.defIdx && res !== "Complete Deficient"){
        validity = "INVALID";
      }
    }

    txt += `#${r.index} → ${res} (B=${Math.round(r.brightness)})\n`;

  });

  txt += `\nAuto Control:
C+ = #${ctrl.normalIdx}
C- = #${ctrl.defIdx}`;

  txt += "\n=== RESULT: " + validity + " ===";

  document.getElementById("debug").innerText = txt;

  if(validity==="INVALID"){
    alert("Invalid test run กรุณาทดสอบใหม่");
  }
}

function preprocess(canvas){

  const ctx = canvas.getContext("2d");
  const img = ctx.getImageData(0,0,canvas.width,canvas.height);
  const data = img.data;

  const bin = [];

  for(let y=0; y<canvas.height; y++){
    for(let x=0; x<canvas.width; x++){

      const i = (y*canvas.width + x)*4;

      const r = data[i];
      const g = data[i+1];
      const b = data[i+2];

      const gray = (r+g+b)/3;

      // threshold ปรับได้
      const val = gray < 200 ? 1 : 0;

      bin.push(val);

    }
  }

  return bin;
}
function findEdgePoints(bin, W, H){

  const edges = [];

  for(let y=1; y<H-1; y+=2){
    for(let x=1; x<W-1; x+=2){

      const i = y*W + x;

      const v = bin[i];

      // detect edge
      if(v === 1){

        const neighbors =
          bin[i-1] + bin[i+1] +
          bin[i-W] + bin[i+W];

        if(neighbors < 4){
          edges.push({x,y});
        }

      }

    }
  }

  return edges;
}

function detectCircles(){

  const canvas = getWorkingCanvas();

  const W = canvas.width;
  const H = canvas.height;

  const bin = preprocess(canvas);
  const edges = findEdgePoints(bin, W, H);

  const circles = [];
  const minR = W * 0.04;
  const maxR = W * 0.12;

  for(let i=0; i<edges.length; i+=20){

    const p = edges[i];

    for(let r=minR; r<maxR; r+=5){

      let count = 0;
      let total = 0;

      for(let a=0; a<360; a+=20){

        const rad = a * Math.PI/180;

        const x = Math.floor(p.x + r*Math.cos(rad));
        const y = Math.floor(p.y + r*Math.sin(rad));

        if(x<0||y<0||x>=W||y>=H) continue;

        const idx = y*W + x;

        total++;

        if(bin[idx] === 1){
          count++;
        }

      }

      const score = count / total;

      if(score > 0.6){

        circles.push({
          x:p.x,
          y:p.y,
          r:r,
          score
        });

      }

    }
  }

  debug("Raw circles: " + circles.length);

  const final = mergeCircles(circles);

  window.grid = final;

  drawCircles(final);
}

function mergeCircles(circles){

  const result = [];
  const dist = 30;

  circles.forEach(c=>{

    let found = false;

    for(let r of result){

      const dx = r.x - c.x;
      const dy = r.y - c.y;

      if(Math.sqrt(dx*dx + dy*dy) < dist){

        r.x = (r.x + c.x)/2;
        r.y = (r.y + c.y)/2;
        r.r = (r.r + c.r)/2;
        r.score = Math.max(r.score, c.score);

        found = true;
        break;
      }
    }

    if(!found){
      result.push({...c});
    }

  });

  debug("Final circles: " + result.length);

  return result;
}

function drawCircles(circles){

  const ctx = overlay.getContext("2d");

  ctx.clearRect(0,0,overlay.width,overlay.height);

  ctx.strokeStyle = "red";
  ctx.fillStyle = "yellow";
  ctx.lineWidth = 2;
  ctx.font = "14px Arial";

  circles.forEach((c,i)=>{

    ctx.beginPath();
    ctx.arc(c.x, c.y, c.r, 0, Math.PI*2);
    ctx.stroke();

    // index
    ctx.fillText(i, c.x + 5, c.y + 5);

    // confidence
    ctx.fillText(
      (c.score*100).toFixed(0)+"%",
      c.x - 10,
      c.y - c.r - 5
    );

  });

}
    
function syncOverlay(){

  const rect = video.getBoundingClientRect();

  overlay.width = video.videoWidth;
  overlay.height = video.videoHeight;

  overlay.style.width = rect.width + "px";
  overlay.style.height = rect.height + "px";
}

function drawCenter(){

  const ctx = overlay.getContext("2d");

  ctx.strokeStyle = "lime";

  ctx.beginPath();
  ctx.moveTo(overlay.width/2, 0);
  ctx.lineTo(overlay.width/2, overlay.height);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(0, overlay.height/2);
  ctx.lineTo(overlay.width, overlay.height/2);
  ctx.stroke();
}
function autoDetectControl(results){

  // เอาเฉพาะที่ valid
  const valid = results.filter(r => r.status !== "ND");

  if(valid.length < 3){
    alert("ข้อมูลไม่พอ");
    return null;
  }

  // sort ตาม brightness
  valid.sort((a,b)=>a.brightness - b.brightness);

  // ใช้ percentile กัน noise
  const lowIdx = Math.floor(valid.length * 0.1);
  const highIdx = Math.floor(valid.length * 0.9);

  const deficient = valid[lowIdx];
  const normal = valid[highIdx];

  return {
    defIdx: deficient.index,
    normalIdx: normal.index,
    defVal: deficient.brightness,
    normVal: normal.brightness
  };
}

function detectPaper(){

  const canvas = captureFrame();
  const ctx = canvas.getContext("2d");
  const img = ctx.getImageData(0,0,canvas.width,canvas.height);
  const data = img.data;

  const W = canvas.width;
  const H = canvas.height;

  // convert to grayscale
  const gray = [];
  for(let i=0;i<data.length;i+=4){
    gray.push((data[i]+data[i+1]+data[i+2])/3);
  }

  // threshold (หา background ขาว)
  const bin = gray.map(v => v > 200 ? 1 : 0);

  // หา bounding box ของกระดาษ
  let minX=W, minY=H, maxX=0, maxY=0;

  for(let y=0;y<H;y++){
    for(let x=0;x<W;x++){
      const i = y*W+x;

      if(bin[i] === 1){
        if(x<minX) minX=x;
        if(x>maxX) maxX=x;
        if(y<minY) minY=y;
        if(y>maxY) maxY=y;
      }
    }
  }

  return {
    x:minX,
    y:minY,
    w:maxX-minX,
    h:maxY-minY,
    canvas
  };
}
function rectifyPaper(){

  const box = detectPaper();

  const targetW = 700;
  const targetH = 1260;

  const out = document.createElement("canvas");
  out.width = targetW;
  out.height = targetH;

  const ctx = out.getContext("2d");

  ctx.drawImage(
    box.canvas,
    box.x, box.y, box.w, box.h,
    0, 0, targetW, targetH
  );

  window.rectifiedCanvas = out;

  return out;
}
function generatePaperGrid(){

  const canvas = window.rectifiedCanvas;
  const W = canvas.width;
  const H = canvas.height;

  const cols = 4;
  const rows = 6;

  const marginX = W * 0.08;
  const marginY = H * 0.06;

  const stepX = (W - marginX*2) / cols;
  const stepY = (H - marginY*2) / rows;

  const grid = [];

  let idx = 0;

  for(let r=0;r<rows;r++){
    for(let c=0;c<cols;c++){

      grid.push({
        index: idx++,
        x: marginX + stepX*(c+0.5),
        y: marginY + stepY*(r+0.5),
        r: Math.min(stepX,stepY)*0.32
      });

    }
  }

  window.grid = grid;
}
function drawOverlay(){

  const ctx = overlay.getContext("2d");

  overlay.width = video.videoWidth;
  overlay.height = video.videoHeight;

  ctx.clearRect(0,0,overlay.width,overlay.height);

  const box = detectPaper();

  const scaleX = box.w / rectifiedCanvas.width;
  const scaleY = box.h / rectifiedCanvas.height;

  ctx.strokeStyle = "lime";
  ctx.lineWidth = 2;
  ctx.font = "14px Arial";

  grid.forEach(g=>{

    const x = box.x + g.x * scaleX;
    const y = box.y + g.y * scaleY;
    const r = g.r * scaleX;

    ctx.beginPath();
    ctx.arc(x,y,r,0,Math.PI*2);
    ctx.stroke();

    ctx.fillStyle = "yellow";
    ctx.fillText(g.index, x+4, y+4);

  });

}


