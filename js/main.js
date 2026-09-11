// Portfolio — Vincent Waldmann

/* ---------- Le tas de photos : emporté en parallaxe ---------- */
// Le tas est en place dès le chargement — son arrivée est une animation CSS
// jouée une fois, pas un montage au scroll. Il ne reste ici que la SORTIE, où
// les photos s'échappent vers le haut : le JS pose `--out` sur la scène (0
// posée, 1 partie) et la transformation composée vit dans `.pile__photo`,
// comme `--open` du parcours.
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
  const log = trail.querySelector('.trail__log');
  if (!map || !track || !done) return;

  /* ---------- Le journal, en bas à gauche ---------- */
  // Les entrées sont CLONÉES depuis les cartes du tracé : le <li> reste la seule
  // source de vérité, donc il n'y a pas deux textes à tenir à jour — et le mode
  // réduit, qui affiche ces mêmes cartes en entier, ne peut pas diverger.
  // Les cinq sont posées d'emblée et superposées ; le rendu ne fait que déplacer
  // une classe, tout le fondu est en CSS.
  const LOG_PARTS = [
    ['.trail__stop-year', 'trail__log-year', 'span'],
    ['.trail__stop-role', 'trail__log-role', 'p'],
    ['.trail__stop-org', 'trail__log-org', 'p'],
    ['.trail__stop-note', 'trail__log-note', 'p'],
  ];

  const logEntries = !log ? [] : stops.map((stop) => {
    const entry = document.createElement('div');
    entry.className = 'trail__log-entry';
    for (const [from, cls, tag] of LOG_PARTS) {
      const src = stop.querySelector(from);
      if (!src) continue;
      const el = document.createElement(tag);
      el.className = cls;
      el.innerHTML = src.innerHTML;
      entry.append(el);
    }
    log.append(entry);
    return entry;
  });

  let logCurrent = null;

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
    // Posés sur la SECTION et pas sur la scène : le fil pointillé, qui est un frère
    // de la scène, doit les lire lui aussi (il s'escamote à l'ouverture).
    trail.style.setProperty('--open', smooth(rev).toFixed(4));
    trail.classList.toggle('is-open', rev >= 0.999);

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

    // Le journal garde le DERNIER poste atteint : tant que l'étape suivante n'est
    // pas débloquée, c'est le précédent qui reste affiché. Avant la première, le
    // coin est vide — d'où le -1, qui ne correspond à aucune entrée.
    let current = -1;
    stops.forEach((s, i) => {
      const reached = p >= parseFloat(s.dataset.at) - CARD_LEAD;
      s.classList.toggle('is-reached', reached);
      if (reached) current = i;
    });

    if (current !== logCurrent) {
      logEntries.forEach((e, i) => e.classList.toggle('is-current', i === current));
      logCurrent = current;
    }

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

  /* ---------- La tuile de relief, rastérisée une fois ----------
     La carte topo clignotait par moments pendant la marche, et c'est un
     problème de RASTÉRISATION, pas de code : le fil principal tient ses 8,3 ms
     médians de bout en bout.

     `assets/home/trail/relief.svg` est une tuile de 192 tracés translucides. Tant
     que l'échelle ne bouge pas, le compositeur réutilise sa texture — mais
     `scale()` change à chaque approche d'étape (0,70 → 1,14), et Chrome doit
     alors redessiner ces 192 tracés pour CHAQUE tuile visible. Mesuré à 58 ms
     la tuile de 1400px, contre 12 ms pour la même image déjà rastérisée et
     16 ms de budget par image. Le rasteur décroche, affiche des tuiles vides,
     et c'est le clignotement — de temps en temps seulement, puisque le zoom ne
     bouge qu'à l'approche des cartes.

     On dessine donc la tuile UNE fois dans un canvas et on passe la bitmap en
     fond. Le SVG reste la source de vérité : c'est lui que produit
     gen_relief.py, c'est lui qu'on lit ici — via le fond déjà déclaré en CSS,
     pour ne pas tenir le chemin à deux endroits — et si quoi que ce soit
     échoue, le fond d'origine reste en place. Rien ne dépend de cette
     optimisation, elle ne fait qu'accélérer. */
  function bakeRelief() {
    const relief = map.querySelector('.trail__relief');
    if (!relief || typeof HTMLCanvasElement === 'undefined') return;

    const cs = getComputedStyle(relief);
    const src = cs.backgroundImage.match(/url\(["']?([^"')]+)["']?\)/);
    const tile = parseFloat(cs.backgroundSize);
    if (!src || !(tile > 0)) return;

    // La tuile est vue jusqu'à ZOOM_STOP sur un écran qui peut être retina : on
    // rastérise à la densité maximale réellement affichée. Plafonnée à 2 — au-delà
    // la bitmap coûte plus de mémoire qu'elle ne rend de finesse sur un trait à
    // 4 % d'opacité.
    const density = Math.min(2, (window.devicePixelRatio || 1) * ZOOM_STOP);
    const size = Math.round(tile * density);

    const img = new Image();
    img.onload = () => {
      try {
        const c = document.createElement('canvas');
        c.width = c.height = size;
        c.getContext('2d').drawImage(img, 0, 0, size, size);
        c.toBlob((blob) => {
          if (blob) relief.style.backgroundImage = `url("${URL.createObjectURL(blob)}")`;
        }, 'image/png');
      } catch (e) {
        /* canvas indisponible ou saturé : le SVG reste en place */
      }
    };
    img.src = src[1];
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
  // Les deux bornes ne sont là que contre les cas dégénérés, et il faut qu'elles
  // NE MORDENT JAMAIS sur une vraie marche : la vitesse au scroll doit être la
  // même partout, sans quoi l'écart s'entend aussitôt. C'est vrai des deux côtés.
  //
  // Le plancher valait 2600 ms, et c'est lui qui produisait le « ralentissement
  // à 2012 ». La première marche est la seule courte du lot — 385 px, contre 850
  // à 1382 pour les autres — parce qu'elle ne part pas d'une carte mais de la fin
  // de la révélation. Elle demandait 1310 ms, le plancher lui en imposait 2600 :
  // 148 px/s contre 294 partout ailleurs, soit la moitié de la vitesse, sur la
  // toute première marche que le visiteur voit.
  const GLIDE_MIN = 250;     // ms — jamais atteint par une marche réelle
  const GLIDE_MAX = 6500;    // ms — idem : assez haut pour qu'aucune marche ne
                             // soit écrêtée sur un écran courant.
  const INERTIA_LOCK = 1100; // ms — le temps qu'un flick de trackpad retombe
  const WHEEL_TRIGGER = 24;  // px de molette cumulés avant de déclencher
  const SWIPE_TRIGGER = 34;  // px de doigt
  const REARM = 260;         // ms de battement après une marche, contre l'inertie
  const MARK_EPS = 0.004;

  // La destination du geste qui suit la DERNIÈRE carte : non plus « rien », mais
  // la section d'après. Ce n'est pas une marque de plus — il n'y a pas d'étape
  // là-bas — donc un jeton à part, que `nextMark` ne peut pas produire.
  const EXIT = 'exit';

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

  // Où mène la sortie : le haut de la section qui suit la piste. On la lit dans
  // le DOM plutôt que par son id — c'est « la suivante » qui est vraie ici, pas
  // « projets », et la piste garde sa sortie si l'ordre de la page change.
  function exitY() {
    const next = trail.nextElementSibling;
    if (!next) return trailTop() + walkPx();
    return next.getBoundingClientRect().top + window.scrollY;
  }

  const glideTo = (frac) => glideToY(pageYFor(frac), frac);

  // `key` identifie la destination : une fraction de scroll, ou EXIT. C'est elle
  // que `step` relit pour savoir si une autre marche l'a supplantée.
  function glideToY(to, key) {
    const from = window.scrollY;
    const dur = Math.min(GLIDE_MAX, Math.max(GLIDE_MIN, Math.abs(to - from) * GLIDE_PACE));
    const t0 = performance.now();
    glide = { to: key };
    lockUntil = t0 + Math.min(dur, INERTIA_LOCK) + REARM;

    const step = (now) => {
      if (!glide || glide.to !== key) return;
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
    if (!auto || still.matches) return null;

    // Une sortie en cours absorbe les gestes, et ce test passe AVANT `pinned()` :
    // la sortie traverse la traîne, donc la scène se décolle en cours de route.
    // Sans ça la page se remettrait à défiler par-dessus l'animation, et les deux
    // se tireraient dessus. Vers le haut, on repart sur la dernière carte.
    if (glide && glide.to === EXIT) return dir > 0 ? EXIT : LAST_MARK;

    if (!pinned()) return null;
    // Pendant la révélation la scène est déjà épinglée : sans ce garde, le
    // premier cran de molette filerait droit sur la première carte et on ne
    // verrait jamais la fenêtre s'ouvrir.
    if (revealFraction() < 1) return null;
    // Passé la dernière carte, on est dans la traîne : le mode auto ne s'en mêle
    // plus, dans aucun des deux sens, et le scroll redevient manuel.
    if (fraction() > LAST_MARK + MARK_EPS) return null;

    const mark = nextMark(glide ? glide.to : fraction(), dir);
    // Plus de carte devant : depuis la dernière, un geste vers le bas emmène à la
    // section suivante d'un seul mouvement, au lieu de rendre la main au milieu
    // de la traîne. Vers le haut, `nextMark` a le dernier mot comme avant.
    if (mark === null && dir > 0) return EXIT;
    return mark;
  }

  // true = le geste est consommé par la section, false = laisse passer la page.
  function handle(dir) {
    const target = targetFor(dir);
    if (target === null) return false;
    if (performance.now() < lockUntil) return true; // avalé, mais sans avancer
    // Déjà en route vers là : on avale sans relancer l'animation depuis la
    // position courante, ce qui la ferait repartir plus lentement à chaque cran.
    if (glide && glide.to === target) return true;
    if (target === EXIT) glideToY(exitY(), EXIT);
    else glideTo(target);
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
    bakeRelief();
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

/* ---------- Projets : le groupement qui suit la carte survolée ---------- */
// Le JS ne pose qu'UN état : la classe `is-active`, déplacée d'un `<li>` à
// l'autre. Tout le reste — le fondu, les décalages d'entrée, l'échelle de la
// carte — vit dans le CSS, comme `--open` du parcours ou `--out` du tas de
// photos.
//
// La classe part du HTML, sur le premier projet : sans JS, en mouvement réduit
// ou si ce fichier ne charge pas, c'est lui qui reste affiché. Rien de visible
// ne dépend d'ici.
(function () {
  const list = document.querySelector('[data-projects]');
  if (!list) return;

  const items = [...list.querySelectorAll('.projects__item')];
  if (items.length < 2) return;

  const activate = (item) => {
    if (item.classList.contains('is-active')) return;   // déjà là : pas de rejeu
    items.forEach((el) => el.classList.toggle('is-active', el === item));
  };

  items.forEach((item) => {
    // On écoute la CARTE et non le `<li>` : celui-ci est en `display: contents`,
    // donc sans boîte, et ne peut pas être la cible d'un événement de pointeur.
    const card = item.querySelector('.pcard');
    if (!card) return;

    // `pointerenter` et pas `mouseenter` : le premier couvre aussi le stylet.
    // Le doigt, lui, le déclenche au toucher — sur un lien la navigation suit
    // de toute façon, et en mobile le CSS montre déjà les trois groupements.
    card.addEventListener('pointerenter', () => activate(item));
    // Le clavier fait le même travail que la souris : tabuler d'une carte à
    // l'autre change le groupement affiché.
    card.addEventListener('focus', () => activate(item));
  });
})();

/* ---------- Pages projet : les blocs qui se révèlent ---------- */
// Le JS ne décide de rien ici. Ce qui se révèle est écrit dans le HTML — un
// attribut `data-reveal` par bloc, comme les `data-at` des étapes du parcours —
// et la manière dont ça se dessine est dans le CSS. Il ne reste que le
// déclencheur : poser `data-reveal-in` quand le bloc passe la ligne, une fois
// pour toutes.
//
// Deux garde-fous tiennent la visibilité du contenu :
//   — on ne fait rien si `.js-motion` n'est pas là (mouvement réduit, ou pas de
//     JS du tout) : dans ce cas le CSS ne masque rien ;
//   — on annonce `data-motion="ready"` au plus tôt, ce qui désamorce le
//     garde-fou de 2,5 s posé en tête de page.
(function () {
  const html = document.documentElement;

  // À faire même s'il n'y a rien à révéler : c'est la preuve que ce fichier a
  // bien chargé, et c'est tout ce que le garde-fou de la page attend.
  html.dataset.motion = 'ready';

  if (!html.classList.contains('js-motion')) return;

  const pending = [...document.querySelectorAll('[data-reveal]')];
  if (!pending.length) return;

  // La ligne de déclenchement, à 88 % de la hauteur de fenêtre : le bloc se
  // révèle une fois franchement entré, pas au ras du bord bas.
  const TRIGGER = 0.88;

  // BALAYAGE GÉOMÉTRIQUE, et pas un `IntersectionObserver`. Ce n'est pas par
  // méfiance envers l'API : c'est qu'elle ne signale que les FRANCHISSEMENTS.
  // Un saut d'un seul rendu — molette à gros crans, `scrollTo`, position
  // restaurée au rechargement, ancre du sommaire — peut faire passer un bloc de
  // « sous la fenêtre » à « au-dessus » sans une seule image où il croise le
  // bord : aucune notification, et le bloc reste masqué pour toujours. Ici on
  // relit la position de ce qui reste, ce qui ne peut pas rater un bloc.
  let frame = 0;

  const sweep = () => {
    frame = 0;
    const line = window.innerHeight * TRIGGER;

    for (let i = pending.length - 1; i >= 0; i--) {
      const el = pending[i];
      if (el.getBoundingClientRect().top >= line) continue;
      el.setAttribute('data-reveal-in', '');   // une seule fois : une révélation
      pending.splice(i, 1);                    // qui rejoue à chaque passage est
    }                                          // une interface qui se bat avec
                                               // son lecteur.
    // Plus rien à révéler : on débranche. La page ne garde pas un écouteur de
    // scroll pour surveiller une liste vide.
    if (!pending.length) {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    }
  };

  // Une lecture par image au plus : `scroll` tire à chaque cran, et lire une
  // position force un calcul de mise en page.
  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(sweep);
  };

  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);

  // Au chargement : la page peut déjà être positionnée plus bas (ancre `#socle`,
  // position restaurée), et ce qui est au-dessus de la ligne se révèle d'emblée.
  sweep();
})();

/* ---------- Le comparateur avant / après (page projet) ----------
   Le curseur natif fait tout le travail : glissement à la souris et au doigt,
   clavier, bornes, annonce aux lecteurs d'écran. Le JS n'écrit qu'un nombre,
   `--pos`, et le CSS compose le reste — même partage que le tas de photos et la
   révélation du parcours. */
(function () {
  const wipes = document.querySelectorAll('.wipe');
  if (!wipes.length) return;

  wipes.forEach((wipe) => {
    const range = wipe.querySelector('.wipe__range');
    if (!range) return;

    const apply = () => wipe.style.setProperty('--pos', range.value + '%');

    // `input` et non `change` : la découpe doit suivre le doigt, pas attendre
    // qu'on relâche.
    range.addEventListener('input', apply);

    // Au chargement, on se cale sur la valeur que le navigateur a RÉELLEMENT
    // posée : il restaure volontiers celle d'avant un rechargement, et le CSS
    // partirait sinon sur les 50 % écrits en dur dans la feuille de style.
    apply();
  });
})();

/* ---------- Le carrousel des écrans (page projet) ----------
   On attrape le rail et on le tire. Trois choses à savoir avant d'y toucher :

   1. LE TACTILE N'EST PAS REPRIS. `pointerType === 'touch'` sort tout de suite : le
      défilement natif du navigateur a une inertie et un rebond qu'aucune ligne écrite
      ici n'égalera, et le doigt doit aussi pouvoir faire défiler la PAGE depuis le
      rail. Seuls la souris et le stylet passent par le glissement scripté.
   2. `setPointerCapture` est enveloppé dans un try/catch : les drags synthétiques
      lèvent `NotFoundError`.
   3. Le JS ne pose qu'une classe, `is-dragging`. Le curseur et le débrayage de
      l'aimant vivent dans le CSS — même partage que partout ailleurs ici. */
(function () {
  const rails = document.querySelectorAll('.rail-wrap');
  if (!rails.length) return;

  rails.forEach((rail) => {
    let originX = 0;
    let originScroll = 0;
    let dragging = false;

    rail.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'touch') return;
      dragging = true;
      originX = e.clientX;
      originScroll = rail.scrollLeft;
      rail.classList.add('is-dragging');
      try { rail.setPointerCapture(e.pointerId); } catch (err) { /* drag synthétique */ }
    });

    rail.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      // Sans ça, le navigateur lance sa propre sélection de texte en travers du geste.
      e.preventDefault();
      rail.scrollLeft = originScroll - (e.clientX - originX);
    });

    const relacher = (e) => {
      if (!dragging) return;
      dragging = false;
      rail.classList.remove('is-dragging');
      try { rail.releasePointerCapture(e.pointerId); } catch (err) { /* déjà relâché */ }
    };

    rail.addEventListener('pointerup', relacher);
    rail.addEventListener('pointercancel', relacher);

    // Ceinture et bretelles avec `-webkit-user-drag` du CSS : sans les deux, tirer
    // sur une capture décolle son fantôme au lieu de faire glisser le rail.
    rail.addEventListener('dragstart', (e) => e.preventDefault());
  });
})();


