// Portfolio — Vincent Waldmann

(function () {
  const DAMPING = 0.35; // resistance: peel intensity lags behind the pointer
  const MAX_DRAG = 26; // px — caps how far the pointer offset is allowed to push the peel
  const MAX_TILT = 16; // deg — max corner-lift tilt
  const MAX_SCALE = 0.06; // max "lifting off the surface" scale bump

  document.querySelectorAll('.decor--sticker').forEach((el) => {
    el.draggable = false;

    let dragging = false;
    let pointerId = null;
    let startX = 0;
    let startY = 0;

    const setPeel = (tiltX, tiltY, scale) => {
      el.style.setProperty('--tiltx', `${tiltX}deg`);
      el.style.setProperty('--tilty', `${tiltY}deg`);
      el.style.setProperty('--peel-scale', scale);
    };

    const release = (e) => {
      if (!dragging || e.pointerId !== pointerId) return;
      dragging = false;
      pointerId = null;
      el.classList.remove('is-dragging');
      setPeel(0, 0, 1);
    };

    el.addEventListener('pointerdown', (e) => {
      dragging = true;
      pointerId = e.pointerId;
      startX = e.clientX;
      startY = e.clientY;
      el.classList.add('is-dragging');
      try { el.setPointerCapture(pointerId); } catch (err) { /* no active pointer to capture */ }
    });

    el.addEventListener('pointermove', (e) => {
      if (!dragging || e.pointerId !== pointerId) return;
      const rawX = (e.clientX - startX) * DAMPING;
      const rawY = (e.clientY - startY) * DAMPING;
      const dist = Math.hypot(rawX, rawY);
      const clamp = dist > MAX_DRAG ? MAX_DRAG / dist : 1;
      const cx = rawX * clamp;
      const cy = rawY * clamp;
      const intensity = Math.hypot(cx, cy) / MAX_DRAG; // 0..1 — how far into the peel we are
      const tiltY = (cx / MAX_DRAG) * MAX_TILT;
      const tiltX = -(cy / MAX_DRAG) * MAX_TILT;
      setPeel(tiltX, tiltY, 1 + intensity * MAX_SCALE);
    });

    el.addEventListener('pointerup', release);
    el.addEventListener('pointercancel', release);
  });
})();

