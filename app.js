let overlay, ctx;
let geo;
let isCameraOn = false;
let needRedraw = true;

window.onload = () => {

  initCameraElement();

  overlay = document.getElementById('overlay');
  ctx = overlay.getContext('2d');

  // START CAMERA
  document.getElementById('startBtn').onclick = async () => {
    await startCamera();
    isCameraOn = true;
    startLoop();
  };

  // TAP SELECT
  overlay.addEventListener('click', (e)=>{

    if(!isCameraOn) return;

    const rect = overlay.getBoundingClientRect();

    const x = (e.clientX - rect.left) * (overlay.width / rect.width);
    const y = (e.clientY - rect.top) * (overlay.height / rect.height);

    handleTap(x, y, geo);

    needRedraw = true;
  });

  // 🔥 FIX: bind analyze button
  const analyzeBtn = document.getElementById("analyzeBtn");

  if(analyzeBtn){
    analyzeBtn.onclick = ()=>{

      if(typeof analyze !== "function"){
        alert("analyze() not loaded");
        console.error("analyze not found");
        return;
      }

      console.log("✅ Analyze clicked");

      analyze();
    };
  }
};

function startLoop(){

  function loop(){

    if(video.videoWidth > 0){

      if(overlay.width !== video.videoWidth ||
         overlay.height !== video.videoHeight){

        overlay.width = video.videoWidth;
        overlay.height = video.videoHeight;

        needRedraw = true;
      }

      if(needRedraw){
        ctx.clearRect(0,0,overlay.width, overlay.height);
        geo = drawGrid(overlay, ctx);
        needRedraw = false;
      }
    }

    requestAnimationFrame(loop);
  }

  loop();
}

function resetApp() {

  for(let r=0;r<5;r++){
    for(let c=0;c<4;c++){
      gridState[r][c] = {
        selected:false,
        type:"sample"
      };
    }
  }

  needRedraw = true;

  console.log("Reset complete");
}

function drawCorners(ctx, corners){
  if(!corners) return;

  ctx.fillStyle = "red";

  corners.forEach(p=>{
    ctx.beginPath();
    ctx.arc(p.x, p.y, 5, 0, 2*Math.PI);
    ctx.fill();
  });
}
