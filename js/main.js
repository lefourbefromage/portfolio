// Portfolio — Vincent Waldmann

/* ---------- Le tas de photos : emporté en parallaxe ---------- */
// Le tas est en place dès le chargement — son arrivée est une animation CSS
// jouée une fois, pas un montage au scroll. Il ne reste ici que la SORTIE, où
// les photos s'échappent vers le haut : le JS pose `--out` sur la scène (0
// posée, 1 partie) et la transformation composée vit dans `.pile__photo`,
// rien d'autre ne se calcule côté JS.
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

/* ---------- Parcours : le carnet de routes et sa carte ----------
   À gauche les étapes, à droite la carte. Au survol ou au clic d'une étape, la
   caméra glisse jusqu'à son point et le tracé vert se dessine jusque-là. Sans
   survol ni clic, la carte reste en vue d'ensemble. Le JS ne fait que deux choses :
   poser la caméra (une `transform` sur `.trail__map`) et recouper le tracé vert.
   Sur mobile la carte est masquée et les étapes ne réagissent pas. */
(function () {
  const trail = document.querySelector('.trail');
  if (!trail) return;

  const view = trail.querySelector('.trail__view');
  const map = trail.querySelector('.trail__map');
  const track = trail.querySelector('.trail__track');
  const done = trail.querySelector('.trail__track-done');
  const list = trail.querySelector('.trail__list');
  const steps = [...trail.querySelectorAll('.trail__step')];
  if (!view || !map || !track || !done || !list || steps.length === 0) return;

  const still = window.matchMedia('(prefers-reduced-motion: reduce)');
  const wide = window.matchMedia('(min-width: 901px)');

  // FIT : marge autour des étapes dans la vue d'ensemble. FOCUS : échelle posée sur
  // une étape. GLIDE_MS : durée du glissement de caméra.
  const FIT = 1.6;
  const FOCUS = 1;
  const GLIDE_MS = 900;
  // En dessous de cette échelle la carte est « dézoomée » : les piles de projets
  // s'effacent, elles encombreraient la vue d'ensemble.
  const NEAR = 0.6;
  // Les bornes du zoom (boutons et pincement), et le pas d'un clic de bouton.
  const MIN_S = 0.12;
  const MAX_S = 1.6;
  const ZOOM_STEP = 1.5;
  // Une étape est « au centre » quand son repère tombe à moins de cette part du
  // petit côté de la fenêtre : on la rend alors active en glissant ou en zoomant.
  const CENTER_R = 0.18;

  const total = track.getTotalLength();
  const at = (f) => track.getPointAtLength(total * f);

  // Une entrée par étape, dans l'ordre de la liste. `walked` est la longueur du
  // tracé à parcourir pour atteindre le point.
  const stops = steps.map((step) => {
    const f = parseFloat(step.querySelector('.trail__step-btn').dataset.at);
    const pt = at(f);
    return {
      f,
      x: pt.x,
      y: pt.y,
      walked: total * f,
      year: step.querySelector('.trail__year').textContent,
    };
  });

  const pins = stops.map((s, i) => {
    const pin = document.createElement('span');
    pin.className = 'trail__pin';
    // Où se pose l'année autour du repère : décidé dans le HTML, sur le bouton.
    const side = steps[i].querySelector('.trail__step-btn').dataset.label;
    if (side) pin.dataset.label = side;
    pin.setAttribute('aria-hidden', 'true');
    pin.style.left = `${s.x}px`;
    pin.style.top = `${s.y}px`;
    const label = document.createElement('span');
    label.className = 'trail__pin-year';
    label.textContent = s.year;
    pin.append(label);
    map.append(pin);
    return pin;
  });

  /* ---------- Les piles de projets, au-dessus des repères ----------
     Les projets d'une étape (`.trail__proj`, dans la liste) sont CLONÉS en une pile
     de cartes posée au-dessus de son repère : le HTML reste la seule source, et sur
     mobile ce sont les pastilles qu'on lit. La pile vit dans la carte et suit son
     zoom, comme le terrain (seuls les repères gardent leur taille). Le JS pose pour
     chaque carte sa
     place au repos (`--x`, `--y`, `--r`) et dans l'éventail (`--fx`, `--fy`,
     `--fr`) ; le passage de l'une à l'autre, au survol, est en CSS. Le premier projet
     listé est au sommet, donc le dernier dans le DOM. */
  // Au repos : la carte du dessus presque droite, les suivantes qui dépassent derrière,
  // tournées d'un côté puis de l'autre.
  const REST = [[0, 0, -3], [22, -12, 7], [-20, -16, -9]];
  const FAN_X = 130;   // px entre deux cartes de l'éventail
  const FAN_R = 7;     // deg de rotation par carte, depuis le centre

  const decks = [];
  steps.forEach((step, i) => {
    const projs = [...step.querySelectorAll('.trail__proj')];
    if (!projs.length) return;

    const deck = document.createElement('div');
    deck.className = 'trail__deck';
    deck.style.left = `${stops[i].x}px`;
    deck.style.top = `${stops[i].y}px`;
    const stack = document.createElement('div');
    stack.className = 'trail__stack';
    const n = projs.length;
    stack.style.setProperty('--spread', `${((n - 1) / 2) * FAN_X}px`);

    projs.slice().reverse().forEach((p, j) => {
      const depth = n - 1 - j;             // 0 = sommet de la pile
      const pos = n - 1 - depth - (n - 1) / 2; // place dans l'éventail, centrée
      const [x, y, r] = REST[Math.min(depth, REST.length - 1)];
      const isLink = p.tagName === 'A';
      const card = document.createElement(isLink ? 'a' : 'div');
      card.className = 'trail__card';
      if (isLink) card.href = p.getAttribute('href');
      card.style.setProperty('--x', `${x}px`);
      card.style.setProperty('--y', `${y}px`);
      card.style.setProperty('--r', `${r}deg`);
      card.style.setProperty('--fx', `${pos * FAN_X}px`);
      card.style.setProperty('--fy', `${Math.abs(pos) * 12}px`);
      card.style.setProperty('--fr', `${pos * FAN_R}deg`);
      // L'entrée se fait du fond vers le dessus de la pile.
      card.style.setProperty('--d', `${(n - 1 - depth) * 80}ms`);

      const name = p.dataset.name || p.textContent.trim();
      const media = document.createElement('span');
      media.className = 'trail__card-media';
      if (p.dataset.image) {
        const img = document.createElement('img');
        img.src = p.dataset.image;
        img.alt = '';
        img.loading = 'lazy';
        img.decoding = 'async';
        media.append(img);
      } else {
        media.classList.add('trail__card-media--ph');
        media.textContent = name.charAt(0);
        media.setAttribute('aria-hidden', 'true');
      }

      const body = document.createElement('span');
      body.className = 'trail__card-body';
      // Le titre de la carte, c'est la marque : son logo est déjà dans le visuel.
      const title = document.createElement('span');
      title.className = 'trail__card-title';
      title.textContent = name;
      const tags = document.createElement('span');
      tags.className = 'trail__card-tags';
      for (const t of [stops[i].year, isLink ? 'Étude de cas' : 'À venir']) {
        const tag = document.createElement('span');
        tag.className = 'trail__card-tag';
        tag.textContent = t;
        tags.append(tag);
      }
      body.append(title, tags);

      card.append(media, body);
      stack.append(card);
    });

    deck.append(stack);
    map.append(deck);
    decks.push({ el: deck, x: stops[i].x, y: stops[i].y });
    stops[i].stack = stack;
  });
  if (map.querySelector('.trail__deck')) trail.classList.add('has-deck');

  /* ---------- Le tracé vert, recoupé au point atteint ----------
     Le chemin parcouru est le MÊME tracé, recoupé — et non `stroke-dasharray`, que
     WebKit (tous les navigateurs iOS) ignore sur ce tracé. Le `d` n'est fait que de
     M et de L, donc les longueurs se calculent une fois. */
  const doneFull = done.getAttribute('d');
  const donePts = (doneFull.match(/-?\d*\.?\d+/g) || []).map(Number);
  const doneSegs = [];
  const doneLen = [0];
  for (let i = 0; i + 3 < donePts.length; i += 2) {
    doneSegs.push(`L ${donePts[i + 2]} ${donePts[i + 3]}`);
    doneLen.push(doneLen[doneLen.length - 1] +
      Math.hypot(donePts[i + 2] - donePts[i], donePts[i + 3] - donePts[i + 1]));
  }
  let doneWalked = -1;

  function drawWalked(walked) {
    const w = Math.round(walked);
    if (w === doneWalked || doneSegs.length === 0) return;
    doneWalked = w;
    const end = doneLen[doneLen.length - 1];
    if (w >= end) { done.setAttribute('d', doneFull); return; }
    // Dernier sommet déjà dépassé, puis le point interpolé sur le segment en cours.
    let lo = 0;
    let hi = doneLen.length - 1;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (doneLen[mid] <= w) lo = mid; else hi = mid;
    }
    const f = (w - doneLen[lo]) / ((doneLen[hi] - doneLen[lo]) || 1);
    const x0 = donePts[lo * 2];
    const y0 = donePts[lo * 2 + 1];
    const x = x0 + (donePts[hi * 2] - x0) * f;
    const y = y0 + (donePts[hi * 2 + 1] - y0) * f;
    done.setAttribute('d',
      `M ${donePts[0]} ${donePts[1]} ${doneSegs.slice(0, lo).join(' ')} L ${x.toFixed(1)} ${y.toFixed(1)}`);
  }

  /* ---------- La caméra ----------
     Elle est décrite par le point de la carte posé au centre de la fenêtre (x, y),
     une échelle (s) et la longueur de tracé à colorier (walked). Une seule
     transformation la traduit : la carte est décalée pour que (x, y) tombe au centre,
     puis mise à l'échelle. */
  let vw = 0;
  let vh = 0;
  const cam = { x: 0, y: 0, s: 1, walked: 0 };
  let anim = 0;

  function paint() {
    map.style.transform =
      `translate(${(vw / 2 - cam.x * cam.s).toFixed(1)}px, ${(vh / 2 - cam.y * cam.s).toFixed(1)}px) ` +
      `scale(${cam.s.toFixed(4)})`;
    // Les repères gardent leur taille à l'écran : ils se remettent à l'échelle inverse.
    map.style.setProperty('--k', (1 / cam.s).toFixed(4));
    // Une pile se montre quand la carte est assez zoomée ET que son repère est dans le
    // cadre (la pile monte au-dessus, d'où la marge du bas) : son entrée se rejoue donc
    // à chaque fois qu'on la fait revenir dans le champ en faisant glisser la carte.
    const near = cam.s >= NEAR;
    for (const d of decks) {
      const sx = vw / 2 + (d.x - cam.x) * cam.s;
      const sy = vh / 2 + (d.y - cam.y) * cam.s;
      const inside = sx > -60 && sx < vw + 60 && sy > 40 && sy < vh + 260;
      d.el.classList.toggle('is-shown', near && inside);
    }
    drawWalked(cam.walked);
  }

  // La vue d'ensemble cadre toutes les étapes, et non le tracé entier : la queue du
  // tracé déborde après 2012 et 2025, et elle écrasait tout à l'échelle.
  function overview() {
    const xs = stops.map((st) => st.x);
    const ys = stops.map((st) => st.y);
    const x0 = Math.min(...xs);
    const x1 = Math.max(...xs);
    const y0 = Math.min(...ys);
    const y1 = Math.max(...ys);
    const w = Math.max(x1 - x0, 1);
    const h = Math.max(y1 - y0, 1);
    return {
      x: (x0 + x1) / 2,
      y: (y0 + y1) / 2,
      s: Math.min(FOCUS, vw / (w * FIT), vh / (h * FIT)),
      walked: 0,
    };
  }

  // Ce qu'on regarde sur une étape, c'est sa pile de projets ET son repère : la caméra
  // vise le milieu des deux, donc le repère tombe sous le centre de la moitié de la
  // hauteur de la pile. Celle-ci est lue sur la pile elle-même (sa hauteur et son
  // retrait au-dessus du repère, en unités de carte) : aucun nombre recopié du CSS. La
  // pile suivant le zoom, le décalage à l'écran est cette moitié fois l'échelle. Sans
  // pile, ou carte dézoomée, le repère est au centre.
  function lift(i, scale) {
    const st = stops[i].stack;
    if (!st || scale < NEAR) return 0;
    // Les cartes prennent la hauteur de leur contenu : on lit la plus haute.
    const h = Math.max(...[...st.children].map((c) => c.offsetHeight));
    return ((h + parseFloat(getComputedStyle(st).bottom)) / 2) * scale;
  }

  function focus(i) {
    const s = stops[i];
    return { x: s.x, y: s.y - lift(i, FOCUS) / FOCUS, s: FOCUS, walked: s.walked };
  }

  // Un glissement, pas une téléportation. Avec `instant` ou sous mouvement réduit,
  // la caméra se pose d'un coup.
  function glide(to, instant, then) {
    cancelAnimationFrame(anim);
    if ('walked' in to) cancelAnimationFrame(walkAnim);
    if (instant || still.matches) {
      Object.assign(cam, to);
      paint();
      if (then) then();
      return;
    }
    const from = { ...cam };
    const t0 = performance.now();
    const step = (now) => {
      const k = Math.min(1, (now - t0) / GLIDE_MS);
      const e = 1 - (1 - k) ** 3;
      for (const key of Object.keys(to)) cam[key] = from[key] + (to[key] - from[key]) * e;
      paint();
      if (k < 1) anim = requestAnimationFrame(step);
      else if (then) then();
    };
    anim = requestAnimationFrame(step);
  }

  // Le tracé seul, sans toucher à la caméra : quand on fait glisser la carte, c'est
  // le visiteur qui tient le cadre, le chemin avance tout seul.
  let walkAnim = 0;
  function walkTo(len) {
    cancelAnimationFrame(walkAnim);
    if (still.matches) { cam.walked = len; paint(); return; }
    const from = cam.walked;
    const t0 = performance.now();
    const step = (now) => {
      const k = Math.min(1, (now - t0) / GLIDE_MS);
      cam.walked = from + (len - from) * (1 - (1 - k) ** 3);
      paint();
      if (k < 1) walkAnim = requestAnimationFrame(step);
    };
    walkAnim = requestAnimationFrame(step);
  }

  /* ---------- L'étape montrée ----------
     Survoler, atteindre au clavier ou cliquer une étape la rend active, et la carte
     y RESTE : quitter la liste — pour aller vers une pastille de projet, ou sur la
     carte — ne ramène pas la vue d'ensemble. Celle-ci n'est que l'état de départ. */
  let active = -1;

  function update(instant) {
    glide(active >= 0 ? focus(active) : overview(), instant);
    mark();
  }

  // Les classes de l'étape active : la ligne de la liste (son effet de survol) et
  // les repères atteints.
  function mark() {
    steps.forEach((step, i) => {
      step.classList.toggle('is-active', i === active);
      step.querySelector('.trail__step-btn').setAttribute('aria-pressed', String(i === active));
    });

    const here = active >= 0 ? stops[active].f : -1;
    pins.forEach((pin, i) => {
      pin.classList.toggle('is-reached', here >= 0 && stops[i].f <= here);
      pin.classList.toggle('is-current', i === active);
    });
  }

  function show(i) {
    if (!wide.matches || active === i) return;
    active = i;
    update(false);
  }

  steps.forEach((step, i) => {
    const btn = step.querySelector('.trail__step-btn');
    btn.addEventListener('mouseenter', () => show(i));
    btn.addEventListener('focus', () => show(i));
    btn.addEventListener('click', () => show(i));
  });

  /* ---------- L'étape au centre ----------
     Quand on fait glisser la carte ou qu'on zoome, l'étape dont le repère tombe à peu
     près au centre devient active : le chemin avance jusqu'à elle et sa ligne
     s'allume dans la liste. La caméra, elle, reste où le visiteur l'a mise. */
  function pickCentered() {
    let best = -1;
    let bestD = Math.min(vw, vh) * CENTER_R;
    stops.forEach((st, i) => {
      // Même visée que `focus` : le repère est attendu sous le centre, de `lift`.
      const d = Math.hypot((st.x - cam.x) * cam.s, (st.y - cam.y) * cam.s - lift(i, cam.s));
      if (d < bestD) { bestD = d; best = i; }
    });
    if (best < 0 || best === active) return;
    active = best;
    mark();
    walkTo(stops[best].walked);
  }

  /* ---------- Faire glisser la carte ----------
     On attrape le terrain et on le déplace : la caméra suit le pointeur, à l'échelle
     près. Un glissement de caméra en cours est interrompu ; si le tracé était en
     route, il finit sa course. Pas depuis une carte de projet ni un bouton de zoom. */
  let drag = null;
  view.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 || e.target.closest('.trail__card, .trail__zoom')) return;
    cancelAnimationFrame(anim);
    if (active >= 0 && cam.walked !== stops[active].walked) walkTo(stops[active].walked);
    drag = { x: e.clientX, y: e.clientY, cx: cam.x, cy: cam.y };
    view.setPointerCapture(e.pointerId);
    view.classList.add('is-dragging');
  });
  view.addEventListener('pointermove', (e) => {
    if (!drag) return;
    // Bornée à la carte, pour ne jamais sortir du relief.
    cam.x = Math.min(7200, Math.max(0, drag.cx - (e.clientX - drag.x) / cam.s));
    cam.y = Math.min(7200, Math.max(0, drag.cy - (e.clientY - drag.y) / cam.s));
    paint();
    pickCentered();
  });
  const endDrag = () => {
    drag = null;
    view.classList.remove('is-dragging');
  };
  view.addEventListener('pointerup', endDrag);
  view.addEventListener('pointercancel', endDrag);

  /* ---------- Zoomer, dézoomer ----------
     Deux boutons, fabriqués ici (c'est du chrome) : ils zooment autour du centre, en
     glissant. Sur la carte, la molette et le pincement d'un trackpad zooment autour du
     pointeur, d'un coup : vers le bas on dézoome, vers le haut on zoome. Aux bornes du
     zoom la molette rend la main à la page, sans quoi la carte, haute, piégerait le
     défilement : on dézoome jusqu'au bout, puis la page repart. */
  function zoomAt(factor, px, py, instant) {
    const s = Math.min(MAX_S, Math.max(MIN_S, cam.s * factor));
    // Le point de la carte sous (px, py) y reste.
    const mx = cam.x + (px - vw / 2) / cam.s;
    const my = cam.y + (py - vh / 2) / cam.s;
    glide({ x: mx - (px - vw / 2) / s, y: my - (py - vh / 2) / s, s }, instant, pickCentered);
  }

  const zoom = document.createElement('div');
  zoom.className = 'trail__zoom';
  for (const [label, sign, factor] of [['Zoomer sur la carte', '+', ZOOM_STEP], ['Dézoomer la carte', '−', 1 / ZOOM_STEP]]) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'trail__zoom-btn';
    b.setAttribute('aria-label', label);
    b.textContent = sign;
    b.addEventListener('click', () => zoomAt(factor, vw / 2, vh / 2, false));
    zoom.append(b);
  }
  view.append(zoom);

  view.addEventListener('wheel', (e) => {
    if (!vw) return;
    // Firefox compte parfois en lignes : on ramène tout en pixels.
    const dy = e.deltaMode === 1 ? e.deltaY * 33 : e.deltaY;
    const out = dy > 0;
    if (!e.ctrlKey && ((out && cam.s <= MIN_S * 1.001) || (!out && cam.s >= MAX_S * 0.999))) return;
    e.preventDefault();
    const r = view.getBoundingClientRect();
    // Le pincement envoie de petits deltas, la molette des crans de ~100 px.
    const speed = e.ctrlKey ? 0.01 : 0.002;
    zoomAt(Math.exp(-dy * speed), e.clientX - r.left, e.clientY - r.top, true);
  }, { passive: false });

  // Mise en place : mesure la fenêtre et pose la caméra sans glisser.
  function refresh(instant) {
    if (!wide.matches) return;
    vw = view.clientWidth;
    vh = view.clientHeight;
    if (!vw || !vh) return;
    update(instant);
  }

  // Sur mobile la carte est masquée et les boutons sont désactivés : la liste seule.
  function sync() {
    const on = wide.matches;
    steps.forEach((step) => { step.querySelector('.trail__step-btn').disabled = !on; });
    refresh(true);
  }

  /* ---------- La tuile de relief, rastérisée une fois ----------
     Chrome redessine les 192 tracés de la tuile à chaque changement d'échelle, ce qui
     fait clignoter la carte. On la dessine donc une fois dans un canvas. Le SVG reste
     la source : c'est lui qu'on relit depuis le fond CSS. Si ça échoue, le fond
     d'origine reste en place. */
  function bakeRelief() {
    const relief = map.querySelector('.trail__relief');
    if (!relief || typeof HTMLCanvasElement === 'undefined') return;

    const cs = getComputedStyle(relief);
    const src = cs.backgroundImage.match(/url\(["']?([^"')]+)["']?\)/);
    const tile = parseFloat(cs.backgroundSize);
    if (!src || !(tile > 0)) return;

    // Densité plafonnée à 2 : au-delà la bitmap coûte plus de mémoire qu'elle ne rend
    // de finesse sur des traits à faible opacité.
    const density = Math.min(2, (window.devicePixelRatio || 1) * FOCUS);
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

  bakeRelief();
  sync();
  // La carte peut changer de taille sans que la fenêtre bouge (la liste la fait grandir) :
  // on suit la boîte elle-même.
  new ResizeObserver(() => refresh(true)).observe(view);
  wide.addEventListener('change', sync);
})();