/* ---------------------------------------------------------------------------
   LA VISIONNEUSE — cliquer une image d'une page projet l'ouvre en grand.

   Les groupes sont déclarés dans le HTML : `data-viewer="<nom>"` sur un
   conteneur, et TOUTES les images qu'il contient forment une galerie qu'on
   parcourt aux flèches. Le groupe est l'unité éditoriale — les dix écrans du
   rail, les quatre emails, les vingt visuels réseaux — pas une liste à plat.

   Le `<dialog>` est FABRIQUÉ ICI et non écrit dans les pages : sans JS il n'y a
   pas de visionneuse, donc pas de bouton mort ni de balise inerte. C'est
   l'inverse de la règle du reveal, et c'est voulu — là-bas on masque du
   contenu, ici on n'ajoute que du chrome.

   `showModal()` fait tout le travail ingrat : couche supérieure, `::backdrop`,
   piège à focus, Échap, arrière-plan inerte, focus rendu au déclencheur. */
(() => {
  // Le décor n'est PAS de la matière : le ciel d'une scène, un carré topo, un
  // filet — tout ce qui porte `alt=""` ou `aria-hidden` est là pour l'ambiance
  // et n'a rien à montrer en grand. Le critère est celui de l'accessibilité, pas
  // une liste de classes à tenir à jour : une image sans texte alternatif est
  // décorative par définition. Et comme la légende de la visionneuse EST ce
  // texte, une image sans alt s'y ouvrirait de toute façon sans légende.
  const utile = (img) => img.alt.trim() !== '' && !img.closest('[aria-hidden="true"]');

  const groups = [...document.querySelectorAll('[data-viewer]')]
    .map((el) => ({ el, imgs: [...el.querySelectorAll('img')].filter(utile) }))
    .filter((g) => g.imgs.length);

  if (!groups.length || typeof HTMLDialogElement === 'undefined') return;

  const dlg = document.createElement('dialog');
  dlg.className = 'viewer';
  dlg.innerHTML =
    '<div class="viewer__stage"><img class="viewer__img" alt=""></div>' +
    '<p class="viewer__count" aria-live="polite"></p>' +
    '<p class="viewer__caption"></p>' +
    '<button class="viewer__nav viewer__nav--prev" type="button" aria-label="Image précédente">' +
      '<svg width="11" height="11" viewBox="0 0 10 10" fill="none" aria-hidden="true">' +
      '<path d="M6.5 1L2 5l4.5 4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg></button>' +
    '<button class="viewer__nav viewer__nav--next" type="button" aria-label="Image suivante">' +
      '<svg width="11" height="11" viewBox="0 0 10 10" fill="none" aria-hidden="true">' +
      '<path d="M3.5 1L8 5l-4.5 4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg></button>' +
    '<button class="viewer__close" type="button" aria-label="Fermer la visionneuse">' +
      '<svg width="12" height="12" viewBox="0 0 10 10" fill="none" aria-hidden="true">' +
      '<path d="M1 1l8 8M9 1l-8 8" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg></button>';
  document.body.appendChild(dlg);

  const stage   = dlg.querySelector('.viewer__stage');
  const big     = dlg.querySelector('.viewer__img');
  const caption = dlg.querySelector('.viewer__caption');
  const count   = dlg.querySelector('.viewer__count');

  let group = null;
  let index = 0;

  function paint(anim) {
    const img = group.imgs[index];

    // `data-full` : la vignette de la page peut être un rognage, et la
    // visionneuse ouvre alors la version entière. Elle n'est référencée QUE par
    // cet attribut, donc le navigateur ne la télécharge qu'au clic — les quatre
    // emails longs de Beepz ne pèsent rien sur le chargement de la page.
    const entier = img.dataset.full;
    big.src = entier || img.currentSrc || img.src;

    // Une version entière se LIT, donc elle défile à sa largeur naturelle au
    // lieu d'être ramenée à la hauteur de la fenêtre : un email de 3 068 px
    // rentré de force dans 700 px ferait 3 px de corps de texte.
    dlg.classList.toggle('is-full', !!entier);
    stage.scrollTop = 0;
    // Le texte alternatif EST la légende : il est déjà écrit et descriptif dans
    // toutes les pages projet. En dupliquer une seconde version serait deux
    // textes à tenir à jour, et l'un des deux finirait par mentir.
    big.alt = img.alt;
    caption.textContent = img.alt;
    count.textContent = `${index + 1} / ${group.imgs.length}`;
    dlg.classList.toggle('is-solo', group.imgs.length < 2);

    if (anim) {                    // relance le keyframe sur un changement d'image
      big.classList.remove('is-swapping');
      void big.offsetWidth;
      big.classList.add('is-swapping');
    }
  }

  function open(g, i) {
    group = g;
    index = i;
    dlg.setAttribute('aria-label', g.el.dataset.viewer || 'Visionneuse');
    paint(false);
    if (!dlg.open) dlg.showModal();
  }

  function step(delta) {
    if (group.imgs.length < 2) return;
    index = (index + delta + group.imgs.length) % group.imgs.length;
    paint(true);
  }

  dlg.querySelector('.viewer__nav--prev').addEventListener('click', () => step(-1));
  dlg.querySelector('.viewer__nav--next').addEventListener('click', () => step(1));
  dlg.querySelector('.viewer__close').addEventListener('click', () => dlg.close());

  // Cliquer À CÔTÉ de l'image ferme. On teste la cible plutôt que la position :
  // la scène remplit le dialogue, donc tout ce qui n'est ni l'image ni un
  // bouton, c'est le vide autour.
  stage.addEventListener('click', (e) => { if (e.target === stage) dlg.close(); });

  dlg.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
    if (e.key === 'ArrowLeft')  { e.preventDefault(); step(-1); }
  });

  // Le rail des écrans se prend au doigt : sans ce garde, un glissement qui
  // finit sur une vignette déclenche aussi son `click` et ouvre la visionneuse
  // en pleine course. On mesure le déplacement du pointeur entre l'appui et le
  // clic — au-delà de 6 px, c'était un geste, pas un clic.
  let downX = 0, downY = 0;
  document.addEventListener('pointerdown', (e) => { downX = e.clientX; downY = e.clientY; }, true);
  const wasDrag = (e) => Math.hypot(e.clientX - downX, e.clientY - downY) > 6;

  groups.forEach((g) => {
    g.imgs.forEach((img, i) => {
      img.classList.add('is-zoomable');
      img.setAttribute('role', 'button');
      img.setAttribute('aria-haspopup', 'dialog');
      img.tabIndex = 0;

      img.addEventListener('click', (e) => { if (!wasDrag(e)) open(g, i); });
      img.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(g, i); }
      });
    });
  });

  // La porte NSFW de projet-jm.html coupe `pointer-events`, ce qui arrête la
  // souris mais PAS le clavier : sans ça on pouvait tabuler jusqu'à une image
  // floutée et l'ouvrir en grand d'un Entrée, par-dessus le voile. La
  // focusabilité suit donc la case à cocher.
  document.querySelectorAll('.nsfw__toggle').forEach((toggle) => {
    const zone = toggle.parentElement.querySelector('.nsfw__content');
    if (!zone) return;
    const sync = () => zone.querySelectorAll('.is-zoomable')
      .forEach((img) => { img.tabIndex = toggle.checked ? 0 : -1; });
    toggle.addEventListener('change', sync);
    sync();
  });
})();


