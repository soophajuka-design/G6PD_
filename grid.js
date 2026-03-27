function drawGrid(canvas, ctx){

  const w = canvas.width;
  const h = canvas.height;

  ctx.clearRect(0,0,w,h);

  const margin = 0.1;

  const usableW = w*(1-margin*2);
  const usableH = h*(1-margin*2);

  const ratio = 7.1 / 12.8;

  let pw = usableW;
  let ph = pw / ratio;

  if (ph > usableH) {
    ph = usableH;
    pw = ph * ratio;
  }

  // ✅ center แนวนอน (สมมาตร)
  const sx = (w - pw)/2;

  // 🔥 เลื่อนขึ้น (bias ขึ้นด้านบน)
  const topBias = 0.35; 
  const sy = (h - ph) * topBias;

  const cols=4, rows=5;
  const cw = pw/cols;
  const ch = ph/rows;

  for(let r=0;r<rows;r++){
    for(let c=0;c<cols;c++){

      let x = sx + c*cw;
      let y = sy + r*ch;

      let cell = gridState[r][c];

      if(cell.type==="normal") ctx.strokeStyle="#22c55e";
      else if(cell.type==="deficient") ctx.strokeStyle="#ef4444";
      else if(cell.selected) ctx.strokeStyle="#facc15";
      else ctx.strokeStyle="#ffffff";

      ctx.lineWidth = 2;
      ctx.strokeRect(x,y,cw,ch);

      ctx.beginPath();
      ctx.strokeStyle="rgba(255,255,255,0.5)";
      ctx.arc(
        x + cw/2,
        y + ch/2,
        Math.min(cw,ch)*0.3,
        0,
        2*Math.PI
      );
      ctx.stroke();
    }
  }

  return {sx,sy,cw,ch};
}