/* ---------- Projets : le groupement qui suit la carte survolée ---------- */
// Le JS ne pose qu'UN état : la classe `is-active`, déplacée d'un `<li>` à
// l'autre. Tout le reste — le fondu, les décalages d'entrée, l'échelle de la
// carte — vit dans le CSS, comme `--out` du tas de
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
   `--pos`, et le CSS compose le reste — même partage que le tas de photos. */
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
    // La mesure d'audience (dernière IIFE) : quelles galeries on ouvre en grand.
    window.umami?.track('Visionneuse', { groupe: g.el.dataset.viewer || '' });
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
     du tas de photos.
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

/* ---------- Le header : il s'efface en descendant, revient en remontant ----------
   Le JS ne pose que deux classes sur `.site-header` — `is-stuck` dès que la page
   a quitté son sommet (le dégradé d'encre apparaît), `is-hidden` quand on
   descend. Tout le dessin est dans le CSS, comme `--out` du tas de photos.

   On CUMULE les déplacements dans un même sens au lieu de réagir au moindre
   pixel : l'inertie d'un trackpad envoie des deltas d'un pixel dans les deux
   sens en fin de course, et le header clignoterait. Un peu vers le haut suffit
   à le faire revenir (UP), il faut un vrai geste vers le bas pour le chasser
   (DOWN).

   Un clic sur une ancre de la page le cache et GÈLE la détection jusqu'à la
   fin du défilement lissé. Sans ça, un saut vers une section plus haute le
   laissait affiché pile par-dessus la tête de la section visée — le calage des
   ancres (`scroll-padding-top`) ne compte que le bandeau.

   En mouvement réduit on garde le comportement : c'est un changement d'état,
   pas une animation, et le CSS y coupe la transition. */
