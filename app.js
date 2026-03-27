let overlay, ctx;
let geo = null;
let isCameraOn = false;
let needRedraw = true;

// 🔥 ใช้ DOMContentLoaded (เสถียรกว่า iOS)
document.addEventListener("DOMContentLoaded", () => {

  overlay = document.getElementById('overlay');
  ctx = overlay.getContext('2d');

  // ===== TAP =====
  overlay.addEventListener('click', (e)=>{

    if(!isCameraOn) return;
    if(!geo) return; // 🔥 กัน crash

    const rect = overlay.getBoundingClientRect();

    const x = (e.clientX - rect.left) * (overlay.width / rect.width);
    const y = (e.clientY - rect.top) * (overlay.height / rect.height);

    handleTap(x, y, geo);

    // 🔥 redraw ทันที (ไม่รอ loop)
    drawNow();
  });

});

// ===== LOOP =====
function startLoop(){

  function loop(){

    if(video && video.videoWidth > 0){

      // 🔥 resize ให้ match video จริง
      if(
        overlay.width !== video.videoWidth ||
        overlay.height !== video.videoHeight
      ){
        overlay.width = video.videoWidth;
        overlay.height = video.videoHeight;

        needRedraw = true;
      }

      // 🔥 redraw เฉพาะเมื่อจำเป็น
      if(needRedraw){
        drawNow();
        needRedraw = false;
      }
    }

    requestAnimationFrame(loop);
  }

  loop();
}

// ===== DRAW =====
function drawNow(){
  if(!overlay || !ctx) return;

  ctx.clearRect(0,0,overlay.width, overlay.height);
  geo = drawGrid(overlay, ctx);
}

// ===== RESET =====
function resetApp(){

  for(let r=0;r<5;r++){
    for(let c=0;c<4;c++){
      gridState[r][c] = {
        selected:false,
        type:"sample"
      };
    }
  }

  // 🔥 กลับ default mode
  if(typeof setMode === "function"){
    setMode("sample");
  }

  // 🔥 redraw ทันที
  needRedraw = true;
  drawNow();

  console.log("✅ Reset complete");
}
