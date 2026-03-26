async function analyze(){

  console.log("🔥 analyze called");

  try {

    // ✅ check OpenCV
    if(typeof cv === "undefined"){
      alert("OpenCV not loaded");
      return;
    }

    // ✅ check video ready
    if(!video || video.videoWidth === 0){
      alert("Camera not ready");
      return;
    }

    // 1. capture
    const frame = captureFrame();

    if(!frame){
      alert("Capture failed");
      return;
    }

    console.log("Frame OK");

    // 2. detect
    let corners = detectPaperCorners(frame);

    if(!corners){
      alert("Paper not detected");
      return;
    }

    console.log("Corners detected");

    // 3. warp
    let warped = warpPaper(frame, corners);

    if(!warped){
      alert("Warp failed");
      return;
    }

    console.log("Warp OK");

    // 4. draw grid
    let canvas = drawWarpGrid(warped);

    let old = document.getElementById("resultCanvas");
    if(old) old.remove();

    canvas.id = "resultCanvas";
    document.body.appendChild(canvas);

    // 5. ROI extraction
    let selected = getSelectedCells();

    if(selected.length === 0){
      alert("No sample selected");
      warped.delete();
      return;
    }

    selected.forEach(cell=>{
      let roi = extractROI(warped, cell);

      console.log("Cell:", cell.row, cell.col, cell.type);

      roi.delete();
    });

    warped.delete();

    console.log("✅ Analyze complete");

  } catch(err) {

    console.error("❌ Analyze error:", err);
    alert("Error: " + err.message);

  }
}

// 🔥 สำคัญ (ต้องมี)
window.analyze = analyze;
