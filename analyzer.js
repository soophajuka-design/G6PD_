

// analyzer.js

async function analyze() {
  const frame = captureFrame();

  for(let r=0;r<5;r++){
    for(let c=0;c<4;c++){

      let cell = gridState[r][c];
      if(!cell.selected) continue;

      let pred = await predict();

      console.log(r,c,pred,cell.type);
    }
  }
}