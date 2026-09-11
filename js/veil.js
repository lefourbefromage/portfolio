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
    // Une ancre DANS la même page n'est pas une navigation — c'est le défilement
    // lissé du header, et il ne doit surtout pas être voilé.
    if (url.pathname === location.pathname && url.search === location.search) return;

    e.preventDefault();
    busy = true;
    try { sessionStorage.setItem(KEY, '1'); } catch (err) {}
    html.classList.add('is-leaving');

    // On part quand le panneau est plein, pas avant : c'est `--veil-hold` qui
    // laisse le nom se lire, et la navigation se glisse dedans.
    setTimeout(function () { location.href = url.href; },
               ms('--veil-close') + ms('--veil-hold'));
  });
})();
