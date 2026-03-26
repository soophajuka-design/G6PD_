let overlay, ctx;
let geo;
let isCameraOn = false;

window.onload = () => {

  initCameraElement();

  overlay = document.getElementById('overlay');
  ctx = overlay.getContext('2d');

  document.getElementById('startBtn').onclick = async () => {
    await startCamera();
    isCameraOn = true;
    startLoop();
  };

 overlay.addEventListener('click', (e)=>{

  if(!isCameraOn) return;

  const rect = overlay.getBoundingClientRect();

  const x = (e.clientX - rect.left) * (overlay.width / rect.width);
  const y = (e.clientY - rect.top) * (overlay.height / rect.height);

  handleTap(x, y, geo);

  // ✅ บังคับ redraw ทันที
  redrawOverlay();
});
};
overlay.addEventListener('click', (e)=>{

  if(!isCameraOn) return;

  const rect = overlay.getBoundingClientRect();

  const x = (e.clientX - rect.left) * (overlay.width / rect.width);
  const y = (e.clientY - rect.top) * (overlay.height / rect.height);

  handleTap(x, y, geo);

  // ✅ บังคับ redraw ทันที
  redrawOverlay();
});

function startLoop(){

  function loop(){

    if(video.videoWidth > 0){

      overlay.width = video.videoWidth;
      overlay.height = video.videoHeight;

      // ❗ ไม่ต้อง redraw ทุก frame
      if(!window.rendered){
        geo = drawGrid(overlay, ctx);
        window.rendered = true;
      }
    }

    requestAnimationFrame(loop);
  }

  loop();
}

function resetApp() {

  // reset grid
  for(let r=0;r<5;r++){
    for(let c=0;c<4;c++){
      gridState[r][c] = {
        selected:false,
        type:"sample"
      };
    }
  }

  // clear overlay
  if(ctx && overlay){
    ctx.clearRect(0,0,overlay.width, overlay.height);
  }

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
