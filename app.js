const video = document.getElementById("video");
const overlay = document.getElementById("overlay");

let stream=null;
let grid=[];
let locked=false;

// ===== CAMERA =====
async function startCamera(){
  stream = await navigator.mediaDevices.getUserMedia({
    video:{facingMode:{ideal:"environment"}}
  });
  video.srcObject = stream;

  video.onloadedmetadata = ()=>{
    syncCanvas();
  };
}

function stopCamera(){
  if(stream){
    stream.getTracks().forEach(t=>t.stop());
    stream=null;
  }
}

// ===== SYNC =====
function syncCanvas(){
  const rect = video.getBoundingClientRect();
  overlay.width = rect.width;
  overlay.height = rect.height;
}

// ===== GET FRAME =====
function getFrame(){
  const c=document.createElement("canvas");
  c.width=video.videoWidth;
  c.height=video.videoHeight;
  const ctx=c.getContext("2d");
  ctx.drawImage(video,0,0);
  return ctx.getImageData(0,0,c.width,c.height);
}

function toGray(img){
  const g=new Uint8ClampedArray(img.width*img.height);
  for(let i=0,j=0;i<img.data.length;i+=4,j++){
    g[j]=(img.data[i]+img.data[i+1]+img.data[i+2])/3;
  }
  return g;
}

// ===== EDGE =====
function edgeDetect(gray,w,h){
  const e=new Uint8ClampedArray(w*h);
  for(let y=1;y<h-1;y++){
    for(let x=1;x<w-1;x++){
      const i=y*w+x;
      const gx=-gray[i-w-1]-2*gray[i-1]-gray[i+w-1]
               +gray[i-w+1]+2*gray[i+1]+gray[i+w+1];
      const gy=-gray[i-w-1]-2*gray[i-w]-gray[i-w+1]
               +gray[i+w-1]+2*gray[i+w]+gray[i+w+1];
      const g=Math.sqrt(gx*gx+gy*gy);
      e[i]=g>60?255:0;
    }
  }
  return e;
}

// ===== PAPER DETECT (QUAD) =====
function detectPaper(gray,w,h){
  const e=edgeDetect(gray,w,h);

  let minX=w,minY=h,maxX=0,maxY=0;

  for(let y=0;y<h;y++){
    for(let x=0;x<w;x++){
      if(e[y*w+x]){
        if(x<minX)minX=x;
        if(y<minY)minY=y;
        if(x>maxX)maxX=x;
        if(y>maxY)maxY=y;
      }
    }
  }

  return [
    {x:minX,y:minY},
    {x:maxX,y:minY},
    {x:maxX,y:maxY},
    {x:minX,y:maxY}
  ];
}

// ===== HOMOGRAPHY (approx crop+scale) =====
function warpPaper(frame,quad){

  const ratio=7/12.6;
  const H=400;
  const W=Math.round(H*ratio);

  const c=document.createElement("canvas");
  c.width=W; c.height=H;
  const ctx=c.getContext("2d");

  const minX=quad[0].x;
  const minY=quad[0].y;
  const maxX=quad[2].x;
  const maxY=quad[2].y;

  ctx.drawImage(video,
    minX,minY,
    maxX-minX,maxY-minY,
    0,0,W,H
  );

  return ctx.getImageData(0,0,W,H);
}

// ===== CIRCLE DETECT =====
function detectCircles(gray,w,h){

  const edge=edgeDetect(gray,w,h);
  const circles=[];

  for(let y=20;y<h-20;y+=4){
    for(let x=20;x<w-20;x+=4){

      let bestR=0,score=0;

      for(let r=10;r<25;r+=2){
        let hit=0;

        for(let a=0;a<360;a+=30){
          const rad=a*Math.PI/180;
          const px=Math.round(x+r*Math.cos(rad));
          const py=Math.round(y+r*Math.sin(rad));
          if(edge[py*w+px]) hit++;
        }

        if(hit>6){score++; bestR=r;}
      }

      if(score>=2){
        circles.push({x,y,r:bestR});
      }
    }
  }

  return circles;
}

// ===== MERGE =====
function mergeCircles(c){
  const out=[];
  c.forEach(p=>{
    let found=false;
    for(let o of out){
      const d=Math.hypot(p.x-o.x,p.y-o.y);
      if(d<20){
        o.x=(o.x+p.x)/2;
        o.y=(o.y+p.y)/2;
        o.r=(o.r+p.r)/2;
        found=true;
        break;
      }
    }
    if(!found) out.push({...p});
  });
  return out;
}

// ===== GRID =====
function buildGrid(circles){

  circles.sort((a,b)=>a.y-b.y);
  const rows=[];

  while(circles.length){
    const base=circles.shift();
    const row=[base];

    for(let i=circles.length-1;i>=0;i--){
      if(Math.abs(circles[i].y-base.y)<25){
        row.push(circles[i]);
        circles.splice(i,1);
      }
    }

    row.sort((a,b)=>a.x-b.x);
    rows.push(row);
  }

  return rows;
}

// ===== MAP BACK =====
function mapToOverlay(rows,quad,warpW,warpH){

  grid=[];
  const rect=video.getBoundingClientRect();

  const scaleX=rect.width/warpW;
  const scaleY=rect.height/warpH;

  let idx=0;

  rows.forEach(r=>{
    r.forEach(p=>{
      grid.push({
        index:idx++,
        x:p.x*scaleX,
        y:p.y*scaleY,
        r:p.r*scaleX
      });
    });
  });
}

// ===== LSQ refine =====
function refineLSQ(){

  const frame=getFrame();
  const gray=toGray(frame);
  const edge=edgeDetect(gray,frame.width,frame.height);

  grid.forEach(g=>{

    const pts=[];

    for(let a=0;a<360;a+=20){
      const rad=a*Math.PI/180;
      const px=Math.round(g.x+g.r*Math.cos(rad));
      const py=Math.round(g.y+g.r*Math.sin(rad));

      if(edge[py*frame.width+px]){
        pts.push([px,py]);
      }
    }

    if(pts.length<6) return;

    let mx=0,my=0;
    pts.forEach(p=>{mx+=p[0];my+=p[1];});
    mx/=pts.length; my/=pts.length;

    g.x=mx;
    g.y=my;
  });

  draw();
}

// ===== DRAW =====
function draw(){

  const ctx=overlay.getContext("2d");
  ctx.clearRect(0,0,overlay.width,overlay.height);

  ctx.strokeStyle="lime";
  ctx.lineWidth=2;

  grid.forEach(g=>{
    ctx.beginPath();
    ctx.arc(g.x,g.y,g.r,0,Math.PI*2);
    ctx.stroke();
  });
}

// ===== MAIN =====
function detectAndLock(){

  const frame=getFrame();
  const gray=toGray(frame);

  const quad=detectPaper(gray,frame.width,frame.height);

  const warp=warpPaper(frame,quad);
  const g2=toGray(warp);

  let circles=detectCircles(g2,warp.width,warp.height);
  circles=mergeCircles(circles);

  const rows=buildGrid(circles);

  mapToOverlay(rows,quad,warp.width,warp.height);

  locked=true;
  draw();
}