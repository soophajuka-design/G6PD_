const video = document.getElementById('video');
const overlay = document.getElementById('overlay');
const octx = overlay.getContext('2d');
const camBtn = document.getElementById('camBtn');

let stream=null;
let cameraOn=false;

let ROIs=[];

let controlConfig={
  normalIndex:0,
  deficientIndex:1
};

// ===== CALIBRATION =====
let calibrationData=[
  {F:0.12,A:1},
  {F:0.25,A:3.5},
  {F:0.40,A:7},
  {F:0.65,A:12}
];

function fitLinear(data){
  let n=data.length,sumX=0,sumY=0,sumXY=0,sumXX=0;
  data.forEach(d=>{
    sumX+=d.F; sumY+=d.A;
    sumXY+=d.F*d.A;
    sumXX+=d.F*d.F;
  });
  let a=(n*sumXY-sumX*sumY)/(n*sumXX-sumX*sumX);
  let b=(sumY-a*sumX)/n;
  return {a,b};
}

let model=fitLinear(calibrationData);

function getActivity(F){
  let A=model.a*F+model.b;
  return A<0?0:A;
}

const video = document.getElementById('video');
const camBtn = document.getElementById('camBtn');

let stream = null;
let cameraOn = false;

async function startCamera(){

  if(!navigator.mediaDevices){
    alert("ต้องเปิดผ่าน HTTPS");
    return;
  }

  try{

    stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: 640,
        height: 480
      },
      audio:false
    });

    video.srcObject = stream;

    await video.play().catch(e=>{
      console.log("play error", e);
    });

    cameraOn = true;
    camBtn.innerText = "Stop Camera";

    console.log("Camera OK");

  }catch(e){

    alert("Camera ERROR: " + e.message);
    console.error(e);
  }
}

// ===== STOP CAMERA =====
function stopCamera(){

  if(stream){
    stream.getTracks().forEach(t=>t.stop());
  }

  video.srcObject = null;
  cameraOn = false;

  camBtn.innerText = "Start Camera";

  console.log("Camera OFF");
}

// ===== BUTTON =====
camBtn.addEventListener("click", async ()=>{

  if(!cameraOn){
    await startCamera();
  }else{
    stopCamera();
  }

});

// ===== EDGE + CORNER =====
function detectCorners(ctx){
  let img=ctx.getImageData(0,0,320,320).data;
  let edges=[];

  for(let y=1;y<319;y+=2){
    for(let x=1;x<319;x+=2){
      let i=(y*320+x)*4;
      let gx=img[i]-img[i-4];
      let gy=img[i]-img[i-320*4];
      let mag=Math.abs(gx)+Math.abs(gy);
      if(mag>50) edges.push({x,y});
    }
  }

  let TL,TR,BL,BR;
  let minSum=1e9,maxSum=-1e9,minDiff=1e9,maxDiff=-1e9;

  edges.forEach(p=>{
    let s=p.x+p.y;
    let d=p.x-p.y;

    if(s<minSum){minSum=s;TL=p;}
    if(s>maxSum){maxSum=s;BR=p;}
    if(d<minDiff){minDiff=d;BL=p;}
    if(d>maxDiff){maxDiff=d;TR=p;}
  });

  return [TL,TR,BR,BL];
}

// ===== HOMOGRAPHY =====
function computeHomography(src,dst){
  let A=[];
  for(let i=0;i<4;i++){
    let x=src[i].x,y=src[i].y,u=dst[i].x,v=dst[i].y;
    A.push([-x,-y,-1,0,0,0,x*u,y*u,u]);
    A.push([0,0,0,-x,-y,-1,x*v,y*v,v]);
  }

  for(let i=0;i<8;i++){
    for(let k=i+1;k<8;k++){
      if(Math.abs(A[k][i])>Math.abs(A[i][i])){
        [A[i],A[k]]=[A[k],A[i]];
      }
    }
    for(let k=i+1;k<8;k++){
      let f=A[k][i]/A[i][i];
      for(let j=i;j<9;j++){
        A[k][j]-=A[i][j]*f;
      }
    }
  }

  let h=new Array(9).fill(0);
  for(let i=7;i>=0;i--){
    let sum=A[i][8];
    for(let j=i+1;j<8;j++) sum-=A[i][j]*h[j];
    h[i]=sum/A[i][i];
  }
  h[8]=1;
  return h;
}

