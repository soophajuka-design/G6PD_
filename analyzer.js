// =========================
// SAFE AI HELPERS
// =========================

function computeIntensity(roi){
  try{
    let gray = new cv.Mat();
    cv.cvtColor(roi, gray, cv.COLOR_RGBA2GRAY);
    let mean = cv.mean(gray)[0];
    gray.delete();
    return mean;
  }catch(e){
    console.error("computeIntensity error:", e);
    return 0;
  }
}

function normalizeIntensity(value, min, max){
  if(max - min === 0) return 0;
  return (value - min) / (max - min);
}

function classifyG6PD(norm){
  if(norm > 0.7) return "Normal";
  if(norm > 0.3) return "Intermediate";
  return "Deficient";
}


// =========================
// MAIN ANALYZE
// =========================

async function analyze(){

  console.log("🔥 analyze called");

  try {

    // 0. check dependencies
    if(typeof cv === "undefined"){
      throw new Error("OpenCV not loaded");
    }

    if(typeof captureFrame !== "function"){
      throw new Error("captureFrame not found");
    }

    if(typeof detectPaperCorners !== "function"){
      throw new Error("detectPaperCorners not found");
    }

    if(typeof warpPaper !== "function"){
      throw new Error("warpPaper not found");
    }

    if(typeof getSelectedCells !== "function"){
      throw new Error("getSelectedCells not found");
    }

    console.log("✅ Dependencies OK");

    // 1. check video
    if(!video || video.videoWidth === 0){
      throw new Error("Camera not ready");
    }

    // 2. capture
    let frame = captureFrame();
    if(!frame){
      throw new Error("captureFrame returned null");
    }

    console.log("📸 Frame captured");

    // 3. detect
    let corners = detectPaperCorners(frame);

    if(!corners || corners.length !== 4){
      throw new Error("Paper not detected properly");
    }

    console.log("📐 Corners:", corners);

    // 4. warp
    let warped = warpPaper(frame, corners);

    if(!warped){
      throw new Error("warp failed");
    }

    console.log("🧭 Warp OK");

    // 5. draw grid
    if(typeof drawWarpGrid !== "function"){
      throw new Error("drawWarpGrid not found");
    }

    let canvas = drawWarpGrid(warped);

    let old = document.getElementById("resultCanvas");
    if(old) old.remove();

    canvas.id = "resultCanvas";
    document.body.appendChild(canvas);

    console.log("🧱 Grid drawn");

    // 6. get selected
    let selected = getSelectedCells();

    console.log("Selected:", selected);

    if(!selected || selected.length === 0){
      throw new Error("No sample selected");
    }

    let intensities = [];

    // 7. ROI loop
    selected.forEach(cell=>{

      try{

        let roi = extractROI(warped, cell);

        if(!roi){
          console.warn("ROI null:", cell);
          return;
        }

        let val = computeIntensity(roi);

        intensities.push({
          ...cell,
          intensity: val
        });

        roi.delete();

      }catch(e){
        console.error("ROI error:", e, cell);
      }

    });

    console.log("📊 Intensities:", intensities);

    // 8. find controls
    let normalCtrl = intensities.find(c=>c.type==="normal");
    let deficientCtrl = intensities.find(c=>c.type==="deficient");

    if(!normalCtrl || !deficientCtrl){
      throw new Error("Control not set (normal + deficient required)");
    }

    console.log("🧪 Controls OK");

    // 9. classify
    intensities.forEach(cell=>{

      let norm = normalizeIntensity(
        cell.intensity,
        deficientCtrl.intensity,
        normalCtrl.intensity
      );

      let result = classifyG6PD(norm);

      console.log(
        "✅ Cell:",
        cell.row, cell.col,
        "Raw:", cell.intensity.toFixed(1),
        "Norm:", norm.toFixed(2),
        "Result:", result
      );
    });

    warped.delete();

    console.log("🎉 Analyze COMPLETE");

  } catch(err) {

    console.error("❌ ANALYZE FAILED:", err);

    alert(
      "Error: " + err.message +
      "\nCheck console for detail"
    );
  }
}


// =========================
// FORCE GLOBAL (สำคัญ)
// =========================
window.analyze = analyze;
