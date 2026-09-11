/* ===========================================================================
   LE VOILE DE TRANSITION — chargé en TÊTE de page, sur les quatre pages.

   Pourquoi un fichier à lui, alors que le site en tient trois ? Parce que sa
   moitié « arrivée » doit s'exécuter AVANT LE PREMIER RENDU — sans quoi la page
   suivante apparaît un instant à nu avant que le voile ne la recouvre, et tout
   l'effet tombe. `main.js` charge en bas de page, il est donc hors de course. Le
   seul autre moyen serait de recopier le même bloc dans les quatre en-têtes ;
   c'est exactement le genre de doublon dont l'une des copies finit par mentir.

   LE PARTAGE HABITUEL DU SITE TIENT : le JS ne pose que des CLASSES — `is-leaving`
   et `is-entering` sur la racine — et tout le dessin vit dans la feuille de
   style, comme `--open` du parcours ou `--out` du tas de photos. Les durées
   elles-mêmes sont LUES dans le CSS (`--veil-close`, `--veil-hold`) plutôt que
   réécrites ici : il n'y a qu'un endroit où les changer.

   IL FABRIQUE AUSSI LE COLLAGE — les sept stickers du hero — parce que c'est du
   CHROME et non du contenu : sans JS il ne doit rester ni balise inerte ni image
   décorative en travers, exactement comme la visionneuse des pages projet. La
   liste des fichiers est ici, TOUTE la géométrie est dans le CSS ; ce fichier ne
   sait pas où les pièces se posent, et c'est voulu.

   LE PANNEAU D'ENCRE, LUI, N'EST PAS DU DOM : c'est un pseudo-élément de la
   racine, donc il est là dès la première image, quand `<body>` n'existe pas
   encore. Le collage, lui, peut se permettre une image de retard — au pire on
   voit un panneau nu, jamais la page à nu. Ne ramène pas les deux du même côté.

   SANS JS, RIEN. Pas de classe, donc pas de pseudo-élément, donc pas de voile —
   et le clic n'est pas intercepté. Même règle que `.js-motion` : la navigation
   ne dépend jamais de ce fichier.
   =========================================================================== */
