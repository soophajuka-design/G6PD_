let overlay, ctx;
let geo;

window.onload = () => {

  initCameraElement();

  overlay = document.getElementById('overlay');
  ctx = overlay.getContext('2d');

  document.getElementById('startBtn').onclick = async () => {
    await startCamera();
    startLoop();
  };

  overlay.addEventListener('click', (e)=>{
    const rect = overlay.getBoundingClientRect();

    const x = (e.clientX - rect.left) * (overlay.width / rect.width);
    const y = (e.clientY - rect.top) * (overlay.height / rect.height);

    handleTap(x,y,geo);
  });
};

function startLoop(){
  function loop(){

    if(video.videoWidth>0){

      overlay.width = video.videoWidth;
      overlay.height = video.videoHeight;

      geo = drawGrid(overlay, ctx);
    }

    requestAnimationFrame(loop);
  }

  loop();
}