// ============================================================
// Компоновка DOM из конфига + Lenis + ScrollTrigger-хореография
// + сплит-раскрытия, счётчики, курсор, магнитные кнопки, прелоадер.
// ============================================================
(function () {
  const C = window.CONTENT, S = window.STORE;
  const reduced = S.reduced;
  const fine = window.matchMedia('(pointer: fine)').matches;
  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => Array.prototype.slice.call((el || document).querySelectorAll(s));

  if (reduced) document.body.classList.add('reduced');

  // ---------------- построение DOM из конфига ----------------
  $('#nav').innerHTML =
    '<a class="brand" href="#hero">' + C.brand.name + '</a>' +
    '<nav class="menu">' + C.brand.menu.map(m => '<a href="' + m.href + '">' + m.label + '</a>').join('') + '</nav>' +
    '<a class="nav-cta" href="#cta">' + C.hero.cta + '</a>';

  $('#page').innerHTML = `
  <section class="sec sec-hero" id="hero" data-screen-label="Hero">
    <div class="hero-inner">
      <p class="hero-eyebrow"><span class="dot"></span>${C.hero.eyebrow}</p>
      <h1 class="hero-h" id="heroH">${C.hero.headline}</h1>
      <p class="hero-sub">${C.hero.sub}</p>
      <div class="hero-cta-row"><a class="btn magnetic" href="#cta"><span class="btn-in">${C.hero.cta}</span></a></div>
    </div>
    <div class="scroll-hint"><span class="hint-line"></span>${C.hero.hint}</div>
  </section>

  <section class="sec sec-manifesto" id="manifesto" data-screen-label="Manifesto">
    <div class="mani-inner">
      <p class="sec-label">${C.manifesto.label}</p>
      <p class="mani-text" id="maniText">${C.manifesto.text}</p>
    </div>
  </section>

  <section class="sec sec-map" id="advantages" data-screen-label="Map">
    <div class="sec-head map-head">
      <div class="map-head-main">
        <p class="sec-label">${C.map.label}</p>
        <h2 class="sec-title" data-split>${C.map.title}</h2>
        <p class="map-intro" data-reveal>${C.map.intro}</p>
      </div>
      <div class="map-legend" id="mapLegend">
        <span class="map-count" id="mapCount">0</span>
        <span class="map-count-label">${C.map.countLabel}</span>
      </div>
    </div>
    <div class="map-stage" id="mapStage">
      <svg class="map-svg" id="mapSvg" viewBox="0 6 100 44" preserveAspectRatio="xMidYMid meet" aria-hidden="true"></svg>
      <div class="map-labels" id="mapLabels"></div>
    </div>
  </section>

  <section class="sec sec-services" id="services" data-screen-label="Services">
    <div class="sec-head">
      <p class="sec-label">${C.services.label}</p>
      <h2 class="sec-title" data-split>${C.services.title}</h2>
    </div>
    <div class="svc-deck" id="svcDeck">
      <div class="svc-track" id="svcTrack">
        ${C.services.items.map((s, i) => `
        <figure class="svc-card" data-i="${i}">
          <div class="svc-panel">
            <span class="svc-art" data-seed="${i}"></span>
            <span class="svc-edge"></span>
            <div class="svc-cap">
              <span class="svc-idx">${String(i + 1).padStart(2, '0')}</span>
              <h3 class="svc-title">${s.title}</h3>
              <p class="svc-desc">${s.desc}</p>
            </div>
            <span class="media-tag">слот: видео-луп / фото</span>
          </div>
        </figure>`).join('')}
      </div>
      <p class="svc-hint" id="svcHint">наведите · листайте</p>
    </div>
  </section>

  <section class="sec sec-process" id="process" data-screen-label="Process">
    <p class="sec-label proc-label">${C.process.label}</p>
    <div class="proc-steps">
      ${C.process.steps.map(p => `
      <div class="proc-step">
        <span class="proc-num">${p.step}</span>
        <h3 class="proc-title">${p.title}</h3>
        <p class="proc-desc">${p.desc}</p>
      </div>`).join('')}
    </div>
    <div class="proc-progress"><span class="proc-bar"></span></div>
  </section>

  <section class="sec sec-chat" id="doctors" data-screen-label="AI-запись">
    <div class="sec-head">
      <p class="sec-label">${C.doctors.label}</p>
      <h2 class="sec-title" data-split>${C.doctors.title}</h2>
      <p class="chat-intro" data-reveal>${C.doctors.intro}</p>
    </div>
    <div class="chat-wrap" id="chatWrap">
      <div class="chat-phone" id="chatPhone">
        <div class="chat-top">
          <span class="chat-avatar"></span>
          <span class="chat-id"><b>${C.doctors.clinicName}</b><i>онлайн · отвечает мгновенно</i></span>
          <span class="chat-dots">•••</span>
        </div>
        <div class="chat-body" id="chatBody"></div>
        <div class="chat-quicks" id="chatQuicks">
          ${C.doctors.quicks.map((q, i) => `<button class="chat-quick" type="button" data-i="${i}">${q.label}</button>`).join('')}
        </div>
      </div>
    </div>
  </section>

  <section class="sec sec-cta" id="cta" data-screen-label="CTA">
    <div class="cta-finale">
      <h2 class="cta-vow" data-typewriter>${C.cta.headline}</h2>
      <button class="cta-confirm magnetic" type="button" id="ctaConfirm" aria-label="${C.cta.button}">
        <span class="cc-ring"></span>
        <span class="cc-core"><span class="btn-in">${C.cta.button}</span></span>
        <span class="cc-done">${C.cta.confirmed}</span>
      </button>
    </div>
  </section>

  <footer class="sec-footer" id="footer" data-screen-label="Footer">
    <div class="marq"><div class="marq-track">${C.footer.marquee.repeat(4)}</div></div>
    <div class="foot-row">
      <span class="foot-brand">${C.brand.name}</span>
      <nav class="foot-links">${C.footer.links.map(l => '<a href="#footer">' + l + '</a>').join('')}</nav>
      <span class="foot-note">${C.footer.note}</span>
    </div>
  </footer>`;

  // ---------------- сплит-утилиты ----------------
  function splitChars(node) {
    const text = node.textContent;
    node.textContent = '';
    const frag = document.createDocumentFragment();
    text.split(' ').forEach((wtext, wi, arr) => {
      const w = document.createElement('span'); w.className = 'w';
      for (const chc of wtext) {
        const m = document.createElement('span'); m.className = 'chm';
        const c = document.createElement('span'); c.className = 'ch'; c.textContent = chc;
        m.appendChild(c); w.appendChild(m);
      }
      frag.appendChild(w);
      if (wi < arr.length - 1) frag.appendChild(document.createTextNode(' '));
    });
    node.appendChild(frag);
    return $$('.ch', node);
  }
  function splitWords(node) {
    const text = node.textContent;
    node.textContent = '';
    const frag = document.createDocumentFragment();
    text.split(' ').forEach((wtext, wi, arr) => {
      const w = document.createElement('span'); w.className = 'mw'; w.textContent = wtext;
      frag.appendChild(w);
      if (wi < arr.length - 1) frag.appendChild(document.createTextNode(' '));
    });
    node.appendChild(frag);
    return $$('.mw', node);
  }

  const heroChars = splitChars($('#heroH'));
  const maniWords = splitWords($('#maniText'));

  // без GSAP (CDN не загрузился) — показываем статичную версию
  if (!window.gsap) {
    const pre = $('#preloader'); if (pre) pre.remove();
    document.body.classList.remove('lock');
    $$('.count').forEach(n => { n.textContent = n.dataset.value; });
    maniWords.forEach(w => { w.style.opacity = 1; w.style.filter = 'none'; w.style.transform = 'none'; });
    return;
  }
  gsap.registerPlugin(ScrollTrigger);

  // ---------------- Lenis (инерционный скролл) ----------------
  let lenis = null;
  if (!reduced && window.Lenis) {
    lenis = new Lenis({ duration: 1.15, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    lenis.stop();
  }
  window.LENIS = lenis;

  // якорная навигация
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const t = document.querySelector(a.getAttribute('href'));
    if (!t) return;
    e.preventDefault();
    if (lenis) lenis.scrollTo(t, { duration: 1.6 });
    else window.scrollTo({ top: t.getBoundingClientRect().top + window.scrollY, behavior: 'smooth' });
  });

  // ---------------- курсор + мышь для параллакса ----------------
  window.addEventListener('mousemove', (e) => {
    S.mouse.x = (e.clientX / window.innerWidth - 0.5) * 2;
    S.mouse.y = (e.clientY / window.innerHeight - 0.5) * 2;
  });
  if (fine && !reduced) {
    document.body.classList.add('has-cursor');
    const cur = $('#cursor'), dot = $('.cur-dot'), ring = $('.cur-ring');
    let rx = innerWidth / 2, ry = innerHeight / 2, tx = rx, ty = ry;
    window.addEventListener('mousemove', (e) => {
      cur.classList.add('on');
      tx = e.clientX; ty = e.clientY;
      if (!cur.classList.contains('seen')) { cur.classList.add('seen'); rx = tx; ry = ty; }
      dot.style.left = tx + 'px'; dot.style.top = ty + 'px';
    });
    gsap.ticker.add(() => {
      rx += (tx - rx) * 0.16; ry += (ty - ry) * 0.16;
      ring.style.left = rx + 'px'; ring.style.top = ry + 'px';
    });
    document.addEventListener('mouseover', (e) => {
      cur.classList.toggle('hov', !!e.target.closest('a,button,.svc-card,.doc-card'));
    });
  }

  // ---------------- магнитные кнопки ----------------
  if (fine && !reduced) {
    $$('.magnetic').forEach((btn) => {
      const inner = $('.btn-in', btn);
      btn.addEventListener('mousemove', (e) => {
        const r = btn.getBoundingClientRect();
        const dx = e.clientX - r.left - r.width / 2, dy = e.clientY - r.top - r.height / 2;
        gsap.to(btn, { x: dx * 0.25, y: dy * 0.25, duration: 0.4, ease: 'power2.out' });
        gsap.to(inner, { x: dx * 0.12, y: dy * 0.12, duration: 0.4, ease: 'power2.out' });
      });
      btn.addEventListener('mouseleave', () => {
        gsap.to([btn, inner], { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1,0.45)' });
      });
    });
  }

  // ---------------- FX-карточки (hover-дисторшн) ----------------
  if (window.FX) {
    $$('.fx').forEach((cv) => {
      const fx = FX.attach(cv, +cv.dataset.seed || 0);
      const card = cv.closest('.svc-card');
      if (card && fine) {
        card.addEventListener('pointerenter', () => fx.setHover(1));
        card.addEventListener('pointerleave', () => fx.setHover(0));
      }
    });
  }

  // ---------------- 3D-дек услуг (диагональная перспектива) ----------------
  (function svcDeck() {
    const deck = $('#svcDeck'), track = $('#svcTrack');
    if (!deck || !track) return;
    const cards = $$('.svc-card', track);
    const N = cards.length;
    const is3D = () => window.innerWidth > 820 && !reduced;

    // толщина стекла: боковые грани-стенки (повёрнуты в 3D), прозрачность лица сохраняется
    const THICK = 20;
    cards.forEach((c) => {
      const panel = c.querySelector('.svc-panel');
      c.style.setProperty('--T', THICK + 'px');
      ['l', 'r', 'b'].forEach((side) => {
        const w = document.createElement('span');
        w.className = 'svc-wall svc-wall-' + side;
        c.insertBefore(w, panel);
      });
    });

    let DX = 168, DY = -30, DZ = -188;
    const ANG = -32;
    function metrics() {
      const k = Math.max(0.72, Math.min(1.12, window.innerWidth / 1440));
      DX = 168 * k; DY = -30 * k; DZ = -188 * k;
    }
    metrics();
    window.addEventListener('resize', metrics);

    // целевые/текущие величины — всё сглаживаем в JS, без CSS-transition на transform
    let p = 0, pT = 0;            // сдвиг ряда от скролла
    let intro = reduced ? 1 : 0, introT = 1;
    const openA = cards.map(() => 0), openTgt = cards.map(() => 0);
    let hovering = false, mouseX = 0, mouseY = 0, lastProg = -1;

    if (fine) {
      deck.addEventListener('pointermove', (e) => { hovering = true; mouseX = e.clientX; mouseY = e.clientY; });
      deck.addEventListener('pointerleave', () => { hovering = false; });
    }

    function applyFlat() {
      cards.forEach((c) => { c.style.transform = ''; c.style.zIndex = ''; c.style.opacity = ''; c.style.filter = ''; });
    }

    function frame() {
      requestAnimationFrame(frame);
      if (!is3D()) { applyFlat(); return; }

      // прогресс по реальному положению дека в окне (надёжнее scrub)
      const r = deck.getBoundingClientRect();
      const centerY = r.top + r.height / 2;
      let prog = 1 - centerY / window.innerHeight;        // 0 — дек внизу, 1 — вверху
      prog = Math.max(0, Math.min(1, prog));
      // раскладка из колоды: 0 = стопка, полный веер когда ~2/3 блока на экране
      const vh = window.innerHeight;
      const vis = Math.max(0, Math.min(1, (vh - r.top) / r.height));   // доля блока на экране
      const fanProg = Math.max(0, Math.min(1, (vis - 0.16) / (0.66 - 0.16)));
      introT = fanProg;
      // после раскрытия из колоды ряд продолжает уезжать в левый угол по скроллу
      pT = (prog - 0.5) * 2.6;

      p += (pT - p) * 0.075;
      intro += (introT - intro) * 0.08;

      const f = (N - 1) / 2 + p;
      // при скролле наведение сбрасывается — открытая карточка возвращается и скрывается
      const scrolling = lastProg >= 0 && Math.abs(prog - lastProg) > 0.0009;
      lastProg = prog;
      if (scrolling) hovering = false;   // скролл закрывает карточку до следующего движения курсора
      // какая карточка под курсором (строго в пределах её рамки, а не «ближайшая»)
      let hoverIdx = -1;
      if (hovering && !scrolling && fine) {
        const cx0 = r.left + r.width / 2;
        const cy0 = r.top + r.height / 2;
        const cw = (cards[0].offsetWidth || 260);
        const chh = cw * (4 / 3) * 0.5;   // полувысота карточки (aspect 3/4)
        const halfW = cw * 0.46;          // строгая граница по X (чуть уже реальной — без перехлёста)
        let best = halfW;
        for (let i = 0; i < N; i++) {
          const d = (i - f) * intro;
          const cxi = cx0 + d * DX;
          const cyi = cy0 + d * DY;
          if (Math.abs(mouseY - cyi) > chh) continue;     // вне карточки по вертикали
          const dist = Math.abs(mouseX - cxi);
          if (dist < best) { best = dist; hoverIdx = i; }
        }
      }

      cards.forEach((c, i) => {
        openTgt[i] = i === hoverIdx ? 1 : 0;
        openA[i] += (openTgt[i] - openA[i]) * 0.09;          // плавный разворот
        const oa = openA[i];
        c.classList.toggle('open', oa > 0.35);
        const d = (i - f) * intro;
        // стопка-колода, пока веер не раскрыт (intro<1): плотный стак с микро-смещением
        const stk = 1 - intro;
        const rel = i - (N - 1) / 2;
        const stx = rel * 7 * stk;
        const sty = rel * -5 * stk;
        const stz = -Math.abs(rel) * 14 * stk;
        // открытая карточка: выходит перед ВСЕМИ по реальному Z + дрейфует к центру
        const tx = d * DX * (1 - oa * 0.55) + stx;
        const ty = d * DY * (1 - oa * 0.55) + sty;
        const tz = d * DZ * (1 - oa) + oa * 480 + stz;
        const ry = ANG * (1 - oa) * intro;   // в стопке карты фронтальны
        const sc = 1 + oa * 0.07;
        c.style.transform = `translate(-50%,-50%) translateX(${tx.toFixed(1)}px) translateY(${ty.toFixed(1)}px) translateZ(${tz.toFixed(1)}px) rotateY(${ry.toFixed(2)}deg) scale(${sc.toFixed(3)})`;
        c.style.zIndex = oa > 0.5 ? '999' : String(200 - Math.round(d * 12));
        const far = Math.max(0, d);
        c.style.opacity = (Math.max(0.4, 1 - far * 0.12)).toFixed(3);
        c.style.filter = `brightness(${(1 - far * 0.04).toFixed(3)})`;
      });
    }
    if (!is3D()) { applyFlat(); return; }
    requestAnimationFrame(frame);
  })();

  // ---------------- AI-чат записи (liquid glass) ----------------
  (function chat() {
    const body = $('#chatBody'), phone = $('#chatPhone'), quicks = $('#chatQuicks');
    if (!body || !phone) return;
    const greeting = C.doctors.greeting || C.doctors.chat[0];
    const autoScript = C.doctors.chat;
    let runId = 0;

    const scrollDown = () => { body.style.scrollBehavior = 'auto'; body.scrollTop = body.scrollHeight; };

    function bubble(msg) {
      const row = document.createElement('div');
      row.className = 'chat-msg chat-' + (msg.from === 'client' ? 'me' : 'them');
      if (msg.card) {
        const c = msg.card;
        row.innerHTML = `<div class="chat-bubble chat-doccard">
          <span class="dc-ava"></span>
          <span class="dc-info"><b>${c.name}</b><i>${c.role}</i><u>${c.meta}</u></span>
          <span class="dc-slot">${c.slot}</span></div>`;
      } else {
        row.innerHTML = `<div class="chat-bubble">${msg.text}${msg.confirm ? `<span class="chat-confirm">✓ ${msg.confirm}</span>` : ''}</div>`;
      }
      body.appendChild(row);
      requestAnimationFrame(() => { row.classList.add('in'); scrollDown(); });
      return row;
    }

    function typing() {
      const row = document.createElement('div');
      row.className = 'chat-msg chat-them';
      row.innerHTML = `<div class="chat-bubble chat-typing"><i></i><i></i><i></i></div>`;
      body.appendChild(row);
      requestAnimationFrame(() => { row.classList.add('in'); scrollDown(); });
      return row;
    }

    const wait = (ms) => new Promise((r) => setTimeout(r, reduced ? Math.min(ms, 120) : ms));

    async function play(script) {
      const my = ++runId;            // отменяет предыдущий прогон при новом сценарии
      if (quicks) quicks.classList.remove('done');
      body.innerHTML = '';
      for (const msg of script) {
        if (my !== runId) return;
        if (msg.from === 'clinic' && (msg.typing || msg.card)) {
          const t = typing();
          await wait(msg.card ? 1100 : 900);
          t.remove();
        } else if (msg.from === 'client') {
          await wait(700);
        }
        if (my !== runId) return;
        bubble(msg);
        await wait(msg.card ? 700 : 600);
      }
      if (my === runId && quicks) quicks.classList.add('done');
    }

    // запуск только когда весь блок на экране
    if (reduced) {
      autoScript.forEach((m) => bubble(m));
    } else if (window.ScrollTrigger) {
      ScrollTrigger.create({ trigger: '#chatPhone', start: 'bottom bottom', once: true, onEnter: () => play(autoScript) });
    } else { play(autoScript); }

    // быстрые подсказки: каждая запускает свой сценарий (приветствие + релевантный поток)
    if (quicks) quicks.querySelectorAll('.chat-quick').forEach((b) => {
      b.addEventListener('click', () => {
        const q = C.doctors.quicks[+b.dataset.i];
        if (!q) return;
        play([greeting].concat(q.chat));
      });
    });
  })();

  // ---------------- CTA: подтверждение записи ----------------
  (function ctaConfirm() {
    const btn = $('#ctaConfirm');
    if (!btn) return;
    btn.addEventListener('click', () => {
      if (btn.classList.contains('done')) return;
      btn.classList.add('done');
      if (!reduced) S.champ = 1;
    });
  })();

  // ---------------- счётчики ----------------
  $$('.count').forEach((el) => {
    const v = +el.dataset.value;
    const fmt = (n) => Math.round(n).toLocaleString('ru-RU');
    if (reduced) { el.textContent = fmt(v); return; }
    const o = { n: 0 };
    ScrollTrigger.create({
      trigger: el, start: 'top 88%', once: true,
      onEnter: () => gsap.to(o, {
        n: v, duration: 1.8, ease: 'power2.out',
        onUpdate: () => { el.textContent = fmt(o.n); }
      })
    });
  });

  // ---------------- интерактивная карта сети ----------------
  const mapSvg = document.getElementById('mapSvg');
  if (mapSvg) buildMap();

  function buildMap() {
    const M = C.map, NS = 'http://www.w3.org/2000/svg';
    const stage = $('#mapStage'), labelsWrap = $('#mapLabels'), countEl = $('#mapCount');
    const VB = { w: 100, h: 56 };
    const mk = (n, a) => { const e = document.createElementNS(NS, n); for (const k in a) e.setAttribute(k, a[k]); return e; };

    // слои
    const gGrid = mk('g', { class: 'map-grid' });
    const gContour = mk('g', { class: 'map-contours' });
    const gLink = mk('g', { class: 'map-links' });
    const gFlow = mk('g', { class: 'map-flows' });
    const gNode = mk('g', { class: 'map-nodes' });
    mapSvg.append(gGrid, gContour, gLink, gFlow, gNode);

    // градиент для сканирующей полосы
    const defs = mk('defs', {});
    const grad = mk('linearGradient', { id: 'mapSweepGrad', x1: '0', y1: '0', x2: '1', y2: '0' });
    grad.append(
      mk('stop', { offset: '0', 'stop-color': 'var(--accent)', 'stop-opacity': '0' }),
      mk('stop', { offset: '0.5', 'stop-color': 'var(--accent)', 'stop-opacity': '0.45' }),
      mk('stop', { offset: '1', 'stop-color': 'var(--accent)', 'stop-opacity': '0' })
    );
    defs.appendChild(grad); mapSvg.appendChild(defs);

    // фоновая точечная сетка (с центром для волнового проявления)
    const gridDots = [];
    const cxg = VB.w / 2, cyg = VB.h / 2, maxD = Math.hypot(cxg, cyg);
    for (let y = 4; y < VB.h; y += 4)
      for (let x = 4; x < VB.w; x += 4) {
        const dot = mk('circle', { cx: x, cy: y, r: 0.18, class: 'map-dot' });
        dot._d = Math.hypot(x - cxg, y - cyg) / maxD;
        gGrid.appendChild(dot); gridDots.push(dot);
      }
    // сканирующая полоса-развёртка
    const sweep = mk('rect', { x: -8, y: 0, width: 8, height: VB.h, class: 'map-sweep' });
    gGrid.appendChild(sweep);

    // абстрактные «изолинии» (контур-подложка под картой)
    const contourDefs = [
      'M 8 30 C 20 18, 40 16, 52 22 S 86 24, 94 14',
      'M 6 40 C 22 34, 38 36, 50 32 S 82 34, 96 26',
      'M 10 48 C 26 46, 44 48, 60 44 S 88 44, 95 40'
    ];
    const contours = contourDefs.map((d) => { const p = mk('path', { d, class: 'map-contour' }); gContour.appendChild(p); return p; });

    // узлы
    const nodeEls = M.points.map((p, idx) => {
      const g = mk('g', { class: 'map-node', transform: `translate(${p.x} ${p.y})` });
      const ping = mk('circle', { r: 1.2, class: 'map-ping' });
      const halo = mk('circle', { r: 1.9, class: 'map-halo' });
      const dot = mk('circle', { r: 0.95, class: 'map-core' });
      const hit = mk('circle', { r: 4.5, class: 'map-hit' });
      g.append(ping, halo, dot, hit);
      gNode.appendChild(g);
      return { g, ping, halo, dot, hit, p, idx, links: [] };
    });

    // связи (дуги) + бегущие импульсы
    const linkEls = M.links.map(([a, b]) => {
      const A = M.points[a], B = M.points[b];
      const mxp = (A.x + B.x) / 2, myp = (A.y + B.y) / 2;
      const dx = B.x - A.x, dy = B.y - A.y;
      const curve = 0.18; // изгиб дуги
      const cx = mxp - dy * curve, cy = myp + dx * curve;
      const d = `M ${A.x} ${A.y} Q ${cx} ${cy} ${B.x} ${B.y}`;
      const path = mk('path', { d, class: 'map-link' });
      gLink.appendChild(path);
      const flow = mk('circle', { r: 0.5, class: 'map-flow' });
      gFlow.appendChild(flow);
      const link = { path, flow, len: 0, a, b };
      nodeEls[a].links.push(link); nodeEls[b].links.push(link);
      return link;
    });

    // подписи (HTML, позиционируются по экранным координатам узлов)
    const labelEls = M.points.map((p) => {
      const f = document.createElement('figure');
      f.className = 'map-label';
      f.setAttribute('data-side', p.side || 'right');
      f.innerHTML = `<span class="map-tag">${p.tag}</span><span class="map-name">${p.name}</span><span class="map-sub">${p.sub}</span>`;
      labelsWrap.appendChild(f);
      return f;
    });

    // позиционирование подписей и лидер-тиков по фактическим координатам
    const tickEls = M.points.map(() => { const t = mk('line', { class: 'map-tick' }); gNode.appendChild(t); return t; });
    function placeLabels() {
      const sr = stage.getBoundingClientRect();
      nodeEls.forEach((n, i) => {
        const r = n.dot.getBoundingClientRect();
        const cx = r.left + r.width / 2 - sr.left, cy = r.top + r.height / 2 - sr.top;
        const lab = labelEls[i], side = n.p.side || 'right';
        const offX = sr.width * 0.035;
        lab.style.top = cy + 'px';
        if (side === 'right') { lab.style.left = (cx + offX) + 'px'; lab.style.right = 'auto'; }
        else { lab.style.right = (sr.width - cx + offX) + 'px'; lab.style.left = 'auto'; }
      });
    }
    placeLabels();
    window.addEventListener('resize', placeLabels);
    if (window.LENIS) { /* пересчёт после возможных сдвигов layout */ }
    setTimeout(placeLabels, 400);

    // длины дуг для импульсов
    requestAnimationFrame(() => linkEls.forEach((l) => { l.len = l.path.getTotalLength(); }));

    // ---- бегущие импульсы по дугам (постоянная «жизнь» сети) ----
    function startFlows() {
      if (reduced) return;
      linkEls.forEach((l, i) => {
        const o = { t: Math.random() };
        gsap.to(o, {
          t: '+=1', duration: 2.8 + i * 0.4, ease: 'none', repeat: -1, delay: i * 0.3,
          onUpdate: () => {
            if (!l.len) return;
            const pt = l.path.getPointAtLength((o.t % 1) * l.len);
            l.flow.setAttribute('cx', pt.x); l.flow.setAttribute('cy', pt.y);
          }
        });
        gsap.fromTo(l.flow, { attr: { 'fill-opacity': 0 } },
          { attr: { 'fill-opacity': 0.9 }, duration: 1.2, repeat: -1, yoyo: true, ease: 'sine.inOut', delay: i * 0.3 });
      });
    }

    // ---- сборка карты ----
    if (reduced) {
      contours.forEach((c) => c.style.strokeDashoffset = 0);
      mapSvg.querySelectorAll('.map-grid,.map-node,.map-tick').forEach((e) => e.style.opacity = 1);
      linkEls.forEach((l) => { l.path.style.strokeDashoffset = 0; l.path.style.opacity = 1; });
      labelEls.forEach((l) => l.classList.add('on'));
      countEl.textContent = M.points.length;
      return;
    }

    // стартовые состояния
    contours.forEach((c) => { const L = c.getTotalLength(); c.style.strokeDasharray = L; c.style.strokeDashoffset = L; });
    gsap.set(gridDots, { autoAlpha: 0 });
    gsap.set(sweep, { autoAlpha: 0 });
    nodeEls.forEach((n) => { gsap.set(n.g, { transformOrigin: 'center', scale: 0, autoAlpha: 0 }); gsap.set(n.ping, { scale: 1, autoAlpha: 0 }); });
    tickEls.forEach((t) => gsap.set(t, { autoAlpha: 0 }));
    linkEls.forEach((l) => { const L = l.path.getTotalLength(); l.path.style.strokeDasharray = L; l.path.style.strokeDashoffset = L; gsap.set(l.flow, { attr: { 'fill-opacity': 0 } }); });
    gsap.set(labelEls, { autoAlpha: 0 });

    let played = false;
    ScrollTrigger.create({
      trigger: '#mapStage', start: 'top 58%', once: true,
      onEnter: () => {
        if (played) return; played = true;
        placeLabels();
        linkEls.forEach((l) => { l.len = l.path.getTotalLength(); });
        const tl = gsap.timeline();
        // 0) развёртка слева направо + волновое проявление точек от центра
        tl.fromTo(sweep, { autoAlpha: 0, x: -8 }, { autoAlpha: 1, duration: 0.25 }, 0)
          .to(sweep, { x: VB.w, duration: 1.25, ease: 'power1.inOut' }, 0)
          .to(sweep, { autoAlpha: 0, duration: 0.3 }, 1.1);
        tl.to(gridDots, { autoAlpha: 1, duration: 0.5, ease: 'power1.out',
          stagger: { each: 0.004, from: 'center' } }, 0.1);
        // 1) контур-подложка прочерчивается
        tl.to(contours, { strokeDashoffset: 0, duration: 1.5, stagger: 0.18, ease: 'power2.inOut' }, 0.2);
        // 2) узлы вспыхивают по очереди + пинг-кольца (двойной пинг)
        nodeEls.forEach((n, i) => {
          const at = 0.7 + i * 0.16;
          tl.to(n.g, { scale: 1, autoAlpha: 1, duration: 0.5, ease: 'back.out(2.2)' }, at);
          tl.fromTo(n.ping, { scale: 1, autoAlpha: 0.8 }, { scale: 4.5, autoAlpha: 0, duration: 1.1, ease: 'power2.out' }, at);
          tl.fromTo(n.ping, { scale: 1, autoAlpha: 0.5 }, { scale: 4.5, autoAlpha: 0, duration: 1.1, ease: 'power2.out' }, at + 0.3);
        });
        // 3) дуги прорисовываются с ярким «остриём» по фронту
        linkEls.forEach((l, i) => {
          const at = 1.25 + i * 0.14;
          tl.to(l.path, { strokeDashoffset: 0, duration: 0.75, ease: 'power2.inOut' }, at);
          // остриё: летит вдоль дуги синхронно с прорисовкой
          const o = { t: 0 };
          tl.fromTo(l.flow, { attr: { 'fill-opacity': 1 }, r: 0.85 },
            { attr: { 'fill-opacity': 0 }, r: 0.5, duration: 0.75, ease: 'power2.inOut',
              onUpdate: () => { if (l.len) { const pt = l.path.getPointAtLength(o.t * l.len); l.flow.setAttribute('cx', pt.x); l.flow.setAttribute('cy', pt.y); } } }, at);
          tl.to(o, { t: 1, duration: 0.75, ease: 'power2.inOut' }, at);
        });
        // 4) счётчик
        const cobj = { n: 0 };
        tl.to(cobj, { n: M.points.length, duration: 1.0, ease: 'power2.out',
          onUpdate: () => { countEl.textContent = Math.round(cobj.n); } }, 1.3);
        // 5) тики + подписи
        nodeEls.forEach((n, i) => {
          tl.to(tickEls[i], { autoAlpha: 1, duration: 0.4 }, 2.0 + i * 0.12);
          tl.to(labelEls[i], { autoAlpha: 1, duration: 0.6, ease: 'power2.out',
            onStart: () => labelEls[i].classList.add('on') }, 2.05 + i * 0.12);
        });
        tl.add(startFlows, 2.3);
      }
    });

    // ---- ховер на филиалах: подсветка узла, связей и подписи ----
    nodeEls.forEach((n, i) => {
      const enter = () => {
        n.g.classList.add('hot'); labelEls[i].classList.add('hot');
        if (!reduced) {
          gsap.to(n.dot, { attr: { r: 1.35 }, duration: 0.35, ease: 'back.out(2.5)' });
          gsap.fromTo(n.ping, { scale: 1, autoAlpha: 0.7 }, { scale: 4.5, autoAlpha: 0, duration: 0.9, ease: 'power2.out' });
        }
        n.links.forEach((l) => {
          l.path.classList.add('hot');
          const other = l.a === i ? l.b : l.a;
          nodeEls[other].g.classList.add('warm'); labelEls[other].classList.add('warm');
        });
      };
      const leave = () => {
        n.g.classList.remove('hot'); labelEls[i].classList.remove('hot');
        if (!reduced) gsap.to(n.dot, { attr: { r: 0.95 }, duration: 0.4, ease: 'power2.out' });
        n.links.forEach((l) => {
          l.path.classList.remove('hot');
          const other = l.a === i ? l.b : l.a;
          nodeEls[other].g.classList.remove('warm'); labelEls[other].classList.remove('warm');
        });
      };
      n.hit.addEventListener('pointerenter', enter);
      n.hit.addEventListener('pointerleave', leave);
      labelEls[i].addEventListener('pointerenter', enter);
      labelEls[i].addEventListener('pointerleave', leave);
    });

    // обновление тиков (узел → подпись) — короткий штрих от узла к стороне подписи
    function updateTicks() {
      const sr = stage.getBoundingClientRect();
      const sx = VB.w / sr.width, sy = VB.h / sr.height;
      nodeEls.forEach((n, i) => {
        const side = n.p.side || 'right';
        const dir = side === 'right' ? 1 : -1;
        tickEls[i].setAttribute('x1', n.p.x + dir * 1.4);
        tickEls[i].setAttribute('y1', n.p.y);
        tickEls[i].setAttribute('x2', n.p.x + dir * 4.2);
        tickEls[i].setAttribute('y2', n.p.y);
      });
    }
    updateTicks();
  }

  // ---------------- раскрытия ----------------
  if (!reduced) {
    $$('[data-reveal]').forEach((n) => {
      gsap.fromTo(n, { autoAlpha: 0, y: 44 }, {
        autoAlpha: 1, y: 0, duration: 1.05, ease: 'power3.out',
        scrollTrigger: { trigger: n, start: 'top 90%', once: true }
      });
    });
    $$('[data-split]').forEach((h) => {
      const ch = splitChars(h);
      gsap.fromTo(ch, { yPercent: 115 }, {
        yPercent: 0, duration: 0.9, stagger: 0.022, ease: 'power4.out',
        scrollTrigger: { trigger: h, start: 'top 86%', once: true }
      });
    });

    // typewriter — печать заголовка по буквам (с мигающим курсором)
    $$('[data-typewriter]').forEach((el) => {
      const full = el.textContent;
      el.textContent = '';
      el.classList.add('tw');
      const caret = document.createElement('span');
      caret.className = 'tw-caret';
      el.appendChild(caret);
      let started = false;
      const run = () => {
        if (started) return; started = true;
        if (reduced) { el.insertBefore(document.createTextNode(full), caret); el.classList.add('tw-done'); return; }
        let i = 0;
        const tick = () => {
          if (i <= full.length) {
            caret.insertAdjacentText('beforebegin', full[i - 1] || '');
            i++;
            setTimeout(tick, 38 + Math.random() * 70);
          } else {
            el.classList.add('tw-done');
          }
        };
        tick();
      };
      ScrollTrigger.create({ trigger: el, start: 'top 78%', once: true, onEnter: run });
    });
  }
  const steps = $$('.proc-step');
  // секция -> [формация, снос offX, плотность констелляции]
  const FORMS = {
    hero:       [0, 1, 1.0],
    manifesto:  [1, -1, 1.0],  // фигура слева, текст справа
    advantages: [2, 0, 0.4],   // впереди карта — фон тусклее
    services:   [3, 0, 0.4],   // впереди 3D-дек
    process:    [4, 0, 1.0],
    doctors:    [5, 0, 0.42],  // впереди ростер
    cta:        [6, 0, 1.0]
  };
  function applyForm(id) {
    const f = FORMS[id]; if (!f) return;
    S.form = f[0]; S.offX = f[1]; S.bgDensity = f[2];
  }

  if (!reduced) {
    // hero: наезд камеры + уход контента
    ScrollTrigger.create({
      trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true,
      onUpdate: (self) => { S.heroP = self.progress; }
    });
    gsap.to('.hero-inner', {
      autoAlpha: 0, y: -90, ease: 'none',
      scrollTrigger: { trigger: '#hero', start: '30% top', end: 'bottom top', scrub: true }
    });
    gsap.to('.scroll-hint', {
      autoAlpha: 0, ease: 'none',
      scrollTrigger: { trigger: '#hero', start: 'top top', end: '25% top', scrub: true }
    });

    // каждая секция активирует СВОЮ констелляцию (без сквозного морфинга)
    Object.keys(FORMS).forEach((id) => {
      ScrollTrigger.create({
        trigger: '#' + id, start: 'top 62%', end: 'bottom 38%',
        onToggle: (self) => { if (self.isActive) applyForm(id); }
      });
    });

    // manifesto: слова поднимаются из расфокуса; scrub делает анимацию двухсторонней
    gsap.fromTo(maniWords,
      { opacity: 0, yPercent: 45, filter: 'blur(7px)' },
      { opacity: 1, yPercent: 0, filter: 'blur(0px)', stagger: 0.5, ease: 'power2.out',
        scrollTrigger: { trigger: '#manifesto', start: 'top 85%', end: 'center center', scrub: 1 } });

    // process: pinned проезд сквозь тоннель — анимация, которую просили сохранить
    const bar = $('.proc-bar');
    const ptl = gsap.timeline({
      scrollTrigger: {
        trigger: '#process', start: 'top top', end: '+=260%', pin: true, scrub: 0.6,
        onUpdate: (self) => {
          S.form = 4; S.offX = 0; S.bgDensity = 1;
          S.travel = self.progress;
          if (bar) bar.style.width = (self.progress * 100).toFixed(1) + '%';
        },
        onLeave: () => { S.form = 5; S.offX = 0; S.bgDensity = 0.42; },      // вниз → формация врачей
        onEnterBack: () => { S.form = 4; S.offX = 0; S.bgDensity = 1; }      // назад в тоннель
      }
    });
    steps.forEach((st, i) => {
      ptl.fromTo(st, { autoAlpha: 0, y: 56 }, { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power2.out' }, i * 2);
      if (i < steps.length - 1) ptl.to(st, { autoAlpha: 0, y: -56, duration: 0.8, ease: 'power2.in' }, i * 2 + 1.4);
    });

    // надёжная активация формации врачей при заезде в секцию (в обе стороны)
    ScrollTrigger.create({
      trigger: '#doctors', start: 'top 75%', end: 'bottom 25%',
      onEnter: () => { S.form = 5; S.offX = 0; S.bgDensity = 0.42; },
      onEnterBack: () => { S.form = 5; S.offX = 0; S.bgDensity = 0.42; }
    });

    // CTA: дерево-формация + насыщение акцентом (надёжно, через всегда-активный скраб)
    ScrollTrigger.create({
      trigger: '#cta', start: 'top 85%', end: 'center center', scrub: 0.6,
      onUpdate: (self) => { S.champ = self.progress; if (self.progress > 0.35) { S.form = 6; S.offX = 0; S.bgDensity = 1; } },
      onToggle: (self) => { if (self.isActive) { S.form = 6; S.offX = 0; S.bgDensity = 1; } }
    });
    // гарантия: пока CTA в зоне видимости — формация дерева
    ScrollTrigger.create({
      trigger: '#cta', start: 'top 75%', end: 'bottom top',
      onEnter: () => { S.form = 6; S.offX = 0; S.bgDensity = 1; },
      onEnterBack: () => { S.form = 6; S.offX = 0; S.bgDensity = 1; },
      onLeaveBack: () => { S.form = 5; S.offX = 0; S.bgDensity = 0.42; S.champ = 0; }   // вверх — дерево распадается обратно к формации врачей
    });
  } else {
    // reduced-motion: формации переключаются спокойно по секциям, без скролл-эффектов
    const io = new IntersectionObserver((ens) => {
      ens.forEach((en) => {
        if (en.isIntersecting && FORMS[en.target.id]) {
          applyForm(en.target.id);
          if (en.target.id === 'cta') S.champ = 1;
        }
      });
    }, { threshold: 0.4 });
    $$('section[id]').forEach((s) => io.observe(s));
    steps.forEach((st) => { st.style.opacity = 1; st.style.visibility = 'visible'; });
    maniWords.forEach((w) => { w.style.opacity = 1; w.style.filter = 'none'; w.style.transform = 'none'; });
  }

  // ---------------- цвет фона как состояние (по секциям) ----------------
  function hexv(hex) {
    const n = parseInt(hex.slice(1), 16);
    return { r: ((n >> 16) & 255) / 255, g: ((n >> 8) & 255) / 255, b: (n & 255) / 255 };
  }
  const bgMap = [
    ['#hero', '#F6F3ED', '#EDE7DB'],
    ['#manifesto', '#F2EDE4', '#E7DFD0'],
    ['#advantages', '#F5F1E9', '#EAE2D2'],
    ['#services', '#F0EAE0', '#E2D8C6'],
    ['#process', '#EFE7D6', '#E0D3B8'],
    ['#doctors', '#EEF1F0', '#DDE6E4'],
    ['#cta', '#FAF7F1', '#F1E9DA'],
    ['#footer', '#F6F2EA', '#ECE3D2']
  ];
  bgMap.forEach(([sel, a, b]) => {
    ScrollTrigger.create({
      trigger: sel, start: 'top 60%', end: 'bottom 40%',
      onToggle: (self) => {
        if (self.isActive && window.SCENE) {
          gsap.to(window.SCENE.bgA, { ...hexv(a), duration: 1.4, overwrite: 'auto' });
          gsap.to(window.SCENE.bgB, { ...hexv(b), duration: 1.4, overwrite: 'auto' });
        }
      }
    });
  });

  // ---------------- прелоадер ----------------
  const pre = $('#preloader'), num = $('#preNum');
  const heroBits = ['#nav', '.hero-eyebrow', '.hero-sub', '.hero-cta-row', '.scroll-hint'];
  if (!reduced) {
    gsap.set(heroChars, { yPercent: 115 });
    gsap.set(heroBits, { autoAlpha: 0, y: 22 });
  }

  // Базовое раскрытие мира — идемпотентно. Снимает блокировку скролла
  // и обязательно показывает герой, даже если анимации не успели проиграть.
  let revealed = false;
  function unlockWorld() {
    if (pre) pre.style.display = 'none';
    document.body.classList.remove('lock');
    if (lenis) lenis.start();
    ScrollTrigger.refresh();
    S.loaded = true;
  }
  function forceShowHero() {
    gsap.set(heroChars, { yPercent: 0, clearProps: 'transform' });
    gsap.set(heroBits, { autoAlpha: 1, y: 0, clearProps: 'opacity,visibility,transform' });
  }
  function reveal() {
    if (revealed) return;
    revealed = true;
    clearTimeout(safety);
    num.textContent = '100';
    const tl = gsap.timeline({ onComplete: forceShowHero });
    tl.to('.pre-inner', { autoAlpha: 0, duration: 0.35 }, 0.12)
      .to('#preloader', { yPercent: -100, duration: 0.9, ease: 'power4.inOut' }, 0.28)
      .add(unlockWorld);
    if (!reduced) {
      tl.to(heroChars, { yPercent: 0, duration: 1.05, stagger: 0.032, ease: 'power4.out' }, 0.5)
        .to(heroBits, { autoAlpha: 1, y: 0, duration: 0.9, stagger: 0.08, ease: 'power3.out' }, 0.85);
    } else {
      forceShowHero();
    }
  }

  const po = { n: 0 };
  gsap.to(po, {
    n: 99, duration: 1.5, ease: 'power1.inOut',
    onUpdate: () => { num.textContent = String(Math.round(po.n)).padStart(2, '0'); }
  });
  const minTime = new Promise((r) => setTimeout(r, 1600));
  const fonts = document.fonts ? document.fonts.ready : Promise.resolve();
  // Жёсткая страховка: что бы ни случилось (зависшие шрифты, троттлинг rAF),
  // через 5.5с мир раскрывается и герой гарантированно виден.
  const safety = setTimeout(() => { unlockWorld(); forceShowHero(); revealed = true; }, 5500);
  Promise.all([minTime, fonts]).then(reveal).catch(reveal);
})();
