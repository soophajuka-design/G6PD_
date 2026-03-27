let gridState = [];

for(let r=0;r<5;r++){
  gridState[r]=[];
  for(let c=0;c<4;c++){
    gridState[r][c]={
      selected:false,
      type:"sample"
    };
  }
}

let currentMode = "sample";

function setMode(mode){
  currentMode = mode;
}

function drawGrid(canvas, ctx){

  const rows=5, cols=4;

  let w = canvas.width * 0.8;
  let h = w * (5/4);

  let startX = (canvas.width - w)/2;
  let startY = (canvas.height - h)/2;

  let cellW = w/cols;
  let cellH = h/rows;

  let geo=[];

  ctx.strokeStyle="white";
  ctx.lineWidth=2;

  for(let r=0;r<rows;r++){
    for(let c=0;c<cols;c++){

      let x = startX + c*cellW;
      let y = startY + r*cellH;

      ctx.strokeRect(x,y,cellW,cellH);

      let s = gridState[r][c];

      if(s.selected){
        ctx.fillStyle =
          s.type==="normal"?"#22c55e":
          s.type==="deficient"?"#ef4444":"#facc15";

        ctx.beginPath();
        ctx.arc(x+cellW/2,y+cellH/2,10,0,Math.PI*2);
        ctx.fill();
      }

      geo.push({row:r,col:c,x,y,w:cellW,h:cellH});
    }
  }

  return geo;
}

function handleTap(x,y,geo){

  geo.forEach(cell=>{
    if(
      x>cell.x && x<cell.x+cell.w &&
      y>cell.y && y<cell.y+cell.h
    ){
      let s = gridState[cell.row][cell.col];

      s.selected = !s.selected;

      if(currentMode==="normal") s.type="normal";
      else if(currentMode==="deficient") s.type="deficient";
      else s.type="sample";

      currentMode="sample";
    }
  });
}