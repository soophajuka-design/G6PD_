// === AI HELPERS ===

function computeIntensity(roi){
  let gray = new cv.Mat();
  cv.cvtColor(roi, gray, cv.COLOR_RGBA2GRAY);
  let mean = cv.mean(gray)[0];
  gray.delete();
  return mean;
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


// === MAIN ===

async function analyze(){

  console.log("🔥 analyze called");

  try {

    // ✅ OpenCV check
    if(typeof cv === "undefined"){
      alert("OpenCV not loaded");
      return;
    }

    // ✅ camera check
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

    // 5. ROI + intensity
    let selected = getSelectedCells();

    if(selected.length === 0){
      alert("No sample selected");
      warped.delete();
      return;
    }

    let intensities = [];

    selected.forEach(cell=>{
      let roi = extractROI(warped, cell);

      let val = computeIntensity(roi);

      intensities.push({
        ...cell,
        intensity: val
      });

      roi.delete();
    });

    // 6. find controls
    let normalCtrl = intensities.find(c=>c.type==="normal");
    let deficientCtrl = intensities.find(c=>c.type==="deficient");

    if(!normalCtrl || !deficientCtrl){
      alert("ต้องกำหนด control normal และ deficient");
      warped.delete();
      return;
    }

    // 7. normalize + classify
    intensities.forEach(cell=>{

      let norm = normalizeIntensity(
        cell.intensity,
        deficientCtrl.intensity,
        normalCtrl.intensity
      );

      let result = classifyG6PD(norm);

      console.log(
        "Cell:", cell.row, cell.col,
        "Raw:", cell.intensity.toFixed(1),
        "Norm:", norm.toFixed(2),
        "Result:", result
      );
    });

    warped.delete();

    console.log("✅ Analyze complete");

  } catch(err) {

    console.error("❌ Analyze error:", err);
    alert("Error: " + err.message);

  }
}

// 🔥 สำคัญ
window.analyze = analyze;
