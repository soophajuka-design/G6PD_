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
  const vr = getVideoRect();

  const scaleX = overlay.width / rect.width;
  const scaleY = overlay.height / rect.height;

  const x = (e.clientX - rect.left) * scaleX;
  const y = (e.clientY - rect.top) * scaleY;

  // 🔥 จำกัดให้ tap อยู่ใน video จริง
  if(
    x < vr.offsetX ||
    x > vr.offsetX + vr.drawWidth ||
    y < vr.offsetY ||
    y > vr.offsetY + vr.drawHeight
  ){
    return;
  }

  handleTap(x, y, geo);
  redraw();
});
};

function redraw(){

  ctx.clearRect(0,0,overlay.width,overlay.height);

  const vr = getVideoRect();

  geo = drawGrid(overlay, ctx, vr); // 🔥 ส่ง rect เข้าไป
}




function getVideoRect(){

  const container = overlay.getBoundingClientRect();

  const videoRatio = video.videoWidth / video.videoHeight;
  const containerRatio = container.width / container.height;

  let drawWidth, drawHeight, offsetX, offsetY;

  if(videoRatio > containerRatio){
    // video กว้างกว่า
    drawWidth = container.width;
    drawHeight = container.width / videoRatio;
    offsetX = 0;
    offsetY = (container.height - drawHeight)/2;
  }else{
    // video สูงกว่า
    drawHeight = container.height;
    drawWidth = container.height * videoRatio;
    offsetX = (container.width - drawWidth)/2;
    offsetY = 0;
  }

  return { drawWidth, drawHeight, offsetX, offsetY };
}


function resetApp(){

  for(let r=0;r<5;r++){
    for(let c=0;c<4;c++){
      gridState[r][c]={selected:false,type:"sample"};
    }
  }

  redraw();
}