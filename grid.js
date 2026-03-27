const WARP_W = 710;
const WARP_H = 1280;

// 🔥 default = select
let mode = "select";

function setMode(m){
  mode = m;
}

let gridState = Array.from({length:5}, () =>
  Array.from({length:4}, () => ({
    selected:false,
    type:"sample"
  }))
);

function drawGrid(canvas, ctx){

  const w = canvas.width;
  const h = canvas.height;

  ctx.clearRect(0,0,w,h);

  const ratio = 7.1/12.8;

  let pw = w;
  let ph = pw/ratio;

  if(ph > h){
    ph = h;
    pw = ph*ratio;
  }

  const sx = (w-pw)/2;
  const sy = (h-ph)/2;

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

      ctx.lineWidth=2;
      ctx.strokeRect(x,y,cw,ch);

      ctx.beginPath();
      ctx.strokeStyle="rgba(255,255,255,0.5)";
      ctx.arc(x+cw/2,y+ch/2,Math.min(cw,ch)*0.3,0,2*Math.PI);
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

  if(mode==="select"){
    cell.selected = !cell.selected;
  }

  if(mode==="normal"){
    cell.type="normal";
    mode="select"; // 🔥 กลับ default
  }

  if(mode==="deficient"){
    cell.type="deficient";
    mode="select"; // 🔥 กลับ default
  }
}
