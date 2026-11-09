/* odarri.com — progressive enhancement. Every section reads fine without this file. */
(function () {
  'use strict';
  var doc = document, $ = function (id) { return doc.getElementById(id); };
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var clamp = function (x) { return Math.max(0, Math.min(1, x)); };
  var ease = function (x) { return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2; };
  var fmtTime = function (h, ampm) {
    var hh = Math.floor(h), mm = Math.floor((h - hh) * 60), h12 = hh % 12 === 0 ? 12 : hh % 12;
    return h12 + ':' + (mm < 10 ? '0' : '') + mm + (ampm ? (hh >= 12 ? ' pm' : ' am') : '');
  };
  var money = function (v) { return '$' + Math.round(v).toLocaleString('en-US'); };

  /* 1. Hero: a drive records itself, parks, and asks Business or Personal. */
  var ticket = $('ticket');
  var setHero = null, heroPhase = 'sorted';
  if (ticket) {
    var DRIVE = 9000, PARK = 14000, SORTED = 6000, MILES = 12.4, MINUTES = 29;
    var car = $('car'), halo = $('halo'), trail = $('trail'), end = $('end');
    var drumCols = Array.prototype.slice.call(doc.querySelectorAll('#drums .drum > span'));
    var drumsBox = $('drums');
    var phase = 'driving', start = performance.now(), raf = null, visible = true, last = 0, purpose = 'business';
    var show = function (id, on) { var el = $(id); if (el) el.hidden = !on; };
    var draw = function (T) {
      var k = ease(T), u = 1 - k;
      var x = u * u * u * 40 + 3 * u * u * k * 40 + 3 * u * k * k * 330 + k * k * k * 330;
      var y = u * u * u * 150 + 3 * u * u * k * 70 + 3 * u * k * k * 110 + k * k * k * 22;
      car.setAttribute('cx', x.toFixed(1)); car.setAttribute('cy', y.toFixed(1));
      halo.setAttribute('cx', x.toFixed(1)); halo.setAttribute('cy', y.toFixed(1));
      trail.setAttribute('stroke-dasharray', (100 * k).toFixed(1) + ' 100');
      end.setAttribute('opacity', T >= 1 ? 1 : 0.35);
      var miles = MILES * k, whole = ('000' + Math.floor(miles)).slice(-3), tenths = (miles * 10) % 10;
      for (var i = 0; i < 3; i++) drumCols[i].style.transform = 'translateY(' + (-44 * Number(whole[i])) + 'px)';
      drumCols[3].style.transform = 'translateY(' + (-44 * tenths).toFixed(1) + 'px)';
      drumsBox.setAttribute('aria-label', miles.toFixed(1) + ' miles');
      var mins = Math.round(MINUTES * k);
      if (phase === 'driving') {
        $('clock').textContent = fmtTime(8.2 + mins / 60);
        $('sub').textContent = mins + ' min · following the road, not a straight line';
        var la = $('laMiles'); if (la) { la.textContent = miles.toFixed(1); $('laTime').textContent = mins + ' min'; }
      }
    };
    setHero = function (p, pick) {
      phase = p; start = performance.now();
      var driving = p === 'driving';
      show('rec', driving); show('pocket', driving); show('sort', p === 'parked'); show('done', p === 'sorted');
      $('eyebrow').textContent = driving ? 'Recording a drive, right now' : 'Mileage log for iPhone and Apple Watch';
      $('status').textContent = driving ? 'Driving' : (p === 'parked' ? 'Parked · Business or Personal?' : 'Logged');
      $('route').textContent = driving ? 'Home → …' : 'Home → Harbor Dental, 14 Oak St';
      var la = $('laStatus'); if (la) la.textContent = driving ? 'Driving · Odarri' : 'Parked · Odarri';
      if (!driving) {
        $('clock').textContent = '8:12 – 8:41'; draw(1);
        if (la) { $('laMiles').textContent = '12.4'; $('laTime').textContent = '29 min'; }
      }
      if (p === 'parked') $('sub').textContent = 'Arrived 8:41. Tap one.';
      if (p === 'sorted') {
        purpose = pick || 'business';
        var biz = purpose === 'business', st = $('stamp');
        st.firstChild.nodeValue = biz ? 'Business' : 'Personal';
        $('stampNote').textContent = biz ? '12.4 mi · $9.42 at 76¢' : '12.4 mi · not claimed';
        st.classList.toggle('personal', !biz);
        st.classList.remove('slam'); void st.offsetWidth; st.classList.add('slam');
        $('sub').textContent = biz ? 'Reason: quarterly equipment check' : 'Kept out of your reports';
      }
      if (driving) draw(0);
    };
    var frame = function (now) {
      raf = null;
      if (!visible) return;
      var el = now - start;
      if (phase === 'driving') {
        var t = clamp(el / DRIVE);
        if (t >= 1) setHero('parked');
        else if (now - last > 33) { last = now; draw(t); }
      } else if (phase === 'parked' && el > PARK) setHero('sorted', 'business');
      else if (phase === 'sorted' && el > SORTED) setHero('driving');
      raf = requestAnimationFrame(frame);
    };
    var go = function () { if (!raf && visible && !reduce) raf = requestAnimationFrame(frame); };
    ticket.addEventListener('click', function (e) {
      var b = e.target.closest('[data-pick]');
      if (b) { setHero('sorted', b.getAttribute('data-pick')); $('again').focus(); return; }
      if (e.target.closest('#again')) { setHero(reduce ? 'parked' : 'driving'); go(); }
    });
    var sync = function () { go(); };
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { visible = es[0].isIntersecting && !doc.hidden; sync(); }).observe(ticket);
    doc.addEventListener('visibilitychange', function () { visible = !doc.hidden; sync(); });
    setHero(reduce ? 'parked' : 'driving');
    go();
  }

  /* 2. The day: scrolling is the clock. */
  var scene = $('day');
  if (scene) {
    var DRIVES = [
      { s: 0.06, e: 0.22, t0: 8.2, t1: 8.68, mi: 12.4, biz: true },
      { s: 0.30, e: 0.46, t0: 11.03, t1: 11.63, mi: 9.6, biz: true },
      { s: 0.54, e: 0.66, t0: 13.25, t1: 13.45, mi: 4.2, biz: false },
      { s: 0.76, e: 0.94, t0: 17.67, t1: 18.37, mi: 22.4, biz: false }
    ];
    var segs = scene.querySelectorAll('.seg'), cards = scene.querySelectorAll('.drive'), marker = $('marker');
    var ticking = false, lastP = -1;
    var paint = function (p) {
      var biz = 0;
      DRIVES.forEach(function (d, i) {
        var f = clamp((p - d.s) / (d.e - d.s));
        if (d.biz) biz += d.mi * f;
        segs[i].style.width = (((d.t1 - d.t0) / 12) * 100 * f).toFixed(2) + '%';
        cards[i].classList.toggle('off', p < d.s);
      });
      marker.style.left = (p * 100).toFixed(2) + '%';
      $('dayClock').textContent = fmtTime(7 + 12 * p, true);
      $('bizMiles').textContent = biz.toFixed(1);
      $('bizValue').textContent = '$' + (biz * 0.76).toFixed(2);
      var w = $('watchMiles'); if (w) w.textContent = (22 * clamp(p * 1.1)).toFixed(1);
    };
    var measure = function () {
      ticking = false;
      var r = scene.getBoundingClientRect(), span = r.height - innerHeight;
      var p = span > 0 ? clamp(-r.top / span) : 1;
      if (Math.abs(p - lastP) > 0.001) { lastP = p; paint(p); }
    };
    addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(measure); } }, { passive: true });
    addEventListener('resize', measure);
    measure();
  }

  /* 3. Tracking Health: real switches, the app's own wording. */
  var checks = Array.prototype.slice.call(doc.querySelectorAll('.check'));
  if (checks.length) {
    var verdict = function () {
      var bad = 0;
      checks.forEach(function (c) {
        var sw = c.querySelector('.switch'), on = sw.getAttribute('aria-checked') === 'true';
        var ok = c.hasAttribute('data-invert') ? !on : on, note = c.querySelector('.check-text span');
        c.classList.toggle('ok', ok);
        note.textContent = note.getAttribute(ok ? 'data-good' : 'data-bad');
        if (!ok) bad++;
      });
      var row = $('hVerdict');
      row.classList.toggle('ok', bad === 0);
      row.classList.remove('pop'); void row.offsetWidth; row.classList.add('pop');
      $('hTitle').textContent = bad === 0 ? 'All clear. Odarri will catch your next drive.' : 'Drives may be missed until ' + bad + (bad === 1 ? ' setting is' : ' settings are') + ' fixed';
      $('hNote').textContent = bad === 0 ? 'Last 7 days: 23 drives caught.' : 'Each one has a button in the app that takes you straight to it.';
      $('hIcon').setAttribute('d', bad === 0 ? 'M5 12.5l4.5 4.5L19 7.5' : 'M12 7v6M12 17h.01');
    };
    checks.forEach(function (c) {
      c.querySelector('.switch').addEventListener('click', function () {
        this.setAttribute('aria-checked', this.getAttribute('aria-checked') === 'true' ? 'false' : 'true');
        verdict();
      });
    });
  }

  /* 4. The certified report: change one number and the check fails. */
  var tamper = $('tamper');
  if (tamper) {
    var touched = false;
    tamper.addEventListener('click', function () {
      touched = !touched;
      $('tMiles').textContent = touched ? '21.4 mi' : '12.4 mi';
      $('tMiles').classList.toggle('changed', touched);
      var seal = $('seal');
      seal.classList.toggle('bad', touched);
      seal.classList.remove('pop'); void seal.offsetWidth; seal.classList.add('pop');
      $('sealText').textContent = touched ? 'Changed after export. The signature no longer matches.' : 'Unchanged since export. Certified on the phone that made it.';
      $('sealIcon').setAttribute('d', touched ? 'M10 10l4 4M14 10l-4 4' : 'M9 12l2 2 4-4');
      tamper.textContent = touched ? 'Undo the change' : 'Change 12.4 to 21.4';
    });
  }

  /* 5. Pricing: years slider against the others' list prices. */
  var years = $('years');
  if (years) {
    var rows = Array.prototype.slice.call(doc.querySelectorAll('.row')), TOP = 140 * 6;
    var cost = function (r, n) {
      if (r.hasAttribute('data-once')) return Number(r.getAttribute('data-once'));
      return Number(r.getAttribute('data-y')) + Number(r.getAttribute('data-r')) * (n - 1);
    };
    var update = function () {
      var n = Number(years.value), word = n + (n === 1 ? ' year' : ' years');
      $('yrs').textContent = word; $('yrs2').textContent = word; $('yrsN').textContent = n;
      rows.forEach(function (r) {
        var v = cost(r, n);
        r.querySelector('output').textContent = money(v);
        r.querySelector('.track i').style.width = Math.max(1.5, v / TOP * 100).toFixed(1) + '%';
      });
      $('kept').textContent = money(cost($('mileiq'), n) - cost(rows[0], n));
    };
    years.addEventListener('input', update);
    update();
  }
})();
