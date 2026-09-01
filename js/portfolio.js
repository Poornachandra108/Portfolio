/* ============================================================
   Poorna Chandra Ramachandra — portfolio interactions
   Vanilla JS, no dependencies.
   ============================================================ */
(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------- theme ---------- */
  (function theme() {
    var root = document.documentElement;
    // Dark is the signature look — only an explicit visitor choice overrides it.
    var saved = null;
    try { saved = localStorage.getItem('pc-theme'); } catch (e) {}
    root.setAttribute('data-theme', saved === 'light' ? 'light' : 'dark');

    var btn = $('#theme');
    if (!btn) return;
    btn.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
      root.setAttribute('data-theme', next);
      var meta = $('meta[name="theme-color"]');
      if (meta) meta.setAttribute('content', next === 'light' ? '#f6f8fc' : '#05070d');
      try { localStorage.setItem('pc-theme', next); } catch (e) {}
    });
  })();

  /* ---------- year ---------- */
  var yr = $('#yr'); if (yr) yr.textContent = new Date().getFullYear();

  /* ---------- nav: sticky, burger, scrollspy ---------- */
  (function nav() {
    var nav = $('#nav'), links = $('#navlinks'), burger = $('#burger');
    var bar = $('#progress'), top = $('#totop');

    if (burger) {
      burger.addEventListener('click', function () {
        var open = links.classList.toggle('open');
        burger.setAttribute('aria-expanded', String(open));
      });
      $$('a', links).forEach(function (a) {
        a.addEventListener('click', function () {
          links.classList.remove('open');
          burger.setAttribute('aria-expanded', 'false');
        });
      });
    }

    var ticking = false;
    function onScroll() {
      var y = window.scrollY || window.pageYOffset;
      var h = document.documentElement.scrollHeight - window.innerHeight;
      if (nav) nav.classList.toggle('stuck', y > 12);
      if (bar) bar.style.width = (h > 0 ? (y / h) * 100 : 0) + '%';
      if (top) top.classList.toggle('show', y > 700);
      ticking = false;
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; window.requestAnimationFrame(onScroll); }
    }, { passive: true });
    onScroll();

    if (top) top.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    });

    // scrollspy
    var sections = $$('main section[id]');
    var map = {};
    $$('a', links || document).forEach(function (a) {
      var id = a.getAttribute('href');
      if (id && id.charAt(0) === '#') map[id.slice(1)] = a;
    });
    if ('IntersectionObserver' in window && sections.length) {
      var spy = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          var a = map[e.target.id];
          if (!a) return;
          if (e.isIntersecting) {
            $$('a', links).forEach(function (x) { x.classList.remove('active'); });
            a.classList.add('active');
          }
        });
      }, { rootMargin: '-45% 0px -50% 0px' });
      sections.forEach(function (s) { spy.observe(s); });
    }
  })();

  /* ---------- reveal on scroll ---------- */
  (function reveal() {
    var items = $$('.reveal');
    if (!('IntersectionObserver' in window) || reduce) {
      items.forEach(function (el) { el.classList.add('in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e, i) {
        if (!e.isIntersecting) return;
        var el = e.target;
        setTimeout(function () { el.classList.add('in'); }, Math.min(i, 6) * 70);
        io.unobserve(el);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    items.forEach(function (el) { io.observe(el); });
  })();

  /* ---------- KPI count-up ---------- */
  (function counters() {
    var nums = $$('[data-count]');
    if (!nums.length) return;
    if (!('IntersectionObserver' in window) || reduce) {
      nums.forEach(function (n) { n.textContent = n.getAttribute('data-count'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target;
        var target = parseFloat(el.getAttribute('data-count'));
        var dur = 1400, t0 = null;
        function step(ts) {
          if (t0 === null) t0 = ts;
          var p = Math.min((ts - t0) / dur, 1);
          var eased = 1 - Math.pow(1 - p, 3);
          el.textContent = target < 10 ? (Math.round(eased * target * 10) / 10).toFixed(0)
                                       : Math.round(eased * target);
          if (p < 1) window.requestAnimationFrame(step);
          else el.textContent = String(target);
        }
        window.requestAnimationFrame(step);
        io.unobserve(el);
      });
    }, { threshold: 0.5 });
    nums.forEach(function (n) { io.observe(n); });
  })();

  /* ---------- hero role rotator ---------- */
  (function roles() {
    var el = $('#role');
    if (!el) return;
    var items = [
      'Marketing Analytics',
      'Campaign & Creative Performance',
      'Channel Efficiency',
      'Media Mix Modelling',
      'Incrementality Testing',
      'Lifecycle & Retention'
    ];
    if (reduce) { el.innerHTML = '<b>' + items.join('</b> &middot; <b>') + '</b>'; return; }

    var i = 0, j = 0, del = false;
    var caret = '<span class="caret">&nbsp;</span>';
    function tick() {
      var word = items[i];
      j = del ? j - 1 : j + 1;
      el.innerHTML = '<b>' + word.slice(0, j) + '</b>' + caret;
      var wait = del ? 34 : 72;
      if (!del && j === word.length) { del = true; wait = 1500; }
      else if (del && j === 0) { del = false; i = (i + 1) % items.length; wait = 260; }
      setTimeout(tick, wait);
    }
    tick();
  })();

  /* ---------- hero particle field ---------- */
  (function field() {
    var cv = $('#field');
    if (!cv || reduce) return;
    var ctx = cv.getContext('2d');
    var dots = [], w = 0, h = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);
    var raf = null, visible = true;

    function size() {
      var r = cv.getBoundingClientRect();
      w = r.width; h = r.height;
      cv.width = w * dpr; cv.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var n = Math.round(Math.min(78, (w * h) / 15000));
      dots = [];
      for (var i = 0; i < n; i++) {
        dots.push({
          x: Math.random() * w, y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.28, vy: (Math.random() - 0.5) * 0.28,
          r: Math.random() * 1.5 + 0.7
        });
      }
    }

    function draw() {
      var light = document.documentElement.getAttribute('data-theme') === 'light';
      var dotCol = light ? 'rgba(0,110,150,'  : 'rgba(120,210,255,';
      var lnCol  = light ? 'rgba(0,110,150,'  : 'rgba(110,170,255,';
      ctx.clearRect(0, 0, w, h);
      for (var i = 0; i < dots.length; i++) {
        var d = dots[i];
        d.x += d.vx; d.y += d.vy;
        if (d.x < 0 || d.x > w) d.vx *= -1;
        if (d.y < 0 || d.y > h) d.vy *= -1;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fillStyle = dotCol + (light ? 0.35 : 0.5) + ')';
        ctx.fill();
        for (var k = i + 1; k < dots.length; k++) {
          var o = dots[k], dx = d.x - o.x, dy = d.y - o.y;
          var dist2 = dx * dx + dy * dy;
          if (dist2 < 18000) {
            ctx.beginPath();
            ctx.moveTo(d.x, d.y); ctx.lineTo(o.x, o.y);
            ctx.strokeStyle = lnCol + ((1 - dist2 / 18000) * (light ? 0.16 : 0.24)).toFixed(3) + ')';
            ctx.lineWidth = 0.7;
            ctx.stroke();
          }
        }
      }
      raf = window.requestAnimationFrame(draw);
    }

    size();
    draw();
    window.addEventListener('resize', function () {
      window.cancelAnimationFrame(raf); size(); draw();
    });
    document.addEventListener('visibilitychange', function () {
      visible = !document.hidden;
      window.cancelAnimationFrame(raf);
      if (visible) draw();
    });
  })();

  /* ---------- about toggle ---------- */
  (function about() {
    var btns = $$('.switch button');
    if (!btns.length) return;
    btns.forEach(function (b) {
      b.addEventListener('click', function () {
        var pane = b.getAttribute('data-pane');
        btns.forEach(function (x) {
          var on = x === b;
          x.classList.toggle('on', on);
          x.setAttribute('aria-selected', String(on));
        });
        $('#pane-pro').hidden = pane !== 'pro';
        $('#pane-per').hidden = pane !== 'per';
        $$('.reveal', pane === 'pro' ? $('#pane-pro') : $('#pane-per'))
          .forEach(function (el) { el.classList.add('in'); });
      });
    });
  })();

  /* ---------- measurement lab ---------- */
  (function lab() {
    var host = $('#bars');
    if (!host) return;

    var channels = ['Meta', 'Google Search', 'YouTube', 'TikTok', 'Email / SMS', 'Display'];
    var views = {
      platform: {
        title: 'Platform-reported credit',
        desc: 'Every platform grades its own homework. Totals overstate reality.',
        insight: 'Meta and Google both claim the same conversion. Summed across platforms, these channels &ldquo;delivered&rdquo; <b>more revenue than the business actually booked</b> — which is the first sign you are budgeting off self-reported numbers.',
        data: [92, 85, 61, 74, 58, 47]
      },
      mmm: {
        title: 'Media mix model contribution',
        desc: 'Regression on spend, sales, seasonality and promotions. Credit shrinks where channels overlap.',
        insight: 'Controlling for seasonality and promotions strips <b>27% of claimed credit</b>. Display and Email fall hardest — most of what they were credited with was demand that already existed.',
        data: [63, 71, 44, 66, 39, 22]
      },
      geo: {
        title: 'Geo-holdout verified lift',
        desc: 'Matched-market holdouts measure what actually would not have happened. This is the number to budget against.',
        insight: 'Meta&rsquo;s credited contribution halves once a matched-market holdout is run — <b>~2&times; over-attribution</b>. Search holds up best. <b>This is the column the next dollar should be allocated from.</b>',
        data: [46, 64, 33, 58, 31, 12]
      }
    };
    var base = views.platform.data;
    var baseTotal = base.reduce(function (a, b) { return a + b; }, 0);

    // build rows once
    var rows = channels.map(function (name) {
      var row = document.createElement('div');
      row.className = 'bar__row';
      row.innerHTML =
        '<span class="bar__name">' + name + '</span>' +
        '<span class="bar__track"><span class="bar__fill"></span></span>' +
        '<span class="bar__val">0</span>';
      host.appendChild(row);
      return { row: row, fill: row.querySelector('.bar__fill'), val: row.querySelector('.bar__val') };
    });

    var current = 'platform';
    var drawn = false;

    function render(key) {
      var v = views[key];
      current = key;
      $('#labTitle').textContent = v.title;
      $('#labDesc').textContent = v.desc;
      $('#labInsight').innerHTML = v.insight;

      var total = 0;
      v.data.forEach(function (n, i) {
        total += n;
        var r = rows[i];
        r.fill.style.width = n + '%';
        r.row.classList.toggle('down', n <= base[i] * 0.5);   // >= 2x over-attribution
        countTo(r.val, n);
      });
      countTo($('#labTotal'), total);

      var delta = Math.round(((total - baseTotal) / baseTotal) * 100);
      var d = $('#labDelta');
      d.innerHTML = key === 'platform'
        ? '<i class="v"></i> Baseline for comparison'
        : '<i class="v"></i> &Sigma; vs. platform-reported: <b style="color:var(--rose);margin-left:4px">' + delta + '%</b>';
    }

    function countTo(el, target) {
      if (reduce) { el.textContent = String(target); return; }
      var from = parseFloat(el.textContent) || 0, t0 = null, dur = 700;
      function step(ts) {
        if (t0 === null) t0 = ts;
        var p = Math.min((ts - t0) / dur, 1);
        var e = 1 - Math.pow(1 - p, 3);
        el.textContent = String(Math.round(from + (target - from) * e));
        if (p < 1) window.requestAnimationFrame(step);
      }
      window.requestAnimationFrame(step);
    }

    $$('.lab__opt').forEach(function (b) {
      b.addEventListener('click', function () {
        $$('.lab__opt').forEach(function (x) { x.classList.remove('on'); });
        b.classList.add('on');
        render(b.getAttribute('data-view'));
      });
    });

    // draw when scrolled into view
    function first() {
      if (drawn) return;
      drawn = true;
      render('platform');
    }
    if ('IntersectionObserver' in window && !reduce) {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) { first(); io.disconnect(); } });
      }, { threshold: 0.25 });
      io.observe(host);
    } else {
      first();
    }
  })();

})();
