/* Lightweight sphere mapping: local images, no 3D library or remote assets. */
(() => {
    'use strict';
    const scene = document.querySelector('.hero-spheres');
    if (!scene) return;
    const toggle = scene.querySelector('.sphere-toggle');
    const preference = matchMedia('(prefers-reduced-motion: reduce)');
    const spheres = [];
    let paused = preference.matches, visible = true, frame = 0, last = 0, elapsed = 0;
    const vertexSource = 'attribute vec2 point; varying vec2 position; void main(){position=point;gl_Position=vec4(point,0.,1.);}';
    const fragmentSource = `
        precision mediump float;
        varying vec2 position;
        uniform sampler2D photo;
        uniform float angle;
        uniform float imageAspect;
        void main() {
            float r2 = dot(position, position);
            if (r2 >= 1.0) discard;
            vec3 normal = vec3(position, sqrt(1.0-r2));
            float c = cos(angle), s = sin(angle);
            vec3 rotated = vec3(normal.x*c-normal.z*s, normal.y, normal.z*c+normal.x*s);
            vec2 uv = vec2(fract(atan(rotated.x, rotated.z)/3.14159265+0.5), asin(rotated.y)/3.14159265*imageAspect+0.62);
            vec3 color = texture2D(photo, uv).rgb;
            vec3 light = normalize(vec3(-0.45, 0.65, 1.1));
            float diffuse = max(dot(normal, light), 0.0);
            float highlight = pow(max(dot(normal, normalize(light+vec3(0.,0.,1.))),0.), 38.0);
            color = color * (0.63+0.37*diffuse) + vec3(0.12)*highlight;
            float alpha = 1.0-smoothstep(0.985,1.0,r2);
            gl_FragColor = vec4(color*alpha, alpha);
        }`;

    function createSphere(link, index) {
        const host = link.querySelector('.sphere-frame');
        const image = host.querySelector('img');
        const canvas = document.createElement('canvas');
        canvas.setAttribute('aria-hidden', 'true');
        const gl = canvas.getContext('webgl', {alpha: true, antialias: true, preserveDrawingBuffer: true, powerPreference: 'low-power'});
        if (!gl) return;
        function shader(type, source) {
            const result = gl.createShader(type);
            gl.shaderSource(result, source); gl.compileShader(result);
            if (!gl.getShaderParameter(result, gl.COMPILE_STATUS)) throw new Error('Sphere shader unavailable');
            return result;
        }
        try {
            const program = gl.createProgram();
            const vertex = shader(gl.VERTEX_SHADER, vertexSource);
            const fragment = shader(gl.FRAGMENT_SHADER, fragmentSource);
            gl.attachShader(program, vertex); gl.attachShader(program, fragment); gl.linkProgram(program);
            gl.deleteShader(vertex); gl.deleteShader(fragment);
            if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
            gl.useProgram(program);
            const buffer = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]), gl.STATIC_DRAW);
            const point = gl.getAttribLocation(program, 'point');
            gl.enableVertexAttribArray(point); gl.vertexAttribPointer(point, 2, gl.FLOAT, false, 0, 0);
            const texture = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
            const angleUniform = gl.getUniformLocation(program, 'angle');
            gl.uniform1f(gl.getUniformLocation(program, 'imageAspect'), image.naturalWidth/image.naturalHeight);
            const sphere = {hover: false, focus: false, dragging: false, offset: 0, angle: 0, lost: false, draw() {
                if (sphere.lost) return;
                if (!sphere.hover && !sphere.focus && !sphere.dragging) sphere.angle = Math.sin(elapsed*.32)*(index ? -.48 : .48);
                const size = Math.min(640, Math.max(128, Math.round(host.clientWidth*Math.min(devicePixelRatio || 1, 2))));
                if (canvas.width !== size) {canvas.width = size; canvas.height = size; gl.viewport(0,0,size,size);}
                gl.uniform1f(angleUniform, sphere.angle+sphere.offset);
                gl.clear(gl.COLOR_BUFFER_BIT); gl.drawArrays(gl.TRIANGLES,0,6);
            }};
            host.append(canvas); sphere.draw(); host.classList.add('sphere-ready'); spheres.push(sphere);
            let pointerX = 0, origin = 0, dragged = false;
            host.addEventListener('pointerdown', event => {
                if (!event.isPrimary || event.button !== 0) return;
                pointerX = event.clientX; origin = sphere.offset; dragged = false; sphere.dragging = true;
                host.setPointerCapture(event.pointerId);
            });
            host.addEventListener('pointermove', event => {
                if (!sphere.dragging) return;
                const distance = event.clientX-pointerX;
                if (Math.abs(distance) > 6) dragged = true;
                if (dragged) {sphere.offset = origin-distance/host.clientWidth*Math.PI; sphere.draw();}
            });
            const release = () => {sphere.dragging = false;};
            host.addEventListener('pointerup', release); host.addEventListener('pointercancel', release); host.addEventListener('lostpointercapture', release);
            link.addEventListener('click', event => {if (dragged) {event.preventDefault(); event.stopPropagation(); dragged = false;} });
            link.addEventListener('dragstart', event => event.preventDefault());
            link.addEventListener('pointerenter', () => {sphere.hover = true;});
            link.addEventListener('pointerleave', () => {sphere.hover = false;});
            link.addEventListener('focus', () => {sphere.focus = true;});
            link.addEventListener('blur', () => {sphere.focus = false;});
            link.addEventListener('keydown', event => {
                if (!['ArrowLeft','ArrowRight'].includes(event.key)) return;
                event.preventDefault(); sphere.offset += event.key === 'ArrowLeft' ? -.15 : .15; sphere.draw();
            });
            canvas.addEventListener('webglcontextlost', event => {event.preventDefault(); sphere.lost = true; host.classList.remove('sphere-ready'); update();});
            canvas.addEventListener('webglcontextrestored', () => {canvas.remove(); createSphere(link,index); update();});
            update();
        } catch (_) {
            // The original round image remains visible when WebGL is unavailable.
            canvas.remove();
        }
    }
    function tick(now) {
        frame = 0;
        if (last) elapsed += Math.min((now-last)/1000,.05);
        last = now;
        spheres.forEach(sphere => sphere.draw());
        if (!paused && visible && !document.hidden && spheres.some(s => !s.lost)) frame = requestAnimationFrame(tick);
    }
    function update() {
        const available = spheres.some(s => !s.lost);
        toggle.hidden = !available;
        toggle.textContent = paused ? '播放旋轉' : '暫停旋轉';
        toggle.setAttribute('aria-pressed', String(paused));
        toggle.setAttribute('aria-label', paused ? '播放球面旋轉' : '暫停球面旋轉');
        scene.dataset.motion = available ? (paused ? 'paused' : 'playing') : 'fallback';
        if (frame) cancelAnimationFrame(frame);
        frame = 0; last = 0;
        spheres.forEach(sphere => sphere.draw());
        if (available && !paused && visible && !document.hidden) frame = requestAnimationFrame(tick);
    }
    toggle.addEventListener('click', () => {paused = !paused; update();});
    preference.addEventListener('change', () => {paused = preference.matches; update();});
    document.addEventListener('visibilitychange', update);
    window.addEventListener('resize', update, {passive:true});
    if ('IntersectionObserver' in window) new IntersectionObserver(entries => {visible = entries[0].isIntersecting; update();}).observe(scene);
    scene.querySelectorAll('.hero-project').forEach((link,index) => {
        const image = link.querySelector('img');
        if (image.complete && image.naturalWidth) createSphere(link,index);
        else image.addEventListener('load', () => createSphere(link,index), {once:true});
    });
})();