(function () {
  const header = document.querySelector('.site-header');
  if (!header) return;

  const UP = 8;
  const DOWN = 24;
  // Temps sans scroll au bout duquel un saut d'ancre est considéré comme posé.
  const SETTLE = 220;

  let last = window.scrollY;
  let run = 0;          // cumul signé du déplacement dans le sens courant
  let hold = 0;         // minuteur du gel pendant un saut d'ancre
  let ticking = false;

  const hide = (on) => {
    header.classList.toggle('is-hidden', on);
  };

  function render() {
    ticking = false;
    const y = window.scrollY;
    const d = y - last;
    last = y;

    // Tant que le header n'a pas quitté sa place dans le flux, il est chez lui :
    // ni dégradé, ni masquage.
    const top = y <= header.offsetHeight;
    header.classList.toggle('is-stuck', !top);

    if (hold) return;
    if (top) { hide(false); run = 0; return; }

    run = (d > 0) === (run > 0) ? run + d : d;
    if (run > DOWN) hide(true);
    else if (run < -UP) hide(false);
  }

  function release() {
    hold = 0;
    last = window.scrollY;
    run = 0;
  }

  // Un geste du visiteur remet le cumul à zéro : le défilement qu'il déclenche est
  // alors lu normalement, et un geste vers le bas chasse le header comme partout.
  const gesture = () => { run = 0; last = window.scrollY; };
  for (const type of ['wheel', 'touchstart', 'keydown', 'pointerdown']) {
    window.addEventListener(type, gesture, { passive: true, capture: true });
  }

  window.addEventListener('scroll', () => {
    if (hold) { clearTimeout(hold); hold = setTimeout(release, SETTLE); }
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(render);
  }, { passive: true });

  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a || a.getAttribute('href') === '#') return;
    hide(true);
    clearTimeout(hold);
    hold = setTimeout(release, SETTLE);
  });

  // Au chargement la page peut déjà être plus bas (ancre, position restaurée) :
  // le dégradé doit être là, le header reste affiché.
  render();
})();

