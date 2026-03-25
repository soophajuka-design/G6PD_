
// detect.js


function detectPaper(canvas) {
  let src = cv.imread(canvas);
  let gray = new cv.Mat();
  cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);

  let edges = new cv.Mat();
  cv.Canny(gray, edges, 50, 150);

  let contours = new cv.MatVector();
  let hierarchy = new cv.Mat();

  cv.findContours(edges, contours, hierarchy,
    cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

  let maxArea=0, best=null;

  for(let i=0;i<contours.size();i++){
    let cnt = contours.get(i);
    let area = cv.contourArea(cnt);
    if(area>maxArea){ maxArea=area; best=cnt;}
  }

  return best;
}

// detect.js

function detectPaperCorners(canvas) {

  let src = cv.imread(canvas);
  let gray = new cv.Mat();

  cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
  cv.GaussianBlur(gray, gray, new cv.Size(5,5), 0);

  let edges = new cv.Mat();
  cv.Canny(gray, edges, 50, 150);

  let contours = new cv.MatVector();
  let hierarchy = new cv.Mat();

  cv.findContours(edges, contours, hierarchy,
    cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

  let maxArea = 0;
  let bestContour = null;

  for (let i = 0; i < contours.size(); i++) {
    let cnt = contours.get(i);
    let area = cv.contourArea(cnt);

    if (area > maxArea) {
      maxArea = area;
      bestContour = cnt;
    }
  }

  if (!bestContour) return null;

  // approximate polygon
  let peri = cv.arcLength(bestContour, true);
  let approx = new cv.Mat();

  cv.approxPolyDP(bestContour, approx, 0.02 * peri, true);

  if (approx.rows !== 4) {
    console.log("Not 4 corners");
    return null;
  }

  let points = [];
  for (let i = 0; i < 4; i++) {
    let p = approx.intPtr(i);
    points.push({ x: p[0], y: p[1] });
  }

  return orderPoints(points);
}