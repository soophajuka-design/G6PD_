
// warp.js

function warpPaper(canvas, corners) {

  let src = cv.imread(canvas);

  let width = 710;   // scale 10x (7.1 cm)
  let height = 1280; // scale 10x (12.8 cm)

  let srcTri = cv.matFromArray(4,1,cv.CV_32FC2, [
    corners[0].x, corners[0].y,
    corners[1].x, corners[1].y,
    corners[2].x, corners[2].y,
    corners[3].x, corners[3].y
  ]);

  let dstTri = cv.matFromArray(4,1,cv.CV_32FC2, [
    0,0,
    width,0,
    width,height,
    0,height
  ]);

  let M = cv.getPerspectiveTransform(srcTri, dstTri);

  let dst = new cv.Mat();
  let dsize = new cv.Size(width, height);

  cv.warpPerspective(src, dst, M, dsize);

  return dst;
}