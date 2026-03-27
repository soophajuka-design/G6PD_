function analyze(){

  console.log("🔥 Analyze clicked");

  let selected = [];

  for(let r=0;r<5;r++){
    for(let c=0;c<4;c++){
      if(gridState[r][c].selected){
        selected.push({row:r,col:c});
      }
    }
  }

  console.log("Selected:", selected);

  if(selected.length === 0){
    alert("No sample selected");
    return;
  }

  alert("Analyze OK (next step = AI)");
}

window.analyze = analyze;
window.gridState[r][c]
