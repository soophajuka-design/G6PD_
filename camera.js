let video;

function initCameraElement(){
  video = document.getElementById('video');
}

async function startCamera(){

  try{

    // 🔥 iOS ต้องใช้ exact ก่อน
    let stream;

    try{
      stream = await navigator.mediaDevices.getUserMedia({
        video:{
          facingMode:{ exact:"environment" }
        },
        audio:false
      });
    }catch(e){
      // fallback Android / browser
      stream = await navigator.mediaDevices.getUserMedia({
        video:{
          facingMode:"environment"
        },
        audio:false
      });
    }

    video.srcObject = stream;
    await video.play();

    console.log("✅ Rear camera active");

  }catch(err){
    alert("Camera error: " + err.message);
    console.error(err);
  }
}