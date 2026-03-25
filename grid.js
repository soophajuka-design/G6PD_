let mode = "select";

function setMode(m) {
  mode = m;
}

let gridState = Array.from({length:5}, () =>
  Array.from({length:4}, () => ({
    selected:false,
    type:"sample"
  }))
);

function drawGrid(canvas, ctx) {
  const w = canvas.width;
  const h = canvas.height;

  ctx.clearRect(0,0,w,h);

  const margin = 0.1;
  const usableW = w*(1-margin*2);
  const usableH = h*(1-margin*2);

  const ratio = 7.1/12.8;

  let pw = usableW;
  let ph = pw/ratio;

  if (ph > usableH) {
    ph = usableH;
    pw = ph*ratio;
  }

  const sx = (w-pw)/2;
  const sy = (h-ph)/2;

  const cols=4, rows=5;
  const cw = pw/cols;
  const ch = ph/rows;

  ctx.strokeStyle="#00FFAA";

  for(let i=0;i<=cols;i++){
    ctx.beginPath();
    ctx.moveTo(sx+i*cw, sy);
    ctx.lineTo(sx+i*cw, sy+ph);
    ctx.stroke();
  }

  for(let j=0;j<=rows;j++){
    ctx.beginPath();
    ctx.moveTo(sx, sy+j*ch);
    ctx.lineTo(sx+pw, sy+j*ch);
    ctx.stroke();
  }

  // circles
  for(let r=0;r<rows;r++){
    for(let c=0;c<cols;c++){
      let cx = sx+c*cw+cw/2;
      let cy = sy+r*ch+ch/2;

      ctx.beginPath();
      ctx.arc(cx,cy,Math.min(cw,ch)*0.3,0,2*Math.PI);
      ctx.stroke();
    }
  }

  return {startX:sx,startY:sy,cellW:cw,cellH:ch};
}

function handleTap(x,y,geo){
  let c = Math.floor((x-geo.startX)/geo.cellW);
  let r = Math.floor((y-geo.startY)/geo.cellH);

  if(c<0||c>=4||r<0||r>=5) return;

  if(mode==="select") gridState[r][c].selected=!gridState[r][c].selected;
  if(mode==="normal") gridState[r][c].type="normal";
  if(mode==="deficient") gridState[r][c].type="deficient";
}