
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