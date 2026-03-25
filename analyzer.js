

// analyzer.js

async function analyze() {
  let canvas = captureFrame();

  let contour = detectPaper(canvas);
  let warped = warpPaper(canvas, contour);

  let results = [];

  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 4; c++) {

      let cell = gridState[r][c];
      if (!cell.selected) continue;

      let roi = extractCell(warped, r, c);

      let tensor = tf.browser.fromPixels(roi)
        .resizeNearestNeighbor([64,64])
        .toFloat()
        .div(255.0)
        .expandDims();

      let pred = await predict(tensor);

      results.push({
        row: r,
        col: c,
        prediction: pred,
        type: cell.type
      });
    }
  }

  console.log(results);
}
