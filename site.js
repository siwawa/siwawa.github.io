// 잠금 설정: Cloudflare 설정을 마친 뒤 이 두 값만 채우세요
var GATE = { worker: 'https://YOUR-WORKER.workers.dev', sitekey: 'YOUR-SITE-KEY' };

// 문지기와 통신하는 부분: Turnstile로 확인하고 30분짜리 통행증을 받아요
(function () {
  var pending = null;
  function loadTurnstile() {
    return new Promise(function (res, rej) {
      if (window.turnstile) return res();
      var s = document.createElement('script');
      s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      s.async = true; s.onload = function () { res(); }; s.onerror = rej;
      document.head.appendChild(s);
    });
  }
  window.gateSession = function (box) {
    try {
      var c = JSON.parse(sessionStorage.getItem('gate') || 'null');
      if (c && c.exp > Date.now() + 60000) return Promise.resolve(c.session);
    } catch (e) {}
    if (pending) return pending;
    pending = loadTurnstile().then(function () {
      return new Promise(function (res, rej) {
        var holder = document.createElement('div');
        (box || document.body).appendChild(holder);
        window.turnstile.render(holder, {
          sitekey: GATE.sitekey,
          callback: function (token) {
            fetch(GATE.worker + '/session', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: token }) })
              .then(function (r) { return r.ok ? r.json() : Promise.reject(new Error('denied')); })
              .then(function (d) { try { sessionStorage.setItem('gate', JSON.stringify(d)); } catch (e) {} holder.remove(); res(d.session); })
              .catch(rej);
          },
          'error-callback': function () { rej(new Error('turnstile')); }
        });
      });
    });
    pending.catch(function () { pending = null; });
    return pending;
  };
  window.gateURL = function (path, s) { return GATE.worker + '/file/' + path + '?s=' + encodeURIComponent(s); };
})();

// About me 사진: 사람이 처음 움직이면 확인을 거쳐 불러와요
(function () {
  var img = document.getElementById('photo');
  if (!img) return;
  var events = ['pointermove', 'touchstart', 'scroll', 'keydown'], started = false;
  function load() {
    if (started) return; started = true;
    events.forEach(function (e) { window.removeEventListener(e, load); });
    window.gateSession().then(function (s) { img.src = window.gateURL('photos/profile.jpg', s); })
      .catch(function () { img.parentNode.style.display = 'none'; });
  }
  img.addEventListener('load', function () { img.parentNode.classList.add('loaded'); });
  img.addEventListener('error', function () { img.parentNode.style.display = 'none'; });
  events.forEach(function (e) { window.addEventListener(e, load, { passive: true }); });
})();

// 사진 갤러리: 버튼으로 한 장씩 넘기고, 몇 번째인지 표시해요
(function () {
  var smooth = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
  document.querySelectorAll('.gallery').forEach(function (g) {
    var track = g.querySelector('.gal-track');
    var prev = g.querySelector('.prev');
    var next = g.querySelector('.next');
    var count = g.querySelector('.gal-count');
    var n = track.children.length;
    function update() {
      var w = track.clientWidth;
      if (!w) return;
      var i = Math.round(track.scrollLeft / w);
      prev.disabled = i <= 0;
      next.disabled = i >= n - 1;
      if (count) count.textContent = (i + 1) + ' / ' + n;
    }
    prev.addEventListener('click', function () { track.scrollBy({ left: -track.clientWidth, behavior: smooth }); });
    next.addEventListener('click', function () { track.scrollBy({ left: track.clientWidth, behavior: smooth }); });
    track.addEventListener('scroll', function () { window.requestAnimationFrame(update); }, { passive: true });
    window.addEventListener('resize', update);
    g.update = update;
    update();
  });
})();

// 도마뱀을 누르면 확인을 거쳐 사진을 불러와요
(function () {
  var btn = document.querySelector('.lizard');
  var box = document.querySelector('.photos');
  if (!btn || !box) return;
  btn.addEventListener('click', function () {
    var hint = document.querySelector('.lock-hint');
    if (hint) hint.textContent = 'One moment…';
    window.gateSession(btn.parentNode).then(function (s) {
      box.querySelectorAll('img[data-photo]').forEach(function (img) {
        if (!img.getAttribute('src')) img.src = window.gateURL('photos/' + img.getAttribute('data-photo'), s);
      });
      box.hidden = false;
      if (hint) hint.textContent = 'Here you go.';
      document.querySelectorAll('.gallery').forEach(function (g) { if (g.update) g.update(); });
    }).catch(function () { if (hint) hint.textContent = 'Couldn’t load the photos. Please try again.'; });
  });
})();

