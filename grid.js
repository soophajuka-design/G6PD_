// ===== MODE =====
let mode = "sample";

function setMode(m){
  mode = m;
}

// ===== GRID STATE =====
let gridState = Array.from({length:5}, () =>
  Array.from({length:4}, () => ({
    selected:false,
    type:"sample"
  }))
);

// ===== DRAW GRID =====
function drawGrid(canvas, ctx){

  const w = canvas.width;
  const h = canvas.height;

  ctx.clearRect(0,0,w,h); // 🔥 สำคัญ (กันภาพซ้อน)

  const margin = 0.1;

  const usableW = w*(1-margin*2);
  const usableH = h*(1-margin*2);

  // 🔥 FIX RATIO (height / width ของกระดาษจริง)
  const ratio = 12.8 / 7.1;

  let pw = usableW;
  let ph = pw * ratio;

  if (ph > usableH) {
    ph = usableH;
    pw = ph / ratio;
  }

  const sx = (w - pw)/2;
  const sy = (h - ph)/2;

  const cols = 4;
  const rows = 5;

  const cw = pw / cols;
  const ch = ph / rows;

  // ===== DRAW CELLS =====
  for(let r=0;r<rows;r++){
    for(let c=0;c<cols;c++){

      let x = sx + c*cw;
      let y = sy + r*ch;

      let cell = gridState[r][c];

      // ===== COLOR =====
      if(cell.type==="normal") ctx.strokeStyle="#22c55e";
      else if(cell.type==="deficient") ctx.strokeStyle="#ef4444";
      else if(cell.selected) ctx.strokeStyle="#facc15";
      else ctx.strokeStyle="#ffffff";

      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, cw, ch);

      // ===== CIRCLE =====
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

  return {sx, sy, cw, ch};
}

// ===== TAP =====
function handleTap(x,y,geo){

  if(!geo) return; // 🔥 กัน error

  const col = Math.floor((x - geo.sx) / geo.cw);
  const row = Math.floor((y - geo.sy) / geo.ch);

  if(col<0||col>=4||row<0||row>=5) return;

  let cell = gridState[row][col];

  // ===== DEFAULT SELECT =====
  if(mode==="sample"){
    cell.selected = !cell.selected;
  }

  if(mode==="normal"){
    cell.type="normal";
    mode="sample"; // 🔥 กลับ default
  }

  if(mode==="deficient"){
    cell.type="deficient";
    mode="sample"; // 🔥 กลับ default
  }

  console.log("Tap:", row, col, cell);
}

// ===== EXPORT GLOBAL =====
window.gridState = gridState;
window.setMode = setMode;
window.drawGrid = drawGrid;
window.handleTap = handleTap;
