function drawGrid(canvas, ctx){

  const W = canvas.width;
  const H = canvas.height;

  ctx.clearRect(0,0,W,H);

  // ===== REAL PAPER RATIO =====
  const paperW = 7.1;
  const paperH = 12.8;

  const paperRatio = paperW / paperH; // 🔥 สำคัญ

  // ===== FIT INSIDE SCREEN =====
  let drawW = W;
  let drawH = drawW / paperRatio;

  if(drawH > H){
    drawH = H;
    drawW = drawH * paperRatio;
  }

  // ===== CENTER =====
  const sx = (W - drawW) / 2;
  const sy = (H - drawH) / 2;

  // ===== GRID =====
  const cols = 4;
  const rows = 5;

  const cw = drawW / cols;
  const ch = drawH / rows;

  // ===== DRAW =====
  for(let r=0;r<rows;r++){
    for(let c=0;c<cols;c++){

      const x = sx + c*cw;
      const y = sy + r*ch;

      let cell = gridState[r][c];

      // COLOR
      if(cell.type==="normal") ctx.strokeStyle="#22c55e";
      else if(cell.type==="deficient") ctx.strokeStyle="#ef4444";
      else if(cell.selected) ctx.strokeStyle="#facc15";
      else ctx.strokeStyle="#ffffff";

      ctx.lineWidth = 2;
      ctx.strokeRect(x,y,cw,ch);

      // CIRCLE
      ctx.beginPath();
      ctx.strokeStyle="rgba(255,255,255,0.6)";
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

  // 🔥 return geometry (สำคัญกับ tap)
  return {sx, sy, cw, ch};
}
