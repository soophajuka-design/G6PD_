
function autoDetect(){

  if(!cachedFrame){
    resultBox.textContent="Capture ก่อน";
    return;
  }

  samples=[];

  const w=cachedFrame.width;
  const h=cachedFrame.height;
  const g=cachedGray;

  const step=8;
  let candidates=[];

  for(let y=50;y<h-50;y+=step){
    for(let x=50;x<w-50;x+=step){

      let score=0;

      for(let a=0;a<360;a+=30){
        const rad=a*Math.PI/180;

        const x1=Math.round(x+SAMPLE_RADIUS*Math.cos(rad));
        const y1=Math.round(y+SAMPLE_RADIUS*Math.sin(rad));

        const x2=Math.round(x+(SAMPLE_RADIUS-5)*Math.cos(rad));
        const y2=Math.round(y+(SAMPLE_RADIUS-5)*Math.sin(rad));

        if(x1<0||y1<0||x1>=w||y1>=h) continue;
        if(x2<0||y2<0||x2>=w||y2>=h) continue;

        score+=Math.abs(g[y1*w+x1]-g[y2*w+x2]);
      }

      if(score>400){
        candidates.push({x,y,score});
      }
    }
  }

  candidates.sort((a,b)=>b.score-a.score);

  const picked=[];

  for(let c of candidates){

    let close=false;

    for(let p of picked){
      if(Math.hypot(p.x-c.x,p.y-c.y)<40){
        close=true;
        break;
      }
    }

    if(!close) picked.push(c);
    if(picked.length>=20) break;
  }

  const rect=overlay.getBoundingClientRect();
  const scale=cachedFrame.width/rect.width;

  picked.forEach(p=>{

    const ox=p.x/scale;
    const oy=p.y/scale;

    const rgb=readRGB(cachedFrame,ox,oy,SAMPLE_RADIUS);

    samples.push({x:ox,y:oy,r:SAMPLE_RADIUS,rgb});
  });

  drawAll();
  updateResult();

  resultBox.textContent=`✅ Detect ${samples.length}`;
}
