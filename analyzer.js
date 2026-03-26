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
    let corners = [];

    for(let i=0; i<4; i++){
      let x = approx.intPtr(i,0)[0];
      let y = approx.intPtr(i,0)[1];
      corners.push({x,y});
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
