let mode = "sample"; // default = tap = sample

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

  ctx.lineWidth = 2;

  // ===== draw cells =====
  for(let r=0;r<rows;r++){
    for(let c=0;c<cols;c++){

      let x = sx + c*cw;
      let y = sy + r*ch;

      let cell = gridState[r][c];

      // ===== สีตามสถานะ =====
      if(cell.type==="normal") {
        ctx.strokeStyle="#22c55e"; // เขียว
      }
      else if(cell.type==="deficient") {
        ctx.strokeStyle="#ef4444"; // แดง
      }
      else if(cell.selected) {
        ctx.strokeStyle="#facc15"; // เหลือง
      }
      else {
        ctx.strokeStyle="#ffffff"; // ขาว (grid default)
      }
      ctx.shadowColor = "rgba(255,255,255,0.4)";
      ctx.shadowBlur = 4;
      ctx.strokeRect(x,y,cw,ch);

      // ===== วงกลม (สีขาวจาง) =====
      ctx.beginPath();
      ctx.strokeStyle="rgba(255,255,255,0.6)";
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

  // 🔥 กดครั้งแรก = sample อัตโนมัติ
  if(mode === "sample") {
    cell.selected = !cell.selected;

    // ถ้าเลือก → เป็น sample
    if(cell.selected){
      cell.type = "sample";
    }
  }

  // 🔥 assign control
  if(mode === "normal") {
    cell.selected = true;
    cell.type = "normal";
  }

  if(mode === "deficient") {
    cell.selected = true;
    cell.type = "deficient";
  }

  console.log("Tap:", row, col, cell);
}
