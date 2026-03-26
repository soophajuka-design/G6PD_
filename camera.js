let video;

function initCameraElement() {
  video = document.getElementById('video');
}

async function startCamera() {
  try {
    let constraints = {
      video: {
        facingMode: "environment"
      },
      audio: false
    };

    let stream;

    try {
      // iOS บางเครื่องต้องไม่ใช้ exact
      stream = await navigator.mediaDevices.getUserMedia(constraints);
    } catch (e) {
      // fallback
      stream = await navigator.mediaDevices.getUserMedia({ video: true });
    }

    video.srcObject = stream;

    await video.play();

    console.log("Camera started");

  } catch (err) {
    alert("Camera error: " + err.message);
    console.error(err);
  }
}

function captureFrame(){
  let canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  let ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0);

  return cv.imread(canvas);
}
