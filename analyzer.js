function analyze(){

  console.log("Analyze OK");

  let selected=[];

  gridState.forEach((row,r)=>{
    row.forEach((cell,c)=>{
      if(cell.selected){
        selected.push({row:r,col:c,type:cell.type});
      }
    });
  });

  console.log(selected);

  if(selected.length===0){
    alert("No sample selected");
  }
}

window.analyze=analyze;