/* ---------- Le menu mobile : le mousqueton ----------
   Sous 900px la nav du header se replie derrière un bouton dessiné en
   mousqueton : fermé au repos, son doigt s'ouvre quand le menu s'ouvre et se
   referme d'un coup sec quand il se ferme. Le JS ne pose qu'un état — la classe
   `menu-open` sur la racine et `aria-expanded` sur le bouton — et tout le
   dessin est dans le CSS.

   LE PANNEAU EST FABRIQUÉ ICI, EN CLONANT LA NAV DU HEADER, et les liens réseaux
   du footer : il n'y a qu'une liste de liens à tenir par page. C'est du chrome,
   donc la règle de la visionneuse s'applique — sans JS, `(scripting: enabled)`
   est faux, le bouton reste masqué et la nav s'affiche comme avant.

   Ouvert, il se comporte comme une modale : le reste de la page est `inert`,
   le scroll est verrouillé (par le CSS), Échap le ferme et le focus revient au
   bouton. Pas de `<dialog>` : sa couche supérieure passerait par-dessus le
   bouton, et c'est justement le mousqueton qu'on doit voir s'ouvrir. */
(function () {
  const header = document.querySelector('.site-header');
  const toggle = header && header.querySelector('.menu-toggle');
  const links = header ? header.querySelectorAll('.main-nav a') : [];
  if (!toggle || !links.length) return;

  const root = document.documentElement;
  const narrow = window.matchMedia('(max-width: 900px)');

  const panel = document.createElement('div');
  panel.className = 'menu-panel';
  panel.id = 'menu-panel';

  const nav = document.createElement('nav');
  nav.className = 'menu-panel__nav';
  nav.setAttribute('aria-label', 'Menu');
  links.forEach((a, i) => {
    const item = document.createElement('a');
    item.href = a.getAttribute('href');
    // Le rang de l'entrée, pour le retard de sa révélation : le JS pose un
    // nombre, le CSS en fait une cascade.
    item.style.setProperty('--i', i);
    const label = document.createElement('span');
    label.className = 'menu-panel__label';
    label.textContent = a.textContent.trim();
    item.append(label);
    nav.append(item);
  });
  panel.append(nav);

  const social = document.querySelectorAll('.site-footer__nav[aria-label="Réseaux"] a');
  if (social.length) {
    const foot = document.createElement('div');
    foot.className = 'menu-panel__foot';
    foot.style.setProperty('--i', links.length);
    social.forEach((a) => foot.append(a.cloneNode(true)));
    panel.append(foot);
  }

  header.after(panel);

  let open = false;

  function set(on, { focus = true } = {}) {
    if (on === open) return;
    open = on;
    root.classList.toggle('menu-open', on);
    toggle.setAttribute('aria-expanded', String(on));
    toggle.setAttribute('aria-label', on ? 'Fermer le menu' : 'Ouvrir le menu');
    for (const el of document.body.children) {
      if (el !== header && el !== panel) el.inert = on;
    }
    if (on) {
      header.classList.remove('is-hidden');
      if (focus) nav.querySelector('a').focus({ preventScroll: true });
    } else if (focus && panel.contains(document.activeElement)) {
      toggle.focus({ preventScroll: true });
    }
  }

  toggle.addEventListener('click', () => set(!open));

  // Un lien du panneau ferme le menu AVANT que le navigateur ne suive l'ancre :
  // le verrou de scroll saute dans le même tour, donc le défilement lissé part
  // de là où on était. Le header, lui, se cache pendant le saut (IIFE du header).
  panel.addEventListener('click', (e) => {
    if (e.target.closest('a')) set(false, { focus: false });
  });

  document.addEventListener('keydown', (e) => {
    if (open && e.key === 'Escape') set(false);
  });

  // Passé 900px le bouton disparaît : un menu resté ouvert n'aurait plus de
  // quoi se fermer.
  narrow.addEventListener('change', () => { if (!narrow.matches) set(false, { focus: false }); });

  // Retour par Précédent depuis une page projet : la page sort du cache avec le
  // menu dans l'état où on l'a quittée.
  window.addEventListener('pageshow', (e) => { if (e.persisted) set(false, { focus: false }); });
})();

