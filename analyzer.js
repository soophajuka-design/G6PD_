

// analyzer.js

      
function analyze(){

  let results = [];

  for(let r=0;r<5;r++){
    for(let c=0;c<4;c++){

      let cell = gridState[r][c];

      if(!cell.selected) continue;

      results.push({
        row:r,
        col:c,
        type:cell.type
      });
    }
  }

  console.log("Analyze result:", results);

  alert("Selected points: " + results.length);
}