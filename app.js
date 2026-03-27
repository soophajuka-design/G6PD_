let overlay, ctx, geo;
let isCameraOn = false;

window.onload = ()=>{

  initCameraElement();

  overlay = document.getElementById("overlay");
  ctx = overlay.getContext("2d");

  document.getElementById("startBtn").onclick = async ()=>{
    await startCamera();
    isCameraOn = true;
    startLoop();
  };

  document.getElementById("analyzeBtn").onclick = ()=>{
    analyze();
  };

  overlay.addEventListener("click", e=>{

    if(!isCameraOn) return;

    const rect = overlay.getBoundingClientRect();

    const x = (e.clientX - rect.left) * (overlay.width / rect.width);
    const y = (e.clientY - rect.top) * (overlay.height / rect.height);

    handleTap(x,y,geo);
    redraw();
  });
};

function redraw(){
  ctx.clearRect(0,0,overlay.width,overlay.height);
  geo = drawGrid(overlay, ctx);
}

function startLoop(){

  function loop(){

    if(video.videoWidth > 0){

      const rect = overlay.getBoundingClientRect();

      overlay.width = rect.width;
      overlay.height = rect.height;

      redraw();
    }

    requestAnimationFrame(loop);
  }

  loop();
}

function resetApp(){

  for(let r=0;r<5;r++){
    for(let c=0;c<4;c++){
      gridState[r][c]={selected:false,type:"sample"};
    }
  }

  redraw();
}