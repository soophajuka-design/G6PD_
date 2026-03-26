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

// 🔻 วาง helper functions ไว้ด้านบน หรือด้านล่างก็ได้
// แต่ต้องอยู่นอก analyze()

function getSelectedCells(){

  let cells = getWarpGrid();
  let selected = [];

  cells.forEach(cell=>{
    let state = gridState[cell.row][cell.col];

    if(state.selected){
      selected.push({
        ...cell,
        type: state.type
      });
    }
  });

  return selected;
}

function extractROI(mat, cell){

  let x = Math.max(0, Math.floor(cell.x));
  let y = Math.max(0, Math.floor(cell.y));
  let w = Math.floor(cell.w);
  let h = Math.floor(cell.h);

  let rect = new cv.Rect(x, y, w, h);

  return mat.roi(rect);
}
