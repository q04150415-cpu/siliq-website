/* Fragment assembly and a quiet, original Web Audio sound palette. */
(() => {
    'use strict';
    window.SiliqGlobeEffects = function(scene, surface, motion) {
        const soundButton=scene.querySelector('.globe-sound'),replay=scene.querySelector('.globe-replay');
        const AudioEngine=window.AudioContext||window.webkitAudioContext;
        let context,master,reverb,noise,muted=false,active=false,animations=[],layer,timer;
        let lastSwipe=0,lastNote=0,introSound=false,started=0,readyCanvas,onComplete;
        const voices=new Set();
        try{muted=localStorage.getItem('siliq-globe-muted')==='true';}catch(_){}
        function soundUI(){
            const running=context?.state==='running';
            scene.dataset.sound=muted?'muted':running?'on':'waiting';
            soundButton.textContent=muted?'音效：關':running?'音效：開':'開啟音效';
            soundButton.setAttribute('aria-pressed',String(!muted&&running));
            soundButton.setAttribute('aria-label',!muted&&running?'關閉作品球音效':'開啟作品球音效');
        }
        function setup(){
            if(context||!AudioEngine)return;
            context=new AudioEngine();master=context.createGain();master.gain.value=muted?0:.32;
            const limiter=context.createDynamicsCompressor();limiter.threshold.value=-18;limiter.knee.value=18;limiter.ratio.value=4;
            master.connect(limiter);limiter.connect(context.destination);
            reverb=context.createConvolver();const impulse=context.createBuffer(2,Math.floor(context.sampleRate*.85),context.sampleRate);
            for(let c=0;c<2;c++){const data=impulse.getChannelData(c);for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*Math.pow(1-i/data.length,3)*.35;}
            reverb.buffer=impulse;const wet=context.createGain();wet.gain.value=.16;reverb.connect(wet);wet.connect(master);
            noise=context.createBuffer(1,context.sampleRate*3,context.sampleRate);const data=noise.getChannelData(0);
            let previous=0;for(let i=0;i<data.length;i++){previous=(previous+(Math.random()*2-1)*.15)/1.15;data[i]=previous;}
            context.addEventListener('statechange',()=>{soundUI();if(context.state==='running'&&active&&!introSound)assemblySound();});
        }
        function unlock(){
            if(muted||document.hidden)return;
            try{setup();if(context?.state==='suspended')context.resume().catch(()=>{});soundUI();}catch(_){soundButton.hidden=true;}
        }
        function canPlay(){return context?.state==='running'&&!muted&&!document.hidden;}
        function route(source,gain,pan=0,filter=null){
            const nodes=[source,gain];let tail=source;
            if(filter){tail.connect(filter);tail=filter;nodes.push(filter);}
            tail.connect(gain);tail=gain;
            if(context.createStereoPanner){const stereo=context.createStereoPanner();stereo.pan.value=pan;tail.connect(stereo);tail=stereo;nodes.push(stereo);}
            tail.connect(master);gain.connect(reverb);voices.add(source);
            source.onended=()=>{voices.delete(source);nodes.forEach(n=>n.disconnect());};
        }
        function tone(frequency,at,duration,volume,pan=0){
            const oscillator=context.createOscillator(),gain=context.createGain();oscillator.type='sine';
            oscillator.frequency.setValueAtTime(frequency,at);oscillator.frequency.exponentialRampToValueAtTime(frequency*.998,at+duration);
            gain.gain.setValueAtTime(0,at);gain.gain.linearRampToValueAtTime(volume,at+.025);
            gain.gain.exponentialRampToValueAtTime(.0001,at+duration);route(oscillator,gain,pan);
            oscillator.start(at);oscillator.stop(at+duration+.03);
        }
        function air(at,duration,volume,pan=0,rise=false){
            const source=context.createBufferSource(),gain=context.createGain(),filter=context.createBiquadFilter();
            source.buffer=noise;filter.type='bandpass';filter.Q.value=.55;
            filter.frequency.setValueAtTime(rise?420:1900,at);filter.frequency.exponentialRampToValueAtTime(rise?2200:650,at+duration);
            gain.gain.setValueAtTime(0,at);gain.gain.linearRampToValueAtTime(volume,at+duration*.3);gain.gain.exponentialRampToValueAtTime(.0001,at+duration);
            route(source,gain,pan,filter);source.start(at);source.stop(at+duration+.02);
        }
        function stopSound(){
            if(!context)return;
            master.gain.cancelScheduledValues(context.currentTime);master.gain.setTargetAtTime(0,context.currentTime,.015);
            for(const source of voices){try{source.stop(context.currentTime+.06);}catch(_){}}
        }
        function restoreVolume(){if(context){master.gain.cancelScheduledValues(context.currentTime);master.gain.setTargetAtTime(muted?0:.32,context.currentTime,.025);}}
        function assemblySound(){
            if(!canPlay()||introSound)return;
            const remaining=Math.max(0,2.65-(performance.now()-started)/1000);
            if(remaining<.35)return;
            introSound=true;restoreVolume();const t=context.currentTime;
            air(t,Math.min(2.1,remaining),.8,0,true);
            [329.63,493.88,659.25].forEach((f,i)=>tone(f,t+Math.max(0,remaining-.9)+i*.09,.8,.08,-.25+i*.25));
            tone(82.41,t+Math.max(0,remaining-.7),.7,.13);
        }
        function cue(){
            if(!canPlay())return;const now=context.currentTime;if(now-lastNote<.12)return;lastNote=now;restoreVolume();
            tone([493.88,659.25,739.99][Number(scene.dataset.selected||0)%3],now,.21,.035);
        }
        function swipe(distance,direction){
            if(!canPlay()||distance<1)return;const now=context.currentTime;if(now-lastSwipe<.085)return;lastSwipe=now;restoreVolume();
            air(now,.19,Math.min(.48,.12+distance*.012),Math.max(-.6,Math.min(.6,direction)));
        }
        function finish(interrupted=false){
            clearTimeout(timer);animations.forEach(a=>a.cancel());animations=[];layer?.remove();layer=null;
            const wasActive=active;active=false;if(wasActive&&interrupted)stopSound();surface.classList.remove('globe-assembling','globe-pending');
            scene.dataset.intro='complete';if(wasActive)onComplete?.();
        }
        function assemble(canvas,complete){
            if(active)finish(true);readyCanvas=canvas;onComplete=complete;
            replay.hidden=motion.matches;
            if(motion.matches||!surface.animate){finish();complete?.();return;}
            try{
                const texture=canvas.toDataURL();layer=document.createElement('div');layer.className='globe-fragments';layer.setAttribute('aria-hidden','true');
                layer.style.setProperty('--fragment-image',`url("${texture}")`);
                surface.append(layer);surface.classList.add('globe-assembling');surface.classList.remove('globe-pending');
                active=true;started=performance.now();introSound=false;scene.dataset.intro='assembling';
                const count=7,size=surface.clientWidth;
                for(let row=0;row<count;row++)for(let col=0;col<count;col++){
                    const x=(col+.5)/count-.5,y=(row+.5)/count-.5;if(Math.hypot(x,y)>.59)continue;
                    const shard=document.createElement('span');shard.className='globe-fragment';
                    shard.style.cssText=`left:${col/count*100}%;top:${row/count*100}%;width:${100/count+.07}%;height:${100/count+.07}%;background-size:${count*100}% ${count*100}%;background-position:${col/(count-1)*100}% ${row/(count-1)*100}%;`;
                    layer.append(shard);const seed=Math.sin((row*count+col+1)*12.9898)*43758.5453;const random=seed-Math.floor(seed);
                    const dx=x*size*(.7+random*.8),dy=y*size*(.7+random*.9),rotation=(random-.5)*110;
                    animations.push(shard.animate([
                        {transform:`translate3d(${dx}px,${dy}px,${120+random*180}px) rotate(${rotation}deg) rotateY(${rotation}deg) scale(.58)`,opacity:0,filter:'brightness(1.4)'},
                        {offset:.16,opacity:.95},
                        {transform:'translate3d(0,0,0) rotate(0) rotateY(0) scale(1)',opacity:1,filter:'brightness(1)'}
                    ],{duration:2100,delay:random*360,easing:'cubic-bezier(.22,.7,.18,1)',fill:'both'}));
                }
                unlock();assemblySound();timer=setTimeout(finish,2650);
            }catch(_){finish();complete?.();}
        }
        replay.addEventListener('click',()=>{unlock();if(readyCanvas)assemble(readyCanvas,onComplete);});
        soundButton.hidden=!AudioEngine;soundUI();
        soundButton.addEventListener('click',()=>{
            if(!muted&&context?.state==='running'){muted=true;stopSound();}else{muted=false;unlock();restoreVolume();}
            try{localStorage.setItem('siliq-globe-muted',String(muted));}catch(_){}soundUI();
        });
        // A normal visit remains silent until the browser allows audio. Never bypass autoplay policy.
        const gesture=e=>{if(!e.target.closest('.globe-sound'))unlock();};
        document.addEventListener('pointerdown',gesture,{passive:true});document.addEventListener('pointerup',gesture,{passive:true});document.addEventListener('keydown',gesture);
        document.addEventListener('visibilitychange',()=>{if(document.hidden){finish();stopSound();}else restoreVolume();});
        motion.addEventListener('change',()=>{if(motion.matches)finish(true);replay.hidden=motion.matches||!readyCanvas;});
        window.addEventListener('resize',()=>{if(active)finish(true);},{passive:true});
        return {assemble,finish,cue,swipe,unlock,stopSound,get active(){return active;}};
    };
})();
