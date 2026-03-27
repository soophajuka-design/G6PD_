function getSelectedCells(){

  let selected=[];

  for(let r=0;r<5;r++){
    for(let c=0;c<4;c++){

      let s = gridState[r][c];

      if(s.selected){
        selected.push({
          row:r,
          col:c,
          type:s.type
        });
      }
    }
  }

  return selected;
}

function analyze(){

  console.log("🔥 analyze called");

  let selected = getSelectedCells();

  if(selected.length===0){
    alert("No sample selected");
    return;
  }

  selected.forEach(c=>{
    console.log("Cell:",c.row,c.col,c.type);
  });

  console.log("✅ Analyze done");
}

window.analyze = analyze;