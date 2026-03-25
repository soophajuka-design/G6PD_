
// grid.js

let mode = "select";

function setMode(m) {
  mode = m;
}

let gridState = Array(5).fill().map(() =>
  Array(4).fill().map(() => ({
    selected: false,
    type: "sample"
  }))
);

function handleTap(x, y, geo) {
  const {startX, startY, cellW, cellH} = geo;

  let col = Math.floor((x - startX) / cellW);
  let row = Math.floor((y - startY) / cellH);

  if (col < 0 || col >= 4 || row < 0 || row >= 5) return;

  if (mode === "select") {
    gridState[row][col].selected = !gridState[row][col].selected;
  }
  if (mode === "normal") {
    gridState[row][col].type = "normal";
  }
  if (mode === "deficient") {
    gridState[row][col].type = "deficient";
  }
}