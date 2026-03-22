<!DOCTYPE html>
 console.log("App Loaded");
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>G6PD Analyzer</title>

<link rel="manifest" href="manifest.json">

<style>
body {
  background: black;
  color: white;
  text-align: center;
  font-family: Arial;
}

.container {
  position: relative;
  display: inline-block;
}

video {
  width: 320px;
}

canvas.overlay {
  position: absolute;
  top: 0;
  left: 0;
}

button {
  margin-top: 10px;
  padding: 10px;
  font-size: 16px;
}

</style>
</head>

<body>

<h2>G6PD Analyzer</h2>

<div class="container">
  <video id="video" autoplay playsinline></video>
  <canvas id="overlay" class="overlay" width="320" height="320"></canvas>
</div>

<br>
<button onclick="capture()">Capture</button>

<canvas id="canvas" width="320" height="320"></canvas>

<p id="result"></p>

<script src="app.js"></script>

<script>
if ('serviceWorker' in navigator) {
 
  navigator.mediaDevices.getUserMedia({ video: true })
  .then(stream => {
    video.srcObject = stream;
  })
  .catch(err => {
    alert("Camera error: " + err);
  });
}
</script>

</body>
</html>
