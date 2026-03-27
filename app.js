let overlay, ctx, geo;
let isCameraOn = false;
let animationId = null;

window.onload = () => {

  initCameraElement();

  overlay = document.getElementById("overlay");
  ctx = overlay.getContext("2d");

  // ===== START BUTTON =====

  document.getElementById('startBtn').onclick = () => {
  startCameraDirect();
};
  // ===== TAP =====
  overlay.addEventListener("click", (e)=>{

    if(!isCameraOn || !geo) return;

    const rect = overlay.getBoundingClientRect();

    const scaleX = overlay.width / rect.width;
    const scaleY = overlay.height / rect.height;

    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    handleTap(x, y, geo);

    // 🔥 redraw ทันที
    drawNow();
  });

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
