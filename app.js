const video = document.getElementById('video');

navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
  .then(stream => video.srcObject = stream);

const ROIs = [
  {name:"Normal", x:60, y:140},
  {name:"Sample", x:160, y:140},
  {name:"Deficient", x:260, y:140}
];

function getF(ctx,x,y){
  let size=30;
  let d=ctx.getImageData(x,y,size,size).data;
  let r=0,g=0,b=0,c=0;

  for(let i=0;i<d.length;i+=4){
    r+=d[i]; g+=d[i+1]; b+=d[i+2]; c++;
  }

  r/=c; g/=c; b/=c;
  return b/(r+g+b);
}

function capture(){
  const canvas=document.getElementById('canvas');
  const ctx=canvas.getContext('2d');

  ctx.drawImage(video,0,0,320,320);

  let val={};

  ROIs.forEach(r=>{
    val[r.name]=getF(ctx,r.x,r.y);
  });

  let ratio=val.Sample/val.Normal;

  let res="Complete Deficient";
  if(ratio>0.8) res="Normal";
  else if(ratio>0.4) res="Partial Deficient";

  document.getElementById('result').innerText=
    "Ratio: "+ratio.toFixed(2)+" → "+res;
}
