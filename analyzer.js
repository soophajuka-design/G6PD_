
async function analyze(){
  console.log("🔥 analyze called");

  if(typeof cv === "undefined"){
    alert("OpenCV not loaded");
    return;
  }

  const frame = captureFrame();

  let corners = detectPaperCorners(frame);

  if(!corners){
    alert("Paper not detected");
    return;
  }

  let warped = warpPaper(frame, corners);

  let canvas = drawWarpGrid(warped);

  let old = document.getElementById("resultCanvas");
  if(old) old.remove();

  canvas.id = "resultCanvas";
  document.body.appendChild(canvas);

  let selected = getSelectedCells();

  selected.forEach(cell=>{
    let roi = extractROI(warped, cell);

    console.log("Cell:", cell.row, cell.col, cell.type);

    roi.delete();
  });

  warped.delete();
}

// 🔥 สำคัญมาก (ต้องมี)
window.analyze = analyze;