/* ---------- Le mème d'À propos ----------
   Survoler « un concept infaisable » fait apparaître un mème au-dessus de la
   souris, qui la suit. Le HTML décide (`data-meme` porte le chemin de l'image),
   le JS ne pose que `--x`, `--y`, `--tilt` et la classe `is-on`, le CSS dessine.

   C'est du chrome, donc la règle de la visionneuse : l'image est fabriquée ici,
   et seulement au PREMIER survol — une page qui n'est jamais survolée ne la
   télécharge pas. Sans souris (tactile, stylet sans survol) il ne se passe rien,
   et le soulignement qui promet l'effet n'est même pas posé.

   La position ne saute pas sur la souris, elle la rattrape (`FOLLOW`), et
   l'image penche du côté où l'on va, d'après la vitesse horizontale : c'est ce
   qui la fait lire comme un objet qu'on traîne plutôt que comme une infobulle.
   Hors mouvement réduit seulement — sinon elle suit au pixel, sans pencher. */
(function () {
  const word = document.querySelector('[data-meme]');
  if (!word) return;
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  const still = matchMedia('(prefers-reduced-motion: reduce)');
  const FOLLOW = 0.22;     // part du reste parcourue à chaque image
  const TILT_MAX = 14;     // degrés
  const GAP = 18;          // px entre la souris et le bord de l'image
  const EDGE = 8;          // px de marge aux bords de la fenêtre

  let img = null;
  let broken = false;
  let on = false;
  let raf = 0;
  const mouse = { x: 0, y: 0 };
  const pos = { x: 0, y: 0, tilt: 0 };

  word.classList.add('is-live');

  function make() {
    img = document.createElement('img');
    img.className = 'meme-float';
    img.alt = '';
    img.setAttribute('aria-hidden', 'true');
    img.decoding = 'async';
    img.addEventListener('error', () => { broken = true; img.remove(); });
    img.src = word.dataset.meme;
    document.body.append(img);
  }

  // Où l'image doit se poser : centrée sur la souris, au-dessus d'elle, et
  // retenue dans la fenêtre. Trop près du haut, elle passe dessous.
  function target() {
    const w = img.offsetWidth;
    const h = img.offsetHeight || w * 1.64;
    const below = mouse.y - GAP - h < EDGE;
    img.classList.toggle('is-below', below);
    return {
      x: Math.min(Math.max(mouse.x - w / 2, EDGE), innerWidth - w - EDGE),
      y: below ? mouse.y + GAP + 6 : mouse.y - GAP - h,
    };
  }

  function paint() {
    img.style.setProperty('--x', `${pos.x}px`);
    img.style.setProperty('--y', `${pos.y}px`);
    img.style.setProperty('--tilt', `${pos.tilt}deg`);
  }

  function tick() {
    raf = 0;
    const t = target();
    const dx = t.x - pos.x;
    pos.x += dx * FOLLOW;
    pos.y += (t.y - pos.y) * FOLLOW;
    const lean = Math.max(-TILT_MAX, Math.min(TILT_MAX, dx * 0.35));
    pos.tilt += (lean - pos.tilt) * 0.2;
    paint();
    // La boucle s'arrête quand tout est posé, comme le parallaxe des pages projet.
    const settled = Math.abs(dx) < 0.3 && Math.abs(t.y - pos.y) < 0.3 && Math.abs(pos.tilt) < 0.1;
    if (!settled) raf = requestAnimationFrame(tick);
  }

  function snap() {
    const t = target();
    pos.x = t.x; pos.y = t.y; pos.tilt = 0;
    paint();
  }

  word.addEventListener('pointerenter', (e) => {
    if (e.pointerType !== 'mouse' || broken) return;
    if (!img) make();
    mouse.x = e.clientX; mouse.y = e.clientY;
    on = true;
    snap();                             // il éclot SOUS la souris, pas en glissant depuis le coin
    img.classList.add('is-on');
  });

  word.addEventListener('pointermove', (e) => {
    if (!on || e.pointerType !== 'mouse') return;
    mouse.x = e.clientX; mouse.y = e.clientY;
    if (still.matches) { snap(); return; }
    if (!raf) raf = requestAnimationFrame(tick);
  });

  function hide() {
    on = false;
    if (img) img.classList.remove('is-on');
  }

  word.addEventListener('pointerleave', hide);
  // La page qui défile sous une souris immobile emporte le mot : l'image, elle,
  // resterait plantée en l'air.
  addEventListener('scroll', () => { if (on) hide(); }, { passive: true });
})();

