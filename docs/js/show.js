/* SEMPP · web de producto · escenas al hacer scroll y show simulado */
(function () {
  'use strict';
  var RM = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var EN = document.documentElement.lang === 'en';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.max(a === undefined ? 0 : a, Math.min(b === undefined ? 1 : b, v)); };
  var ease = function (t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  var eout = function (t) { return 1 - Math.pow(1 - t, 3); };
  var mmss = function (s) { s = Math.max(0, Math.ceil(s)); return Math.floor(s / 60) + ':' + ('0' + s % 60).slice(-2); };
  var T = EN ? {
    song: 'Song', of: '/', later: 'next', parts: ['Intro', 'Verse', 'Pre-chorus', 'Chorus', 'Verse 2', 'Chorus 2', 'Bridge', 'Outro'],
    songs: ['Intro', 'Neon lights', 'Sleeping city', 'It all starts again', 'Undertow', 'Goodbye'],
    lines: ['Lights come on at midnight', 'and the city starts to sing', 'one more song before we go', 'hold on to this moment', 'we are dancing in the dark', 'never looking back again', 'it all starts again', 'one more time tonight'],
    ends: 'ends at ', bars: ['in 3 beats', 'in 2 beats', 'in 1 beat', 'Now'], youare: 'SECTION',
    key: 'Key', scales: ['Major', 'Minor', 'Chromatic', 'Dorian', 'Mixolydian'], on: 'ACTIVE', off: 'BYPASS',
    modes: { free: 'Follow', chain: 'Chain', stop: 'Stop' }, day: 'Friday'
  } : {
    song: 'Canción', of: '/', later: 'luego', parts: ['Intro', 'Estrofa', 'Pre', 'Estribillo', 'Estrofa 2', 'Estribillo 2', 'Puente', 'Final'],
    songs: ['Intro', 'Luces de neón', 'Ciudad dormida', 'Todo vuelve a empezar', 'Mar de fondo', 'Despedida'],
    lines: ['Se encienden las luces', 'y la ciudad empieza a cantar', 'una canción más antes de irnos', 'agárrate a este momento', 'bailamos a oscuras', 'sin mirar atrás', 'todo vuelve a empezar', 'una vez más esta noche'],
    ends: 'acaba a las ', bars: ['entrada en 3 tiempos', 'entrada en 2 tiempos', 'entrada en 1 tiempo', 'Entrada'], youare: 'SECCIÓN',
    key: 'Tonalidad', scales: ['Mayor', 'Menor', 'Cromática', 'Dórica', 'Mixolidia'], on: 'ACTIVO', off: 'BYPASS',
    modes: { free: 'Seguir', chain: 'Encadenar', stop: 'Parar' }, day: 'viernes'
  };
  var PCOL = ['#C9F2A0', '#A9ECEC', '#FFE08A', '#F7B8C6', '#D9CCFA', '#FFD3B0', '#B8E8FF', '#FFC9C9'];

  /* ---------------- ventanas del plugin simuladas ---------------- */
  var tpl = $('#tpl-app'), apps = [];
  $$('[data-app]').forEach(function (box) {
    box.appendChild(tpl.content.cloneNode(true));
    var a = { box: box, el: $('.app', box), k: {} };
    $$('[data-k]', box).forEach(function (n) { a.k[n.getAttribute('data-k')] = n; });
    a.k.parts.innerHTML = T.parts.map(function (p, i) { return '<div class="pt" style="--c:' + PCOL[i] + '">' + p + '</div>'; }).join('');
    a.pts = $$('.pt', a.k.parts);
    a.beats = $$('i', a.k.beats);
    a.k.num.textContent = a.k.num2.textContent = T.song + ' 3 ' + T.of + ' 6';
    a.k.song.textContent = a.k.song2.textContent = T.songs[2];
    a.k.next.textContent = a.k.ns.textContent = T.songs[3];
    a.k.clock.nextElementSibling.textContent = T.day;
    apps.push(a);
  });
  function fit() {
    apps.forEach(function (a) { a.el.style.setProperty('--s', a.box.clientWidth / 1100); });
  }
  fit(); window.addEventListener('resize', fit);
  if (window.ResizeObserver) { var ro = new ResizeObserver(fit); apps.forEach(function (a) { ro.observe(a.box); }); }

  /* motor del show: 104 BPM, partes por compases */
  var BPM = 104, BEAT = 60 / BPM, PB = [4, 8, 4, 8, 8, 8, 4, 8], TOTB = PB.reduce(function (a, b) { return a + b; }, 0);
  var SONGLEN = TOTB * 4 * BEAT, SHOWREST = 14 * 60 + 33, t0 = performance.now(), lastBeat = -1, lastLine = -1;
  var now0 = new Date(); now0.setHours(22, 29, 0, 0);
  function partAt(bar) { var b = 0; for (var i = 0; i < PB.length; i++) { if (bar < b + PB[i]) return { i: i, s: b, len: PB[i] }; b += PB[i]; } return { i: PB.length - 1, s: b - 8, len: 8 }; }
  function hhmm(d) { return ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2); }
  function tickShow(ms) {
    var el = ((ms - t0) / 1000 + 9 * 4 * BEAT) % SONGLEN;
    var beatsF = el / BEAT, beat = Math.floor(beatsF), bar = Math.floor(beat / 4), bib = beat % 4;
    var left = SONGLEN - el, p = partAt(bar), np = (p.i + 1) % PB.length;
    var barsToNext = p.s + p.len - bar, li = Math.floor(bar / 2) % T.lines.length;
    var clock = new Date(now0.getTime() + el * 1000), ends = new Date(clock.getTime() + (left + SHOWREST) * 1000);
    for (var k = 0; k < apps.length; k++) {
      var a = apps[k];
      if (!a.vis) continue;
      a.k.bb.textContent = (bar + 1) + '.' + (bib + 1);
      if (beat !== a.lb) {
        a.lb = beat;
        a.beats.forEach(function (d, j) { d.classList.toggle('on', j === bib); });
        a.k.left.textContent = a.k.left2.textContent = mmss(left);
        a.k.show.textContent = mmss(left + SHOWREST);
        a.k.ends.textContent = T.ends + hhmm(ends);
        a.k.clock.textContent = hhmm(clock);
        a.k.bar.style.setProperty('--w', (el / SONGLEN * 100) + '%');
        a.k.pn.textContent = (p.i + 1) + ' / ' + PB.length;
        a.k.np.textContent = T.parts[np]; a.k.nb.textContent = barsToNext;
        a.pts.forEach(function (n, j) { n.className = 'pt' + (j < p.i ? ' done' : j === p.i ? ' on' : j === np ? ' nx' : ''); });
        a.k.lnext.textContent = T.lines[(li + 1) % T.lines.length];
      }
      a.pts[p.i].style.setProperty('--pp', ((beatsF / 4 - p.s) / p.len * 100) + '%');
      if (li !== a.ll) {
        a.ll = li;
        (function (n, txt) { n.classList.add('out'); setTimeout(function () { n.textContent = txt; n.classList.remove('out'); }, 220); })(a.k.line, T.lines[li]);
      }
    }
  }

  /* ---------------- escenas por scroll ---------------- */
  var scenes = $$('[data-scene]').map(function (el) { return { el: el, name: el.getAttribute('data-scene'), p: -1 }; });
  var H = {};
  function progress(el) {
    var r = el.getBoundingClientRect(), tot = el.offsetHeight - innerHeight;
    return tot > 0 ? clamp(-r.top / tot) : (r.top < innerHeight ? 1 : 0);
  }

  /* hero: la ventana se endereza */
  H.hero = function (p, el) { el.style.setProperty('--p', p); el.style.setProperty('--e', eout(clamp(p * 1.7))); };

  /* 01 Auto-Tune */
  var KEYS = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
  var SCL = [[0, 2, 4, 5, 7, 9, 11], [0, 2, 3, 5, 7, 8, 10], [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]];
  var CK = [
    { s: .05, e: .27, key: 10, sc: 1, c: '#F7B8C6' },
    { s: .33, e: .58, key: 0, sc: 0, c: '#FFE08A' },
    { s: .64, e: .97, key: 6, sc: 2, c: '#A9ECEC' }];
  var CT = [
    { s: .14, e: .3, rt: 10, c: '#D9CCFA', t: 'Retune 10' },
    { s: .44, e: .6, rt: 45, c: '#D9CCFA', t: 'Retune 45' },
    { s: .68, e: .8, byp: true, c: '#FF9C9C', t: 'PC 1 · Bypass' },
    { s: .86, e: .97, byp: false, c: '#C9F2A0', t: 'PC 0 · On' }];
  var tune = { el: $('#s-tune') };
  if (tune.el) {
    var lk = $('#ln-key'), lt = $('#ln-tune');
    CK.forEach(function (c) { var d = document.createElement('div'); d.className = 'clip'; d.style.cssText = 'left:' + c.s * 100 + '%;width:' + (c.e - c.s) * 100 + '%;background:' + c.c; d.textContent = 'Key ' + KEYS[c.key] + ' · ' + T.scales[c.sc]; lk.appendChild(d); c.d = d; });
    CT.forEach(function (c) { var d = document.createElement('div'); d.className = 'clip'; d.style.cssText = 'left:' + c.s * 100 + '%;width:' + (c.e - c.s) * 100 + '%;background:' + c.c; d.textContent = c.t; lt.appendChild(d); c.d = d; });
    var pn = $('#piano'), html = '', wi = 0, BL = { 1: 1, 3: 1, 6: 1, 8: 1, 10: 1 };
    for (var i = 0; i < 12; i++) if (!BL[i]) html += '<div class="wk" data-n="' + i + '">' + KEYS[i] + '</div>';
    pn.innerHTML = html;
    [1, 3, 6, 8, 10].forEach(function (n) { var pos = { 1: 1, 3: 2, 6: 4, 8: 5, 10: 6 }[n]; var b = document.createElement('div'); b.className = 'bk'; b.setAttribute('data-n', n); b.style.left = 'calc(' + (pos / 7 * 100) + '% - 4.25%)'; pn.appendChild(b); });
    $('#chips').innerHTML = T.scales.map(function (s, i) { return '<span data-s="' + i + '">' + s + '</span>'; }).join('');
    tune.keys = $$('[data-n]', pn); tune.chips = $$('#chips span'); tune.steps = $$('.steptxt>div', tune.el); tune.prog = $$('.prog i', tune.el);
    tune.flow = $('#flow'); tune.polo = $('#polo'); tune.st = $('#atst'); tune.kr = $('#keyread'); tune.dial = $('#dial'); tune.rtv = $('#rtv');
    tune.state = '';
  }
  function setTune(key, sc, rt, byp) {
    tune.keys.forEach(function (k) { var n = +k.getAttribute('data-n'); k.classList.toggle('on', n === key); k.classList.toggle('sc', SCL[Math.min(sc, 2)].indexOf((n - key + 12) % 12) >= 0); });
    tune.chips.forEach(function (c, i) { c.classList.toggle('on', i === sc); });
    tune.kr.innerHTML = T.key + ' <em>' + KEYS[key] + '</em> · ' + T.scales[sc];
    tune.dial.style.setProperty('--k', rt / 100); tune.rtv.textContent = rt;
    tune.polo.classList.toggle('off', byp); tune.st.textContent = byp ? T.off : T.on;
  }
  H.tune = function (p, el) {
    var ph = clamp(p * 1.04 - .02);
    el.style.setProperty('--ph', ph);
    var step = Math.min(4, Math.floor(p * 5));
    tune.steps.forEach(function (s, i) { s.classList.toggle('on', i === step); });
    tune.prog.forEach(function (s, i) { s.classList.toggle('on', i <= step); });
    var key = 9, sc = 1, rt = 25, byp = false, sig = '';
    CK.forEach(function (c, i) { c.d.classList.toggle('on', ph >= c.s && ph <= c.e); if (ph >= c.s) { key = c.key; sc = c.sc; sig += 'k' + i; } });
    CT.forEach(function (c, i) { c.d.classList.toggle('on', ph >= c.s && ph <= c.e); if (ph >= c.s) { if (c.rt !== undefined) rt = c.rt; if (c.byp !== undefined) byp = c.byp; sig += 't' + i; } });
    if (sig !== tune.state) {
      var first = tune.state === '' && sig === '';
      tune.state = sig; setTune(key, sc, rt, byp);
      if (!first) {
        tune.flow.classList.remove('fire'); void tune.flow.offsetWidth; tune.flow.classList.add('fire');
        tune.polo.classList.remove('bump'); void tune.polo.offsetWidth; tune.polo.classList.add('bump');
        var nodes = $$('.node', tune.flow);
        nodes.forEach(function (n, i) { setTimeout(function () { n.classList.add('hot'); setTimeout(function () { n.classList.remove('hot'); }, 260); }, i * 210); });
      }
    }
  };
  if (tune.el) setTune(9, 1, 25, false);

  /* 02 despiece */
  var xp = { el: $('#s-xp') };
  if (xp.el) { xp.ly = $$('.ly', xp.el); xp.li = $$('.xlist li', xp.el); }
  H.xp = function (p, el) {
    el.style.setProperty('--x', ease(clamp((p - .04) / .4)));
    var a = p < .32 ? -1 : Math.min(4, Math.floor((p - .32) / .6 * 5));
    xp.li.forEach(function (li, i) {
      li.classList.toggle('on', i <= a);
      var L = xp.ly[+li.getAttribute('data-l')]; if (L) L.classList.toggle('hl', i === a);
    });
  };

  /* 03 setlist */
  var SD = [90, 221, 245, 198, 263, 184], set = { el: $('#s-set') };
  if (set.el) {
    var sl = $('#slist');
    sl.innerHTML = T.songs.map(function (n, i) {
      return '<div class="srow" data-i="' + i + '"><span class="grip">⋮⋮</span><span class="num">' + (i + 1) + '</span><span class="nm">' + n + '</span><span class="hr"></span><span class="du">' + mmss(SD[i]) + '</span><span class="md">' + T.modes.free + '</span><span class="eye">👁</span></div>';
    }).join('');
    set.rows = $$('.srow', sl); set.steps = $$('.steptxt>div', set.el); set.modes = $$('.mode', set.el); set.k = -1;
  }
  function renderSet(step, sub) {
    var order = step >= 1 ? [0, 1, 3, 2, 4, 5] : [0, 1, 2, 3, 4, 5];
    var hidden = step >= 2 ? 4 : -1;
    var modes = ['free', 'free', 'free', 'free', 'free', 'free'];
    if (step >= 3) { if (sub > .15) modes[1] = 'chain'; if (sub > .45) modes[3] = 'stop'; }
    var t = 22 * 3600 + 30 * 60, tot = 0;
    order.forEach(function (idx, pos) {
      var r = set.rows[idx];
      r.style.top = (pos * 58) + 'px';
      $('.num', r).textContent = pos + 1;
      r.classList.toggle('off', idx === hidden);
      r.classList.toggle('drag', step === 1 && idx === 3 && sub < .55);
      r.classList.toggle('now', pos === 0);
      var md = $('.md', r); md.textContent = T.modes[modes[idx]]; md.className = 'md ' + modes[idx];
      $('.eye', r).textContent = idx === hidden ? '◌' : '👁';
      $('.hr', r).textContent = ('0' + Math.floor(t / 3600) % 24).slice(-2) + ':' + ('0' + Math.floor(t / 60) % 60).slice(-2);
      if (idx !== hidden) { t += SD[idx]; tot += SD[idx]; }
    });
    $('#sl-tot').textContent = mmss(tot);
    $('#sl-end').textContent = ('0' + Math.floor(t / 3600) % 24).slice(-2) + ':' + ('0' + Math.floor(t / 60) % 60).slice(-2);
    set.steps.forEach(function (s, i) { s.classList.toggle('on', i === step); });
    var mi = step < 3 ? -1 : sub < .15 ? 0 : sub < .45 ? 1 : 2;
    set.modes.forEach(function (m, i) { m.classList.toggle('on', i === mi); });
  }
  H.set = function (p) {
    var step = p < .2 ? 0 : p < .42 ? 1 : p < .62 ? 2 : 3;
    var sub = step === 0 ? p / .2 : step === 1 ? (p - .2) / .22 : step === 2 ? (p - .42) / .2 : (p - .62) / .38;
    var key = step + ':' + (step === 1 ? (sub < .55 ? 0 : 1) : step === 3 ? (sub < .15 ? 0 : sub < .45 ? 1 : 2) : 0);
    if (key !== set.k) { set.k = key; renderSet(step, sub); }
  };

  /* 05 banda */
  H.band = function (p, el) {
    var r = function (a, b) { return eout(clamp((p - a) / (b - a))); };
    el.style.setProperty('--b1', r(0, .2)); el.style.setProperty('--b2', r(.08, .3)); el.style.setProperty('--b3', r(.24, .46));
    el.style.setProperty('--b4', r(.4, .62)); el.style.setProperty('--b5', r(.66, .82));
  };

  var ticking = false;
  function onScroll() {
    if (ticking) return; ticking = true;
    requestAnimationFrame(function () {
      ticking = false;
      scenes.forEach(function (s) {
        var r = s.el.getBoundingClientRect();
        if (r.bottom < -50 || r.top > innerHeight + 50) return;
        var p = RM ? 1 : progress(s.el);
        if (Math.abs(p - s.p) < .0005) return;
        s.p = p; if (H[s.name]) H[s.name](p, s.el);
      });
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();
  if (RM) scenes.forEach(function (s) { if (H[s.name]) H[s.name](s.name === 'xp' ? .5 : 1, s.el); });

  /* visibilidad (para animar solo lo que se ve) */
  var vis = {};
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        var id = e.target.getAttribute('data-vis');
        vis[id] = e.isIntersecting;
        apps.forEach(function (a) { if (a.box === e.target) a.vis = e.isIntersecting; });
      });
    }, { rootMargin: '100px' });
    apps.forEach(function (a) { a.box.setAttribute('data-vis', 'app'); io.observe(a.box); });
    ['#s-parts .partsbox', '#vu'].forEach(function (s, i) { var n = $(s); if (n) { n.setAttribute('data-vis', 'v' + i); io.observe(n); } });
    var rio = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); rio.unobserve(e.target); if (e.target.querySelector('[data-count]')) count(e.target.querySelector('[data-count]')); } });
    }, { rootMargin: '0px 0px -12% 0px' });
    $$('.rv').forEach(function (n) { rio.observe(n); });
  } else { apps.forEach(function (a) { a.vis = true; }); vis.v0 = vis.v1 = true; $$('.rv').forEach(function (n) { n.classList.add('in'); }); }

  function count(n) {
    var to = +n.getAttribute('data-count'), from = to === 0 ? 100 : 0, st = performance.now(), d = 1400;
    (function f(t) { var k = eout(clamp((t - st) / d)); n.textContent = Math.round(from + (to - from) * k); if (k < 1) requestAnimationFrame(f); })(st);
  }

  /* 04 partes a tempo (reloj propio, sigue al tempo) */
  var pp = { box: $('#s-parts .partsbox') };
  if (pp.box) {
    pp.row = $('#pp-row');
    pp.row.innerHTML = T.parts.slice(0, 7).map(function (p, i) { return '<div class="pt" style="--c:' + PCOL[i] + '">' + p + '</div>'; }).join('');
    pp.pts = $$('.pt', pp.row); pp.beats = $$('#pp-beats i'); pp.cur = 1; pp.q = -1; pp.lb = -1; pp.t0 = performance.now();
    pp.f = $('#pp-f'); pp.now = $('#pp-now'); pp.cnt = $('#pp-cnt'); pp.bb = $('#pp-bb'); pp.bar = 8;
    $('.pstat span', pp.box).firstChild.textContent = T.youare + ' ';
  }
  function tickParts(ms) {
    var beat = Math.floor((ms - pp.t0) / 1000 / BEAT);
    if (beat === pp.lb) return;
    pp.lb = beat;
    var b = beat % 4;
    if (b === 0) {
      pp.bar++;
      if (pp.q >= 0) { pp.cur = pp.q; pp.q = -1; pp.cnt.textContent = T.bars[3]; pp.bar = [1, 9, 13, 21, 29, 37, 41][pp.cur] || 1; }
      else pp.cnt.innerHTML = '&nbsp;';
    }
    var cyc = Math.floor(beat / 4) % 4;
    if (cyc === 2 && b === 1 && pp.q < 0) {
      var tg = (pp.cur + 2 + Math.floor(Math.random() * 3)) % pp.pts.length; if (tg === pp.cur) tg = (tg + 1) % pp.pts.length;
      pp.q = tg;
      var r = pp.pts[tg].getBoundingClientRect(), R = pp.box.getBoundingClientRect();
      pp.f.style.left = (r.left - R.left + r.width / 2 - 23) + 'px'; pp.f.style.top = (r.top - R.top + r.height / 2 - 23) + 'px';
      pp.f.classList.add('tap'); setTimeout(function () { pp.f.classList.remove('tap'); }, 380);
    }
    if (pp.q >= 0 && b > 0) pp.cnt.textContent = T.bars[b - 1];
    pp.beats.forEach(function (d, j) { d.classList.toggle('on', j === b); });
    pp.pts.forEach(function (n, j) { n.classList.toggle('on', j === pp.cur); n.classList.toggle('q', j === pp.q); });
    pp.now.textContent = T.parts[pp.cur].toUpperCase();
    pp.bb.textContent = pp.bar + '.' + (b + 1);
  }

  /* 06 vúmetro */
  var vu = { el: $('#vu') };
  if (vu.el) {
    vu.el.style.cssText = 'flex-direction:column;height:auto;gap:10px';
    var N = 30, row = function () { var s = '<div class="col" style="flex-direction:row;height:46px">'; for (var i = 0; i < N; i++) s += '<i></i>'; return s + '</div>'; };
    vu.el.innerHTML = row() + row();
    vu.cols = $$('.col', vu.el).map(function (c) { return $$('i', c); });
    vu.lv = -60; vu.pk = -60; vu.target = -20; vu.nt = 0; vu.clipT = 0; vu.clip = $('#clipb'); vu.hold = -60; vu.holdT = 0;
  }
  function segClass(db) { return db >= -3 ? 'r' : db >= -12 ? 'y' : 'g'; }
  function tickVu(ms) {
    if (ms > vu.nt) {
      var r = Math.random();
      vu.target = r < .12 ? -60 : r < .9 ? -28 + Math.random() * 20 : -4 + Math.random() * 3.5;
      vu.nt = ms + 120 + Math.random() * 380;
      if (ms - vu.clipT > 9000 && Math.random() < .08) { vu.target = 0; vu.clipT = ms; vu.clip.classList.add('on'); setTimeout(function () { vu.clip.classList.remove('on'); }, 2600); }
    }
    vu.lv += (vu.target - vu.lv) * (vu.target > vu.lv ? .5 : .12);
    var pk = vu.lv + 3 + Math.random() * 2;
    if (pk > vu.hold || ms - vu.holdT > 2000) { vu.hold = pk; vu.holdT = ms; }
    [vu.lv, pk].forEach(function (lv, ci) {
      vu.cols[ci].forEach(function (seg, i) {
        var db = -60 + i * 2;
        var c = db <= lv ? segClass(db) : (ci === 1 && Math.abs(db - vu.hold) < 1 ? segClass(db) : '');
        if (seg.className !== c) seg.className = c;
      });
    });
  }

  /* bucle principal */
  function loop(ms) {
    if (!RM) {
      tickShow(ms);
      if (pp.box && vis.v0) tickParts(ms);
      if (vu.el && vis.v1) tickVu(ms);
    }
    requestAnimationFrame(loop);
  }
  if (RM) { apps.forEach(function (a) { a.vis = true; }); tickShow(performance.now() + 20000); apps.forEach(function (a) { a.vis = false; }); }
  requestAnimationFrame(loop);

  /* DAW */
  $$('.daw button').forEach(function (b) {
    b.addEventListener('click', function () {
      $$('.daw button').forEach(function (x) { x.setAttribute('aria-selected', x === b ? 'true' : 'false'); });
      $$('.dawp').forEach(function (p) { p.classList.toggle('on', p.id === 'daw-' + b.getAttribute('data-daw')); });
    });
  });

  /* licencias */
  var LIC = { midi: ['tune'], set: ['daw', 'set'], full: ['tune', 'daw', 'set'] };
  function lic(k) {
    $$('.licpick button').forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-lic') === k ? 'true' : 'false'); });
    $$('.mini [data-f]').forEach(function (n) { n.classList.toggle('lockd', LIC[k].indexOf(n.getAttribute('data-f')) < 0); });
  }
  $$('.licpick button').forEach(function (b) { b.addEventListener('click', function () { lic(b.getAttribute('data-lic')); }); });
  if ($('.licpick')) lic('full');
})();
