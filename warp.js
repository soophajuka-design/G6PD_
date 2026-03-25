
// warp.js

function warpPaper(src, contour) {
  let rect = cv.boundingRect(contour);

  let dst = new cv.Mat();
  let dsize = new cv.Size(710, 1280); // scale 10x ของ 7.1x12.8

  let srcTri = cv.matFromArray(4,1,cv.CV_32FC2, [
    rect.x, rect.y,
    rect.x + rect.width, rect.y,
    rect.x + rect.width, rect.y + rect.height,
    rect.x, rect.y + rect.height
  ]);

  let dstTri = cv.matFromArray(4,1,cv.CV_32FC2, [
    0,0,
    dsize.width,0,
    dsize.width,dsize.height,
    0,dsize.height
  ]);

  let M = cv.getPerspectiveTransform(srcTri, dstTri);
  cv.warpPerspective(src, dst, M, dsize);

  return dst;
}