function detectPaperCorners(src){

  let gray = new cv.Mat();
  let edges = new cv.Mat();

  cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
  cv.GaussianBlur(gray, gray, new cv.Size(5,5), 0);
  cv.Canny(gray, edges, 50, 150);

  let contours = new cv.MatVector();
  let hierarchy = new cv.Mat();

  cv.findContours(edges, contours, hierarchy,
    cv.RETR_EXTERNAL,
    cv.CHAIN_APPROX_SIMPLE
  );

  let maxArea = 0;
  let best = null;

  for(let i=0;i<contours.size();i++){
    let cnt = contours.get(i);
    let area = cv.contourArea(cnt);

    if(area > maxArea){
      let peri = cv.arcLength(cnt, true);
      let approx = new cv.Mat();
      cv.approxPolyDP(cnt, approx, 0.02 * peri, true);

      if(approx.rows === 4){
        maxArea = area;
        best = approx;
      }
    }
  }

  gray.delete(); edges.delete(); contours.delete(); hierarchy.delete();

  if(!best) return null;

  let pts = [];
  for(let i=0;i<4;i++){
    pts.push({
      x: best.data32S[i*2],
      y: best.data32S[i*2+1]
    });
  }

  best.delete();

  return pts;
}
