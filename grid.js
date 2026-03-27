function handleTap(x,y,geo){

  const col = Math.floor((x-geo.sx)/geo.cw);
  const row = Math.floor((y-geo.sy)/geo.ch);

  if(col<0||col>=4||row<0||row>=5) return;

  let cell = gridState[row][col];

  // 🔥 default = select
  if(mode==="select"){
    cell.selected = !cell.selected;
  }

  else if(mode==="normal"){
    cell.type="normal";
    mode="select"; // 🔥 auto return
  }

  else if(mode==="deficient"){
    cell.type="deficient";
    mode="select"; // 🔥 auto return
  }

  console.log("Tap:", row, col, cell);
}
