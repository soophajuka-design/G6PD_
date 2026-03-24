// ===== ELEMENT =====
const video = document.getElementById("video");
const template = document.getElementById("template");

let stream = null;

// ===== CAMERA =====
async function startCamera(){

  try{
    stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: "environment" }
      }
    });

    video.srcObject = stream;

    video.onloadedmetadata = () => {
      syncTemplate();
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

// ===== SYNC CANVAS =====
function syncTemplate(){

  const rect = video.getBoundingClientRect();

  // ใช้ "display size" เท่านั้น
  template.width  = rect.width;
  template.height = rect.height;

}

// ===== DRAW GRID =====
function drawTemplateGrid(){

  const ctx = template.getContext("2d");

  const W = template.width;
  const H = template.height;

  ctx.clearRect(0,0,W,H);

  // ===== LOCK ASPECT RATIO 7:12.6 =====
  const paperRatio = 7 / 12.6;
  let drawW = W;
  let drawH = W / paperRatio;

  if(drawH > H){
    drawH = H;
    drawW = H * paperRatio;
  }

  const offsetX = (W - drawW)/2;
  const offsetY = (H - drawH)/2;

  // ===== FRAME =====
  ctx.strokeStyle = "cyan";
  ctx.lineWidth = 2;
  ctx.strokeRect(offsetX, offsetY, drawW, drawH);

  // ===== GRID REAL (ปรับตามภาพจริง) =====
  const cols = 4;
  const rows = 6;

  // 👇 ปรับจากภาพจริง (สำคัญมาก)
  const marginX = drawW * 0.12;
  const marginY = drawH * 0.10;

  const stepX = (drawW - marginX*2)/cols;
  const stepY = (drawH - marginY*2)/rows;

  ctx.strokeStyle = "lime";

  for(let r=0;r<rows;r++){
    for(let c=0;c<cols;c++){

      const x = offsetX + marginX + stepX*(c+0.5);
      const y = offsetY + marginY + stepY*(r+0.5);

      const radius = Math.min(stepX,stepY)*0.38;

      ctx.beginPath();
      ctx.arc(x,y,radius,0,Math.PI*2);
      ctx.stroke();
    }
  }

  // ===== CENTER =====
  ctx.strokeStyle = "red";

  ctx.beginPath();
  ctx.moveTo(W/2,0);
  ctx.lineTo(W/2,H);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(0,H/2);
  ctx.lineTo(W,H/2);
  ctx.stroke();
}

// ===== RESIZE FIX =====
let resizeTimer;

window.addEventListener("resize", () => {

  clearTimeout(resizeTimer);

  resizeTimer = setTimeout(() => {

    if(video.videoWidth > 0){
      syncTemplate();
      drawTemplateGrid();
    }

  }, 150);

});