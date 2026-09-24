/* One sphere of portfolio thumbnails, draggable in both directions. */
(() => {
    'use strict';
    const scene = document.querySelector('.hero-gallery-globe');
    if (!scene) return;
    const surface = scene.querySelector('.portfolio-globe');
    const fallback = scene.querySelector('.globe-fallback');
    const toggle = scene.querySelector('.sphere-toggle');
    const current = scene.querySelector('.globe-current');
    const counter = scene.querySelector('.globe-count');
    const category = scene.querySelector('.globe-category');
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    const effects=window.SiliqGlobeEffects?.(scene,surface,motion);
    const items = [...fallback.querySelectorAll('img')].map(img => ({
        title: img.dataset.title, image: img.src,
        url: img.dataset.url, category: img.dataset.category
    }));
    if (items.length < 3) return;
    const TAU = Math.PI*2;
    const bandCount=items.length>24?5:3, middle=Math.floor(bandCount/2);
    const weights=Array.from({length:bandCount},(_,i)=>Math.sin((i+.5)/bandCount*Math.PI));
    const weightSum=weights.reduce((sum,n)=>sum+n,0);
    const counts=weights.map(n=>Math.max(1,Math.floor(n/weightSum*items.length)));
    counts[middle]+=items.length-counts.reduce((sum,n)=>sum+n,0);
    const offsets=Array(bandCount).fill(0);let nextOffset=0;
    [middle,...Array.from({length:bandCount},(_,i)=>i).filter(i=>i!==middle)].forEach(row=>{offsets[row]=nextOffset;nextOffset+=counts[row];});
    let selected=0, yaw=Math.PI-TAU*.5/counts[middle], pitch=0;
    let paused=motion.matches, visible=!('IntersectionObserver'in window), hovering=false, focused=false, dragging=false;
    let introPending=Boolean(effects)&&!motion.matches;
    if(introPending)surface.classList.add('globe-pending');
    let raf=0,last=0,draw=null,available=false;
    const canvas=document.createElement('canvas'); canvas.setAttribute('aria-hidden','true');
    const gl=canvas.getContext('webgl',{alpha:true,antialias:true,preserveDrawingBuffer:true,powerPreference:'low-power'});
    function show(index) {
        selected=(index+items.length)%items.length;
        const item=items[selected]; current.textContent=item.title; current.href=item.url;
        current.setAttribute('aria-label','觀看'+item.title+'作品（另開視窗）');
        counter.textContent=String(selected+1).padStart(2,'0')+' / '+items.length;
        category.textContent=item.category; scene.dataset.selected=String(selected);
    }
    function locate(n) {
        const cy=Math.cos(yaw),sy=Math.sin(yaw),cp=Math.cos(pitch),sp=Math.sin(pitch);
        const y=n.y*cp-n.z*sp,z=n.z*cp+n.y*sp;
        const x=n.x*cy-z*sy,rz=z*cy+n.x*sy;
        const u=((Math.atan2(x,rz)/TAU+.5)%1+1)%1;
        const v=Math.asin(Math.max(-1,Math.min(1,y)))/Math.PI+.5;
        const row=Math.min(bandCount-1,Math.floor(v*bandCount));
        return offsets[row]+Math.min(counts[row]-1,Math.floor(u*counts[row]));
    }
    function rotateTo(index) {
        effects?.finish(true);
        show(index);
        const row=offsets.findIndex((offset,r)=>selected>=offset&&selected<offset+counts[r]);
        yaw=Math.PI-TAU*(selected-offsets[row]+.5)/counts[row];
        pitch=-((row+.5)/bandCount-.5)*Math.PI; paused=true; update();
        effects?.cue();
    }
    function render() {
        if(draw) draw();
        else fallback.querySelectorAll('img').forEach((img,i)=>img.classList.toggle('is-current',i===selected));
        scene.dataset.rotation=yaw.toFixed(4)+','+pitch.toFixed(4);
    }
    function tick(now) {
        raf=0;
        if(last&&!hovering&&!focused&&!dragging&&!effects?.active){yaw+=Math.min((now-last)/1000,.05)*.1;show(locate({x:0,y:0,z:1}));}
        last=now;if(!effects?.active)render();
        if(available&&!paused&&visible&&!document.hidden&&!effects?.active) raf=requestAnimationFrame(tick);
    }
    function update() {
        toggle.hidden=!available;toggle.textContent=paused?'播放旋轉':'暫停旋轉';
        toggle.setAttribute('aria-pressed',String(paused));
        scene.dataset.motion=available?(paused?'paused':'playing'):'fallback';
        if(raf)cancelAnimationFrame(raf);raf=0;last=0;render();
        if(available&&visible&&introPending){introPending=false;effects.assemble(canvas,update);}
        if(available&&!paused&&visible&&!document.hidden&&!effects?.active)raf=requestAnimationFrame(tick);
    }
    show(0);
    scene.querySelector('.globe-controls').hidden=false;
    scene.querySelector('.globe-previous').addEventListener('click',()=>rotateTo(selected-1));
    scene.querySelector('.globe-next').addEventListener('click',()=>rotateTo(selected+1));
    toggle.addEventListener('click',()=>{effects?.finish(true);paused=!paused;update();});
    motion.addEventListener('change',()=>{paused=motion.matches;if(motion.matches)introPending=false;update();});
    surface.addEventListener('pointerenter',()=>{hovering=true;});surface.addEventListener('pointerleave',()=>{hovering=false;});
    surface.addEventListener('focus',()=>{focused=true;});surface.addEventListener('blur',()=>{focused=false;});
    let startX=0,startY=0,startYaw=0,startPitch=0,moved=false,lastX=0,lastY=0;
    surface.addEventListener('pointerdown',event=>{
        if(!event.isPrimary||event.button!==0||!available)return;
        effects?.unlock();effects?.finish(true);introPending=false;
        paused=true;dragging=true;moved=false;startX=event.clientX;startY=event.clientY;startYaw=yaw;startPitch=pitch;
        lastX=startX;lastY=startY;
        surface.setPointerCapture(event.pointerId);update();
    });
    surface.addEventListener('pointermove',event=>{
        if(!dragging)return;
        const dx=event.clientX-startX,dy=event.clientY-startY;
        if(Math.hypot(dx,dy)>5)moved=true;
        if(!moved)return;
        effects?.swipe(Math.hypot(event.clientX-lastX,event.clientY-lastY),(event.clientX-lastX)/20);
        lastX=event.clientX;lastY=event.clientY;
        yaw=startYaw-dx/surface.clientWidth*TAU;pitch=Math.max(-1.45,Math.min(1.45,startPitch+dy/surface.clientHeight*Math.PI));
        show(locate({x:0,y:0,z:1}));render();
    });
    surface.addEventListener('pointerup',event=>{
        if(!dragging)return;dragging=false;
        if(!moved){const b=surface.getBoundingClientRect(),x=(event.clientX-b.left)/b.width*2-1,y=1-(event.clientY-b.top)/b.height*2;
            if(x*x+y*y<1)rotateTo(locate({x,y,z:Math.sqrt(1-x*x-y*y)}));}
    });
    surface.addEventListener('pointercancel',()=>{dragging=false;});surface.addEventListener('lostpointercapture',()=>{dragging=false;});
    surface.addEventListener('dragstart',event=>event.preventDefault());
    surface.addEventListener('keydown',event=>{
        if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home'].includes(event.key))return;
        event.preventDefault();paused=true;
        effects?.finish(true);introPending=false;
        if(event.key==='Home')return rotateTo(0);
        if(event.key==='ArrowLeft'||event.key==='ArrowRight')return rotateTo(selected+(event.key==='ArrowLeft'?-1:1));
        pitch=Math.max(-1.45,Math.min(1.45,pitch+(event.key==='ArrowUp'?-.45:.45)));show(locate({x:0,y:0,z:1}));update();effects?.cue();
    });
    document.addEventListener('visibilitychange',update);window.addEventListener('resize',update,{passive:true});
    if('IntersectionObserver'in window)new IntersectionObserver(entries=>{visible=entries[0].isIntersecting&&entries[0].intersectionRatio>=.2;update();},{threshold:[0,.2]}).observe(surface);
    update();if(!gl){surface.classList.remove('globe-pending');return;}
    const loadImage=item=>new Promise(resolve=>{const image=new Image();const timeout=setTimeout(()=>resolve(null),10000);image.onload=()=>{clearTimeout(timeout);resolve(image);};image.onerror=()=>{clearTimeout(timeout);resolve(null);};image.src=item.image;});
    Promise.all(items.map(loadImage)).then(images=>{
        try{
            const atlas=document.createElement('canvas'),columns=4,rows=Math.ceil(items.length/columns);
            const cell=Math.min(320,Math.floor(gl.getParameter(gl.MAX_TEXTURE_SIZE)/Math.max(columns,rows)));
            atlas.width=cell*columns;atlas.height=cell*rows;const ctx=atlas.getContext('2d');
            items.forEach((item,index)=>{
                const x=index%columns*cell,y=Math.floor(index/columns)*cell;
                ctx.fillStyle='#dce5dd';ctx.fillRect(x,y,cell,cell);
                const image=images[index];
                if(image){
                    const band=offsets.findIndex((offset,r)=>index>=offset&&index<offset+counts[r]);
                    const aspect=2*bandCount*Math.sin((band+.5)/bandCount*Math.PI)/counts[band];
                    const h=cell-36,logicalWidth=cell*aspect;
                    const scale=Math.max(logicalWidth/image.width,h/image.height),sw=logicalWidth/scale,sh=h/scale;
                    ctx.drawImage(image,(image.width-sw)/2,(image.height-sh)*.28,sw,sh,x,y,cell,h);}
                ctx.fillStyle='#1e3530';ctx.fillRect(x,y+cell-36,cell,36);
                ctx.fillStyle='#fbfcfb';ctx.font='500 17px sans-serif';ctx.textBaseline='middle';
                let label=item.title;while(ctx.measureText(label).width>cell-26)label=label.slice(0,-2)+'…';
                ctx.fillText(label,x+13,y+cell-18);
            });
            const vertex='attribute vec2 point;varying vec2 p;void main(){p=point;gl_Position=vec4(point,0.,1.);}';
            const fragment=`precision mediump float;
                varying vec2 p;uniform sampler2D atlas;uniform vec2 rotation;uniform float atlasRows;
                void main(){float r=dot(p,p);if(r>=1.)discard;vec3 n=vec3(p,sqrt(1.-r));
                float cy=cos(rotation.x),sy=sin(rotation.x),cp=cos(rotation.y),sp=sin(rotation.y);
                vec3 q=vec3(n.x,n.y*cp-n.z*sp,n.z*cp+n.y*sp);q=vec3(q.x*cy-q.z*sy,q.y,q.z*cy+q.x*sy);
                float u=fract(atan(q.x,q.z)/6.2831853+.5),v=clamp(asin(q.y)/3.14159265+.5,0.,.99999),row=floor(v*${bandCount.toFixed(1)});
                float count=${counts[0].toFixed(1)},offset=${offsets[0].toFixed(1)};
                ${counts.slice(1).map((c,i)=>`if(row>${(i+.5).toFixed(1)}){count=${c.toFixed(1)};offset=${offsets[i+1].toFixed(1)};}`).join('')}
                vec2 tile=vec2(fract(u*count),1.-fract(v*${bandCount.toFixed(1)}));float index=offset+floor(u*count);
                vec2 uv=(vec2(mod(index,4.),floor(index/4.))+clamp((tile-.026)/.948,0.,1.))/vec2(4.,atlasRows);
                vec3 color=texture2D(atlas,uv).rgb;
                if(tile.x<.026||tile.x>.974||tile.y<.026||tile.y>.974)color=vec3(.1176,.2078,.1882);
                color*=.72+.28*max(dot(n,normalize(vec3(-.35,.5,1.))),0.);
                float alpha=1.-smoothstep(.989,1.,r);gl_FragColor=vec4(color*alpha,alpha);}`;
            function compile(type,source){const shader=gl.createShader(type);gl.shaderSource(shader,source);gl.compileShader(shader);
                if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw new Error('Globe renderer unavailable');return shader;}
            const program=gl.createProgram();gl.attachShader(program,compile(gl.VERTEX_SHADER,vertex));gl.attachShader(program,compile(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);
            if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error('Globe link failed');gl.useProgram(program);
            gl.bindBuffer(gl.ARRAY_BUFFER,gl.createBuffer());gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
            const point=gl.getAttribLocation(program,'point');gl.enableVertexAttribArray(point);gl.vertexAttribPointer(point,2,gl.FLOAT,false,0,0);
            gl.bindTexture(gl.TEXTURE_2D,gl.createTexture());gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
            gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,atlas);gl.uniform1f(gl.getUniformLocation(program,'atlasRows'),rows);
            const rotation=gl.getUniformLocation(program,'rotation');
            draw=()=>{const size=Math.min(1000,Math.round(surface.clientWidth*Math.min(devicePixelRatio||1,2)));
                if(canvas.width!==size){canvas.width=size;canvas.height=size;gl.viewport(0,0,size,size);}
                gl.uniform2f(rotation,yaw,pitch);gl.clear(gl.COLOR_BUFFER_BIT);gl.drawArrays(gl.TRIANGLES,0,6);};
            surface.append(canvas);surface.classList.add('globe-ready');available=true;scene.dataset.caseCount=String(items.length);update();
            canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();available=false;draw=null;effects?.finish();surface.classList.remove('globe-ready','globe-pending');update();});
        }catch(_){available=false;draw=null;surface.classList.remove('globe-pending');update();}
    });
})();
