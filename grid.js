let mode = "select";

function setMode(m) {
  mode = m;
  console.log("Mode:", m);
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

  // margin 10%
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

  // draw cells
  for(let r=0;r<rows;r++){
    for(let c=0;c<cols;c++){

      let x = sx + c*cw;
      let y = sy + r*ch;

      let cell = gridState[r][c];

      // สีตามสถานะ
      if(cell.type==="normal") ctx.strokeStyle="lime";
      else if(cell.type==="deficient") ctx.strokeStyle="red";
      else if(cell.selected) ctx.strokeStyle="yellow";
      else ctx.strokeStyle="#00FFAA";

      ctx.strokeRect(x,y,cw,ch);

      // วงกลม
      ctx.beginPath();
      ctx.arc(x+cw/2, y+ch/2, Math.min(cw,ch)*0.3, 0, 2*Math.PI);
      ctx.stroke();
    }
  }

  return {sx,sy,cw,ch};
}

function handleTap(x,y,geo){

  const col = Math.floor((x-geo.sx)/geo.cw);
  const row = Math.floor((y-geo.sy)/geo.ch);

  if(col<0||col>=4||row<0||row>=5) return;

  let cell = gridState[row][col];

  if(mode==="select") {
    cell.selected = !cell.selected;
  }

  if(mode==="normal") {
    cell.type="normal";
  }

  if(mode==="deficient") {
    cell.type="deficient";
  }

  console.log("Tap:", row, col, cell);
}
