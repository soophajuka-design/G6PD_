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

  template.width = video.videoWidth;
  template.height = video.videoHeight;

  template.style.width = rect.width + "px";
  template.style.height = rect.height + "px";
}

// ===== DRAW GRID =====
function drawTemplateGrid(){

  const ctx = template.getContext("2d");

  ctx.clearRect(0,0,template.width,template.height);

  const W = template.width;
  const H = template.height;

  const cols = 4;
  const rows = 6;

  const marginX = W * 0.08;
  const marginY = H * 0.06;

  const stepX = (W - marginX*2)/cols;
  const stepY = (H - marginY*2)/rows;

  // ===== PAPER FRAME =====
  ctx.strokeStyle = "cyan";
  ctx.lineWidth = 2;
  ctx.strokeRect(marginX, marginY, W-marginX*2, H-marginY*2);

  // ===== CIRCLES =====
  ctx.strokeStyle = "lime";

  for(let r=0;r<rows;r++){
    for(let c=0;c<cols;c++){

      const x = marginX + stepX*(c+0.5);
      const y = marginY + stepY*(r+0.5);

      const radius = Math.min(stepX,stepY)*0.32;

      ctx.beginPath();
      ctx.arc(x,y,radius,0,Math.PI*2);
      ctx.stroke();
    }
  }

  // ===== CENTER CROSS =====
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