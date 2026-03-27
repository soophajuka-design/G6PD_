function analyze(){

  console.log("🔥 analyze called");

  if(typeof cv === "undefined"){
    alert("OpenCV not ready");
    return;
  }

  const selected = getSelectedCells();

  if(selected.length === 0){
    alert("No sample selected");
    return;
  }

  console.log("Selected:", selected);
}

function getSelectedCells(){

  let cells = [];
  gridState.forEach((row,r)=>{
    row.forEach((cell,c)=>{
      if(cell.selected){
        cells.push({row:r,col:c,type:cell.type});
      }
    });
  });

  return cells;
}

window.analyze = analyze;