/* ---------- Parcours : la carte qui défile sous vos pas ---------- */
(function () {
  const trail = document.querySelector('.trail');
  if (!trail) return;

  const stage = trail.querySelector('.trail__stage');
  const map = trail.querySelector('.trail__map');
  const track = trail.querySelector('.trail__track');
  const done = trail.querySelector('.trail__track-done');
  const you = trail.querySelector('.trail__you');
  const value = trail.querySelector('.trail__progress-value');
  const stops = [...trail.querySelectorAll('.trail__stop')];
  if (!map || !track || !done) return;

  // How hard the going is, sampled along the route. 0 = flat stroll, 1 = grind.
  // This one profile drives the pace, the colour of the line and the zoom.
  const GRADE = [
    [0, 0.05], [0.12, 0.50], [0.26, 0.20], [0.42, 1.00],
    [0.56, 0.34], [0.72, 0.92], [0.86, 0.22], [1, 0.08],
  ];

  const ROT_DAMP = 0.34;    // only part of the full heading-up turn
  const LEAD = 0.02;        // tangent window, as a share of route length
  const DWELL_W = 0.026;    // how much route progress each pause spans
  const DWELL_COST = 7;     // how strongly a stop resists the scroll
  const BASE_COST = 0.55;
  const GRADE_COST = 1.9;   // steep ground costs more scroll to cross
  const CARD_LEAD = 0.012;  // reveal the card just before you arrive

  const DRIFT_X = 0.05;
  const DRIFT_Y = 0.06;

  const still = window.matchMedia('(prefers-reduced-motion: reduce)');

  const clamp01 = (n) => (n < 0 ? 0 : n > 1 ? 1 : n);
  const smooth = (t) => t * t * (3 - 2 * t);

  function gradeAt(p) {
    for (let i = 1; i < GRADE.length; i++) {
      if (p <= GRADE[i][0]) {
        const [p0, g0] = GRADE[i - 1];
        const [p1, g1] = GRADE[i];
        return g0 + (g1 - g0) * smooth((p - p0) / (p1 - p0));
      }
    }
    return GRADE[GRADE.length - 1][1];
  }

  const stopPositions = stops.map((s) => parseFloat(s.dataset.at));

  // The scroll covers first stop -> last stop only. That way you open already
  // standing at Paris with green route behind you, and you stop at the last
  // waypoint while the dashed trail carries on past it.
  const START = stopPositions[0];
  const END = stopPositions[stopPositions.length - 1];

  // Scroll cost per unit of route: steep ground is slow, and each stop sits in
  // a well of very high cost so the walker all but halts while you read it.
  function costAt(p) {
    let c = BASE_COST + GRADE_COST * gradeAt(p);
    for (const at of stopPositions) {
      const d = Math.abs(p - at);
      if (d < DWELL_W) c += DWELL_COST * (1 - d / DWELL_W);
    }
    return c;
  }

  // Integrate the cost once, then invert it to turn scroll into route progress.
  const STEPS = 1400;
  const cum = new Float64Array(STEPS + 1);
  for (let i = 1; i <= STEPS; i++) {
    const p = START + (END - START) * ((i - 0.5) / STEPS);
    cum[i] = cum[i - 1] + costAt(p) / STEPS;
  }
  const totalCost = cum[STEPS];

  function progressFor(scrolled) {
    const target = clamp01(scrolled) * totalCost;
    let lo = 0;
    let hi = STEPS;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (cum[mid] < target) lo = mid + 1;
      else hi = mid;
    }
    const i = Math.max(1, lo);
    const span = cum[i] - cum[i - 1];
    const t = span > 0 ? (target - cum[i - 1]) / span : 0;
    return START + (END - START) * clamp01((i - 1 + t) / STEPS);
  }

  let total = track.getTotalLength();
  let prevHeading = null;
  let ticking = false;

  const at = (len) => track.getPointAtLength(Math.max(0, Math.min(total, len)));

  function layoutStops() {
    stops.forEach((s) => {
      const pt = at(total * parseFloat(s.dataset.at));
      s.style.left = `${pt.x}px`;
      s.style.top = `${pt.y}px`;
    });
  }

  function render() {
    ticking = false;

    const runway = trail.offsetHeight - window.innerHeight;
    const scrolled = runway > 0 ? clamp01(-trail.getBoundingClientRect().top / runway) : 0;
    const p = progressFor(scrolled);
    const walked = total * p;

    done.style.strokeDasharray = `${walked} ${total}`;

    const here = at(walked);

    // Heading, sampled either side so the turn is smooth, then damped so a
    // fast scroll does not send the map spinning.
    const lead = total * LEAD;
    const back = at(walked - lead);
    const fwd = at(walked + lead);
    let heading = -90 - (Math.atan2(fwd.y - back.y, fwd.x - back.x) * 180) / Math.PI;
    if (prevHeading !== null) {
      while (heading - prevHeading > 180) heading -= 360;
      while (heading - prevHeading < -180) heading += 360;
    }
    prevHeading = heading;
    const rot = heading * ROT_DAMP;

    const grade = gradeAt(p);
    const zoom = 1.02 + 0.34 * grade;

    const stageW = stage.clientWidth;
    const stageH = stage.clientHeight;
    const cx = stageW / 2 + Math.sin(p * Math.PI * 3.1) * stageW * DRIFT_X;
    const cy = stageH / 2 + Math.sin(p * Math.PI * 2.3 + 1.1) * stageH * DRIFT_Y;

    // Origin is 0 0, so this reads right-to-left: bring the walker's point to
    // the origin, scale, turn, then drop it where we want it on screen.
    map.style.transform =
      `translate(${cx.toFixed(1)}px, ${cy.toFixed(1)}px) ` +
      `rotate(${rot.toFixed(2)}deg) scale(${zoom.toFixed(4)}) ` +
      `translate(${(-here.x).toFixed(1)}px, ${(-here.y).toFixed(1)}px)`;

    // Labels read these to cancel the map's turn and zoom
    map.style.setProperty('--rot', `${rot.toFixed(2)}deg`);
    map.style.setProperty('--zoom', zoom.toFixed(4));

    you.style.left = `${cx.toFixed(1)}px`;
    you.style.top = `${cy.toFixed(1)}px`;

    stops.forEach((s) => {
      s.classList.toggle('is-reached', p >= parseFloat(s.dataset.at) - CARD_LEAD);
    });

    // Read out the scroll through the section, not the raw position on the
    // route — the route deliberately starts and ends outside the walk.
    if (value) value.textContent = Math.round(scrolled * 100);
  }

  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(render);
  }

  function refresh() {
    if (still.matches) return;
    total = track.getTotalLength();
    prevHeading = null;
    layoutStops();
    render();
  }

  if (!still.matches) {
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', refresh);
  }
  still.addEventListener('change', () => window.location.reload());

  refresh();
})();