(function () {
  var html = document.documentElement;
  var KEY = 'veil';

  // Le voile est du mouvement, et rien d'autre : en mouvement réduit on sort
  // avant d'avoir posé quoi que ce soit. Le drapeau est nettoyé au passage, pour
  // ne pas laisser un voile en attente si le réglage change en cours de visite.
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    try { sessionStorage.removeItem(KEY); } catch (e) {}
    return;
  }

  // Les durées sont dans la feuille de style, pas ici. `getComputedStyle` est sûr
  // dès maintenant : un script placé après un `<link rel="stylesheet">` attend
  // que celle-ci soit chargée.
  var ms = function (name) {
    var v = getComputedStyle(html).getPropertyValue(name).trim();
    var n = parseFloat(v);
    return isNaN(n) ? 0 : (v.slice(-2) === 'ms' ? n : n * 1000);
  };

  /* ---------- LE COLLAGE ----------
     Les sept stickers du hero, dans l'ORDRE DE PROFONDEUR — de l'arrière vers
     l'avant. Cet ordre est celui de la peinture ET celui du parallaxe, et le CSS
     s'y accroche pièce par pièce : ne le change pas d'un côté seulement. */
  var PIECES = [
    ['figma',    'sticker-figma.webp'],
    ['uiux',     'sticker-uiux.webp'],
    ['html',     'sticker-html.webp'],
    ['adobe',    'sticker-adobe.webp'],
    ['sass',     'sticker-sassless.webp'],
    ['affinity', 'sticker-affinity.webp'],
    ['github',   'sticker-github.webp']
  ];

  var art = null;

  var build = function () {
    if (art) return;
    art = document.createElement('div');
    art.className = 'veil';
    // Décoratif de bout en bout : le conteneur est masqué aux lecteurs d'écran
    // et chaque image a un `alt` vide — ce qui l'écarte aussi de la visionneuse,
    // dont le filtre est l'alternative textuelle et non une liste de classes.
    art.setAttribute('aria-hidden', 'true');

    var inner = document.createElement('div');
    inner.className = 'veil__art';
    PIECES.forEach(function (p) {
      var img = document.createElement('img');
      img.className = 'veil__sticker veil__sticker--' + p[0];
      img.src = 'assets/home/hero/' + p[1];   // chemin RELATIF : le site est servi sous /portfolio/
      img.alt = '';
      img.decoding = 'async';
      inner.appendChild(img);
    });
    art.appendChild(inner);
    mount(art);
  };

  // `<body>` n'existe pas encore quand ce fichier s'exécute. On ne l'attend pas
  // avec `DOMContentLoaded`, qui vient après TOUT le document : l'observateur
  // rend la main à l'instant où la balise s'ouvre, donc avant que le moindre
  // contenu ne soit analysé — et donc avant le premier rendu.
  function mount(node) {
    if (document.body) { document.body.appendChild(node); return; }
    var mo = new MutationObserver(function () {
      if (!document.body) return;
      mo.disconnect();
      document.body.appendChild(node);
    });
    mo.observe(document.documentElement, { childList: true });
  }

  /* ---------- L'ARRIVÉE ----------
     On ne voile QUE si l'on vient d'une page du site — le drapeau a été posé en
     partant. Quelqu'un qui arrive d'un moteur de recherche ou d'un lien direct
     n'a pas à regarder un panneau d'encre se retirer : ce serait un écran de
     chargement, pas une transition. Le bouton Précédent non plus, pour la même
     raison : on n'a rien intercepté, donc rien à raccorder. */
  try {
    if (sessionStorage.getItem(KEY)) {
      sessionStorage.removeItem(KEY);
      html.classList.add('is-entering');
      build();   // tout de suite : le collage doit être là à la première image

      // On retire la classe une fois le panneau sorti, pour ne pas laisser deux
      // pseudo-éléments plein écran en place. Le nom de l'animation est vérifié :
      // `animationend` remonte jusqu'à la racine depuis TOUTE la page, y compris
      // l'atterrissage du tas de photos.
      var off = function (e) {
        if (e && e.animationName !== 'veil-open') return;
        html.classList.remove('is-entering');
        html.removeEventListener('animationend', off);
      };
      html.addEventListener('animationend', off);
      // Filet : si l'animation ne démarre jamais (onglet en arrière-plan au
      // chargement, par exemple), la classe s'en va quand même.
      setTimeout(off, ms('--veil-hold') + ms('--veil-open') + 400);
    }
  } catch (e) { /* stockage indisponible : pas de voile, la navigation est nue */ }

  // Page arrivée sans voile (lien direct, moteur de recherche, bouton Précédent) :
  // on monte le collage une fois le reste chargé. Les 232 Ko des sept stickers ne
  // disputent alors rien au premier rendu, et ils sont en cache pour le départ.
  if (!art) addEventListener('load', function () { setTimeout(build, 0); });

  /* ---------- LE DÉPART ----------
     Un seul écouteur, sur le document, en phase de bouillonnement : il voit tous
     les liens, y compris ceux qu'une page ajouterait plus tard. */
  var busy = false;

  document.addEventListener('click', function (e) {
    if (busy || e.defaultPrevented) return;
    // Tout ce qui n'est pas un clic gauche nu ouvre ailleurs ou fait autre chose.
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

    var a = e.target && e.target.closest && e.target.closest('a[href]');
    if (!a || (a.target && a.target !== '_self') || a.hasAttribute('download')) return;

    var url;
    try { url = new URL(a.href, location.href); } catch (err) { return; }

    // `mailto:` et les liens sortants ont une autre origine : ils passent.
    if (url.origin !== location.origin) return;

    // UNE ANCRE DANS LA MÊME PAGE N'EST PAS UNE NAVIGATION — c'est le défilement
    // lissé du header, et il ne doit surtout pas être voilé. Le test se fait en
    // DEUX temps depuis que les liens internes sont sans extension : `./#projets`
    // pointe sur `/`, donc il ne porte plus le même `pathname` que l'accueil
    // ouvert sur `/index.html`, et la comparaison seule laissait passer l'ancre.
    // Le second test ne demande rien à l'URL : la cible est-elle ICI ? Sur une
    // page projet, `#projets` n'existe pas, donc le voile joue bien.
    if (url.hash && (url.pathname === location.pathname ||
                     document.getElementById(url.hash.slice(1)))) return;
    if (url.pathname === location.pathname && url.search === location.search) return;

    e.preventDefault();
    busy = true;
    build();   // filet : un clic avant la fin du chargement n'aura pas de collage sinon
    try { sessionStorage.setItem(KEY, '1'); } catch (err) {}
    html.classList.add('is-leaving');

    // On part quand le panneau est plein, pas avant : c'est `--veil-hold` qui
    // laisse le nom se lire, et la navigation se glisse dedans.
    setTimeout(function () { location.href = url.href; },
               ms('--veil-close') + ms('--veil-hold'));
  });
})();
