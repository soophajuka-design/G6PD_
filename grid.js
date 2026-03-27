function drawGrid(canvas, ctx){

  const rows = 5;
  const cols = 4;

  const W = canvas.width;
  const H = canvas.height;

  const targetRatio = 7.1 / 12.8;
  const screenRatio = W / H;

  let gridW, gridH, offsetX, offsetY;

  if(screenRatio > targetRatio){
    // จอกว้าง → fit height
    gridH = H;
    gridW = H * targetRatio;
    offsetX = (W - gridW)/2;
    offsetY = 0;
  }else{
    // จอสูง → fit width
    gridW = W;
    gridH = W / targetRatio;
    offsetX = 0;
    offsetY = (H - gridH)/2;
  }

  const cellW = gridW / cols;
  const cellH = gridH / rows;

  let geo = [];

  ctx.strokeStyle = "white";
  ctx.lineWidth = 2;

  for(let r=0;r<rows;r++){
    for(let c=0;c<cols;c++){

      let x = offsetX + c*cellW;
      let y = offsetY + r*cellH;

      ctx.strokeRect(x,y,cellW,cellH);

      let state = gridState[r][c];

      if(state.selected){
        ctx.fillStyle =
          state.type==="normal"?"green":
          state.type==="deficient"?"red":"yellow";

        ctx.beginPath();
        ctx.arc(x+cellW/2, y+cellH/2, 12, 0, Math.PI*2);
        ctx.fill();
      }

      geo.push({row:r,col:c,x,y,w:cellW,h:cellH});
    }
  }

  return geo;
}
