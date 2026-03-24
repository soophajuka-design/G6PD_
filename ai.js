function autoDetect(){

  if(!cachedFrame){
    resultBox.textContent="⚠️ Capture ก่อน";
    return;
  }

  samples=[];

  const w=cachedFrame.width;
  const h=cachedFrame.height;
  const g=cachedGray;

  let candidates=[];

  for(let y=50;y<h-50;y+=8){
    for(let x=50;x<w-50;x+=8){

      let score=0;

      for(let a=0;a<360;a+=30){
        const rad=a*Math.PI/180;

        const x1=Math.round(x+25*Math.cos(rad));
        const y1=Math.round(y+25*Math.sin(rad));

        const x2=Math.round(x+20*Math.cos(rad));
        const y2=Math.round(y+20*Math.sin(rad));

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

  const scale=cachedFrame.width/overlay.width;

  picked.forEach(p=>{

    const ox=p.x/scale;
    const oy=p.y/scale;

    const rgb=readRGB(cachedFrame,ox,oy,25);

    samples.push({x:ox,y:oy,r:25,rgb});
  });

  drawAll();
  updateResult();

  resultBox.textContent=`✅ Detect ${samples.length}`;
}