const video = document.getElementById("video");
const overlay = document.getElementById("overlay");
const resultBox = document.getElementById("result");

let stream = null;
let samples = [];

const SAMPLE_RADIUS = 20;

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
      video.play();
      syncCanvas();
    };

  }catch(err){
    alert("Camera error: " + err);
  }
}

function stopCamera(){
  if(stream){
    stream.getTracks().forEach(t=>t.stop());
    stream = null;
  }
}

// ===== SYNC CANVAS =====
function syncCanvas(){
  const rect = video.getBoundingClientRect();
  overlay.width = rect.width;
  overlay.height = rect.height;
}

// ===== TAP EVENT =====
overlay.addEventListener("click", (e)=>{

  const rect = overlay.getBoundingClientRect();

  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  addSample(x,y);
});

// ===== ADD SAMPLE =====
function addSample(x,y){

  const rgb = readRGB(x,y,SAMPLE_RADIUS);

  samples.push({
    x,y,
    r:SAMPLE_RADIUS,
    rgb
  });

  drawAll();
  updateResult();
}

// ===== READ RGB =====
function readRGB(cx,cy,r){

  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  const ctx = canvas.getContext("2d");
  ctx.drawImage(video,0,0);

  const img = ctx.getImageData(0,0,canvas.width,canvas.height);

  let sumR=0,sumG=0,sumB=0,count=0;

  const scaleX = canvas.width / overlay.width;
  const scaleY = canvas.height / overlay.height;

  const centerX = cx * scaleX;
  const centerY = cy * scaleY;
  const radius = r * scaleX;

  for(let y=-radius;y<=radius;y++){
    for(let x=-radius;x<=radius;x++){

      if(x*x + y*y <= radius*radius){

        const px = Math.floor(centerX + x);
        const py = Math.floor(centerY + y);

        if(px<0||py<0||px>=canvas.width||py>=canvas.height) continue;

        const i = (py*canvas.width + px)*4;

        sumR += img.data[i];
        sumG += img.data[i+1];
        sumB += img.data[i+2];
        count++;
      }
    }
  }

  return {
    r:Math.round(sumR/count),
    g:Math.round(sumG/count),
    b:Math.round(sumB/count)
  };
}

// ===== DRAW =====
function drawAll(){

  const ctx = overlay.getContext("2d");
  ctx.clearRect(0,0,overlay.width,overlay.height);

  samples.forEach((s,i)=>{

    ctx.strokeStyle="lime";
    ctx.lineWidth=2;

    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI*2);
    ctx.stroke();

    ctx.fillStyle="yellow";
    ctx.font="12px Arial";
    ctx.fillText(
      `#${i} (${s.rgb.r},${s.rgb.g},${s.rgb.b})`,
      s.x+8,
      s.y-8
    );
  });
}

// ===== RESET =====
function resetSamples(){
  samples=[];
  drawAll();
  resultBox.textContent="";
}

// ===== RESULT (พื้นฐาน) =====
function updateResult(){

  let txt = "";

  samples.forEach((s,i)=>{
    txt += `#${i} → R:${s.rgb.r} G:${s.rgb.g} B:${s.rgb.b}\n`;
  });

  resultBox.textContent = txt;
}