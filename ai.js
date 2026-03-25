// ===== CORNER DETECTION =====

function detectPaperCorners(){

  const w=cachedFrame.width;
  const h=cachedFrame.height;

  const edges = detectEdges(cachedGray,w,h);
  const contours = findContours(edges,w,h);

  if(contours.length===0) return null;

  const paper = contours.sort((a,b)=>b.length-a.length)[0];

  return approxQuad(paper);
}

// edge
function detectEdges(g,w,h){

  const out=new Uint8ClampedArray(w*h);

  for(let y=1;y<h-1;y++){
    for(let x=1;x<w-1;x++){

      const gx = g[y*w+(x+1)] - g[y*w+(x-1)];
      const gy = g[(y+1)*w+x] - g[(y-1)*w+x];

      out[y*w+x] = (Math.abs(gx)+Math.abs(gy))>80?255:0;
    }
  }

  return out;
}

// contour
function findContours(edge,w,h){

  const visited=new Uint8Array(w*h);
  const contours=[];

  for(let i=0;i<w*h;i++){

    if(edge[i]===255 && !visited[i]){

      let stack=[i];
      let pts=[];

      while(stack.length){

        const idx=stack.pop();
        if(visited[idx]) continue;

        visited[idx]=1;

        const x=idx%w;
        const y=Math.floor(idx/w);

        pts.push({x,y});

        for(let dy=-1;dy<=1;dy++){
          for(let dx=-1;dx<=1;dx++){

            const nx=x+dx;
            const ny=y+dy;

            if(nx<0||ny<0||nx>=w||ny>=h) continue;

            const ni=ny*w+nx;

            if(edge[ni]===255 && !visited[ni]){
              stack.push(ni);
            }
          }
        }
      }

      if(pts.length>300){
        contours.push(pts);
      }
    }
  }

  return contours;
}

// quad
function approxQuad(points){

  let tl={x:9999,y:9999};
  let tr={x:0,y:9999};
  let br={x:0,y:0};
  let bl={x:9999,y:0};

  points.forEach(p=>{

    if(p.x+p.y < tl.x+tl.y) tl=p;
    if(p.x-p.y > tr.x-tr.y) tr=p;
    if(p.x+p.y > br.x+br.y) br=p;
    if(p.x-p.y < bl.x-bl.y) bl=p;

  });

  return [tl,tr,br,bl];
}

// ===== WARP =====
function warpPerspective(src,c){

  const W=300,H=500;
  const dst=new ImageData(W,H);

  const [tl,tr,br,bl]=c;

  for(let y=0;y<H;y++){
    for(let x=0;x<W;x++){

      const u=x/W,v=y/H;

      const sx=
        (1-u)*(1-v)*tl.x +
        u*(1-v)*tr.x +
        u*v*br.x +
        (1-u)*v*bl.x;

      const sy=
        (1-u)*(1-v)*tl.y +
        u*(1-v)*tr.y +
        u*v*br.y +
        (1-u)*v*bl.y;

      const px=Math.floor(sx);
      const py=Math.floor(sy);

      if(px<0||py<0||px>=src.width||py>=src.height) continue;

      const si=(py*src.width+px)*4;
      const di=(y*W+x)*4;

      dst.data[di]=src.data[si];
      dst.data[di+1]=src.data[si+1];
      dst.data[di+2]=src.data[si+2];
      dst.data[di+3]=255;
    }
  }

  return dst;
}

// ===== AUTO DETECT =====
function autoDetect(){

  if(!cachedFrame) return;

  samples=[];

  const w=cachedFrame.width;
  const h=cachedFrame.height;
  const g=cachedGray;

  for(let y=40;y<h-40;y+=30){
    for(let x=40;x<w-40;x+=30){

      let s=0;

      for(let a=0;a<360;a+=30){

        const rad=a*Math.PI/180;

        const px=Math.round(x+25*Math.cos(rad));
        const py=Math.round(y+25*Math.sin(rad));

        if(px<0||py<0||px>=w||py>=h) continue;

        s+=g[py*w+px];
      }

      if(s<4000){

        // map → display
        const dx = x / displayScaleX;
        const dy = y / displayScaleY;

        const rgb = readRGB(cachedFrame,x,y,25);

        samples.push({
          x:dx,
          y:dy,
          r:25,
          rgb
        });
      }
    }
  }

  drawAll();
}

function autoGridAlign(){

  if(!cachedFrame) return;

  samples=[];

  const w=cachedFrame.width;
  const h=cachedFrame.height;

  const rows=5, cols=4;

  const dx=w/(cols+1);
  const dy=h/(rows+1);

  for(let r=1;r<=rows;r++){
    for(let c=1;c<=cols;c++){

      const x=c*dx;
      const y=r*dy;

      const dx2 = x / displayScaleX;
      const dy2 = y / displayScaleY;

      const rgb = readRGB(cachedFrame,x,y,25);

      samples.push({
        x:dx2,
        y:dy2,
        r:25,
        rgb
      });
    }
  }

  drawAll();
}