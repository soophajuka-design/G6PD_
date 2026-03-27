let gridState = [];
let mode = "sample";

for(let r=0;r<5;r++){
  gridState[r]=[];
  for(let c=0;c<4;c++){
    gridState[r][c]={selected:false,type:"sample"};
  }
}

function setMode(m){
  mode = m;
}

function drawGrid(canvas, ctx){

  const rows=5, cols=4;

  const W = canvas.width;
  const H = canvas.height;

  // 🔥 FIX สำคัญ: grid scale ต้องสัมพันธ์กับ "สั้นที่สุด"
  const base = Math.min(W, H);

  const gridW = base * 0.75;
  const gridH = base * 0.75 * (5/4); // ratio 4x5

  const offsetX = (W - gridW)/2;
  const offsetY = (H - gridH)/2;

  const cellW = gridW / cols;
  const cellH = gridH / rows;

  let geo=[];

  ctx.strokeStyle="white";
  ctx.lineWidth=2;

  for(let r=0;r<rows;r++){
    for(let c=0;c<cols;c++){

      let x = offsetX + c*cellW;
      let y = offsetY + r*cellH;

      ctx.strokeRect(x,y,cellW,cellH);

      let s = gridState[r][c];

      if(s.selected){
        ctx.fillStyle =
          s.type==="normal"?"#22c55e":
          s.type==="deficient"?"#ef4444":"#facc15";

        ctx.beginPath();
        ctx.arc(x+cellW/2,y+cellH/2,12,0,Math.PI*2);
        ctx.fill();
      }

      geo.push({row:r,col:c,x,y,w:cellW,h:cellH});
    }
  }

  return geo;
}

function handleTap(x,y,geo){

  geo.forEach(cell=>{
    if(x>cell.x && x<cell.x+cell.w &&
       y>cell.y && y<cell.y+cell.h){

      let s = gridState[cell.row][cell.col];

      s.selected = true;
      s.type = mode;

      // 🔥 FIX: reset กลับ sample ทันที
      mode = "sample";
    }
  });
}