// Research Interests 본문과 그림: 페이지가 열리면 확인을 거쳐 불러와요
(function () {
  var el = document.getElementById('research-body');
  if (!el) return;
  var note = el.querySelector('.gate-note'), box = el.querySelector('.gate-box');
  window.gateSession(box).then(function (s) {
    return fetch(window.gateURL(el.getAttribute('data-gate'), s))
      .then(function (r) { if (!r.ok) throw new Error('load'); return r.text(); })
      .then(function (html) {
        el.innerHTML = html;
        el.querySelectorAll('img[data-gate]').forEach(function (img) { img.src = window.gateURL(img.getAttribute('data-gate'), s); });
      });
  }).catch(function () {
    if (note) note.textContent = 'Couldn’t load my research questions. Please refresh, or email me at siwawa [at] snu [dot] ac [dot] kr.';
  });
})();

// 페이지 맨 아래 도마뱀: 구석의 점박이 돌, 벌레 사냥, 밤에는 돌 옆에서 잠
(function () {
  var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var cols = ['#7d9a6a', '#b98a55', '#7f97b5', '#c4a24f', '#a4796f'];
  var hr = new Date().getHours();
  var nightNow = hr >= 20 || hr < 6;
  window.__lizards = [];
  document.querySelectorAll('canvas.lizards').forEach(function (cv) {
    var ctx = cv.getContext('2d'), W = 0, H = 0, R = [], L = null, B = [], Z = [];
    var px = -999, py = -999, prev = performance.now(), night = nightNow, bugT = 1.5;
    function seeded(s) { return function () { s = (s * 9301 + 49297) % 233280; return s / 233280; }; }
    function makeRocks() {
      R = [{ x: W - 72, y: H - 34, rx: 38, ry: 22 }, { x: W - 132, y: H - 22, rx: 26, ry: 15 }, { x: W - 36, y: H - 80, rx: 22, ry: 14 }];
      R.forEach(function (r, i) {
        var g = seeded(17 + i * 31), n = 11, tilt = (g() - 0.5) * 0.5;
        r.pts = [];
        for (var j = 0; j < n; j++) {
          var q = j / n * 6.283 + (g() - 0.5) * 0.35, f = 0.8 + g() * 0.32;
          var x0 = Math.cos(q) * r.rx * f, y0 = Math.sin(q) * r.ry * f;
          r.pts.push({ x: x0 * Math.cos(tilt) - y0 * Math.sin(tilt), y: x0 * Math.sin(tilt) + y0 * Math.cos(tilt) });
        }
        r.sp = [];
        for (var k = 0; k < 16; k++) {
          var a = g() * 6.28, d = Math.sqrt(g()) * 0.68;
          r.sp.push({ x: Math.cos(a) * r.rx * d, y: Math.sin(a) * r.ry * d, s: 0.7 + g() * 1.5, c: g() < 0.6 ? '#a39a88' : '#4a443c' });
        }
      });
    }
    function pick() { return R[Math.floor(Math.random() * R.length)]; }
    function spot(r) { var q = Math.random() * 6.28; return { x: r.x + Math.cos(q) * r.rx * 0.35, y: r.y + Math.sin(q) * r.ry * 0.35 }; }
    function edge(r) { var q = Math.PI * (0.6 + Math.random() * 0.9); return { x: r.x + Math.cos(q) * (r.rx + 9), y: r.y + Math.sin(q) * (r.ry + 7) }; }
    function onRock(x, y) { return R.some(function (r) { var a = (x - r.x) / r.rx, b = (y - r.y) / r.ry; return a * a + b * b < 1.4; }); }
    function setMode(n) {
      night = n; if (!L) return;
      if (n) B = [];
      L.forEach(function (l) { l.tg = n ? edge(pick()) : null; l.st = n ? 'go' : 'rest'; l.t = Math.random(); l.prey = null; });
    }
    window.__lizards.push(setMode);
    function fit() {
      var w = cv.clientWidth, h = cv.clientHeight;
      if (!w || !h) return false;
      if (w !== W || h !== H) {
        var d = window.devicePixelRatio || 1;
        W = w; H = h; cv.width = w * d; cv.height = h * d; ctx.setTransform(d, 0, 0, d, 0, 0);
        makeRocks();
        if (!L) {
          L = cols.map(function (c) { return { x: 20 + Math.random() * (W * 0.6), y: 15 + Math.random() * (H - 30), a: Math.random() * 6.28, v: 0, t: Math.random() * 2, st: 'rest', ph: 0, c: c, tg: null, curl: 0, zt: Math.random() * 3, chew: 0, prey: null }; });
          setMode(night);
        }
      }
      return true;
    }
    function pos(e) { var b = cv.getBoundingClientRect(); px = e.clientX - b.left; py = e.clientY - b.top; }
    cv.addEventListener('pointermove', pos);
    cv.addEventListener('pointerdown', pos);
    cv.addEventListener('pointerleave', function () { px = py = -999; });
    function steer(l, x, y, k) { var ta = Math.atan2(y - l.y, x - l.x); l.a += Math.atan2(Math.sin(ta - l.a), Math.cos(ta - l.a)) * k; }
    function spawnBug() {
      if (night || B.length >= 3) return;
      var best = null, bestD = -1;
      for (var k = 0; k < 14; k++) {
        var x = 16 + Math.random() * (W * 0.72), y = 12 + Math.random() * (H - 24);
        if (onRock(x, y)) continue;
        var dmin = Infinity;
        L.forEach(function (l) { dmin = Math.min(dmin, Math.hypot(l.x - x, l.y - y)); });
        if (dmin > bestD) { bestD = dmin; best = { x: x, y: y }; }
      }
      if (best) B.push({ x: best.x, y: best.y, a: Math.random() * 6.28, life: 11 + Math.random() * 6, f: 0 });
    }
    function separate() {
      var minD = 22;
      for (var i = 0; i < L.length; i++) for (var j = i + 1; j < L.length; j++) {
        var a = L[i], b = L[j], dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy);
        if (d < minD) {
          if (d < 0.01) { dx = Math.random() - 0.5; dy = Math.random() - 0.5; d = Math.hypot(dx, dy); }
          var push = (minD - d) / 2, ux = dx / d, uy = dy / d;
          var fa = a.st === 'sleep' ? 0.3 : 1, fb = b.st === 'sleep' ? 0.3 : 1;
          a.x -= ux * push * fa; a.y -= uy * push * fa; b.x += ux * push * fb; b.y += uy * push * fb;
        }
      }
    }
    function updBug(b, dt) {
      b.a += (Math.random() - 0.5) * 7 * dt;
      b.x += Math.cos(b.a) * 20 * dt; b.y += Math.sin(b.a) * 20 * dt;
      if (b.x < 8 || b.x > W - 8 || b.y < 8 || b.y > H - 8) b.a += Math.PI;
      b.x = Math.max(6, Math.min(W - 6, b.x)); b.y = Math.max(6, Math.min(H - 6, b.y));
      b.life -= dt; b.f += dt * 45;
    }
    function upd(l, dt) {
      var near = Math.hypot(l.x - px, l.y - py) < 55;
      if (near && l.st !== 'sleep') { l.a = Math.atan2(l.y - py, l.x - px) + (Math.random() - 0.5) * 0.6; l.st = 'run'; l.v = 170; l.t = 0.35 + Math.random() * 0.3; l.prey = null; if (!night) l.tg = null; }
      if (near && l.st === 'sleep') l.curl = 0.6;
      if (!night && (l.st === 'rest' || l.st === 'bask') && B.length && !L.some(function (o) { return o.st === 'hunt'; })) {
        var best = null, bd = 320;
        B.forEach(function (b) { var dd = Math.hypot(b.x - l.x, b.y - l.y); if (dd < bd) { bd = dd; best = b; } });
        if (best && Math.random() < dt * 1.6) { l.prey = best; l.st = 'hunt'; }
      }
      if (l.st === 'hunt') {
        if (B.indexOf(l.prey) < 0) { l.st = 'rest'; l.v = 0; l.t = 0.5; l.prey = null; }
        else {
          steer(l, l.prey.x, l.prey.y, 0.35); l.v = 125;
          if (Math.hypot(l.prey.x - l.x - Math.cos(l.a) * 9, l.prey.y - l.y - Math.sin(l.a) * 9) < 7) {
            B.splice(B.indexOf(l.prey), 1); l.prey = null; l.st = 'rest'; l.v = 0; l.t = 1.2 + Math.random(); l.chew = 0.8;
          }
        }
      } else if (l.st === 'go' && l.tg) {
        steer(l, l.tg.x, l.tg.y, 0.25); l.v = 90;
        if (Math.hypot(l.tg.x - l.x, l.tg.y - l.y) < 5) {
          if (night) { l.st = 'sleep'; l.v = 0; } else { l.st = 'bask'; l.v = 0; l.t = 2.5 + Math.random() * 4; }
          l.tg = null;
        }
      } else {
        l.t -= dt;
        if (l.t <= 0) {
          if (night) { if (l.st !== 'sleep') { l.tg = edge(pick()); l.st = 'go'; } }
          else if (l.st === 'run') { l.st = 'rest'; l.v = 0; l.t = 0.6 + Math.random() * 2; }
          else if (Math.random() < 0.4) { l.tg = spot(pick()); l.st = 'go'; }
          else { l.st = 'run'; l.a += (Math.random() - 0.5) * 2; l.v = 80 + Math.random() * 90; l.t = 0.2 + Math.random() * 0.45; }
        }
      }
      var m = 14;
      if (l.st === 'run' && (l.x < m || l.x > W - m || l.y < m || l.y > H - m)) steer(l, W / 2, H / 2, 0.3);
      if (l.v > 0) { l.x += Math.cos(l.a) * l.v * dt; l.y += Math.sin(l.a) * l.v * dt; l.ph += dt * l.v * 0.18; }
      l.x = Math.max(4, Math.min(W - 4, l.x)); l.y = Math.max(4, Math.min(H - 4, l.y));
      l.curl += ((l.st === 'sleep' ? 1 : 0) - l.curl) * Math.min(1, dt * 3);
      if (l.chew > 0) l.chew -= dt;
      if (l.st === 'sleep') { l.zt -= dt; if (l.zt <= 0) { Z.push({ x: l.x + 4, y: l.y - 6, life: 1.6 }); l.zt = 2 + Math.random() * 3; } }
    }
    function rock(r) {
      var P = r.pts, n = P.length;
      ctx.fillStyle = '#6f675b'; ctx.strokeStyle = '#575046'; ctx.lineWidth = 1;
      ctx.beginPath();
      var m0 = { x: (P[n - 1].x + P[0].x) / 2, y: (P[n - 1].y + P[0].y) / 2 };
      ctx.moveTo(r.x + m0.x, r.y + m0.y);
      for (var i = 0; i < n; i++) {
        var a = P[i], b = P[(i + 1) % n];
        ctx.quadraticCurveTo(r.x + a.x, r.y + a.y, r.x + (a.x + b.x) / 2, r.y + (a.y + b.y) / 2);
      }
      ctx.closePath(); ctx.fill(); ctx.stroke();
      r.sp.forEach(function (s) { ctx.fillStyle = s.c; ctx.beginPath(); ctx.arc(r.x + s.x, r.y + s.y, s.s, 0, 6.29); ctx.fill(); });
    }
    function bug(b) {
      var w = Math.sin(b.f) * 2.4;
      ctx.strokeStyle = 'rgba(150,144,132,0.85)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(b.x - 2.6, b.y - 2 - w); ctx.moveTo(b.x, b.y); ctx.lineTo(b.x + 2.6, b.y - 2 - w); ctx.stroke();
      ctx.fillStyle = '#3d3a35'; ctx.beginPath(); ctx.arc(b.x, b.y, 1.7, 0, 6.29); ctx.fill();
    }
    function draw(l) {
      ctx.save(); ctx.translate(l.x, l.y); ctx.rotate(l.a);
      ctx.strokeStyle = l.c; ctx.fillStyle = l.c; ctx.lineCap = 'round';
      var mv = l.v > 0, s = Math.sin(l.ph), w = mv ? s * 0.35 : 0, k = mv ? s * 3 : 0, c = l.curl;
      ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-6, 0);
      ctx.quadraticCurveTo(-13, w * 10 * (1 - c) + 9 * c, -20 * (1 - c) - 4 * c, -w * 6 * (1 - c) + 11 * c); ctx.stroke();
      ctx.lineWidth = 1.6; var lg = 6 - 3 * c;
      [[3, 1], [-4, -1]].forEach(function (p) {
        ctx.beginPath(); ctx.moveTo(p[0], 0); ctx.lineTo(p[0] + 2 + k * p[1], -lg);
        ctx.moveTo(p[0], 0); ctx.lineTo(p[0] + 2 - k * p[1], lg); ctx.stroke();
      });
      ctx.beginPath(); ctx.ellipse(-1, 0, 7, 3, 0, 0, 6.29); ctx.fill();
      var hx = 8 + (l.chew > 0 ? Math.sin(l.chew * 26) * 1.3 : 0);
      ctx.beginPath(); ctx.ellipse(hx, 0, 3.4, 2.6, 0, 0, 6.29); ctx.fill();
      ctx.restore();
    }
    function loop(t) {
      var dt = Math.min(0.05, (t - prev) / 1000); prev = t;
      if (fit()) {
        if (!still) {
          bugT -= dt; if (bugT <= 0) { spawnBug(); bugT = 2.5 + Math.random() * 3.5; }
          B.forEach(function (b) { updBug(b, dt); }); B = B.filter(function (b) { return b.life > 0; });
        }
        ctx.clearRect(0, 0, W, H);
        R.forEach(rock); B.forEach(bug);
        if (!still) { L.forEach(function (l) { upd(l, dt); }); separate(); }
        L.forEach(draw);
        ctx.font = '11px sans-serif';
        Z = Z.filter(function (z) { return (z.life -= dt) > 0; });
        Z.forEach(function (z) { z.y -= dt * 12; z.x += dt * 4; ctx.fillStyle = 'rgba(140,132,118,' + Math.min(1, z.life) + ')'; ctx.fillText('z', z.x, z.y); });
      }
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  });
})();
