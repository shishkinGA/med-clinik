// ============================================================
// FX-карточки: шейдерные «видео-лупы» (жидкий перламутр/хром)
// с hover-дисторшном + RGB-shift. Фолбэк вместо видео-ассетов:
// реальные ролики подключаются заменой файлов без правок кода.
// ============================================================
window.FX = (function () {
  const VERT = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
  const FRAG = [
    'precision highp float;',
    'uniform vec2 uRes;uniform float uTime;uniform float uHover;uniform float uSeed;uniform vec3 uAccent;',
    'float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}',
    'float noise(vec2 p){vec2 i=floor(p);vec2 f=fract(p);f=f*f*(3.0-2.0*f);',
    ' float a=hash(i),b=hash(i+vec2(1.,0.)),c=hash(i+vec2(0.,1.)),d=hash(i+vec2(1.,1.));',
    ' return mix(mix(a,b,f.x),mix(c,d,f.x),f.y);}',
    'float fbm(vec2 p){float v=0.;float a=.5;for(int i=0;i<4;i++){v+=a*noise(p);p=p*2.03+vec2(1.7,9.2);a*=.5;}return v;}',
    'float field(vec2 uv){float t=uTime*.07+uSeed*13.1;',
    ' vec2 q=vec2(fbm(uv*2.0+vec2(t,0.)),fbm(uv*2.0-vec2(0.,t*.8)));',
    ' return fbm(uv*2.4+q*1.8);}',
    'void main(){',
    ' vec2 uv=gl_FragCoord.xy/uRes;',
    ' vec2 m=uv-.5;',
    ' vec2 duv=uv+uHover*.09*vec2(field(uv*1.4+vec2(3.1))-.5,field(uv*1.4-vec2(1.7))-.5);',
    ' float sh=uHover*.016;',
    ' float r=field(duv+vec2(sh,0.));',
    ' float g=field(duv);',
    ' float b=field(duv-vec2(sh,0.));',
    ' vec3 pearl=vec3(.965,.948,.915);',
    ' vec3 taupe=vec3(.80,.76,.69);',
    ' vec3 col=vec3(mix(taupe.r,pearl.r,smoothstep(.3,.75,r)),mix(taupe.g,pearl.g,smoothstep(.3,.75,g)),mix(taupe.b,pearl.b,smoothstep(.3,.75,b)));',
    ' float band=smoothstep(.5,.58,g)*smoothstep(.7,.6,g);',
    ' col=mix(col,uAccent,band*.5);',
    ' float glint=pow(smoothstep(.66,.86,r),2.);',
    ' col+=vec3(.09,.085,.075)*glint;',
    ' col*=1.-dot(m,m)*.4;',
    ' gl_FragColor=vec4(col,1.);',
    '}'
  ].join('\n');

  function hexv(hex) {
    const n = parseInt(hex.slice(1), 16);
    return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
  }

  function attach(canvas, seed) {
    const gl = canvas.getContext('webgl', { antialias: false, depth: false, stencil: false, alpha: false });
    if (!gl) return { setHover() {} };

    function shader(type, src) {
      const s = gl.createShader(type);
      gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) console.warn(gl.getShaderInfoLog(s));
      return s;
    }
    const prog = gl.createProgram();
    gl.attachShader(prog, shader(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, shader(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const U = {
      res: gl.getUniformLocation(prog, 'uRes'),
      time: gl.getUniformLocation(prog, 'uTime'),
      hover: gl.getUniformLocation(prog, 'uHover'),
      seed: gl.getUniformLocation(prog, 'uSeed'),
      accent: gl.getUniformLocation(prog, 'uAccent')
    };

    let hover = 0, target = 0, visible = false, painted = false;
    const t0 = performance.now();
    const reduced = window.STORE && window.STORE.reduced;

    new IntersectionObserver((en) => { visible = en[0].isIntersecting; }, { rootMargin: '120px' }).observe(canvas);

    function resize() {
      const d = Math.min(window.devicePixelRatio || 1, 1.5);
      const w = (canvas.clientWidth * d) | 0, h = (canvas.clientHeight * d) | 0;
      if (w && (canvas.width !== w || canvas.height !== h)) {
        canvas.width = w; canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
    }

    function frame(now) {
      requestAnimationFrame(frame);
      if (!visible) return;
      hover += (target - hover) * 0.08;
      resize();
      gl.useProgram(prog);
      gl.uniform2f(U.res, canvas.width, canvas.height);
      gl.uniform1f(U.time, reduced ? 30 : (now - t0) / 1000);
      gl.uniform1f(U.hover, hover);
      gl.uniform1f(U.seed, seed);
      const a = hexv((window.STORE && window.STORE.accent) || '#D6BD92');
      gl.uniform3f(U.accent, a[0], a[1], a[2]);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (!painted) { painted = true; canvas.classList.add('on'); }
    }
    requestAnimationFrame(frame);
    // первый кадр сразу, не дожидаясь IntersectionObserver,
    // чтобы карточка никогда не оставалась чёрной
    visible = true; resize();
    requestAnimationFrame((t) => frame(t));

    return { setHover(v) { target = v; } };
  }

  return { attach };
})();
