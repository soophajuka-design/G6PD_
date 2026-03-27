function handleTap(x,y,geo){

  const col = Math.floor((x-geo.sx)/geo.cw);
  const row = Math.floor((y-geo.sy)/geo.ch);

  if(col<0||col>=4||row<0||row>=5) return;

  let cell = gridState[row][col];

  // ✅ DEFAULT = select
  if(mode === "select"){
    cell.selected = !cell.selected;
  }

  // ✅ set control แล้วเด้งกลับ select
  else if(mode === "normal"){
    cell.type = "normal";
    cell.selected = true;
    mode = "select";
  }

  else if(mode === "deficient"){
    cell.type = "deficient";
    cell.selected = true;
    mode = "select";
  }

  console.log("Tap:", row, col, cell);
}