/* ---------- L'adresse de contact ---------- */
// L'adresse n'est écrite en entier dans aucun fichier du site : le HTML n'en
// porte que les deux moitiés, et le « @ » y est un contenu généré par le CSS.
// Un robot qui lit le HTML sans exécuter le JS n'y trouve donc ni adresse ni
// `mailto:`. Ici on remplace le `<span>` par un vrai lien, avec un vrai « @ »
// dans le texte — c'est ce qui le rend copiable.
(function () {
  for (const el of document.querySelectorAll('[data-mail]')) {
    const at = el.querySelector('.contact__at');
    if (!at) continue;
    at.replaceWith('@');
    const [user, domain] = el.textContent.trim().split('@');
    const link = document.createElement('a');
    link.className = el.className;
    link.href = 'mailto:' + user + '@' + domain;
    link.append(...el.childNodes);
    el.replaceWith(link);
  }
})();

/* ---------- La mesure d'audience ----------
   Umami (chargé en tête des quatre pages) compte seul les pages vues. Ce qu'on
   ajoute ici, ce sont des ÉVÉNEMENTS, et le premier sert moins à les compter
   qu'à rendre la durée de visite juste : Umami la mesure du premier au dernier
   signal d'une visite, donc quelqu'un qui lit tout l'accueil sans changer de
   page repartirait avec « 0 s ». Chaque section atteinte est un signal de plus.

   Tout passe par `window.umami?.track` : si le script est bloqué (bloqueur de
   pub, réseau), il n'y a pas d'objet, et rien ne casse. Hors de vincentw.fr,
   Umami ignore l'appel de lui-même (`data-domains`). Rien n'est intercepté :
   aucun `preventDefault`, le voile de transition garde la main sur les liens. */
