

// analyzer.js


async function analyze(){

  const frame = captureFrame();

  // 1. detect corners
  let corners = detectPaperCorners(frame);

  if(!corners){
    alert("Paper not detected");
    return;
  }

  // 2. warp
  let warped = warpPaper(frame, corners);

  // debug: show warped
  cv.imshow('overlay', warped);

  console.log("Warp complete");
}