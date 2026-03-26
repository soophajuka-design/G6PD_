// =========================
// DETECT PAPER (4 CORNERS)
// =========================
function detectPaperCorners(src){

  let gray = new cv.Mat();
  let blur = new cv.Mat();
  let edges = new cv.Mat();
  let contours = new cv.MatVector();
  let hierarchy = new cv.Mat();

  try{

    // grayscale
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);

    // blur
    cv.GaussianBlur(gray, blur, new cv.Size(5,5), 0);

    // edge detect
    cv.Canny(blur, edges, 50, 150);

    // find contours
    cv.findContours(edges, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

    let maxArea = 0;
    let bestContour = null;

    for(let i=0; i<contours.size(); i++){

      let cnt = contours.get(i);
      let area = cv.contourArea(cnt);

      if(area > maxArea){
        maxArea = area;
        bestContour = cnt;
      }
    }

    if(!bestContour){
      return null;
    }

    // approx polygon
    let peri = cv.arcLength(bestContour, true);
    let approx = new cv.Mat();

    cv.approxPolyDP(bestContour, approx, 0.02 * peri, true);

    if(approx.rows !== 4){
      approx.delete();
      return null;
    }

    // extract 4 points
 // 🔥 FIX: fallback ถ้า detectPaperCorners ไม่มี
let corners;

if(typeof detectPaperCorners === "function"){
  corners = detectPaperCorners(frame);
} else {
  console.warn("⚠️ detectPaperCorners not found → use full frame");

  corners = [
    {x:0, y:0},
    {x:frame.cols, y:0},
    {x:frame.cols, y:frame.rows},
    {x:0, y:frame.rows}
  ];
}

    approx.delete();

    return corners;

  }catch(e){
    console.error("detectPaperCorners error:", e);
    return null;

  }finally{
    gray.delete();
    blur.delete();
    edges.delete();
    contours.delete();
    hierarchy.delete();
  }
}
