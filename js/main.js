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

/* ---------- Le tas de photos : emporté en parallaxe ---------- */
// Le tas est en place dès le chargement — son arrivée est une animation CSS
// jouée une fois, pas un montage au scroll. Il ne reste ici que la SORTIE, où
// les photos s'échappent vers le haut : le JS pose `--out` sur la scène (0
// posée, 1 partie) et la transformation composée vit dans `.pile__photo`,
// comme pour les stickers du hero.
(function () {
  const scene = document.querySelector('.pile__scene');
  if (!scene) return;

  // Bornes en fractions de la TRAVERSÉE du tas — du moment où son bord haut
  // entre par le bas de l'écran à celui où son bord bas sort par le haut.
  // Mesurer sur la traversée, et non sur la position du tas dans la fenêtre,
  // est ce qui tient à toute hauteur d'écran : le tas est haut dans la page,
  // donc sur une grande fenêtre il est déjà entier à l'écran au chargement.
  // Son bord haut quitte l'écran aux deux tiers de la traversée, d'où des
  // bornes qui finissent avant — plus tard, la sortie se jouait hors champ.
  const EXIT_IN = 0.50;
  const EXIT_OUT = 0.90;

  const still = window.matchMedia('(prefers-reduced-motion: reduce)');
  const clamp01 = (n) => (n < 0 ? 0 : n > 1 ? 1 : n);

  let ticking = false;

  function render() {
    ticking = false;

    const box = scene.getBoundingClientRect();
    const top = box.top + window.scrollY;
    // `from` est borné à 0 : sous le hero, le tas est déjà à l'écran au
    // chargement sur la plupart des fenêtres, il n'entre pas par le bas.
    const from = Math.max(0, top - window.innerHeight);
    const crossed = clamp01((window.scrollY - from) / (top + box.height - from));

    // Linéaire, et ça doit le rester : c'est un parallaxe, donc proportionnel
    // au scroll. L'effet vient du seul écart entre les photos (--away-y va de
    // -6vh au fond à -21vh devant : elles montent toutes, mais pas à la même
    // vitesse), pas d'une courbe. Une accélération mangeait la moitié visible
    // de la sortie.
    scene.style.setProperty('--out', clamp01((crossed - EXIT_IN) / (EXIT_OUT - EXIT_IN)).toFixed(4));
  }

  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(render);
  }

  if (!still.matches) {
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    render();
  }
  still.addEventListener('change', () => window.location.reload());
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
  // This one profile drives the pace. The zoom is on its own, see approachAt.
  const GRADE = [
    [0, 0.05], [0.12, 0.50], [0.26, 0.20], [0.42, 1.00],
    [0.56, 0.34], [0.72, 0.92], [0.86, 0.22], [1, 0.08],
  ];

  const ROT_DAMP = 0.34;    // only part of the full heading-up turn
  const LEAD = 0.02;        // tangent window, as a share of route length
  // L'aimant d'une étape : un palier de coût très élevé, encadré de rampes
  // courtes. On arrive presque à pleine vitesse, on se colle net, et il faut
  // insister au scroll pour décrocher. C'est l'inverse de l'ancien long
  // ralenti à l'approche, qui étalait la décélération sur un quart de marche.
  const DETENT_HOLD = 0.0010; // demi-largeur du palier, en part de parcours
  const DETENT_W = 0.0025;    // ... et de la rampe qui l'encadre
  const DETENT_COST = 8.12;   // ~45vh de scroll pour décrocher d'une carte
  const BASE_COST = 0.30;   // the walk between stops is deliberately cheap
  const GRADE_COST = 0.95;  // steep ground costs more scroll to cross
  const CARD_LEAD = 0.012;  // reveal the card just before you arrive

  // Zoom is driven by how close the next waypoint is, nothing else: you take a
  // step back to cover ground, then lean into the map as a stop comes up.
  // ZOOM_W is wider than DWELL_W on purpose, so the lens is already moving
  // before the scroll starts to resist, and keeps moving through the pause.
  const ZOOM_TRAVEL = 0.70;
  const ZOOM_STOP = 1.14;
  // À garder sous la demi-distance entre deux étapes (0,035 aujourd'hui), sinon
  // les fenêtres d'approche se recouvrent et le zoom ne redescend jamais à
  // ZOOM_TRAVEL : la carte reste plaquée de bout en bout.
  const ZOOM_W = 0.030;     // how much route progress the approach spans

  // L'amorce et la traîne : les portions de chemin que le marcheur parcourt
  // *pendant* que la scène entre par le bas, puis ressort par le haut. Elles
  // n'ont rien de particulier dans le barème — même coût qu'ailleurs — c'est
  // fraction() qui les fait tomber dans les 100vh d'entrée et les 100vh de
  // sortie. Sans elles, le marcheur restait figé tant que la section n'était
  // pas collée, puis se figeait de nouveau dès qu'elle se décollait : deux
  // ruptures nettes, aux deux bouts.
  //
  // Elles ne sont pas égales, et c'est normal : le terrain d'avant la première
  // carte est plus plat, donc il en faut davantage pour dépenser les mêmes
  // 100vh de scroll. Les deux se recalculent, voir le tableau de CLAUDE.md.
  const LEAD_RUN = 0.113;
  const TAIL_RUN = 0.0607;

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

  // The scroll covers first stop -> last stop, plus the tail. That way you open
  // already standing at the first job with green route behind you, and the last
  // card holds while the trail creeps on past it.
  const FIRST = stopPositions[0];
  const LAST = stopPositions[stopPositions.length - 1];
  const START = FIRST - LEAD_RUN;
  const END = LAST + TAIL_RUN;

  // How close the nearest waypoint is: 0 out on the trail, 1 standing on it.
  function approachAt(p) {
    let near = 0;
    for (const at of stopPositions) {
      const d = Math.abs(p - at);
      if (d < ZOOM_W) near = Math.max(near, smooth(1 - d / ZOOM_W));
    }
    return near;
  }

  // Coût de scroll par unité de parcours : le terrain raide est lent, et chaque
  // étape porte un aimant — trapèze étroit et très haut, plutôt qu'une longue
  // pente. Le marcheur n'y avance que de ~47px de carte pour 45vh de scroll :
  // autant dire qu'il est collé, et qu'il faut insister pour repartir.
  function costAt(p) {
    let c = BASE_COST + GRADE_COST * gradeAt(p);
    for (const at of stopPositions) {
      const d = Math.abs(p - at);
      if (d >= DETENT_W) continue;
      const grip = d <= DETENT_HOLD ? 1 : 1 - (d - DETENT_HOLD) / (DETENT_W - DETENT_HOLD);
      c += DETENT_COST * grip;
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

  // L'inverse de progressFor : à quelle fraction de scroll se tient-on ici ?
  function scrollFor(target) {
    let lo = 0;
    let hi = 1;
    for (let k = 0; k < 40; k++) {
      const mid = (lo + hi) / 2;
      if (progressFor(mid) < target) lo = mid;
      else hi = mid;
    }
    return (lo + hi) / 2;
  }

  // Les étapes, en fraction de scroll. Le mode auto ne s'arrête que là-dessus,
  // la traîne en est volontairement exclue : elle se parcourt à la main.
  const MARKS = stopPositions.map(scrollFor);
  const LAST_MARK = MARKS[MARKS.length - 1];

  /* ---------- La révélation, par-dessus le début de la marche ---------- */
  // Les deux courent EN MÊME TEMPS, et c'est voulu : dès que la scène s'épingle,
  // la fenêtre s'ouvre du petit carton au plein écran pendant que le marcheur
  // entame son amorce. Quand la carte finit de s'ouvrir, il est presque sur la
  // première étape — on découvre le chemin juste avant d'y arriver, plutôt que de
  // rester 100vh sans rien faire une fois le cadre ouvert.
  //
  // REVEAL_VH est donc à régler contre le coût de l'amorce, qui vaut 100vh : à
  // 0,8 il reste 20vh de marche visible après l'ouverture, le temps de voir le
  // marcheur couvrir les derniers mètres et la carte d'étape apparaître. Monter
  // à 1 le colle sur l'étape à l'instant même où le cadre s'ouvre.
  //
  // Il n'a PAS de budget de scroll à lui : la hauteur CSS ne dépend plus de lui.
  const REVEAL_VH = 0.8;

  const trailTop = () => trail.getBoundingClientRect().top + window.scrollY;
  const revealPx = () => window.innerHeight * REVEAL_VH;

  // La marche court de l'épinglage au bord bas de la section — 717vh, soit
  // exactement le budget d'origine, dont les 100 derniers vh se jouent pendant
  // que la scène ressort par le haut (la traîne).
  const walkPx = () => Math.max(1, trail.offsetHeight);
  const walkStart = () => trailTop();

  const revealFraction = () => clamp01((window.scrollY - trailTop()) / revealPx());
  // Où en sera la marche quand la fenêtre finira de s'ouvrir.
  const revealEnd = () => clamp01(revealPx() / walkPx());

  // Comme avant, c'est UNE division sur une longueur de scroll réelle en pixels :
  // pas de couture calculée à l'avance, pas de dérive sur mobile où `vh` et
  // `window.innerHeight` ne sont pas d'accord à cause de la barre d'URL.
  const fraction = () => clamp01((window.scrollY - walkStart()) / walkPx());

  // ... et sa réciproque, dont le mode auto a besoin pour viser une étape.
  const pageYFor = (frac) => walkStart() + walkPx() * frac;

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

    // La fenêtre d'abord. Le JS n'écrit qu'un nombre — toute la géométrie de
    // l'ouverture (taille du carton, marge finale, arrondi) vit dans le CSS.
    // Le lissage est ici et pas dans la marche : ouvrir un cadre supporte une
    // courbe, suivre un chemin non (voir la note sur le mode auto).
    const rev = revealFraction();
    stage.style.setProperty('--open', smooth(rev).toFixed(4));
    stage.classList.toggle('is-open', rev >= 0.999);

    const scrolled = fraction();
    const p = progressFor(scrolled);
    const walked = total * p;

    done.style.strokeDasharray = `${walked} ${total}`;

    // Le marcheur avance dès l'épinglage, mais la CAMÉRA ne le suit qu'une fois le
    // chemin visible. Pendant l'ouverture elle est tenue à la position qu'il aura
    // à la FIN de la révélation : le terrain reste donc parfaitement immobile sous
    // le cadre qui s'ouvre — c'est ce qui fait lire l'ouverture comme un masque —
    // et comme les deux se rejoignent à l'instant du raccord, il n'y a aucun saut.
    // Viser la position de départ à la place produirait ce saut.
    const pCam = rev < 1 ? progressFor(revealEnd()) : p;
    const seen = total * pCam;

    const here = at(seen);

    // Heading, sampled either side so the turn is smooth, then damped so a
    // fast scroll does not send the map spinning.
    const lead = total * LEAD;
    const back = at(seen - lead);
    const fwd = at(seen + lead);
    let heading = -90 - (Math.atan2(fwd.y - back.y, fwd.x - back.x) * 180) / Math.PI;
    if (prevHeading !== null) {
      while (heading - prevHeading > 180) heading -= 360;
      while (heading - prevHeading < -180) heading += 360;
    }
    prevHeading = heading;
    const rot = heading * ROT_DAMP;

    const zoom = ZOOM_TRAVEL + (ZOOM_STOP - ZOOM_TRAVEL) * approachAt(pCam);

    const stageW = stage.clientWidth;
    const stageH = stage.clientHeight;
    const cx = stageW / 2 + Math.sin(pCam * Math.PI * 3.1) * stageW * DRIFT_X;
    const cy = stageH / 2 + Math.sin(pCam * Math.PI * 2.3 + 1.1) * stageH * DRIFT_Y;

    // Origin is 0 0, so this reads right-to-left: bring the walker's point to
    // the origin, scale, turn, then drop it where we want it on screen.
    map.style.transform =
      `translate(${cx.toFixed(1)}px, ${cy.toFixed(1)}px) ` +
      `rotate(${rot.toFixed(2)}deg) scale(${zoom.toFixed(4)}) ` +
      `translate(${(-here.x).toFixed(1)}px, ${(-here.y).toFixed(1)}px)`;

    // Labels read these to cancel the map's turn and zoom
    map.style.setProperty('--rot', `${rot.toFixed(2)}deg`);
    map.style.setProperty('--zoom', zoom.toFixed(4));

    // En coordonnées carte : la caméra amène ce point pile en (cx, cy).
    you.style.left = `${here.x.toFixed(1)}px`;
    you.style.top = `${here.y.toFixed(1)}px`;

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

  /* ---------- Mode « étape par étape » ---------- */
  // Un cran de molette ne fait pas défiler : il déclenche la marche jusqu'à
  // l'étape suivante, chemin compris, que la caméra suit toute seule. Le geste
  // est un déclencheur, pas une poignée. Activé par défaut, débrayable par le
  // bouton du HUD — qui est aussi la sortie de secours si le glissement coince.

  // Le rythme de la marche automatique. Volontairement lent : la moitié de
  // l'intérêt de la section est de voir le cheminement se faire, pas d'être
  // téléporté d'une carte à l'autre. Baisse GLIDE_PACE pour accélérer.
  const GLIDE_PACE = 3.4;    // ms de marche par px de scroll à couvrir
  const GLIDE_MIN = 2600;    // ms — la marche la plus courte
  const GLIDE_MAX = 6500;    // ms — et la plus longue. Assez haut pour qu'aucune
                             // marche ne soit écrêtée sur un écran courant : une
                             // marche tronquée irait plus vite que les autres.
  const INERTIA_LOCK = 1100; // ms — le temps qu'un flick de trackpad retombe
  const WHEEL_TRIGGER = 24;  // px de molette cumulés avant de déclencher
  const SWIPE_TRIGGER = 34;  // px de doigt
  const REARM = 260;         // ms de battement après une marche, contre l'inertie
  const MARK_EPS = 0.004;

  const toggle = trail.querySelector('.trail__auto');
  let auto = true;
  let glide = null;
  let lockUntil = 0;
  let wheelAcc = 0;
  let touchY = null;

  // 1px de tolérance : au ras de l'épinglage le rect vaut couramment 0,23px, et
  // un test strict laisserait le tout premier geste filer sous la section.
  function pinned() {
    const r = trail.getBoundingClientRect();
    return r.top <= 1 && r.bottom >= window.innerHeight - 1;
  }

  function nextMark(from, dir) {
    if (dir > 0) {
      for (const m of MARKS) if (m > from + MARK_EPS) return m;
    } else {
      for (let i = MARKS.length - 1; i >= 0; i--) if (MARKS[i] < from - MARK_EPS) return MARKS[i];
    }
    return null; // plus rien devant : la page reprend son défilement normal
  }

  function glideTo(frac) {
    const from = window.scrollY;
    const to = pageYFor(frac);
    const dur = Math.min(GLIDE_MAX, Math.max(GLIDE_MIN, Math.abs(to - from) * GLIDE_PACE));
    const t0 = performance.now();
    glide = { to: frac };
    lockUntil = t0 + Math.min(dur, INERTIA_LOCK) + REARM;

    const step = (now) => {
      if (!glide || glide.to !== frac) return;
      const t = clamp01((now - t0) / dur);
      // 'instant' est indispensable : html porte scroll-behavior: smooth, qui
      // sinon animerait chaque pas de l'animation et la ferait ramer sur place.
      // Interpolation linéaire, sans aucun assouplissement : toute courbe d'entrée
      // /sortie se lit ici comme une accélération au milieu du trajet, ce qui est
      // exactement ce qu'on ne veut pas quand le sujet est de suivre le chemin.
      window.scrollTo({ top: from + (to - from) * t, left: 0, behavior: 'instant' });
      if (t < 1) requestAnimationFrame(step);
      else glide = null;
    };
    requestAnimationFrame(step);
  }

  // La marque visée par un geste, ou null si la section doit rendre la main.
  function targetFor(dir) {
    if (!auto || still.matches || !pinned()) return null;
    // Pendant la révélation la scène est déjà épinglée : sans ce garde, le
    // premier cran de molette filerait droit sur la première carte et on ne
    // verrait jamais la fenêtre s'ouvrir.
    if (revealFraction() < 1) return null;
    // Passé la dernière carte, on est dans la traîne : le mode auto ne s'en mêle
    // plus, dans aucun des deux sens, et le scroll redevient manuel.
    if (fraction() > LAST_MARK + MARK_EPS) return null;
    return nextMark(glide ? glide.to : fraction(), dir);
  }

  // true = le geste est consommé par la section, false = laisse passer la page.
  function handle(dir) {
    const target = targetFor(dir);
    if (target === null) return false;
    if (performance.now() < lockUntil) return true; // avalé, mais sans avancer
    glideTo(target);
    return true;
  }

  function onWheel(e) {
    const dir = e.deltaY > 0 ? 1 : e.deltaY < 0 ? -1 : 0;
    if (!dir || targetFor(dir) === null) {
      wheelAcc = 0;
      return;
    }
    e.preventDefault(); // sinon l'inertie du trackpad traverse toute la section
    if (dir !== Math.sign(wheelAcc)) wheelAcc = 0;
    wheelAcc += e.deltaY;
    if (Math.abs(wheelAcc) < WHEEL_TRIGGER) return;
    if (handle(dir)) wheelAcc = 0;
  }

  function onTouchStart(e) {
    touchY = e.touches.length === 1 ? e.touches[0].clientY : null;
  }

  function onTouchMove(e) {
    if (touchY === null) return;
    const dy = touchY - e.touches[0].clientY;
    const dir = dy > 0 ? 1 : -1;
    if (targetFor(dir) === null) return;
    e.preventDefault();
    if (Math.abs(dy) < SWIPE_TRIGGER) return;
    if (handle(dir)) touchY = e.touches[0].clientY;
  }

  function onKey(e) {
    if (e.target === toggle || e.metaKey || e.ctrlKey || e.altKey) return;
    let dir = 0;
    if (e.key === 'ArrowDown' || e.key === 'PageDown') dir = 1;
    else if (e.key === 'ArrowUp' || e.key === 'PageUp') dir = -1;
    else if (e.key === ' ') dir = e.shiftKey ? -1 : 1;
    if (dir && handle(dir)) e.preventDefault();
  }

  function setAuto(on) {
    auto = on;
    glide = null;
    wheelAcc = 0;
    lockUntil = 0;
    // Les deux libellés « Manuel / Auto » sont décoratifs : l'état réel passe par
    // aria-pressed, et le nom accessible dit ce que fait le bouton maintenant.
    if (toggle) {
      toggle.setAttribute('aria-pressed', String(on));
      toggle.setAttribute('aria-label', on ? 'Avancer étape par étape' : 'Défilement libre');
    }
  }

  if (toggle) toggle.addEventListener('click', () => setAuto(!auto));
  setAuto(true);

  if (!still.matches) {
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', refresh);
    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('keydown', onKey);
  }
  still.addEventListener('change', () => window.location.reload());

  refresh();
})();
