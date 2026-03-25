function autoDetect(){

  if(!cachedFrame){
    resultBox.textContent="⚠️ Capture ก่อน";
    return;
  }

  const w=cachedFrame.width;
  const h=cachedFrame.height;
  const g=cachedGray;

  let newSamples=[];

  for(let y=40;y<h-40;y+=6){
    for(let x=40;x<w-40;x+=6){

      let vals=[];
      for(let a=0;a<360;a+=20){
        const rad=a*Math.PI/180;
        const px=Math.round(x+25*Math.cos(rad));
        const py=Math.round(y+25*Math.sin(rad));

        if(px<0||py<0||px>=w||py>=h) continue;
        vals.push(g[py*w+px]);
      }

      const mean=vals.reduce((a,b)=>a+b,0)/vals.length;
      let variance=vals.reduce((a,v)=>a+(v-mean)*(v-mean),0);

      if(variance<500 && mean<180){

        let tooClose=false;

        for(let s of samples){
          const dx=(s.x*w/overlay.width)-x;
          const dy=(s.y*h/overlay.height)-y;
          if(Math.hypot(dx,dy)<35){
            tooClose=true;
            break;
          }
        }

        if(!tooClose){
          newSamples.push({x,y});
        }
      }
    }
  }

  const scaleF=cachedFrame.width/overlay.width;

  newSamples.forEach(p=>{
    const ox=p.x/scaleF;
    const oy=p.y/scaleF;
    const rgb=readRGB(cachedFrame,ox,oy,25);
    samples.push({x:ox,y:oy,r:25,rgb});
  });

  drawAll();
  resultBox.textContent=`✅ Detect ${samples.length}`;
}