/* ---------------------------------------------------------------------------
   LE PARALLAXE DES PAGES PROJET

   Ce qui donne son glissé à une page longue, ce n'est pas la vitesse du scroll,
   c'est l'ÉCART entre ce qui avance vite et ce qui avance lentement. Même
   principe que la sortie du tas de photos de l'accueil, à un détail près qui
   fait toute la différence de sensation — voir « L'amortissement » plus bas.

   Trois règles, les mêmes que partout ailleurs sur ce site :

   - LE HTML DÉCIDE. Un élément porte `data-parallax`, et c'est tout : ni
     amplitude, ni direction, ni sens dans l'attribut. On sait en lisant la page
     ce qui bouge, sans avoir à ouvrir le JS.
   - LE JS NE POSE QU'UN NOMBRE, `--par`, entre -1 et 1 : la position de
     l'élément dans la fenêtre, -1 tout en haut, +1 tout en bas. Comme `--out`
     du tas de photos et `--open` du parcours.
   - LE CSS COMPOSE. C'est lui qui décide de combien et dans quel sens, via
     `--par-amp` dans la règle de chaque pièce. Une amplitude POSITIVE fait
     l'élément passer plus vite que la page — il vient devant ; une NÉGATIVE le
     retient — il passe derrière.

   ON ÉCRIT DANS `transform`, ET LA RÉVÉLATION DANS `translate`. Ce n'est pas un
   hasard : ce sont deux propriétés distinctes, qui se composent d'elles-mêmes.
   Une pièce peut donc être révélée et parallaxée en même temps sans que l'une
   écrase l'autre — même raison que `pile-land` sur l'accueil, qui anime
   `translate` par-dessus la transformation composée des photos.

   L'AMORTISSEMENT, et c'est lui qu'on ressent. La valeur courante ne saute pas
   sur sa cible, elle court après (`SUIVI`). Le scroll de la page reste
   parfaitement natif — inertie du trackpad, barre de défilement, clavier, tout
   est intact — mais les images traînent d'un cheveu derrière lui puis se
   reposent, et c'est ça qui se lit comme de la fluidité. Le scroll lui-même
   n'est PAS détourné, et ne devrait pas l'être : intercepter la molette coûte
   l'inertie native, la restauration de position et la moitié du clavier, pour
   un gain que la traîne donne déjà.

   La boucle S'ARRÊTE quand tout est posé, et le prochain scroll la relance. Une
   page immobile ne doit pas tourner à 60 images par seconde.
   --------------------------------------------------------------------------- */
