/* SEMPP · entornos de fondo (claro, escenario, paisaje) */
(function () {
  'use strict';
  var RM = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var body = document.body, secs = [].slice.call(document.querySelectorAll('[data-env]')).filter(function (n) { return n !== body; });
  var env = 'light', DPR = Math.min(window.devicePixelRatio || 1, 2);

  function pick() {
    var y = innerHeight * 0.5, e = 'light';
    for (var i = 0; i < secs.length; i++) {
      var r = secs[i].getBoundingClientRect();
      if (r.top <= y && r.bottom > y) { e = secs[i].getAttribute('data-env'); break; }
    }
    if (e !== env) { env = e; body.setAttribute('data-env', e); }
  }
  var pend = false;
  window.addEventListener('scroll', function () { if (!pend) { pend = true; requestAnimationFrame(function () { pend = false; pick(); }); } }, { passive: true });
  window.addEventListener('resize', function () { size(); pick(); });

  /* lienzos */
  var hz = document.getElementById('haze'), hx = hz && hz.getContext('2d');
  var ld = document.getElementById('land'), lx = ld && ld.getContext('2d');
  var W = 0, H = 0;
  function size() {
    W = innerWidth; H = innerHeight;
    [hz, ld].forEach(function (c) { if (c) { c.width = W * DPR; c.height = H * DPR; } });
    if (hx) hx.setTransform(DPR, 0, 0, DPR, 0, 0);
    if (lx) lx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  size();

  /* humo y polvo en los focos */
  var dust = [];
  for (var i = 0; i < 90; i++) dust.push({ x: Math.random(), y: Math.random(), r: .6 + Math.random() * 1.8, s: .02 + Math.random() * .06, p: Math.random() * 6.28 });
  var puffs = [];
  for (i = 0; i < 7; i++) puffs.push({ x: Math.random(), y: .55 + Math.random() * .4, r: .25 + Math.random() * .3, v: (Math.random() - .5) * .006, p: Math.random() * 6.28 });
  function drawStage(t) {
    hx.clearRect(0, 0, W, H);
    puffs.forEach(function (p) {
      p.x += p.v * .016; if (p.x < -.4) p.x = 1.4; if (p.x > 1.4) p.x = -.4;
      var x = p.x * W, y = (p.y + Math.sin(t / 4000 + p.p) * .02) * H, r = p.r * Math.max(W, H);
      var g = hx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, 'rgba(210,200,190,.07)'); g.addColorStop(1, 'rgba(210,200,190,0)');
      hx.fillStyle = g; hx.fillRect(x - r, y - r, r * 2, r * 2);
    });
    dust.forEach(function (d) {
      d.y -= d.s * .004; if (d.y < -.02) { d.y = 1.02; d.x = Math.random(); }
      var x = (d.x + Math.sin(t / 3000 + d.p) * .01) * W, y = d.y * H;
      var a = .18 + .5 * Math.abs(Math.sin(t / 1500 + d.p));
      hx.fillStyle = 'rgba(255,240,220,' + (a * .5).toFixed(3) + ')';
      hx.beginPath(); hx.arc(x, y, d.r, 0, 6.283); hx.fill();
    });
    /* pulso a 104 BPM, como el show simulado */
    var beat = (t / (60000 / 104)) % 1, down = Math.floor(t / (60000 / 104)) % 4 === 0;
    body.style.setProperty('--pulse', (.45 + (down ? .5 : .28) * Math.pow(1 - beat, 3)).toFixed(3));
  }

  /* paisaje: cielo, sol, nubes, colinas en capas y semillas flotando */
  var HILLS = [
    { c: '#D8F6F1', a: 34, f: 1.6, o: .60, sp: .004 },
    { c: '#BFEFE8', a: 42, f: 2.3, o: .68, sp: .007 },
    { c: '#A9ECEC', a: 50, f: 1.2, o: .76, sp: .011 },
    { c: '#8FE3DA', a: 46, f: 2.8, o: .85, sp: .016 },
    { c: '#77D8CD', a: 38, f: 1.9, o: .93, sp: .022 }];
  var seeds = [];
  for (i = 0; i < 26; i++) seeds.push({ x: Math.random(), y: Math.random(), s: .3 + Math.random() * .9, r: 2 + Math.random() * 4, p: Math.random() * 6.28, c: ['#FF6666', '#FFE08A', '#FBFAF6', '#40E0D0', '#F7B8C6'][i % 5] });
  var clouds = [{ x: .1, y: .16, w: 220 }, { x: .55, y: .1, w: 300 }, { x: .82, y: .22, w: 180 }];
  var lp = document.getElementById('precios');
  function drawLand(t) {
    var sc = lp ? -lp.getBoundingClientRect().top : 0;
    lx.clearRect(0, 0, W, H);
    var sx = W * .72, sy = H * (.3 + Math.min(.12, Math.max(-.05, sc / 9000)));
    var g = lx.createRadialGradient(sx, sy, 0, sx, sy, H * .45);
    g.addColorStop(0, 'rgba(255,224,138,.95)'); g.addColorStop(.14, 'rgba(255,190,140,.75)'); g.addColorStop(.15, 'rgba(255,200,150,.45)'); g.addColorStop(1, 'rgba(255,200,150,0)');
    lx.fillStyle = g; lx.fillRect(0, 0, W, H);
    lx.fillStyle = '#FF8A7A'; lx.beginPath(); lx.arc(sx, sy, Math.min(W, H) * .07, 0, 6.283); lx.fill();
    clouds.forEach(function (c, k) {
      var x = ((c.x + t * .0000045 * (k + 1)) % 1.3 - .15) * W, y = c.y * H;
      lx.fillStyle = 'rgba(255,255,255,.75)';
      [[0, 0, .22], [.18, -.08, .26], [.38, 0, .2], [.2, .04, .24]].forEach(function (b) { lx.beginPath(); lx.ellipse(x + b[0] * c.w, y + b[1] * c.w, b[2] * c.w, b[2] * c.w * .55, 0, 0, 6.283); lx.fill(); });
    });
    HILLS.forEach(function (h, k) {
      var base = H * h.o, off = t * h.sp * .06 + sc * (k + 1) * .05;
      lx.fillStyle = h.c; lx.beginPath(); lx.moveTo(0, H);
      for (var x = 0; x <= W + 20; x += 20) {
        var y = base - Math.sin((x + off) / W * h.f * 6.283) * h.a - Math.sin((x * 1.7 + off * 1.3) / W * 6.283) * h.a * .35;
        lx.lineTo(x, y);
      }
      lx.lineTo(W, H); lx.closePath(); lx.fill();
      lx.strokeStyle = 'rgba(63,63,63,.18)'; lx.lineWidth = 2; lx.stroke();
    });
    seeds.forEach(function (s) {
      s.y -= s.s * .0009; if (s.y < -.05) { s.y = 1.05; s.x = Math.random(); }
      var x = (s.x + Math.sin(t / 2600 + s.p) * .03) * W, y = s.y * H;
      lx.fillStyle = s.c; lx.strokeStyle = 'rgba(63,63,63,.55)'; lx.lineWidth = 1.5;
      lx.beginPath(); lx.arc(x, y, s.r, 0, 6.283); lx.fill(); lx.stroke();
    });
  }

  function loop(t) {
    if (!RM) {
      if (env === 'stage' && hx) drawStage(t);
      if (env === 'land' && lx) drawLand(t);
    }
    requestAnimationFrame(loop);
  }
  pick();
  if (RM) { if (lx) drawLand(0); }
  requestAnimationFrame(loop);
})();