function applyHomography(ctx,h){
  let src=ctx.getImageData(0,0,320,320);
  let dst=ctx.createImageData(320,320);

  for(let y=0;y<320;y++){
    for(let x=0;x<320;x++){
      let d=h[6]*x+h[7]*y+1;
      let sx=(h[0]*x+h[1]*y+h[2])/d;
      let sy=(h[3]*x+h[4]*y+h[5])/d;

      sx=Math.floor(sx);
      sy=Math.floor(sy);

      if(sx>=0&&sy>=0&&sx<320&&sy<320){
        let si=(sy*320+sx)*4;
        let di=(y*320+x)*4;

        dst.data[di]=src.data[si];
        dst.data[di+1]=src.data[si+1];
        dst.data[di+2]=src.data[si+2];
        dst.data[di+3]=255;
      }
    }
  }

  ctx.putImageData(dst,0,0);
}

// ===== GRID =====
function detectGrid(){

  const canvas=document.getElementById('canvas');
  const ctx=canvas.getContext('2d');

  ctx.drawImage(video,0,0,320,320);

  let corners=detectCorners(ctx);

  let H=computeHomography(corners,[
    {x:0,y:0},{x:320,y:0},{x:320,y:320},{x:0,y:320}
  ]);

  applyHomography(ctx,H);

  // simple grid 4x4
  ROIs=[];
  for(let r=0;r<4;r++){
    for(let c=0;c<4;c++){
      ROIs.push({
        x:40+c*70,
        y:40+r*70
      });
    }
  }
}

// ===== FLUO =====
function getF(ctx,x,y){
  let d=ctx.getImageData(x,y,30,30).data;
  let r=0,g=0,b=0,c=0;

  for(let i=0;i<d.length;i+=4){
    r+=d[i]; g+=d[i+1]; b+=d[i+2]; c++;
  }

  r/=c; g/=c; b/=c;
  let sum=r+g+b+1;
  return (b/sum);
}

// ===== ND =====
function isEmpty(ctx,x,y){
  let d=ctx.getImageData(x,y,30,30).data;
  let sum=0;

  for(let i=0;i<d.length;i+=4){
    sum+=d[i]+d[i+1]+d[i+2];
  }

  return (sum/d.length)>200;
}

// ===== CONTROL =====
function setControl(){
  controlConfig.normalIndex=parseInt(normalIdx.value);
  controlConfig.deficientIndex=parseInt(defIdx.value);
}

// ===== CAPTURE =====
function capture(){

  const canvas=document.getElementById('canvas');
  const ctx=canvas.getContext('2d');

  ctx.drawImage(video,0,0,320,320);

  let out="";

  let Fn=0,Fd=0;

  ROIs.forEach((r,i)=>{

    if(isEmpty(ctx,r.x,r.y)){
      out+=`Spot ${i}: ND\n\n`;
      return;
    }

    let F=getF(ctx,r.x,r.y);

    if(i===controlConfig.normalIndex) Fn=F;
    if(i===controlConfig.deficientIndex) Fd=F;

    let Fnrm=(F-Fd)/((Fn-Fd)+0.001);

    let A=getActivity(Fnrm);

    let res = A>=7?"Normal":A>=3?"Partial":"Deficient";

    out+=`Spot ${i}
F=${F.toFixed(2)}
Activity=${A.toFixed(2)}
Result=${res}\n\n`;
  });

  document.getElementById('result').innerText=out;
}

// ===== overlay =====
function drawOverlay(){
  octx.clearRect(0,0,320,320);

  ROIs.forEach((r,i)=>{
    octx.beginPath();
    octx.arc(r.x,r.y,20,0,Math.PI*2);
    octx.strokeStyle="yellow";
    octx.stroke();
    octx.fillText(i,r.x,r.y);
  });
}
(function loop(){drawOverlay();requestAnimationFrame(loop);})();
