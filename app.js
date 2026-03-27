let overlay, ctx;
let geo;
let isCameraOn = false;

window.onload = () => {

  overlay = document.getElementById('overlay');
  ctx = overlay.getContext('2d');

  overlay.addEventListener('click', (e)=>{

    if(!isCameraOn) return;

    const rect = overlay.getBoundingClientRect();

    const x = (e.clientX - rect.left) * (overlay.width / rect.width);
    const y = (e.clientY - rect.top) * (overlay.height / rect.height);

    handleTap(x, y, geo);

    ctx.clearRect(0,0,overlay.width, overlay.height);
    geo = drawGrid(overlay, ctx);
  });
};

function startLoop(){

  function loop(){

    if(video.videoWidth > 0){

      if(overlay.width !== video.videoWidth){
        overlay.width = video.videoWidth;
        overlay.height = video.videoHeight;
      }

      ctx.clearRect(0,0,overlay.width, overlay.height);
      geo = drawGrid(overlay, ctx);
    }

    requestAnimationFrame(loop);
  }

  loop();
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

  console.log("Reset");
}