(function () {
  const track = (name, data) => window.umami?.track(name, data);

  // Ne pas se compter soi-même : `?stats=off` une fois par appareil et par
  // navigateur, `?stats=on` pour revenir. C'est le drapeau qu'Umami lit
  // lui-même, et ce fichier passe AVANT lui (le sien est en `defer`), donc la
  // visite qui pose le drapeau n'est déjà plus comptée.
  const flag = new URLSearchParams(location.search).get('stats');
  if (flag === 'off' || flag === 'on') {
    try {
      if (flag === 'off') localStorage.setItem('umami.disabled', '1');
      else localStorage.removeItem('umami.disabled');
    } catch (e) { /* stockage indisponible */ }
    const url = new URL(location.href);
    url.searchParams.delete('stats');
    history.replaceState(history.state, '', url.pathname + url.search + url.hash);
  }

  // Les liens qui quittent le site, et l'adresse de contact.
  document.addEventListener('click', (e) => {
    const a = e.target.closest?.('a[href]');
    if (!a) return;
    if (a.protocol === 'mailto:') track('Mail');
    else if (/^https?:$/.test(a.protocol) && a.hostname !== location.hostname) {
      track('Lien sortant', { vers: a.hostname.replace(/^www\./, '') });
    }
  });

  // Ce qu'on a LU. Le HTML décide : `data-stat="<nom>"` sur un bloc, et
  // l'événement part la première fois qu'il reste DWELL ms à l'écran — un bloc
  // traversé d'un trait (saut d'ancre, flick) ne compte pas comme lu. Un
  // `IntersectionObserver` suffit ici, contrairement au reveal : rater un bloc
  // qu'on n'a pas vu est justement la bonne réponse. On attend le `load`,
  // qui suit l'envoi de la page vue par Umami : aucun événement ne la précède.
  const blocks = document.querySelectorAll('[data-stat]');
  if (!blocks.length || !('IntersectionObserver' in window)) return;
  const DWELL = 1500;

  const start = () => {
    const timers = new Map();
    const io = new IntersectionObserver((entries) => {
      for (const { target, isIntersecting } of entries) {
        if (isIntersecting && !timers.has(target)) {
          timers.set(target, setTimeout(() => {
            track(target.dataset.stat);
            io.unobserve(target);
          }, DWELL));
        } else if (!isIntersecting) {
          clearTimeout(timers.get(target));
          timers.delete(target);
        }
      }
    }, { rootMargin: '0px 0px -20% 0px' });   // entré dans les quatre cinquièmes hauts
    blocks.forEach((el) => io.observe(el));
  };

  if (document.readyState === 'complete') start();
  else addEventListener('load', start, { once: true });
})();