(function () {
  // Rien du tout en mouvement réduit : `--par` reste à 0, donc la déclaration
  // `transform` du CSS vaut l'identité et les pièces ne bougent pas d'un pixel.
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const cibles = document.querySelectorAll('[data-parallax]');
  if (!cibles.length) return;

  // Part du chemin restant rattrapée à chaque image. Plus bas = plus de traîne ;
  // au-delà de ~.2 l'amortissement cesse de se voir, en dessous de ~.06 les
  // pièces ont l'air de flotter et le scroll paraît mou.
  const SUIVI = 0.11;

  // En dessous, on colle à la cible : sans ce seuil la boucle tournerait
  // indéfiniment sur des décimales invisibles.
  const EPS = 0.0004;

  const pieces = [...cibles].map((el) => ({ el, valeur: 0, but: 0 }));
  let frame = 0;

  const image = () => {
    frame = 0;
    const vh = window.innerHeight;
    let bouge = false;

    for (const p of pieces) {
      const r = p.el.getBoundingClientRect();

      // 0 quand le centre de la pièce est au centre de la fenêtre, ±1 quand il
      // en touche un bord. La course tient compte de la hauteur de la pièce :
      // sans ça une bande de 900 px et une vignette de 200 px ne parcourraient
      // pas la même amplitude sur le même trajet de scroll.
      const ecart = r.top + r.height / 2 - vh / 2;
      const course = (vh + r.height) / 2;
      p.but = Math.max(-1, Math.min(1, ecart / course));

      const reste = p.but - p.valeur;
      if (Math.abs(reste) < EPS) {
        p.valeur = p.but;
      } else {
        p.valeur += reste * SUIVI;
        bouge = true;
      }
      p.el.style.setProperty('--par', p.valeur.toFixed(4));
    }

    if (bouge) frame = requestAnimationFrame(image);
  };

  const relancer = () => { if (!frame) frame = requestAnimationFrame(image); };

  window.addEventListener('scroll', relancer, { passive: true });
  window.addEventListener('resize', relancer);

  // Au chargement : la page peut déjà être positionnée plus bas (ancre, position
  // restaurée), et les pièces doivent partir de leur vraie place.
  image();
})();
