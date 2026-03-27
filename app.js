let overlay, ctx, geo;
let isCameraOn = false;
let animationId = null;

window.onload = () => {

  initCameraElement();

  document.getElementById('startBtn').onclick = async () => {
    await startCamera();
  };

};

function startLoop(){

  function loop(){

    if(video.videoWidth > 0){

      const rect = overlay.getBoundingClientRect();

      // 🔥 resize canvas ให้ตรง display
      if(
        overlay.width !== rect.width ||
        overlay.height !== rect.height
      ){
        overlay.width = rect.width;
        overlay.height = rect.height;
      }

      drawNow();
    }

    animationId = requestAnimationFrame(loop);
  }

  loop();
}

// 🔥 วาดทันที (ใช้ร่วมกัน)
function drawNow(){
  ctx.clearRect(0,0,overlay.width,overlay.height);
  geo = drawGrid(overlay, ctx);
}

function resetApp(){

  for(let r=0;r<5;r++){
    for(let c=0;c<4;c++){
      gridState[r][c] = {
        selected:false,
        type:"sample"
      };
    }
  }

  mode = "select";

  console.log("✅ Reset complete");
}
