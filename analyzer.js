// analyzer.js

async function analyze(){

  const frame = captureFrame();

  // 1. detect
  let corners = detectPaperCorners(frame);

  if(!corners){
    alert("Paper not detected");
    return;
  }

  // 2. warp
  let warped = warpPaper(frame, corners);

  // 3. draw grid
  let canvas = drawWarpGrid(warped);

  // 🔥 clear ของเก่า (กันซ้อน)
  let old = document.getElementById("resultCanvas");
  if(old) old.remove();

  canvas.id = "resultCanvas";
  document.body.appendChild(canvas);

  // 4. extract ROI
  let selected = getSelectedCells();

  selected.forEach(cell=>{
    let roi = extractROI(warped, cell);

    console.log("Cell:", cell.row, cell.col, cell.type);

    // TODO: ส่งเข้า AI ตรงนี้
    // predictROI(roi);

    roi.delete(); // 🔥 สำคัญ
  });

  warped.delete(); // 🔥 สำคัญ

  console.log("Analyze complete");
}
