# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Rédigé en français : le site, ses contenus et son mainteneur le sont aussi.

## Le projet

Portfolio personnel de Vincent Waldmann. Site statique, sans framework, sans étape de build
et sans gestionnaire de dépendances : `index.html`, `css/style.css` et `js/main.js` sont
servis tels qu'ils sont écrits. Tous les textes destinés aux visiteurs sont en français.

## Lancer le site

Le serveur de dev est déclaré dans `.claude/launch.json` — démarre-le avec le panneau
navigateur (`preview_start` avec `{name: "portfolio"}`), jamais avec Bash. Il n'y a ni build,
ni lint, ni tests.

Ce n'est plus `python3 -m http.server` mais `tools/serve.py`, qui est ce module **plus une
seule règle** : servir `projet-beepz.html` à l'adresse `/projet-beepz`. C'est ce que fait
GitHub Pages, et les liens internes du site sont désormais sans extension — avec le module nu,
la navigation entre pages tombe en 404 en local alors qu'elle marche en ligne, ce qui fait
chercher un bug là où il n'y en a pas. Le « / » final reste un 404 des deux côtés, et c'est
voulu : voir « Les URL sans extension ».

**Le panneau met `style.css` et `main.js` en cache de façon agressive.** Un rechargement
ordinaire — même `navigate` avec `force: true` — continue de servir l'ancien fichier en
silence, et injecter une copie du `<script>` avec un paramètre anti-cache laisse *plusieurs*
instances des IIFE enregistrées, ce qui produit un état incompréhensible. Le rafraîchissement
fiable :

```js
for (const e of document.querySelectorAll('link[href^="css/"], script[src^="js/"]')) await fetch(e.getAttribute('href') || e.getAttribute('src'), {cache: 'reload'}); location.reload();
```

Il relit les URL **telles que la page les écrit** : elles portent un `?v=` (voir « Le
numéro de version »), et un `fetch('css/style.css')` nu rafraîchirait une autre adresse
que celle que la page charge.

Si une modification semble sans effet, compare les règles de `document.styleSheets` avec un
`fetch()` frais du même fichier avant de conclure que le code est en cause. Et quand le
panneau est masqué, les captures d'écran retardent : fie-toi aux mesures du DOM.

## Versionnement

Dépôt git sur `main`, poussé vers `git@github-perso:lefourbefromage/portfolio.git`.

`github-perso` est un alias d'hôte SSH défini dans `~/.ssh/config`, ce n'est pas une faute de
frappe : il épingle la clé personnelle avec `IdentitiesOnly yes`. Utiliser `github.com` en
clair dans une URL de remote propose la clé *professionnelle* et échoue sur
`Permission denied (publickey)`. Garde l'alias dans tout remote ajouté ici.

**Les commits signent avec l'adresse noreply de GitHub**
(`7112782+lefourbefromage@users.noreply.github.com`), posée dans le `git config` LOCAL du
dépôt — le global garde le Gmail pour le reste. Le dépôt étant public, l'auteur de chaque
commit se lit en ajoutant `.patch` à son URL : c'est la fuite d'adresse la plus sûre qui
soit, et les robots qui ratissent GitHub la connaissent. Les 26 premiers commits portent
encore le Gmail ; il a été décidé de ne pas réécrire l'historique.

### L'adresse de contact

**C'est `contact`, sur le domaine du site, et elle n'est écrite en entier dans AUCUN fichier
du dépôt** — ce fichier compris : il est public lui aussi, servi à la racine du domaine. Ni
`@`, ni `mailto:` dans `index.html`. C'est une redirection OVH vers le Gmail : si elle se
fait spammer, on la coupe ou on en change sans toucher à la boîte perso.

Le HTML porte les deux moitiés dans un `<span data-mail>`, séparées par un
`<span class="contact__at">` vide dont le CSS dessine l'arobase en `::before`. Un robot qui
lit le HTML sans exécuter le JS n'y trouve que `contactvincentw.fr`. La dernière IIFE de
`js/main.js` remplace le tout par un vrai `<a href="mailto:…">`, avec un vrai `@` dans le
texte — sans quoi l'adresse ne se copierait pas (un contenu généré n'est pas sélectionnable).

- **sans JS, l'adresse reste LISIBLE mais pas cliquable** : un `<span>`, pas d'ancre morte,
  même règle que le bouton CV. D'où `a.contact__mail:hover` et non `.contact__mail:hover` —
  le soulignement ne doit pas promettre un clic qui n'existe pas ;
- **pas de commentaire qui cite l'arobase en clair** près de l'adresse, ni dans le HTML ni
  dans le JS : c'est le test à repasser (`grep -nE "@|mailto" index.html`, hors `@media`/
  `@font-face`/`@keyframes`) ;
- une autre adresse ailleurs sur le site suit le même balisage : l'IIFE traite tout
  `[data-mail]`.

Les skills vendorisées (`.agents/`, et les liens symboliques de `.claude/skills/`) sont
ignorées par git — 5,4 Mo que `skills-lock.json`, lui versionné, permet de restaurer.

`assets/src/` est ignoré lui aussi — voir « Les assets, rangés par contexte » plus bas.

## Les assets, rangés par contexte

`assets/` ne contient plus que **quatre dossiers**, et rien en vrac à sa racine. Un
fichier se range d'après la PAGE qui le charge, pas d'après son format :

```
assets/
  home/      index.html            hero/  pile/  about/  trail/  projects/   + src/
  beepz/     projet-beepz.html     onboarding/  mails/
  jm/        projet-jm.html        hero/  sites/  marques/  jacquia/
                                   campagnes/  social/  frise/   + src/
  jimizz/    projet-jimizz.html    marque/  site/  app/  plateformes/       + src/
```

Les sous-dossiers de `home/` sont les **sections de la page** : `hero/` porte le fond, le
topo, les sept stickers et les deux SVG de titre ; `pile/` les sept photos du tas et le
tracé pointillé ; `about/` les deux carrés topo ; `trail/` la tuile de relief et le tracé
du parcours ; `projects/` les visuels des trois projets. La structure du dossier suit
celle du document — c'est ce qui permet de savoir où va un nouveau fichier sans poser la
question.

`projects/` est le seul à porter des préfixes, et ce n'est pas une entorse à la règle
ci-dessous : `jm-`, `beepz-`, `jmz-` ne répètent pas le nom du dossier, ils disent de
QUEL des trois projets la pièce vient. Sans eux, `car.webp` et `coin1.webp` se
retrouveraient côte à côte sans qu'on sache lequel va où.

**Le nom ne répète pas le dossier.** `assets/beepz/system.webp`, pas
`assets/beepz/beepz-system.webp` ; `assets/home/hero/bg.png`, pas `hero-bg.png`. Les
préfixes dataient du temps où tout était à plat.

**Chaque projet garde ses originaux dans son propre `src/`, et tous les `src/` sont hors
du dépôt** — une seule règle, `assets/*/src/`. Exports Figma, captures avant traitement,
PNG haute définition : jusqu'à 9,9 Mo la pièce, contre 30 à 140 Ko pour le `.webp` qui en
sort. Le dépôt est public et GitHub Pages le sert tel quel, donc tout ce qui y entre est
lisible de tous, historique compris. **Si tu ajoutes un visuel, dépose la source dans
`assets/<projet>/src/` et ne verse à côté que le fichier réellement servi.**

Il y a eu un `assets/src/` unique, avec un sous-dossier par projet : deux dossiers
portaient alors le même nom à deux endroits — `assets/beepz/` et `assets/src/beepz/` — et
ça se lisait comme un doublon. Le `src/` est descendu dans chaque projet pour cette seule
raison ; la règle de `.gitignore` tient toujours en une ligne.

`assets/jimizz/` suit la même règle, et ses quatre dossiers sont eux aussi les
**sections du document** — `marque/` la bande pleine largeur, `site/` le collage en
perspective et les deux mises en scène, `app/` les trois écrans du dashboard avec la
fusée et les cinq pièces, `plateformes/` les quatre captures du collage final. Ses
originaux sont dans `assets/jimizz/src/`.

`assets/jm/` a migré avec la refonte de sa page : ses sept dossiers servis sont eux aussi
des **sections du document** — `hero/` la bande photographique, `sites/` les quatre mises
en scène, `marques/` les douze vignettes, `jacquia/` la campagne et ses écrans,
`campagnes/` le collage, `social/` la grille des réseaux, `frise/` la fresque des vingt
ans — et ses originaux sont
descendus dans `assets/jm/src/`.

Il lui reste **un dossier de sources hors `src/`** : `social-network/`, 47 Mo d'exports
d'origine que `tools/build_social.py` lit là où ils sont tombés. C'est pour lui seul que
`.gitignore` garde `assets/jm/*` et ré-autorise les dossiers servis un par un ; le jour où
ce script ira chercher ses sources dans `src/`, ces lignes se réduisent à `assets/*/src/`.

**`tools/build_social.py` sert de nouveau** : il produit les seize `.webp` de
`assets/jm/social/`, la grille des réseaux de `projet-jm.html` (voir la page J&M). Il lit
ses sources dans `social-network/`, justement. **`tools/build_shots.py`, lui, ne sert plus
aucune page** : laissé en place, la matière est bonne et peut revenir, mais ne le prends
pas pour une dépendance vivante — ses sources sont d'ailleurs parties avec le ménage
ci-dessous.

**Le ménage du 11 septembre 2026.** Tout ce qu'aucune page ni aucun script ne lisait
plus a été retiré, à la demande de Vincent : `beepz/mails/board.webp` et la police
`ClashDisplay-Variable-partial.ttf` du dépôt ; et hors dépôt, dans la Corbeille
(`~/.Trash/portfolio-originaux-2026-09-11/`, arborescence conservée), les deux
maquettes PNG, tout `assets/beepz/src/` (aucun script ne produit les visuels de Beepz),
la source de la marque retirée (`image 50.png`) et les neuf exports de `social-network/`
écartés de la grille. **Les maquettes de J&M et de Jimizz et les sources de Beepz ne
sont donc plus sur le disque** : réexporte-les depuis Figma si tu en as besoin. Chaque
source citée par `build_jm.py`, `build_jimizz.py`, `build_social.py` et
`build_projects.py` est restée, vérifié manifeste par manifeste.

## La mise en ligne

Le site est publié sur **GitHub Pages**, en *Deploy from a branch* : branche `main`, dossier
racine. Il n'y a **ni workflow ni étape de build** — GitHub sert le dépôt tel quel, donc
**le dépôt EST le site**. Un fichier ajouté à la racine est en ligne peu après le push, sans
rien déclarer nulle part.

**L'adresse est `https://vincentw.fr`**, domaine pris chez OVH le 11 septembre 2026. Le fichier
`CNAME` à la racine du dépôt porte ce nom : c'est lui qui déclare l'apex comme forme canonique,
et **GitHub redirige `www` vers l'apex tout seul**, il n'y a rien à configurer pour ça. Ne le
supprime pas — et ne touche pas au bouton *Remove* de Settings → Pages, qui l'effacerait.

La zone DNS chez OVH tient en trois blocs. Les quatre `A` (`185.199.108–111.153`) et les quatre
`AAAA` (`2606:50c0:8000–8003::153`) sur l'apex, qui sont les adresses de GitHub Pages. Un
`CNAME` sur `www` vers `lefourbefromage.github.io.` — **avec le point final**, sans quoi OVH
fabrique `…github.io.vincentw.fr`. Et les trois `MX` plus le `SPF` d'OVH, qui portent
l'adresse de contact du site — une **redirection OVH** vers le Gmail de
Vincent, pas une boîte (voir « L'adresse de contact ») ; le mode textuel de la zone **remplace
tout**, donc ne les perds pas au passage.

Les défauts OVH ont été retirés : le `A` de parking vers `213.186.33.5`, le `ftp` en `CNAME`, et
le `TXT` `"3|welcome"` sur `www`. Ce dernier **empêchait** la création du `CNAME` — un `CNAME`
ne peut coexister avec aucun autre enregistrement sur le même nom.

Il y a eu un workflow `.github/workflows/pages.yml` ici, retiré : il misait sur
`actions/configure-pages` avec `enablement: true` pour activer Pages tout seul, et cette
étape échoue sur `Create Pages site failed. Error: Resource not accessible by integration`.
Le `GITHUB_TOKEN` d'un workflow ne peut pas **créer** un site Pages qui n'existe pas encore,
même avec la permission `pages: write`. Le passage par Settings → Pages est obligatoire de
toute façon, donc la source par branche fait le même travail sans rien à maintenir.

Trois conséquences à ne pas oublier :

- **le dépôt est public**, c'est ce qui rend Pages gratuit. Tout ce qui est commité ici est
  lisible de tous, historique compris : pas de clé, pas d'adresse privée, pas de brouillon
  qu'on ne veut pas voir ;
- **le site est servi depuis la RACINE du domaine**, et non plus depuis `/portfolio/`.
  **Garde quand même tous les chemins relatifs** (`assets/home/pile/photo1.png`, pas
  `/assets/home/pile/photo1.png`) : la raison d'origine a disparu, mais c'est ce qui laisserait
  le site fonctionner sous un sous-chemin, et c'est surtout ce qui interdit les URL à dossier —
  voir juste en dessous ;
- **Jekyll tourne** sur ce mode de publication, d'où le `.nojekyll` à la racine. Sans lui, un
  fichier ou un dossier commençant par un souligné serait ignoré et ne serait jamais servi.
  Ne le supprime pas.

### Les URL sans extension

Les liens internes ne portent pas de `.html` : `projet-beepz` et non `projet-beepz.html`, `./`
et `./#projets` pour l'accueil. **Aucun fichier n'a été déplacé pour ça** — GitHub Pages sert
`projet-beepz.html` à l'adresse `/projet-beepz` de lui-même, en 200 direct et sans redirection.
Les liens restent **relatifs**, aucun `/` absolu n'a été introduit.

**Ne convertis pas les pages en dossiers** (`projet-beepz/index.html`), qui est pourtant la
manière habituelle d'obtenir des URL propres. Elle donne des adresses à slash final, et **à
`/projet-beepz/` tous les chemins relatifs se résolvent depuis `/projet-beepz/`** :
`css/style.css` deviendrait `/projet-beepz/css/style.css`, et la page se chargerait sans style
ni images. C'est pour ça que `/projet-beepz/` rend un 404 en ligne comme en local — c'est une
bonne nouvelle, pas un défaut.

**Les anciennes URL en `.html` restent servies**, GitHub Pages ne sachant pas rediriger côté
serveur. Sans conséquence pour un visiteur, mais un moteur de recherche y voit deux adresses
pour un même contenu — d'où le `<link rel="canonical">` que porte désormais chaque page, et
qui déclare la forme sans extension. Il est posé avec les balises de partage, voir juste en
dessous : les deux disent la même adresse, et il n'y avait pas de raison d'en tenir deux.

### L'icône et l'image de partage

**Quatre fichiers, et ils sont à la RACINE du dépôt, pas dans `assets/`.** Ce n'est pas une
entorse au rangement par page, c'est ce que ce rangement implique : `assets/` se range
d'après la PAGE qui charge un fichier, or ces quatre-là n'appartiennent à aucune page. Deux
d'entre eux sont même sondés **à un chemin fixe** — `/favicon.ico` et `/apple-touch-icon.png`
— par des agents qui ne lisent jamais le `<head>`. Les mettre ailleurs, c'est un 404 chez
eux.

```
favicon.svg           net à toute taille, c'est lui qui gagne partout où il est compris
favicon.ico           16 + 32 + 48, pour le reste et pour `/favicon.ico`
apple-touch-icon.png  180x180, iOS. OPAQUE et SANS arrondi : iOS pose son propre masque
social-image.png      1280x640, la carte de partage
```

**Les trois icônes sont produites par `tools/gen_favicon.py`**, jamais dessinées à la main :
la marque est le **W de Clash Display à la graisse 700**, celle du logo du header, en crème
sur un carré d'encre — aucune couleur de plus. Son contour est extrait de la police, donc il
suit la police. Changer de lettre tient en une constante (`MARK`). Voir `tools/README.md`
pour les trois pièges de ce script.

**L'ordre des trois `<link>` compte** : le navigateur retient la DERNIÈRE déclaration qu'il
sait lire, donc le SVG passe après l'ICO.

**Les URL des balises `og:` sont ABSOLUES, et c'est la SEULE entorse du site à la règle des
chemins relatifs.** Un robot de réseau social ne résout pas une URL relative — il ne charge
pas la page, il lit le HTML. Le domaine est donc écrit en clair dans les quatre `<head>` :
si l'adresse change, ce sont ces lignes-là qu'il faut reprendre, avec le `CNAME` et la zone
DNS.

**`twitter:card` est seul de sa famille**, et il faut que ça le reste : X comme la plupart
des autres retombent sur les `og:` pour le titre, le texte et l'image. Redire chaque chaîne
en `twitter:` ferait deux jeux à tenir d'accord, et c'est toujours le second qui ment.

**L'image de partage est la même pour les quatre pages** — le hero de l'accueil, fourni par
Vincent. Elle est en **1280x640**, soit le 2:1 exact que veut X ; Facebook recadre vers son
1,91:1 en rognant une quinzaine de pixels en haut et en bas, ce que la composition, centrée
et margée, absorbe sans rien perdre. Son alpha a été retiré à l'import : il était
uniformément opaque, donc il ne portait rien. Le jour où chaque page projet mérite sa propre
carte, `og:image` est déjà par page — il n'y a qu'un chemin à changer.

**`og:image:width` et `-height` ne sont pas décoratifs** : sans eux, les réseaux affichent
une carte sans image le temps du premier passage de leur robot. Si tu changes l'image, change
les deux nombres.

## Système de design

### Palette : quatre couleurs

Tout est défini dans `:root`. **N'introduis pas de cinquième couleur** sans le demander.

| Token | Valeur | Usage |
|---|---|---|
| `--cream` | `#fef1da` | Blanc cassé : couleur de texte sur fond foncé — c'est le cas partout — **ou** fond des rares surfaces claires (pastilles et cartes du parcours) |
| `--navy` | `#172247` | Bleu foncé : couleur de texte, ou fond foncé |
| `--green` | `#4f914f` | Touche de couleur sur certains éléments |
| `--pink` | `#f8d0ee` | Touche de couleur, **sur fond foncé uniquement** |

Corollaire à ne pas oublier : sur fond sombre le texte est **crème, jamais blanc pur**.
`body` porte déjà `color: var(--cream)`.

### L'axe des bleus

Tous les bleus du site partagent la **teinte 226**. Seules la luminosité et la saturation
varient, et la saturation *baisse* quand la couleur s'éclaircit — c'est ce qui donne des
bleus d'encre plutôt que des bleus électriques. Un bleu à saturation 80 % dans les tons
moyens jure avec le reste du site ; c'est un écart mesuré et écarté délibérément.

- `--ink` `#060d22` — `hsl(226 70% 8%)`. Fond du site, et pied du ciel du parcours. Ce fut
  aussi l'encre de la carte topographique, dont les courbes sont désormais tracées en crème.
- `--ink-rgb` `6 13 34` — pour les opacités : `rgb(var(--ink-rgb) / .32)`.
- `--cream-rgb`, `--navy-rgb` — même usage pour les deux autres.

**Ne réintroduis jamais une opacité en `rgba()` codée en dur.** La section parcours en a
compté jusqu'à dix, à neuf opacités différentes, ce qui rendait tout changement manuel.

Exceptions restant hors palette, à trancher un jour : `#44d444` (pastille « Disponible »),
`#4258a2` (bordure du badge de localisation), `#fffaf0` (fond des cartes du parcours).

### Typographie

Trois familles, toutes auto-hébergées dans `fonts/` en woff2 variable.

- **Clash Display** (`--font-display`, graisses 200–700) — titres en bold, ainsi que les
  sous-titres et les labels.
- **Inter** (`--font-body`, graisses 100–900) — texte courant, en regular.
- **EB Garamond** (`--font-serif`, graisses 400–800) — **en italique seulement**. Réservé à
  quatre usages, tous décidés par la maquette : les œils des **quatre** sections, les mots mis
  en avant dans le texte d'À propos, l'année des cartes d'étape, et le « Avancement » du HUD. C'est la respiration du reste : ne l'étends pas sans le demander.
  S'y ajoutent deux usages demandés depuis, par les maquettes de Vincent : la ligne de
  sous-titre des cartes projets (`.pcard__tag`), et « Vincent » dans l'intro du hero,
  **en mobile seulement** — l'affiche mobile le veut, le desktop garde Clash.

**L'interlignage des grands titres n'est pas le même partout sur les pages projet**, et
c'est mesuré, pas choisi : les titres de couverture (une seule ligne) sont à 1,12, les
titres d'introduction (plusieurs lignes) à **1,24** — 62 px pour 50 px de corps, valeur
que donnent les deux maquettes, J&M comme Jimizz. La page J&M a longtemps porté 1,12
partout, ce qui serrait ses titres de six pixels par ligne ; la règle vit maintenant
dans `.proj-intro .proj-title` et vaut pour les deux pages. Ne la remonte pas dans
`.proj-title`, elle ne concerne que ce qui a plusieurs lignes.

`body` porte `--font-body` ; `--font-display` est appliqué explicitement aux onze sélecteurs
de titres et de labels. Un nouvel élément de texte hérite donc d'Inter par défaut, ce qui est
le comportement voulu.

**Le woff2 de Garamond ne contient QUE l'italique**, sous-ensemble latin + accents français,
29 Ko. Il est produit depuis la variable Google Fonts (`EBGaramond-Italic-VariableFont_wght.ttf`)
avec fontTools ; le `@font-face` est déclaré en `font-style: italic`. Écrire du Garamond droit
donnerait un faux romain synthétisé par le navigateur — ne le fais pas, ou réexporte le romain.
Son œil est plus petit que celui d'Inter : `.about__hl` compense par un `font-size: 1.08em`,
sinon les mots en avant paraissent en retrait au lieu d'en relief.

## Le bandeau de chantier

Un bandeau **rose et collant** annonce en tête des **quatre** pages que le site est en
construction et que des bugs peuvent apparaître. **Il est temporaire** : le retirer, c'est
le bloc « Le bandeau de chantier » de `css/style.css` — qui emporte avec lui le
`scroll-padding-top` et la règle des écrans étroits — et le `<div class="banner">` en tête
des quatre pages. Rien d'autre : le seul endroit du site qu'il touche, la tête du parcours,
se recale tout seul (voir plus bas).

**Le rose EN FOND est la seule entorse à la règle « le rose est une touche de couleur, sur
fond foncé uniquement »**, et elle est assumée : c'est ce qui le fait sortir d'une page
sombre de bout en bout, et c'est ce qu'on lui demande. Aucune cinquième couleur pour
autant — le texte, les hachures du bord bas et la pastille qui bat sont de l'encre.

**Sa hauteur est un token, `--banner-h`, et pas une hauteur libre**, parce que quatre choses
la lisent :

- la barre elle-même (`min-height`) ;
- **le header**, collant JUSTE SOUS elle (`top: var(--banner-h, 0px)`) — voir « Le header »
  plus bas. Même repli à `0px` que la tête du parcours, et pour la même raison ;
- le calage des ancres, `scroll-padding-top` sur `html` — sans quoi un lien du header
  poserait sa section SOUS la barre. Il ne concerne que le saut vers un fragment et
  `scrollIntoView` : les `scrollTo` du mode auto du parcours, qui visent des positions
  calculées, ne sont pas touchés ;
- **la tête du parcours**, seule chose du site que le bandeau déplace. La scène est
  épinglée à `top: 0`, donc la barre passerait sur son œil ; son `padding-top` vaut donc
  `calc(var(--banner-h, 0px) + …)`. **Le repli à `0px` n'est pas décoratif** : c'est lui qui
  rend au titre son calage d'origine le jour où le bandeau part, sans avoir à repasser dans
  la règle du parcours.

Sous 520px les deux phrases ne tiennent plus sur une ligne : `--banner-h` passe à 58px et
les quatre lecteurs suivent. Le seuil est mesuré (460px de texte à 11px de corps), pas choisi.

**Il est à `z-index: 8000`, donc SOUS le voile de transition** (9000) : entre deux pages,
c'est le panneau d'encre qui couvre tout, bandeau compris. La visionneuse, elle, est un
`<dialog>` en couche supérieure et passe devant sans rien avoir à déclarer.

Aucun JS, aucune fermeture : il n'y a rien à mémoriser, et il doit rester sous les yeux tant
que le débogage n'est pas fini.

### Le numéro de version

Le bandeau se termine par une pastille `v0.N` (`.banner__version`), demandée par Vincent
pour voir **depuis son téléphone** si une mise en ligne est arrivée. **N est le numéro du
commit qui la livre** — le nombre de commits de `main` plus un —, donc il se lit dans
l'historique et il n'y a rien à retenir : v0.25 est le 25e commit.

**Lance `python3 tools/bump_version.py` juste avant chaque commit qui touche au site.** Il
réécrit les quatre pages, et il est idempotent : le relancer avant de commiter redonne le
même numéro. Ne l'édite pas à la main.

**Le même numéro est posé en `?v=` sur `css/style.css`, `js/veil.js` et `js/main.js`**, et
c'est ce qui rend l'étiquette digne de foi. Sans lui, un navigateur mobile peut servir le
HTML neuf avec le CSS ou le JS de la veille — c'est exactement ce qui a fait croire à un
correctif raté. Une URL qui change ne peut pas venir du cache, donc lire v0.N, c'est savoir
que les trois ressources sont de la même livraison. Ce qui peut encore retarder, c'est le
HTML lui-même : GitHub Pages le sert avec dix minutes de cache.

Le jour où le bandeau part, la pastille part avec lui ; les `?v=` peuvent rester, ils ne
coûtent rien et continuent de protéger les mises en ligne.

## Le header

**Il est collant, et il s'efface quand on descend** : un geste vers le bas le fait remonter
sous le bandeau, le moindre geste vers le haut le fait revenir. Demandé par Vincent, sur les
quatre pages — c'est le même `<header class="site-header">` partout.

**`sticky` et pas `fixed`**, pour la même raison que tout le reste : il garde sa place dans le
flux, donc rien sous lui n'a à être décalé d'une hauteur à recopier, et au sommet de la page
il est exactement là où il a toujours été. Visuellement c'est la même chose. Il est à
`z-index: 7000` — sous le bandeau (8000), qu'il traverse en s'effaçant, et sous le voile
(9000).

**Le partage habituel** : le JS (`js/main.js`, dernière IIFE) ne pose que deux classes,
`is-stuck` dès que la page a quitté son sommet et `is-hidden` en descendant ; le dessin est
dans le CSS.

- **le dégradé d'encre est un `::before` pleine largeur** (le header, lui, reste borné à
  1512px) qui DÉBORDE sous lui de `--header-fade` : c'est ce qui le fond dans la page au lieu
  de tracer un bord. Il n'apparaît qu'avec `is-stuck`, sans quoi il assombrirait le haut du
  panneau du hero au chargement ;
- **le masquage remonte de sa hauteur PLUS `--header-fade`**, sinon la frange du dégradé
  resterait visible sous le bandeau ;
- **les déplacements se CUMULENT dans un même sens** (8px vers le haut pour revenir, 24px vers
  le bas pour partir) : l'inertie d'un trackpad envoie des deltas d'un pixel dans les deux
  sens en fin de course, et un seuil nul le ferait clignoter ;
- **un clic sur une ancre de la page le cache et gèle la détection** jusqu'à 220ms sans
  scroll. Sans ça, un saut vers une section plus HAUTE le laissait affiché pile sur la tête
  de la section — `scroll-padding-top` ne compte que le bandeau, et il ne faut pas lui
  ajouter le header : les sauts vers le bas se poseraient 70px trop bas, et celui vers
  `#parcours` avant l'épinglage de la scène ;
- **il revient au clavier** (`:has(:focus-visible)`) — pas `:focus-within`, qui le garderait
  affiché après un clic de souris sur un lien du menu, pendant le saut.

Remonter dans le parcours le fait revenir par-dessus la tête de la carte, y compris pendant
une marche du mode auto vers l'arrière. C'est le comportement demandé — il suffit de
redescendre d'un cran.

### En mobile : le mousqueton

Sous 900px la nav se replie derrière un bouton rond dessiné en **mousqueton** — demandé
par Vincent, qui trouvait la nav en seconde ligne « posée ». Fermé au repos ; à
l'ouverture son doigt pivote vers l'intérieur et le mousqueton se balance ; à la
fermeture le doigt **claque** — une courbe qui dépasse, le seul rebond du site, et c'est
voulu. La barre tombe de 105 à 68px.

- **le dessin est dans les quatre pages** (`.menu-toggle`, un SVG en viewBox 24 × 32) :
  un D asymétrique, un bec en haut, et le doigt dans un `<g>` avec sa bague de
  verrouillage. **Le doigt pivote autour de sa charnière** (`transform-origin: 17px 25px`,
  en unités du viewBox grâce à `transform-box: view-box`) : si tu retouches le tracé,
  recale l'origine sur le bas du doigt. Sans la bague, à 20px de haut, il se lisait comme
  un trombone ;
- **le panneau est fabriqué par le JS en clonant la nav du header**, plus les liens réseaux
  du footer : aucune liste de liens à tenir en double. Il est posé juste après le header,
  en `fixed`, à `z-index: 6990` — SOUS la barre, pour que le logo, « Discutons » et le
  mousqueton restent en place pendant qu'il se déroule (`clip-path`, du haut vers le bas) ;
- **pas de `<dialog>`**, contrairement à la visionneuse : sa couche supérieure passerait
  par-dessus le bouton, et c'est justement le mousqueton qu'on doit voir s'ouvrir. Le
  comportement de modale est donc fait à la main : reste de la page en `inert`, scroll
  verrouillé, Échap, focus rendu au bouton. **Le verrou est sur `html` SEUL** : l'avoir mis
  aussi sur `body` faisait disparaître le bandeau et le header dès qu'on ouvrait le menu
  au milieu de la page — plus aucun moyen de le refermer. `html` portant `overflow-x: clip`,
  l'`overflow` de `body` n'est plus reporté sur la fenêtre ; `body` devient alors son propre
  conteneur de défilement, et les deux barres collantes se recalent sur lui, tout en haut
  du document. Teste toujours l'ouverture APRÈS avoir scrollé. Le mode auto du parcours est débrayé menu ouvert, par un
  garde dans `targetFor()` ;
- **un lien du panneau ferme le menu AVANT que l'ancre ne soit suivie** : le verrou saute
  dans le même tour, donc le défilement lissé part de là où on était, et le header se
  cache pendant le saut ;
- **tout est sous `@media (scripting: enabled)`** : sans JS, ni bouton ni panneau, et la
  nav retombe en seconde ligne comme avant. Si `main.js` ne charge pas, le bouton est
  mort — la nav du footer reste, et c'est un risque accepté plutôt qu'un saut de mise en
  page à chaque chargement ;
- les entrées portent le numéro de leur section (`01.` À propos, `02.` Parcours, `03.`
  Projets) en Garamond italique vert, et un filet pointillé qui se trace de gauche à
  droite — le trait du parcours. C'est le sixième usage du Garamond.

## La structure de la page

`Hero > À propos > Parcours (« Carnet de routes ») > Projets > Contact > Footer`, dans cet ordre, et la nav du
header comme celle du footer pointent toutes vers des sections qui existent bel et bien —
dans l'ordre de la page, elles aussi. À propos passe **avant** projets : c'est ce que veut la
maquette, et c'est ce qui met la section à cheval avec le tas de photos du hero.

`html` **et `main`** portent `overflow-x: clip` : en s'en allant, les photos du tas grossissent
et dérivent hors du cadre, et sans ça un ascenseur horizontal apparaît. Il en faut sur les
deux — la règle du root ne retient pas ce débordement-là, seul le clip du conteneur pleine
largeur l'arrête. `clip` et non `hidden` : ni l'un ni l'autre ne crée de conteneur de
défilement ici, donc le `position: sticky` du parcours n'est pas affecté (vérifié).

**Le fond du site est sombre de bout en bout**, parcours compris. Il l'a été *sauf* pour le
parcours, qui était crème ; cette inversion a été retirée. La carte porte à la place son
propre ciel (`--trail-sky`, voir plus bas), un dégradé de `--navy` vers `--ink` : le seul
écart de valeur de la page, et il reste sur l'axe des bleus. Les seules surfaces claires
restantes sont les cartes d'étape du parcours. N'introduis pas de section claire.

Les sections plates partagent trois primitives — `.section` (largeur max et rythme vertical),
`.section__eyebrow` / `.section__title` / `.section__lede` — et la pastille `.todo` qui
signale un contenu encore à écrire. Le parcours garde ses propres `.trail__eyebrow` et
`.trail__heading` — non plus pour inverser ses couleurs, mais parce que sa tête est posée
sur la carte et non dans le rythme vertical de `.section`.

**Trois plafonds tiennent toute la typographie du site**, demandés par Vincent après que
l'échelle a paru zoomée : **titres 50px, œils et sous-titres 30px, textes 20px**. Ils valent
partout — accueil, parcours et pages projet — avec **une seule exception, les deux titres de
couverture** (`.hero__title-line` de l'accueil, ≈113px en `cqw` et calé sur la maquette Figma ;
`.case-hero__title`, 112px), qui sont du display et restent hors barème. Quand tu abaisses un
plafond, **remets le coefficient `vw` à l'échelle** (`k × plafond / ancien max`) au lieu de
couper le seul maximum : la rampe atteint alors son plafond à la même largeur de fenêtre
qu'avant, et le responsive ne bouge pas.

**Les quatre sections portent LA MÊME tête**, et c'est une consigne : œil en Garamond italique
`clamp(20px, 2.12vw, 30px)`, numéro d'ordre en vert, titre en Clash bold et en casse normale
`clamp(32px, 3.48vw, 50px)`, le tout centré. Il y a eu trois têtes différentes sur cette page —
capitales espacées roses pour projets et contact, Garamond 18/25px pour À propos et le
parcours, puis la grande version de la maquette arrivée par les projets. **Ne les fais pas
revenir.**

Les sélecteurs sont **groupés exprès** dans une seule déclaration
(`.section__eyebrow, .about__eyebrow, .trail__eyebrow` et de même pour les titres) : plus rien
ne peut diverger sans qu'on le voie. Ne redonne pas une taille propre à l'une des trois
familles de classes — c'est exactement ce qui avait produit les trois têtes.

**Le rapport titre / œil vaut ~1,7**, et les termes du `clamp` de l'œil valent 0,60 fois ceux
du titre — **borne basse comprise** (20/32 = 0,625), sinon la proportion se perd sous ~700px de
large, là où les deux clamps se figent sur leur minimum. C'était 0,62 quand la tête montait à
66/41 ; les deux plafonds (50 et 30) le ramènent à 0,60, un écart de 3 % qui ne se voit pas.
Si tu retouches les tailles, garde le rapport plutôt que les valeurs.

Deux exceptions, et elles sont motivées :

- **le parcours est aligné à gauche** (`.trail__intro`), son titre étant un calque dans le coin
  de la carte et non un bloc dans le flux ; son œil est aussi légèrement retenu (crème à 82 %)
  parce qu'il est posé sur le terrain ;
- **le titre de couverture du parcours est une vignette** : le carton fait au plus 330px de
  large, où 50px ne tiendrait pas. Il se règle donc sur `--card-w` et non sur la largeur de
  l'écran (`calc(var(--card-w) * .089)`, et `.055` pour l'œil — le même rapport 0,62). Ce n'est
  pas une quatrième taille, c'est le même titre en réduction.

Les quatre œils portent un numéro d'ordre : `01.` À propos, `02.` parcours, `03.` projets,
`04.` contact.

`html` porte `scroll-behavior: smooth`, sous `prefers-reduced-motion: no-preference`. Cliquer
une ancre qui traverse le parcours le fait donc défiler d'un trait : c'est voulu, la caméra
suit image par image sans casser.

## Le hero : un repère fixe adressé en pourcentages

**Deux boîtes, à ne pas confondre.** `.hero__panel` fait `aspect-ratio: 1472 / 730` — presque
2/1 — mais le **cadre Figma reste 1472 × 599**, porté par `--frame` et appliqué à
`.hero__content` et `.hero__decor`, calés EN HAUT du panneau. La hauteur en plus s'ouvre donc
en dessous, sans déplacer d'un pixel le titre, les badges ni les onze éléments du décor ; c'est
elle qui laisse la place au « Scroll to explore » et au tas de photos. Si tu remets le décor
sur la hauteur du panneau, tout descend proportionnellement.

`.hero__panel` est aussi le contexte de container query (`container-name: panel`) : les `cqw`
ne dépendent que de la largeur, donc ils sont les mêmes dans les deux boîtes. Chaque élément
décoratif de `.hero__decor` est positionné en **pourcentage du cadre de 599**, et les tailles
de texte sont en `cqw`. Donc quand une demande est formulée en pixels (« descend la ligne de 10px »), convertis
contre cette taille de référence : **10px ≈ 0,679 % en horizontal, ≈ 1,669 % en vertical**.
La rotation de chaque sticker vit dans sa règle `.sticker-N` sous forme de `--rot`, pas dans
un `transform`.

Pour placer un élément par rapport à un tracé SVG décoratif (par exemple « mets UX au départ
de la flèche »), lis le point fractionnaire dans le `d` du SVG, multiplie-le par le `width:%`
de l'élément et par 1472/599 pour la composante verticale, puis ajoute ses `left`/`top`.

**Les stickers sont de purs décors, et ils doivent le rester.** Il y a eu ici un effet de
décollage — on prenait un sticker au pointeur, un coin se soulevait en 3D et revenait en
place. Vincent l'a fait retirer : il ne servait rien, personne ne pense à essayer, et il
coûtait une IIFE, quatre variables CSS et un `pointer-events: auto` qui rouvrait le décor
aux événements. `.hero__decor` est de nouveau en `pointer-events: none` de bout en bout,
et `.decor--sticker` ne porte plus que sa rotation de repos et son ombre. Ne le remonte
pas.

**En mobile (≤ 900px), le hero est une AFFICHE dessinée par Vincent** (maquette de 810px
de large, hors dépôt) : une rangée de trois stickers (HTML, Figma, Affinity), l'intro et le
titre sur toute la largeur, une rangée de quatre (Adobe, Github, UI/UX, Sass & Less), puis
le « Scroll to explore » et le collage, agrandis. Elle a remplacé deux versions intermédiaires
— texte centré dans un panneau nu, puis stickers éparpillés autour — : ne les fais pas
revenir.

Même convention que le desktop : un **cadre de 778 × 1014 px de maquette**, tout posé en %
de ce cadre, les textes en `cqw`. La composition se met donc à l'échelle d'un seul tenant, à
toute largeur — ce qui veut dire aussi qu'elle grandit sur tablette (941px de haut à 768).

- **La hauteur du cadre est DÉDUITE, pas dessinée.** Le « Scroll to explore » appartient au
  tas de photos, qui remonte de `--bite` sur le panneau. La maquette le pose à 96,5vw sous
  le haut du panneau ; il tombe à 28,7vw au-dessus de son bas (30,75vw de morsure moins
  2,04vw de marge dans la scène) : le panneau fait donc 125,2vw pour 96vw de large, soit
  778 × 1014. **Toucher à `--bite` ou à la largeur de la scène en mobile oblige à
  recalculer ce rapport**, sinon le « Scroll to explore » monte sur les stickers ;
- le hero est bordé de **2vw** (16px sur 810), d'où un panneau de 96vw ;
- les stickers sont posés par leur **centre** (`translate: -50% -50%`, que ces stickers ne
  portent nulle part ailleurs — il se compose avec `--rot` sans l'écraser). Leurs
  rotations se lisent sur l'inclinaison du TEXTE de chaque sticker et pas sur sa boîte :
  plusieurs dessins sont déjà penchés dans le fichier, et le triangle de Github est
  presque carré, sa boîte ne dit rien de son angle ;
- **les badges « Basé en France » / « Disponible » sont masqués en mobile** : l'affiche ne
  les montre pas. Les petites lignes aussi, leur géométrie n'existant qu'au cadre de 599 ;
- **« Vincent » passe en Garamond italique en mobile**, comme sur l'affiche. Le desktop
  garde Clash.

Mesuré à 390px, ramené aux coordonnées de la maquette : intro, titre, stickers et « Scroll
to explore » tombent à 0–12px de maquette de leur place, et rien ne se touche de 360 à
768px.

**Mesure ça photos posées** : le panneau masqué gèle `pile-land` sur sa première image, où
les photos sont décalées. Termine les animations
(`document.getAnimations().forEach(a => a.finish())`) avant de lire quoi que ce soit — une
mesure prise sans ça s'était trompée de près du double.

## Le tas de photos (`js/main.js`, première IIFE)

Sous le hero, à cheval sur le haut d'À propos. Tout — le « Scroll to explore », le tracé
pointillé et les sept photos — est posé en **pourcentage d'un même cadre de référence**, 1472
× 490, comme les stickers du hero. La composition se met donc à l'échelle d'un seul bloc, et
les coordonnées du `d` du tracé sont celles de ce cadre (même viewBox, même rapport).

**L'échelle du collage est une règle, pas un réglage : il fait la largeur du titre du hero.**
949 sur 1472, mesuré des deux côtés. C'est le repère à reprendre si tu retouches les tailles —
une première lecture de la maquette l'avait fait une fois et demie trop grand, jusqu'à occuper
toute la largeur, ce qui ne ressemblait plus à rien.

**Les PNG sont à plat** : plus de rotation ni d'ombre cuites dedans, seulement le cadre crème.
La rotation de repos vit dans `--rot` de chaque règle `.pile__photo--N` (jamais dans un
`transform`) et l'ombre est un `box-shadow`. Elle ne se voit presque pas sur le fond d'encre —
c'est sur les photos de dessous qu'elle travaille, et c'est ce qui fait tenir l'empilement.
`photo1` à `photo7` sont de gauche à droite dans la maquette.

**L'empilement est décidé par des `z-index` explicites, pas par l'ordre du DOM.** Ce sont les
quatre couches de la maquette, et elles sont données :

| couche | photos |
|---|---|
| 1 (au fond) | 1 et 7 |
| 2 | 4 |
| 3 | 3 et 6 |
| 4 (devant) | 2 et 5 |

Le tracé est en `z-index: 0` (donc sous tout : il disparaît derrière la photo du randonneur et
ressort en dessous) — et son `inset` porte un **bas négatif** (-20,41 %, soit 100 unités de
cadre) pour qu'il descende dans le padding haut d'À propos et meure juste au-dessus de l'œil de
section, comme sur la maquette. Le `d` s'arrête à **510** et pas à 590 : c'est ce qui laisse
36px de dégagement au-dessus de l'œil, sans quoi le dernier tiret vient buter dessus. Pour le
raccourcir, corrige le `d` et **pas** l'inset — réduire la boîte remet tout le tracé à
l'échelle au lieu de l'écourter. Rien ne le rogne : `container-type` applique une containment de
layout, pas de peinture. Son viewBox vaut donc 1472 × 590, pas 1472 × 490 et le « Scroll to explore » en `z-index: 5`, au-dessus de tout. L'ordre du
DOM suit quand même ces couches — `1, 7, 4, 3, 6, 2, 5` — mais pour une autre raison : c'est
lui que lit `:nth-of-type` pour décaler l'animation de chargement, qui doit poser les photos de
l'arrière vers l'avant. Changer l'un sans l'autre désynchronise l'empilement et le décalage.

**Le raccord tient à une seule marge négative.** `--bite` (8 % de la largeur du cadre, soit
118px) dit de combien le CADRE remonte sur le hero ; `.pile__scene` porte
`margin-top: calc(-1 * var(--bite) - clamp(20px, 3vw, 40px))`, le second terme annulant le
padding bas du hero. **Ne répartis pas ça sur deux marges** (une sur `.pile`, une sur
`.pile__scene`) : elles s'effondrent en une seule, la plus grande, et la morsure tombait à 24px
au lieu de 118.

Cette valeur est calée sur une contrainte précise : le hero laisse **259px de libre sous ses
badges** (mesuré au cadre de 1472) depuis qu'il est passé en presque 2/1. Trois choses s'y
logent, et elles se tiennent : le « Scroll to explore » à 90px sous les badges, 72px d'écart
jusqu'au collage (la maquette en a 70), et le haut des photos qui mord de 75px sur le bord bas
du panneau. Bouger `--bite` déplace les trois d'un coup — et **changer le rapport du hero aussi**,
puisque tout est mesuré depuis son bord bas.

**L'arrivée est une animation CSS jouée une fois au chargement**, pas un montage au scroll :
les photos sont en place dès le départ et se posent de l'arrière vers l'avant
(`@keyframes pile-land`, 70ms d'écart, dans l'ordre du DOM). Elle passe par la propriété **`translate`**, pas par
`transform`, pour ne pas écraser la transformation composée — les deux se composent d'elles-
mêmes. Ne la remets pas au scroll.

**Le JS ne pose plus qu'un nombre** : `--out` sur la scène (0 posée, 1 partie), pour la sortie
en parallaxe. La progression est mesurée sur la **traversée du tas** — du moment où son
bord haut entre par le bas de l'écran à celui où son bord bas sort par le haut. C'est ce qui
tient à toute hauteur d'écran : le tas est haut dans la page, donc sur une grande fenêtre il
est déjà entier à l'écran au chargement, et un repère « centre du tas dans la fenêtre »
démarrait avant le premier scroll. La sortie court de 0,50 à 0,90 de traversée : **le bord haut
du tas quitte l'écran aux deux tiers**, donc des bornes plus tardives la jouaient hors champ.

- **La sortie est une remontée, et rien d'autre.** Les photos s'échappent vers le haut, sans
  zoom et sans dérive latérale : la transformation ne compose plus qu'un `translateY` et la
  rotation. Ne réintroduis pas de `scale()` — ça a été essayé et retiré.
- **Elles ne montent pas à la même vitesse**, et c'est tout le sujet : `--away-y` va de -6vh
  pour celle du fond à -21vh pour celle de devant. C'est ce seul écart qui fait le parallaxe.
- Les valeurs sont volontairement basses — les photos doivent s'échapper **doucement**, pas
  décoller. Celle de devant va ~43 % plus vite que le scroll, celle du fond ~12 %.
- La sortie **reste linéaire**. N'y remets pas d'assouplissement : c'est un parallaxe, donc
  proportionnel au scroll, et l'effet vient de l'écart entre les photos, pas d'une courbe.

En mobile le collage **déborde des deux côtés** plutôt que de rétrécir : `width: 250%` et
`margin-left: -75%` sur la scène, donc son cadre en `aspect-ratio` grandit d'autant et les
hauteurs suivent toutes seules. C'est l'échelle de l'affiche mobile de Vincent (la photo du
randonneur y fait 48,6vw) ; à 170 %, l'ancienne valeur, le collage se lisait comme une frise
de vignettes. `--bite` suit la même règle qu'en desktop, remise à l'échelle :
12,3 % × 2,5 = 30,75 %. Le « Scroll to explore » passe à 4,5vw — il tombait sur le plancher
de son `clamp`, 12px. Le débord est clos par le `overflow-x: clip` de `html`.

**La hauteur du hero mobile dépend de ces deux nombres** (voir « Le hero ») : change-les, et
recalcule son cadre.

Sous `prefers-reduced-motion: reduce`, ni l'animation de chargement ni le JS ne tournent : le
défaut `--out: 0` posé sur `.pile__scene` laisse le collage en place, immobile.

Deux choses à savoir sur les assets : `photo4.png` a été **rognée de sa bande transparente
haute** (54px) pour que la boîte de l'élément vaille exactement la photo visible — c'est
l'invariant sur lequel reposent les `top` en % et le `box-shadow`. Si tu réexportes une photo
depuis Figma, vérifie que son alpha remplit toute l'image. Et le libellé est en anglais
(« Scroll to explore ») parce que la maquette l'est : c'est la seule entorse au français.


## La section À propos (`#a-propos`)

**C'est la seule section bâtie comme ça, et c'est voulu** : l'œil (`.about__eyebrow`) et le
titre sont **centrés**, le texte repasse **à gauche** dans une colonne de 780px. Ne la
réaligne pas sur les autres sections, qui sont entièrement à gauche.

**Sa hiérarchie a longtemps été inversée** — tête volontairement plus petite que le texte
qu'elle annonce, œil à 18px et titre à 25px au-dessus d'un corps à 30px. **Ce n'est plus le
cas** : Vincent a demandé l'unification des quatre titres, et À propos porte désormais la tête
commune (voir « Les quatre sections portent LA MÊME tête »). Le titre y est donc plus gros que
son texte, comme partout ailleurs. `.about__eyebrow` et `.about__title` n'ont plus de règles à
eux — ne leur en redonne pas.

Ce qui reste vrai : le corps est un peu plus grand qu'ailleurs — `clamp(18px, 1.32vw, 20px)`,
contre 18px fixes pour le reste du site — et le chapô monte à 30px, dans une colonne calée sur
**~74 signes par ligne**. Si tu changes le corps, change la largeur de colonne avec : les deux
tiennent la mesure, et c'est une règle qui a déjà servi. En passant le corps de 30 à 20px, la
colonne de 1040px donnait 93 signes par ligne, très au-delà des 60-75 lisibles ; elle est
descendue à 780px dans le même mouvement.

**Cette largeur est un token, `--about-col`, et pas un nombre écrit deux fois.**
`.trail__lead-inner` DOIT porter exactement la même valeur : le fil pointillé du parcours part
de sous le bouton CV, donc il recopie la boîte d'À propos (vérifié après le changement — l'axe
du trait tombe à 64px du bord du bouton, la valeur documentée). Deux nombres en dur auraient
fini par diverger.

`.about__head` ne porte **aucune largeur maximale**, ce qui évite de mal recentrer les titres
longs.

**Le fond porte deux carrés topo** (`assets/home/about/topo-square-left.svg` et `-right.svg`, 266×266),
posés dans un `.about__topo` en `z-index: -1` et `overflow: hidden` qui les laisse déborder
des deux bords sans créer d'ascenseur. Ils sont calés en % de la **largeur**, jamais de la
hauteur : le texte est du contenu réel, donc la section grandit quand on l'édite et un calage
vertical en % dériverait. Leur remplissage a été ramené de `#18264A` à `--navy` à l'import —
garde-le dans la palette si tu réexportes.

**Le fil pointillé qui relie les deux sections part d'ici mais vit dans le parcours** —
voir « Le fil qui vient d'À propos » plus bas. Il n'est plus dans `.about__body` parce qu'il
doit se figer avec la scène du parcours, ce qu'un enfant d'À propos ne peut pas faire.

**Le bouton CV est un `<span>`, pas un `<a>`, tant que le PDF n'existe pas** — même règle que
les liens réseaux du contact : pas d'ancre morte sur le site. Le jour où le fichier est là, il
repasse en `<a href="assets/home/cv-vincent-waldmann.pdf" download>`, un commentaire HTML le
rappelle sur place.

Le texte est **du vrai contenu**, écrit avec Vincent : treize ans d'expérience depuis 2013,
les années sur des sites à très forte audience, et le « couteau suisse ». Le nombre d'années
est écrit en toutes lettres dans le chapô — un commentaire HTML rappelle de l'incrémenter.
Un quatrième paragraphe dit la place de l'IA dans son travail — en appui, jamais aux
commandes — et il est de Vincent sur le fond : ne le durcis ni ne l'adoucis sans lui.

**« un concept infaisable » porte un mème au survol** (`data-meme`, IIFE « Le mème
d'À propos », la dernière de `js/main.js`) : l'image suit la souris au-dessus d'elle, en
la rattrapant et en penchant du côté où l'on va, et passe dessous près du haut de la
fenêtre. Demandé par Vincent, c'est le seul clin d'œil de la page. Trois règles :
l'image est fabriquée par le JS et **seulement au premier survol** (0 Ko tant qu'on ne
passe pas dessus) ; **rien sans souris** — pas même le soulignement rose (`is-live`),
qui promettrait un effet qui ne viendra pas ; et un scroll la replie, sans quoi elle
resterait plantée en l'air pendant que le mot s'en va. Source dans
`assets/home/src/meme-dev.png` (335 × 550, donc un peu molle sur écran retina à
192–240 px d'affichage), `.webp` servi dans `assets/home/about/`.

**Les compétences sont revenues, en pastilles** (`.about__skills`), en trois familles —
Design, Dev, Outils —, fournies par Vincent. Une première liste avait été retirée à la
refonte au motif que les stickers du hero disaient déjà les outils ; mais ces stickers sont
décoratifs (`alt=""`), donc ni un lecteur d'écran, ni un outil de tri de candidatures, ni un
recruteur qui survole ne les lit. Les pastilles sont du TEXTE, et c'est leur raison d'être.
Elles se posent avant le bouton CV : le fil du parcours part de sous ce bouton et ne dépend
que du bas d'À propos, donc allonger le texte ne le décale pas (vérifié, toujours à 64px du
bord du bouton).

## La section parcours (`#parcours`, « Carnet de routes »)

La partie la plus délicate du site. `js/main.js`, deuxième IIFE.

**Forme.** Une piste `.trail` très haute (`height: 717vh`) avec une scène en
`position: sticky`.

**Le parcours a son propre ciel.** `--trail-sky`, déclaré sur `.trail`, est un dégradé à 163°
qui va de `--navy` à `--ink` (88 %) : deux tokens existants, aucune cinquième couleur, et toute
la teinte reste sur l'axe 226. Il est peint sur `.trail__window` — c'est donc lui qu'on découvre
en ouvrant le carton — et il finit exactement sur l'encre de la page, si bien que la marge
`--frame` qui borde la carte ouverte ne laisse pas de couture en bas.

Quatre corollaires, tous déjà appliqués ; si tu retouches le ciel, ils se tiennent :

- le texte de la scène est **crème** (`color` sur `.trail__stage`), l'œil et le titre compris ;
- le tracé encore à parcourir est crème à 38 % d'opacité, plus de l'encre à 32 % ;
- le HUD est une pastille d'**encre sur un fond devenu sombre** : il ne se détachait plus, d'où
  son filet crème à 16 % ;
- les cartes d'étape, elles, restent claires (`#fffaf0`, texte encre) — ce sont les seules
  surfaces claires de la page, et c'est ce qui les fait ressortir sur le terrain.

**La section REMONTE sur le bas d'À propos** (`margin-top: calc(-1 * var(--pull))`, avec
`--pull: max(0px, calc(50vh - 260px))`), et ce n'est pas un ajustement esthétique : c'est ce
qui rend le fil pointillé de longueur constante. Le carton se tient à 50vh sous le haut de la
section, donc sans ça le trajet du bouton « CV » jusqu'à lui grandissait avec la hauteur de la
fenêtre — 380px sur un portable, plus de 1000 sur un grand écran, dont 640 de seule descente
droite. En remontant de `50vh − 260px`, ce terme sort du calcul : le trajet tient dans
376–465px de 900 × 600 à 2560 × 1440. Le `max(0px, ...)` évite de POUSSER la section vers le bas
sur une fenêtre de moins de 520px de haut.

Le recouvrement va jusqu'à 271px et ne cache rien : la scène est transparente tant que la
fenêtre n'est pas ouverte, donc le texte d'À propos continue de défiler dessous, normalement.
**Toute position mesurée depuis le haut de la section doit ajouter `--pull`** — c'est le cas de
`--lead-top` et la hauteur du fil.

### La révélation : une fenêtre qui s'ouvre, une carte qui ne bouge pas

Avant la marche, la section se donne un premier temps. Un **petit carton centré** montre déjà
la carte en fond, avec l'œil et le titre dedans ; en scrollant il grandit jusqu'au plein écran,
à une marge d'encre près.

**C'est un masque, pas un zoom, et c'est tout le sujet.** `.trail__window` porte un
`clip-path: inset(...)` dont les quatre côtés s'interpolent entre le carton et le plein cadre.
La carte, dessous, n'est **pas** transformée pendant ce temps : le même relief reste exactement
au même endroit à l'écran, on ne fait qu'en découvrir davantage. Si tu remplaces ça par une mise
à l'échelle du carton, l'effet s'inverse et tout est perdu.

**Le marcheur avance pendant l'ouverture, mais la caméra ne le suit pas** — c'est le partage à
tenir, et il repose sur une seule variable dans `render()` : `pCam`. Le chemin parcouru, le
pourcentage et les cartes d'étape suivent `p`, la vraie progression ; la caméra, elle, suit
`pCam`, qui est **tenu à la position que le marcheur aura à la FIN de la révélation** tant que
`rev < 1`. D'où un terrain rigoureusement immobile sous le cadre qui s'ouvre (matrice de
transformation identique au pixel près, vérifié), et **aucun saut au raccord** puisque les deux
valeurs se rejoignent exactement à cet instant. Viser la position de DÉPART à la place
produirait ce saut : c'est le piège.

Toute la géométrie de l'ouverture vit dans le CSS — taille du carton (`--card-w`, `--card-h`),
marge finale (`--frame`), arrondi — et **le JS n'écrit qu'un nombre**, `--open`, comme pour le
tas de photos. `--open` et la classe `is-open` sont posés sur **`.trail`
et pas sur la scène** : le fil pointillé en a besoin lui aussi, et comme il est le FRÈRE de la
scène il ne pourrait pas les lire depuis elle. Ne redéclare pas `--open: 0` sur `.trail__stage`
— une déclaration sur l'élément l'emporte sur l'héritage, et la valeur du JS serait masquée. Les `%` du `inset()` se résolvent sur la boîte de la
fenêtre, donc le carton reste centré à toute taille d'écran sans une ligne de JS.

Trois choses attendent la **fin** de la révélation, et c'est une consigne : le chemin, le
marcheur et les étapes n'apparaissent qu'une fois la carte entièrement ouverte, avec le HUD et
le titre en haut à gauche. Le JS pose alors la classe `is-open` sur la scène et le CSS fait le
fondu. C'est un rendez-vous, pas une progression : n'accroche pas ces opacités au scroll.

**Et à cet instant on est presque sur la première étape**, à 11 % contre 14 % pour la carte —
c'est là que la caméra prend le relais et se met à suivre.
C'est `REVEAL_VH` qui le règle, contre le coût de l'amorce, qui vaut 100vh : à **0,8** il reste
20vh de marche visible après l'ouverture, le temps de voir le marcheur couvrir les derniers
mètres et la carte d'étape apparaître. À 1 il serait collé dessus au moment même où le cadre
finit de s'ouvrir, et le chemin paraîtrait déjà arrivé. `REVEAL_VH` n'a **pas** de budget de
scroll à lui : il se superpose à la marche, donc le changer ne touche ni la hauteur CSS ni la
vitesse au sol.

**Deux titres, pas un seul qui se déplace.** `.trail__cover` est centré dans le carton et
s'efface au scroll (`opacity: calc(1 - var(--open) * 2.8)`, l'opacité étant bornée par le
navigateur, pas besoin de clamp) ; `.trail__intro` reparaît en haut à gauche à l'ouverture.
Le premier est `aria-hidden` et n'est pas un `<h2>` — sans quoi le titre serait doublé.

**Les liens « Parcours » arrivent sur la carte OUVERTE**, demandé par Vincent : l'ancre
`#parcours` posait le petit carton d'avant la révélation, et il fallait encore scroller pour
voir la carte. Le parcours vise donc la première étape (`MARKS[0]`) — carte dépliée,
première carte d'étape affichée. Un clic sur un lien de la page est intercepté et défile en
douceur jusque-là, l'ancre restant dans l'URL ; une arrivée depuis une page projet
(`./#parcours`) est reposée au `load`, sous le voile de transition. Rien en mouvement
réduit, où il n'y a pas de carte à ouvrir, ni au rechargement, où la position restaurée
prime. Le point d'arrivée se déduit des marques : il suit tout changement de `data-at`.

**La révélation ne coûte rien** : mesurée à 8,3 ms médians, exactement comme la marche. Un
`clip-path: inset()` est un découpage de rectangle arrondi, pas une recomposition.

### Le fil qui vient d'À propos

Le trait pointillé qui descend du bouton « CV » et va se poser sur le carton vit **dans le
parcours**, pas dans À propos, et son bloc `.trail__lead` est en **`position: sticky`** avec une
hauteur nulle.

**C'est ce sticky qui fait tout** : il se colle en haut de l'écran à l'instant précis où la
scène s'épingle, donc **au début de la révélation**. Avant, le fil défile avec la page et reste
accroché sous le bouton ; à partir de là **il ne bouge plus**, et le carton, en grandissant, le
recouvre jusqu'à l'avoir mangé.

**Et il s'escamote pour de bon dès que la carte est ouverte** (`.trail.is-open .trail__lead`).
Ce n'est pas cosmétique : son bloc reste collant sur **toute** la hauteur de la section, donc
sans ça il réapparaissait par-dessus la section projets une fois la carte sortie par le haut.
À cet instant il est déjà caché derrière la carte, l'escamotage ne se voit donc pas. C'est aussi pourquoi il ne peut pas rester dans `.about__body` :
un `sticky` ne sort pas de son bloc conteneur, et il doit tenir bien au-delà d'À propos.
Hauteur nulle pour ne pas décaler la scène d'un pixel, et placé **avant** elle dans le DOM —
tous deux en `z-index: auto` — pour que la fenêtre peigne par-dessus.

`.trail__lead` **recopie les boîtes d'À propos** (`max-width: 1512px`, le même `padding-inline`,
puis la même colonne, `--about-col`) : le fil part ainsi exactement sous le bouton sans un seul calcul de
centrage à refaire.

**Un seul tracé, et il est DÉFORMÉ — c'est le point à comprendre.** Le fil doit couvrir deux
distances qui ne varient pas ensemble : la *verticale* dépend de la hauteur de la fenêtre (le
carton se tient à 50vh sous le haut de la section) alors que l'*horizontale* est quasi
constante — la colonne de texte et le carton sont l'un comme l'autre centrés.
`preserveAspectRatio="none"` laisse donc chaque axe se régler sur sa contrainte.

Ça ne marche que grâce à `vector-effect: non-scaling-stroke`, qui refait le trait en **pixels
d'écran** : bouts ronds et tirets restent nets quel que soit l'étirement. Mesuré à 0,91–1,17
d'écart en desktop (invisible) et 0,26 en mobile — même à ce 3,8x d'écrasement le trait reste
propre, vérifié côte à côte. Sans lui il faudrait deux éléments (une descente droite qui absorbe
le vertical, une boucle à taille fixe), ce qui a été la version précédente : elle ajoutait une
jointure à recaler en x ET en phase de tirets, pour rien.

**La boîte du SVG EST le trajet.** Le tracé vient d'`assets/home/src/separator.svg` (fourni par
Vincent, gardé comme référence — rien ne le charge, il est recopié dans le HTML),
renormalisé pour que son départ tombe en (0,0) et son arrivée en (486,415) : il n'y a donc plus
rien à calculer pour placer ses deux bouts, on dimensionne la boîte et c'est tout.

- en largeur, `calc(50% - 64px + var(--card-w) * 0.08)` : du bouton (62 + 2 = 64px, l'axe du
  trait) jusqu'au carton. La colonne (`--about-col`) étant centrée comme lui, **sa moitié EST le
  centre du carton** — d'où le « 50 % », sans un seul calcul de centrage ;
- en hauteur, jusqu'à 70px SOUS le bord haut du carton, pour finir derrière lui.

Les points de contrôle sortent de la boîte (−222 et 749 en x), c'est voulu — c'est le ventre de
la courbe vers la gauche, qui va lécher le bord gauche de la colonne de texte. D'où
`overflow: visible` sur le SVG.

**Ne réduis pas le padding bas d'À propos pour « rapprocher » les deux sections** : c'est lui
qui donne sa hauteur au fil. À zéro, le trajet tombe de 370–439px à 199–240px et la courbe est
écrasée de moitié en plus de son étirement horizontal. C'est la remontée de la section
(`--pull`, voir « Forme ») qui règle cette distance, pas le padding.

**Le mode auto est débrayé tant que la carte n'est pas ouverte.** La scène est déjà épinglée
pendant la révélation, donc sans le garde `revealFraction() < 1` dans `targetFor()`, le premier
cran de molette filerait droit sur la première carte et on ne verrait jamais la fenêtre
s'ouvrir.

**La caméra est une seule transformation composée** sur `.trail__map` (7200×7200,
`transform-origin: 0 0`), qui se lit de droite à gauche : amener le point du marcheur à
l'origine, mettre à l'échelle, tourner, puis le poser à l'écran.

```
translate(cx,cy) rotate(rot) scale(zoom) translate(-here.x,-here.y)
```

Tout le reste en découle. **N'anime rien d'autre image par image** — c'est cette
transformation unique et composite qui rend la section fluide au doigt. `cx`/`cy` valent le
centre de l'écran plus une légère dérive sinusoïdale, pour que le marcheur respire autour du
milieu sans jamais approcher un bord.

**La rotation cap en haut** est échantillonnée de part et d'autre du marcheur, puis
*déroulée* à la couture de l'atan2 (`while (heading - prev > 180) heading -= 360`), faute de
quoi un scroll rapide provoque un tour complet, puis amortie par `ROT_DAMP`. Au-delà de ~0,4
l'amortissement rend le scroll rapide brinquebalant : la valeur actuelle a été baissée exprès.

**Les étiquettes se contre-transforment.** Les étapes vivent *à l'intérieur* de la carte qui
tourne, pour rester collées au terrain, et annulent la caméra avec
`rotate(calc(-1 * var(--rot))) scale(calc(1 / var(--zoom)))`. `--rot` et `--zoom` sont posés
sur `.trail__map` à chaque image uniquement pour servir d'interface JS → CSS.

**`.trail__you` vit dans la carte lui aussi**, posé en coordonnées carte (`here.x`, `here.y`)
et contre-transformé de la même façon — la caméra amène ce point pile en `cx, cy`, donc il
retombe au même endroit à l'écran que s'il était posé sur la scène. Ce n'est pas un détour
gratuit : `.trail__map` est un contexte d'empilement à lui seul (il porte un `transform`), donc
tant que le point restait un frère de la carte avec un `z-index`, **rien** de la carte ne
pouvait passer devant lui. Le mettre dedans, juste avant `.trail__stops`, est le seul moyen de
le garder au-dessus du terrain tout en laissant les étiquettes passer par-dessus. L'ordre de
peinture tient au seul ordre du DOM (les deux sont en `z-index: auto`) : ne réordonne pas ces
deux blocs sans le vouloir.

**Le relief est cuit dans la tuile, et il doit le rester.** `assets/home/trail/relief.svg` est une
tuile de 1400 px où chaque niveau de courbe est déjà remonté de `i × STEP` dans le dessin
lui-même — c'est ce qui donne l'empilement des cartes topographiques dessinées, sans aucune
3D. Un seul `background`, un seul calque.

**Et elle est dessinée en crème**, pas en encre, depuis que le parcours est passé sur fond
sombre : `LINE_RGB` dans `gen_relief.py`. `ALPHA` (0,46) ramène au passage toutes les opacités
au même poids visuel — elles avaient été calées pour de l'encre sur crème, et une ligne claire
sur fond sombre paraît nettement plus forte. Garde les deux ensemble si tu régénères la tuile.

**Ne redécoupe pas ce fond en calques.** Une version l'a fait — un `<div>` par niveau, décalé
en `translateZ` dans un contexte `preserve-3d`, la carte inclinée en `rotateX`. Ça marchait
visuellement, et c'était inutilisable : la surface composée (24 calques sur toute la carte,
1 244 Mpx) saturait le compositeur, qui évinçait des tuiles. La carte et le tracé
**clignotaient et disparaissaient** au scroll, et il y avait des gels de 1,5 à 2 s. En prime,
un SVG dans un contexte `preserve-3d` n'est pas toujours composité : le tracé s'évanouissait
par intermittence. Avec la tuile cuite, plus rien de tout ça ne peut revenir — mesuré à 8-17 ms
médians, 25 ms au pire, sur toute la traversée.

Le prix de la cuisson, assumé : la direction de l'empilement est fixée dans l'image, donc elle
suit la rotation cap-en-haut au lieu de rester verticale à l'écran. `ROT_DAMP` bornant la
rotation à ±25°, le relief penche un peu au fil de la marche.

**Et la tuile est rastérisée une fois au chargement, dans un canvas** (`bakeRelief()`, dans
la même IIFE). Ce n'est pas une micro-optimisation : sans elle la carte topo **clignote par
moments** pendant la marche. Le mécanisme, mesuré et non supposé :

- la tuile est un SVG de **192 tracés translucides**. Tant que l'échelle ne bouge pas, le
  compositeur réutilise sa texture et tout va bien ;
- mais `scale()` change à **chaque approche d'étape** (0,70 → 1,14), et Chrome doit alors
  redessiner ces 192 tracés pour **chaque tuile visible** : **58 ms la tuile de 1400 px**,
  contre 16 ms de budget par image. Le rasteur décroche et affiche des tuiles vides ;
- d'où un clignotement **intermittent** — seulement près des cartes, là où le zoom bouge —
  et **invisible au profilage du fil principal**, qui reste à 8,3 ms médians de bout en bout.
  Si tu cherches ce genre de défaut, ne perds pas de temps sur le JS : il n'y est pas.

La même tuile déjà rastérisée coûte **12 ms**, soit 4,7x moins. On la dessine donc une fois
dans un canvas et on passe la bitmap en fond.

Trois choses à respecter :

- **le SVG reste la source de vérité.** C'est lui que produit `gen_relief.py`, et c'est lui
  que `bakeRelief()` lit — via le fond **déjà déclaré en CSS**, pour ne pas tenir le chemin à
  deux endroits. Ne code pas le chemin en dur dans le JS.
- **rien ne dépend de cette optimisation.** Si le canvas échoue, le fond CSS d'origine reste
  en place et la section fonctionne comme avant, en moins fluide. Garde ce repli.
- **la densité est plafonnée à 2** (`min(2, dpr × ZOOM_STOP)`), soit une tuile de 2800 px et
  30 Mo de texture sur un écran retina. Le pire cas affiché vaut 3192 px, donc la bitmap est
  très légèrement remontée au zoom maximum : mesuré, l'encre totale est **identique** (alpha
  moyen 3,31 des deux côtés), la surface de trait varie de 1 % et seul le pixel le plus
  brillant perd 4 % (144 → 138). Invisible. Ne monte pas ce plafond sans regarder la mémoire :
  à densité 3 la tuile passerait à 4788 px et 91 Mo, ce qui rendrait sur mobile le mal qu'on
  vient de guérir.

À ne pas confondre avec l'avertissement du dessus : découper le fond en **calques** est
interdit, le rastériser en **une image** est justement le remède.

Trois contraintes à respecter si tu retouches `tools/gen_relief.py` :

- **`STEP` doit rester sous le quart de l'espacement horizontal des courbes** (~`TILE/LEVELS`).
  Au-delà, deux niveaux voisins se croisent au lieu de s'emboîter et le volume cesse de se
  lire — dans les pentes raides ça donne déjà un paquet de lignes parallèles plutôt que du
  relief. Baisser `STEP` corrige, au prix d'un relief plus discret.
- **Chaque niveau est dessiné deux fois**, à `dy` et `dy + TILE`. C'est ce qui garde la couture
  invisible malgré le décalage vertical : sans la copie, chaque niveau laisserait une bande
  vide en bas de la tuile.
- **`LINE_RGB` doit rester dans la palette** et `ALPHA` bouger avec lui : ce sont les deux
  réglages qui accordent la tuile au fond du parcours.

**Le rythme est non linéaire par construction.** `costAt(p)` renvoie un coût de scroll par
unité de parcours : une base, plus une pénalité de pente issue du profil `GRADE` (« comme si
on montait »), plus un puits triangulaire à chaque étape pour que le marcheur s'arrête
presque le temps qu'on lise la carte. Le tout est intégré une fois en table cumulée, puis
inversé par recherche dichotomique dans `progressFor()`. Augmente `BASE_COST`/`GRADE_COST`
pour de plus longues marches.

**Les étapes sont des aimants, pas des ralentisseurs.** Le puits de coût est un trapèze très
étroit (`DETENT_W` = 0,0025 de parcours) et très haut (`DETENT_COST` = 8,7, soit ~18x le coût
en terrain libre) : on arrive presque à pleine vitesse, on se colle net, et il faut ~45 vh de
scroll pour décrocher — pendant lesquels le marcheur n'avance que de 47 px de carte. La
version précédente étalait au contraire la décélération sur un quart de marche, ce qui se
lisait comme un ralentissement mou plutôt que comme un arrêt. Si tu élargis `DETENT_W`, tu
retombes dans le ralenti ; c'est l'étroitesse qui fait l'aimant.

**Les marches sont volontairement courtes.** C'est réglé aux deux bouts, et il faut tenir les
deux ensemble sous peine de casser l'équilibre :

- *géométriquement*, les `data-at` sont resserrés — un écart de 0,07, contre 0,115 puis 0,18
  dans les versions précédentes, soit 663 px de carte entre deux étapes au lieu de ~1 800 ;
- *en scroll*, `BASE_COST` et `GRADE_COST` ont été divisés par deux environ, si bien qu'un
  intervalle d'étape à étape coûte ~94 vh au lieu de ~243 (49 de marche, 45 d'aimant).

La vitesse à l'écran pendant la marche, elle, n'a quasiment pas bougé (~13 px de carte par
vh) : c'est le trajet qui est plus court, pas le pas qui est plus rapide. Si tu retouches un
des deux réglages, vérifie l'autre — allonger la géométrie sans rallonger le coût donnerait
une marche expédiée.

**Le zoom est piloté par l'approche d'une étape, et rien d'autre.** `approachAt(p)` vaut 0 en
pleine marche et 1 sur une étape ; le zoom va de `ZOOM_TRAVEL` (0,70 — on prend du recul, on
couvre du terrain) à `ZOOM_STOP` (1,14 — on se penche sur la carte). Garde le rapport entre
les deux (1,63) si tu les retouches : c'est lui qui donne son amplitude au mouvement
d'approche, pas leurs valeurs absolues. **`ZOOM_W` doit rester
sous la demi-distance entre deux étapes** (0,035 aujourd'hui) : au-delà, les fenêtres
d'approche se recouvrent, le zoom ne redescend jamais à `ZOOM_TRAVEL` et la carte reste plaquée
de bout en bout. Il a fallu le baisser de 0,048 à 0,030 en rapprochant les cartes. `ZOOM_W` est plus large
que `DWELL_W` **exprès** : l'objectif bouge déjà avant que le scroll ne se mette à résister,
et continue de bouger pendant la pause, ce qui évite que les ~55 % de scroll passés à l'arrêt
paraissent morts. Le profil `GRADE` ne pilote plus le zoom, seulement le rythme.

**Reculer la caméra fait voir le bord du motif**, et c'est le piège de ce réglage. À 0,70 la
marge entre le coin d'écran le plus exposé et le bord de la carte était tombée à 195 px en
2560×1440, et passait négative au-delà. `.trail__relief` déborde donc les 7200 px de la carte
de **2800 px de chaque côté — exactement deux tuiles**, pour que la phase du motif soit
inchangée et que le terrain ne bouge pas d'un pixel. Il reste ainsi 2 995 px de marge en
2560×1440 et 2 378 px en 3440×1440. Si tu baisses encore `ZOOM_TRAVEL`, remesure, et agrandis
le débord **par multiples de 1400**.

**La section se lit en trois temps, et c'est le point le plus délicat du fichier.** `START`
est le premier `data-at` **moins `LEAD_RUN`** (0,113 de parcours), `END` le dernier **plus
`TAIL_RUN`** (0,0607). Ces bornes ne coïncident ni avec le début ni avec la fin de la piste :

- pendant les **100 vh où la section entre par le bas**, le marcheur avance déjà sur l'amorce.
  Il atteint l'aimant de la première carte à l'instant précis où la section achève de se
  poser — c'est là que la marche « commence vraiment » ;
- tant que la scène est **épinglée**, on marche d'étape en étape jusqu'à la dernière carte ;
- pendant les **100 vh où elle ressort par le haut**, le marcheur continue sur la traîne, si
  bien qu'on le voit progresser *pendant* qu'on défile vers le contact.

Sans ces deux bouts, le marcheur restait figé tant que la section n'était pas collée, puis se
figeait de nouveau dès qu'elle se décollait : deux ruptures nettes, aux deux extrémités.

**Tout tient à une division.** `fraction()` mesure la marche sur toute la piste, de
l'épinglage au moment où le bord bas de la section sort par le haut. Une seule division sur une
longueur de scroll réelle, en pixels : la densité est uniforme par construction, le marcheur ne
change jamais d'allure, ni quand la scène se décolle ni pendant la traîne. Une version
antérieure calculait les points de couture à l'avance ; elle dérivait de 5 % sur mobile, où
`vh` et `window.innerHeight` ne sont pas d'accord à cause de la barre d'URL. Ne réintroduis pas
ce découpage explicite.

**La traversée se lit 100 + 717 = 817 vh**, et `height` en vaut 717 : 100 vh d'entrée pendant
lesquels le carton monte jusqu'au centre, puis 717 vh de marche — dont les 100 derniers se
jouent pendant que la scène ressort par le haut. La révélation ne prend aucun de ces vh, elle
se superpose aux 80 premiers.

Les **deux rendez-vous** tiennent : l'entrée dans l'aimant de la première carte tombe 100 vh
après l'épinglage, et la sortie de l'aimant de la dernière pile quand la scène commence à se
retirer (vérifié : 14 % à 1 vh après l'épinglage, 86 % à `H − V`). C'est aussi pourquoi **il n'y
a pas de hauteur réduite en mobile** : les 100 vh d'entrée et de sortie ne rétrécissent pas.

`LEAD_RUN` est près du double de `TAIL_RUN`, et ce n'est pas une faute de frappe : le terrain
d'avant la première carte est plus plat, donc moins cher, donc il en faut davantage pour
dépenser les mêmes 100 vh. C'est aussi ce qui a forcé à **décaler toutes les étapes plus loin
sur le tracé** (première carte à 0,133 au lieu de 0,10) : avec l'ancienne position il n'y
avait pas assez de chemin en amont pour payer l'entrée.

Conséquence de l'amorce : la partie basse du tracé est visible dès l'entrée, ce qui est le
moment où la marge au bord du motif est la plus faible. C'est ce cas-là qu'il faut mesurer
quand on touche au zoom ou au débord de `.trail__relief`.

Conséquence : la fraction brute du parcours ne vaut jamais 0 ni 1 — l'affichage du HUD montre
donc délibérément `scrolled`, et non `p`.

**Le `d` du tracé porte l'altitude.** Il n'est plus celui que produit `gen_route.py` :
`gen_relief.py` le relit et remonte chaque point de la hauteur du terrain sous lui, du même
barème que les courbes de la tuile — d'où un chemin qui épouse le relief. Bonne surprise :
comme `getPointAtLength` renvoie donc des positions déjà relevées, **la caméra, les pastilles
d'étape et le marcheur suivent le terrain sans une ligne de JS en plus**.

Le tracé plat de référence vit dans `assets/home/trail/route-flat.path`, et c'est lui que le script
relit — relancer `gen_relief.py` ne cumule donc pas les décalages. **Si tu régénères le tracé
avec `gen_route.py`, supprime ce fichier puis relance `gen_relief.py`**, sinon l'altitude
resterait calée sur l'ancien tracé.

**Deux tracés superposés, au même `d` dans le HTML.** `.trail__track` est la route grise
en pointillés devant ; `.trail__track-done` est verte, pleine, et **le JS recoupe son `d`
au point atteint** à chaque image (`drawWalked()`) : longueurs cumulées calculées une fois,
puis une dichotomie et le point interpolé sur le segment en cours.

**Ne reviens pas à `stroke-dasharray: ${walked} ${total}`.** C'était la technique d'avant,
et WebKit — Safari, donc TOUS les navigateurs iOS, Chrome compris — l'ignore sur ce tracé :
le vert s'y peignait de bout en bout dès l'ouverture de la carte. Vérifié sur iOS 18 dans
le simulateur, quatre variantes échouent toutes (tiret + trou, `dashoffset`, trou de 1e7,
SVG sans calque ni transform) ; seul le `d` recoupé tient. Chrome desktop, lui, rend bien
les tirets : **le bug ne se voit pas dans le panneau navigateur**, il faut le simulateur.
Le recoupage suppose un `d` fait uniquement de `M` et de `L`, ce que produisent
`gen_route.py` et `gen_relief.py`.

Ajouter ou déplacer une étape se fait en éditant `data-at` dans `index.html` ; les positions à
l'écran sont calculées par `getPointAtLength`. Une étape ajoutée doit porter les quatre
éléments d'une carte — année, poste, boîte/lieu et `.trail__stop-note` — sans quoi le journal
affichera une entrée tronquée. Mais **quatre valeurs se recalculent ensemble**
dès qu'on touche à l'espacement, et les oublier se voit tout de suite :

| valeur | contrainte |
|---|---|
| `ZOOM_W` | < demi-distance entre deux étapes, sinon le zoom ne respire plus |
| `TAIL_RUN` | fixe la vitesse à l'écran : ~13,5 px de carte par vh |
| `DETENT_COST` | fixe l'aimant à ~45 vh |
| `LEAD_RUN` | rendez-vous d'entrée : `scrollFor(première − DETENT_W)` = 100 vh de traversée |
| `height` (CSS) | rendez-vous de sortie, et donc la traversée totale |

Les trois dernières se résolvent ensemble : le barème est intégré une fois, donc changer l'une
déplace les autres. En pratique on les cherche numériquement plutôt qu'à la main.

### Le journal, en bas à gauche

Le poste courant s'écrit **à même la carte**, en bas à gauche : année, intitulé, boîte, lieu,
puis une description. Comme le reste du parcours, ces cinq textes sont **du vrai contenu**,
écrits par Vincent — ne les réécris pas sans le lui demander.

**Pas de carton, mais un scrim.** Le fond reste transparent — aucune boîte dessinée — et la
lisibilité est assurée par un dégradé d'encre né dans le coin bas gauche, qui meurt avant le
HUD. Il est porté par **le journal et non par ses entrées** : sur une entrée il s'effacerait et
reparaîtrait à chaque changement de poste, et ce clignotement se verrait bien plus que le
dégradé lui-même. D'où une taille fixe et généreuse (`min(430px, 52vh)`), calculée pour couvrir
la description la plus longue sans que le fond ne bouge d'une étape à l'autre. La couleur est
`--ink` : le pied du ciel du parcours, assombri, pas une nouvelle couleur. Pas de carton ni de scrim — le ciel du parcours est assez sombre pour
porter du crème, vérifié par-dessus les courbes les plus denses.

**Il garde le dernier poste atteint.** Tant que l'étape suivante n'est pas débloquée, c'est le
précédent qui reste affiché ; le journal ne se vide jamais entre deux cartes. Le seul état vide
est celui d'avant la première étape, et il tombe pendant la révélation, donc il ne se voit
pratiquement pas : la carte finit de s'ouvrir presque au moment où le marcheur atteint la
première pastille (voir `REVEAL_VH`).

**Les cartes du tracé sont réduites à l'ANNÉE**, exprès : sans ça on lisait deux fois la même
chose à 30 cm d'écart. Le balisage complet reste pourtant dans chaque `<li>` — c'est la
**seule source de vérité**, et le CSS n'en masque que les feuilles (`.trail__stop-role`,
`-org`, `-note`). Deux raisons, toutes deux à respecter :

- le JS **clone** ces éléments au démarrage pour fabriquer les entrées du journal, donc il n'y
  a jamais deux textes à tenir à jour ;
- le **mode réduit les réaffiche en entier** (`display: revert`), puisqu'il n'a pas de journal :
  la frise verticale doit porter tout le texte, description comprise.

Le journal est donc `aria-hidden` : le lecteur d'écran lit la liste des étapes, pas son reflet.

**Les cinq entrées sont toutes dans le DOM, superposées**, et le rendu ne fait que déplacer la
classe `is-current`. Toute la transition est en CSS — aucun minuteur JS qui pourrait se croiser
sur un scroll rapide. L'entrée qui part **ne fait que s'effacer** : sa translation est remise à
sa valeur de départ *après* le fondu (`transition: … translate 0s linear .3s`), donc elle ne
redescend pas ; celle qui arrive monte de 10px, avec 120 ms de retard pour que les deux ne se
croisent pas à mi-opacité.

**Son retrait à gauche est plus serré que le padding du titre** posé au-dessus, et c'est
demandé : `--log-inset` vaut `clamp(16px, 3vw, 42px)` contre `clamp(24px, 4.5vw, 64px)` pour
`.trail__intro`, soit 22px d'écart en 1440. Les deux calques ne sont donc PAS alignés sur la
même verticale — si tu veux les raccorder, c'est le padding de `.trail__intro` qu'il faut
descendre, pas le journal qu'il faut repousser. Le scrim relit `--log-inset`, il n'y a qu'une
valeur à changer.

**Les barres du navigateur mobile recouvrent le bas de la scène**, qui fait `100vh` —
soit la fenêtre barres ESCAMOTÉES. Le journal et le HUD passaient donc sous la barre
d'outils d'iOS. Leur `bottom` ajoute `--bar-gap`, qui vaut `100vh − 100dvh` : exactement
la part cachée, 0 sur ordinateur et 0 barres escamotées. **La scène, elle, garde
`100vh`** : sa hauteur, la caméra et les rendez-vous de la marche n'en dépendent pas, et
c'est pour ça que seuls les calques ancrés en bas relisent la variable. Le scrim la
retranche de son `bottom` pour descendre jusqu'au bas de la scène.

**Le journal et le HUD partagent la ligne du bas**, à toute largeur d'écran : même `bottom`,
et le journal s'arrête avant le coin droit grâce à `--hud-reserve`, la place réservée au HUD.
C'est ce qui évite qu'un texte long ne décale l'un par rapport à l'autre — une version
précédente faisait passer le journal *au-dessus* du HUD en mobile, et l'alignement se perdait.

La boîte est pour cela **de hauteur nulle et ancrée par le bas** : les entrées grandissent vers
le haut, donc la ligne du bas ne bouge pas d'un poste à l'autre, quelle que soit la longueur de
la description. Le prix de cet alignement se paie en mobile, où la colonne est étroite : la
description la plus longue y monte sur sept lignes (214px de haut en 375 × 812, 17px de
dégagement avec le HUD — mesuré). Si ça devient trop haut, c'est la longueur des textes qu'il
faut revoir, pas l'alignement.

**Le HUD est une pastille d'encre posée sur la carte**, en bas à droite : « Avancement » en
Garamond italique, le pourcentage en gros Clash, et sous un filet le couple **Manuel / Auto**.
Les deux libellés sont **décoratifs** (`aria-hidden`) — l'état réel passe par `aria-pressed` sur
le bouton unique, et son `aria-label` dit ce que fera le prochain clic. Le HUD est en
`pointer-events: none` tant que `is-open` n'est pas posée : invisible, il ne doit pas non plus
être cliquable ni atteignable au clavier.

### Le mode « étape par étape »

Activé par défaut, débrayable par le bouton `.trail__auto` du HUD. Dedans, **un geste n'est
plus une poignée mais un déclencheur** : un cran ou deux de molette et la caméra parcourt
d'elle-même tout le chemin jusqu'à l'étape suivante.

Le rythme de cette marche se règle par `GLIDE_PACE` (3,4 ms par px de scroll à couvrir),
borné par `GLIDE_MIN`/`GLIDE_MAX`. **La lenteur est le sujet** : on doit voir le cheminement
se faire, pas être téléporté d'une carte à l'autre. Ça donne 3,8 à 6,3 s par étape, ~295 px/s
de scroll. La valeur a été cherchée en trois passes (0,9 → 1,8 → 4,5 → 3,4) : c'est un réglage
tenu, pas une valeur par défaut, et le trop rapide s'est révélé bien plus gênant que le trop
lent. Si tu dois trancher, penche du côté lent.
**`GLIDE_MIN` et `GLIDE_MAX` ne doivent JAMAIS mordre sur une marche réelle.** Ce ne sont
que des gardes contre les cas dégénérés : dès que l'une des deux s'applique, la marche
concernée change de vitesse et l'écart s'entend aussitôt. La règle vaut des deux côtés,
et c'est le plancher qui l'a appris à ses dépens.

Le plancher valait 2600 ms et produisait le « ralentissement à 2012 ». La première marche
est la seule courte du lot — **385 px, contre 850 à 1382 pour les autres** — parce qu'elle
ne part pas d'une carte mais de la fin de la révélation, à 80vh, alors que la première étape
tombe à 100vh. Elle demandait 1310 ms, le plancher lui en imposait 2600 : **148 px/s contre
294 partout ailleurs**, soit la moitié de la vitesse, sur la toute première marche que le
visiteur voit. Il est descendu à 250 ms, une valeur qu'aucune marche réelle n'atteint.

Les six mouvements du mode auto valent aujourd'hui 294 px/s, sortie comprise.

**L'interpolation est linéaire. N'y remets pas d'assouplissement.** Un ease-in-out (cubique
puis smoothstep) a été essayé et retiré : quand le sujet est de suivre le chemin, toute courbe
d'entrée/sortie se lit comme une accélération bizarre au milieu du trajet. Le scroll avance
maintenant à ~295 px/s du début à la fin de la marche, mesuré plat à 4 % près.

Attention, il reste **une seconde source d'accélération, plus forte, et celle-là est
volontaire** : le marcheur avance à `vitesse de scroll / costAt(p)`, et `costAt` varie d'un
facteur ~8 entre le creux d'une étape et le milieu d'une marche. Donc même à scroll
parfaitement linéaire, le marcheur rampe en quittant une carte puis file au milieu. C'est le
principe même de la section en défilement libre. Si ça devait gêner en mode auto, le correctif
n'est pas de retoucher la courbe mais d'interpoler `p` au lieu du scroll — en passant par
`scrollFor(p)` à chaque image, ce qui donnerait une vitesse au sol constante.

**Le verrou anti-inertie ne couvre pas toute la marche**, seulement `INERTIA_LOCK` (1,1 s), le
temps qu'un flick de trackpad retombe. C'est indispensable depuis que les marches durent
plusieurs secondes : avec un verrou couvrant toute la durée, un visiteur pressé restait
prisonnier 8 s. Passé ce délai, un nouveau geste **enchaîne** sur l'étape d'après en cours de
route — `glide.to` sert de référence, donc il vise bien la marque suivant la destination et
non celle suivant la position courante.

`MARKS` est la liste des seules fractions de scroll où le mode s'arrête : **une par étape, et
rien d'autre**. Elles sont obtenues en **inversant `progressFor` par dichotomie**
(`scrollFor`), donc elles suivent automatiquement tout changement de `data-at`, de `GRADE` ou
des coûts : il n'y a aucune position à tenir à jour à la main.

**Depuis la dernière carte, un geste vers le bas emmène à la section suivante.** C'est le
jeton `EXIT` de `targetFor()` : pas une marque de plus — il n'y a pas d'étape là-bas — mais
une destination à part, que `nextMark` ne peut pas produire. La sortie traverse la traîne
d'un seul mouvement, à la même vitesse que les marches, et se pose sur le haut de
`trail.nextElementSibling`. On la lit dans le DOM et pas par son id : ce qui est vrai ici
c'est « la section suivante », pas « projets ».

Avant, ce geste rendait la main au scroll manuel au milieu de la traîne, ce qui coupait
net le rythme de la section juste avant d'en sortir.

**Deux gardes tiennent cette sortie, et il faut les deux :**

- le test `glide.to === EXIT` passe **avant** `pinned()`. La sortie traverse la traîne, donc
  la scène se décolle en cours de route ; sans ce test la page se remettrait à défiler
  par-dessus l'animation et les deux se tireraient dessus ;
- `handle()` avale un geste dont la destination est déjà celle du glissement en cours, au
  lieu de relancer l'animation depuis la position courante — ce qui la ferait repartir plus
  lentement à chaque cran de molette.

Un geste vers le haut pendant la sortie repart sur la dernière carte, et **à l'intérieur de
la traîne plus rien n'est intercepté** — sans ça, remonter d'un cran vous ramenait aussitôt
sur la dernière carte. C'est le rôle du garde `fraction() > LAST_MARK` dans `targetFor()`,
qui reste le point de passage unique des trois gestionnaires (molette, doigt, clavier). Un
geste vers le haut *depuis* la dernière carte, lui, reste automatique : on remonte bien
d'étape en étape.

Trois pièges, tous déjà payés :

- **`scrollTo` doit passer `behavior: 'instant'`.** `html` porte `scroll-behavior: smooth`, qui
  sinon anime chaque pas de l'animation et la fait ramer sur place.
- **`preventDefault` même quand rien n'avance.** Un flick de trackpad envoie ~25 événements ;
  sans le verrou `lockUntil` + le seuil `WHEEL_TRIGGER`, un seul geste traversait toute la
  section. Les événements pendant le verrou sont absorbés mais ne font rien.
- **Le test d'épinglage tolère 1px.** Au ras de la couture `getBoundingClientRect().top` vaut
  couramment 0,23px, et un `<= 0` strict laissait filer le tout premier geste.

Quand `nextMark` ne renvoie plus rien — au tout début en remontant, au bout de la traîne en
descendant — le geste **n'est pas** absorbé et la page reprend son défilement normal. C'est ce
qui évite d'enfermer le visiteur ; le bouton du HUD est la seconde sortie.

`prefers-reduced-motion: reduce` désépingle l'ensemble en une simple frise verticale — le mode
auto n'y est pas branché du tout, et le HUD (donc son bouton) y est masqué. Quand tu y masques
des morceaux de la carte, masque les éléments feuilles — masquer un conteneur a déjà emporté
`.trail__stops` deux fois en silence.

## La section projets (`#projets`, « Cartographie des projets »)

Trois projets — Jacquie & Michel, Beepz, Jimizz — en trois cartes à gauche, et à
droite **un seul emplacement** où trois groupements de visuels se superposent :
survoler une carte fait entrer le sien. C'est la maquette de Vincent, intégrée
telle quelle.

**Le JS ne pose qu'un état**, la classe `is-active` déplacée d'un `<li>` à
l'autre (`js/main.js`, troisième IIFE). Le fondu, les décalages d'entrée, l'échelle de la
carte : tout est dans le CSS, comme `--open` du parcours et `--out` du tas de
photos. La classe part du HTML, sur le premier projet — **sans JS, en mouvement
réduit ou si `main.js` ne charge pas, c'est lui qui reste affiché**. Rien de
visible ne dépend d'ici.

L'écouteur est posé sur la CARTE et non sur le `<li>` : celui-ci est en
`display: contents`, donc sans boîte, et ne peut pas être la cible d'un
événement de pointeur.

**Une seule structure pour les deux mises en page**, et c'est ce qui tient la
section. Chaque groupement vit dans le `<li>` de sa carte — pas dans un
conteneur à part qu'il faudrait tenir d'accord avec la liste — et
`display: contents` efface la boîte du `<li>` sans lui retirer sa classe. En
desktop les groupements sont absolus sur la moitié droite ; en mobile
(≤ 900px) la grille retombe et **les trois cartes s'empilent, pleine largeur**.

**LES GROUPEMENTS SONT MASQUÉS EN MOBILE, et c'est une consigne de Vincent.** Ils
y sont restés longtemps affichés, chacun en clair sous sa carte : la mise en page
tenait, mais elle ne racontait plus la même chose. En desktop un groupement est
la RÉPONSE au survol — on désigne une carte, son collage entre. Sans survol il
n'y a plus de question, et trois collages empilés ne sont qu'un mur d'images de
plus entre le visiteur et les trois liens qu'il est venu chercher. Les cartes
suffisent, et les pages projet montrent les visuels en grand.

Ça allège la page d'autant : les quatorze `.webp` des groupements sont en
`loading="lazy"`, donc un écran étroit **ne les télécharge plus du tout**
(vérifié : zéro requête). C'est `display: none` et pas `visibility: hidden` — il
ne doit rien rester à réserver — et les groupements étant déjà `aria-hidden`,
rien ne change pour un lecteur d'écran.

**Le `::before` flottant est ce qui DONNE sa hauteur à la section.** Les trois
groupements étant absolus, ils n'en donnent aucune ; le flotteur en réserve
exactement autant en `padding-bottom` — un pourcentage se résolvant sur la
*largeur* du conteneur, 53 % × 640/780 = 43,5 % rend précisément la hauteur du
cadre de référence, à toute largeur et sans un seul nombre en dur. D'où le
`display: flow-root` : sans lui la hauteur d'un flotteur ne compte pas. Ne
remplace pas ça par une `min-height` en `vw`, qui recopierait la géométrie de la
grille en deux endroits.

**Le cadre de référence vaut 780 × 640**, et tout dedans est posé en pourcentage
de ce cadre — même convention que le hero et le tas de photos. Seul **Beepz** garde
les `left`/`top`/`width` déduits des tailles relatives des exports, ramenés dans le
cadre par leur boîte englobante (94 % de remplissage). **J&M et Jimizz ont été
recomposés à la main**, plus serrés et chevauchés, et leurs pourcentages ne se
déduisent plus de rien : ce sont des valeurs de maquette.

**Serrer un groupe, c'est aussi changer les tailles relatives.** Sur J&M la
tablette est passée de 1,86 fois la largeur de la photo à 1,43 — c'est ce rapport
qui compte, pas sa taille absolue, et sans lui le groupe restait étalé même en
rapprochant les pièces. Le groupe couvre 75 % de la largeur du cadre au lieu de 94.

**Les visuels sont produits par `tools/build_projects.py`**, qui lit les originaux
dans `assets/home/src/projects/` (hors dépôt) et écrit les `.webp` servis dans
`assets/home/projects/`. Le script **ne connaît aucune taille en dur** : il va lire
les `width: %` dans `css/style.css` et apparie les classes aux fichiers par les
`src` d'`index.html`. Déplacer une pièce ou changer sa largeur, relancer, et les
exports suivent — même principe que la tuile de relief, dont le chemin est lu dans
le CSS plutôt que recopié.

**La cible vaut deux fois la taille d'affichage**, densité d'écran 2. C'est le point
qui avait manqué : les premiers exports de maquette étaient en 1x, donc agrandis par
le navigateur d'un facteur 2,5 à 2,9 — franchement pixellisés, surtout sur Jimizz
dont la composition les agrandit déjà. **Les sources sont désormais en @3x** et le
script ne fait plus que RÉDUIRE, ce qui est toujours propre : plus un seul pixel
inventé dans la chaîne. 714 Ko servis pour 4,4 Mo de sources.

**Le script dit ce qu'il fait, et c'est sa fonction la plus utile.** En fin de passe
il liste les pièces qu'il a dû agrandir, leur facteur, et l'échelle d'export Figma
qui ferait cesser l'agrandissement — sans quoi rien ne distinguerait une sortie
honnête d'un fichier à la bonne taille dont la moitié des pixels est inventée. Il
signale de même les pièces sans source, qu'il laisse en place plutôt que d'effacer.
Si tu retouches une largeur dans le CSS, relance : le message te dira aussitôt si la
source suit encore.

**Il ramasse aussi les exports déposés dans `assets/home/projects/png/`** et les
range dans `src/projects/` avant de travailler. C'est le dossier où ils atterrissent
naturellement quand on les dépose à côté des fichiers servis — et c'est justement le
seul endroit d'où ils partiraient dans le dépôt public, que `assets/*/src/` ne
couvre pas. Une seule règle de `.gitignore`, et rien à retenir au moment de déposer.

**Les trois icônes de carte n'ont plus de source.** Leur `.webp` de 220 px est servi
et versionné, mais le PNG dont il sortait a disparu — le script le signale à chaque
passe et laisse le fichier en place. À redéposer dans `src/projects/` le jour où
elles doivent changer.

**La rotation vit dans `--rot`**, jamais dans un `transform` — sauf quand elle est
déjà cuite dans le PNG, ce qui est le cas de l'iPad, du jouet, de la fusée et des
pièces. Les pièces portent aussi leur flou de profondeur cuit : ne le refais pas
en CSS.

**Une animation d'entrée par projet, et c'est demandé.** Chaque pièce porte son
propre décalage de départ (`--out-x`, `--out-y`, `--out-r`, `--out-s`) et son
retard (`--d`) :

| projet | mouvement |
|---|---|
| Jacquie & Michel | l'étalement — les quatre pièces partent ramassées vers le centre et s'écartent, de l'arrière vers l'avant |
| Beepz | l'arrivée par la droite — la voiture entre par le bord, le téléphone et la photo montent |
| Jimizz | le décollage — la fusée monte du bas, les pièces flottent derrière elle, les deux cartes s'ouvrent en échelle |

**La composition de Jimizz est une masse, pas quatre éléments posés.** Les trois
pièces maîtresses se chevauchent — la fusée cabrée à 22°, la carte de portefeuille
derrière sa dérive, le graphe par-dessus les deux — et les pièces flottent autour,
deux nettes au fond, deux floues devant. Une première version les avait posées
côte à côte, sans contact : ça se lisait comme quatre visuels perdus au milieu du
cadre plutôt que comme un décollage. Si tu y touches, garde les recouvrements.

La rotation de la fusée vit dans `--rot`, comme partout ailleurs sur le site.
Attention en la retouchant : `getBoundingClientRect()` renvoie la boîte
ENGLOBANTE d'un élément tourné, pas sa largeur de mise en page — à 22° la fusée
mesure 324 px de boîte pour 191 px de largeur réelle. C'est `offsetWidth` qu'il
faut lire pour juger de sa taille.

**Les deux états sont écrits en dur, et il faut que ça le reste.** Au repos une
pièce ne porte que sa rotation ; à l'entrée elle porte `var(--out-*)`. Aucune de
ces variables ne CHANGE d'un état à l'autre — c'est la déclaration de
`translate`/`rotate`/`scale` qui change. Une variable qui change en cours de
transition ne s'interpole pas, elle saute : c'est le piège de ce genre de
montage, et il est évité ici.

Le retard n'appartient qu'à l'entrée (`transition-delay` posé sur l'état actif
seulement) : les pièces qui partent s'effacent **ensemble**, sinon la sortie
durerait plus longtemps que l'arrivée.

**Les groupements sont décoratifs** — `aria-hidden` sur le conteneur, `alt=""` sur
chaque image, même critère que la visionneuse des pages projet. Le lecteur
d'écran lit les trois cartes, pas leur illustration.

**Les trois cartes sont des liens** (`projet-jm.html`, `projet-beepz.html`,
`projet-jimizz.html`). Celle de Jimizz a longtemps été un `<div>` — pas d'ancre
morte tant que la page n'existait pas, même règle que les liens réseaux du
contact ; la page existe, la carte est un `<a>`, et rien d'autre n'a changé.
La navigation entre pages projet boucle&nbsp;: J&M → Beepz → Jimizz → J&M.

**Les trois icônes de marque portent leur fond ET leurs coins arrondis dans
l'image** (`logo-jm-left`, `logo-beepz-left`, `logo-jimizz-left`, carrées).
`.pcard__icon` n'est donc qu'une boîte à dimensionner : aucune couleur de logo
n'est redite en CSS, et rien ne vient s'ajouter à la palette du site. Si tu
réexportes une icône, garde l'arrondi dans l'image — le CSS ne le rattrapera pas.
Leur cible de résolution est lue sur le plafond du `clamp` de `.pcard__icon`, la
seule taille où elles ont besoin de tout leur jus.

La ligne de sous-titre des cartes (`.pcard__tag`) est le **cinquième usage du
Garamond italique**, demandé par la maquette.

## La page Jacquie & Michel (`projet-jm.html`)

Intégration de la maquette refaite par Vincent (1512 px de large ; le PNG n'est plus sur
le disque, voir « Le ménage du 11 septembre 2026 »). **Elle a remplacé la version
précédente EN ENTIER** : les trois volets, la fiche de course, les notes de terrain, la
porte NSFW et le mur de vingt visuels réseaux ont disparu avec elle. Ne les remonte pas
par morceaux.

**Elle ne partage pas la grammaire de `projet-beepz.html`, et c'est le point.** Beepz
raconte un projet — un problème, un système, trois volets qui en découlent. J&M montre un
POSTE : une phrase, puis ce qu'elle a produit, cinq fois de suite. Ne fais pas glisser ses
classes vers `.case-*`, qui sert Beepz : les deux pages n'ont pas la même mise en page, et
un sélecteur partagé les ferait diverger en silence.

**En revanche elle PARTAGE son gabarit avec `projet-jimizz.html`**, et ce n'est pas une
déduction : les deux maquettes de Vincent donnent les mêmes nombres au pixel. Les
primitives communes portent donc le préfixe neutre **`.proj-*`** — `proj-wrap` (le cadre
de 1472), `proj-title`, `proj-eyebrow`, `proj-text`, `proj-lede`, `proj-line`, `proj-hero`
et ses parties, `proj-intro`, `proj-band` — et les deux `<main>` portent `class="proj …"`.
Elles ont porté `jm-` tant qu'il n'y avait qu'une page à ce dessin ; recopier leurs valeurs
sous un second préfixe aurait fait deux jeux de nombres à tenir d'accord, et c'est toujours
le second qui ment. Ce qui reste `.jm-*` n'appartient qu'à cette page : la bande
photographique, les quatre sites, les douze marques, JacquIA, le collage des campagnes et
la fresque. Ne fais pas remonter un de ces blocs dans `.proj-*` — il n'y serait plus lu que
par une seule page et le nom mentirait.

Seuls l'en-tête, le pied, la navigation entre projets (`.case-foot`), les pastilles
`.case-btn`, le système de révélation, le parallaxe et la visionneuse sont communs aux
**trois** pages projet.

**TOUTES LES SECTIONS DE CE DESSIN PORTENT LE CARRÉ TOPOGRAPHIQUE À GAUCHE**, et c'est une
consigne. Elles sont quatre : « Douze ans dans la maison » et « Les campagnes marketing »
ici, « Le projet Crypto de Jacquie & Michel » et « Un univers 3.0 complet » chez Jimizz.
**Les deux maquettes ne le montrent pas partout — Vincent l'a dit lui-même, c'était une
coquille de leur côté**, donc ne te fie pas aux PNG sur ce point.

Le carré a besoin d'un HÔTE, et c'est toute la raison d'être de `.proj-block` : il déborde à
GAUCHE de la colonne de texte, jusqu'au bord du cadre, donc posé dans `.proj-intro` — la
colonne de 1288 px, centrée — il ne pourrait pas en sortir sans un décalage négatif à
recalculer à chaque largeur d'écran. L'hôte occupe le cadre, la grille la colonne, et il n'y
a aucun nombre à tenir.

Il fait 341 px (`clamp(190px, 23.17%, 341px)`), donc il est plus HAUT que son bloc et dépasse
d'environ 78 px au-dessus et en dessous : c'est un décor de fond, pas un cadre. Et son
`z-index: -1` n'est pas décoratif — sans lui, un élément `position: absolute` peindrait
PAR-DESSUS le texte, quel que soit l'ordre du DOM.

L'ordre est : `couverture > bande photo > l'arrivée > quatre sites > énoncé > douze marques
> les campagnes > JacquIA > énoncé des réseaux > collage > grille des réseaux > fresque`. Il n'y a que **trois titres visibles dans
toute la page** — le `h1`, « Douze ans dans la maison » et « Les campagnes marketing » — et
c'est voulu ; les blocs d'images sont des `<section>` nommées par `aria-label`.

### Deux cadres, et rien d'autre

- le **CADRE**, 1472 px : la largeur de tout ce qui est image. C'est le même nombre que le
  hero de l'accueil. `.proj-wrap` le tient — 1512 px de conteneur moins 20 px de marge de
  chaque côté ;
- la **COLONNE**, `--proj-col`, 1288 px : la largeur de tout ce qui est texte, soit le cadre
  moins 92 px de chaque côté. Le texte ne va jamais aussi loin que l'image, et c'est ce
  décalage qui fait la respiration de la page.

Deux bandes échappent aux deux et sont **pleine largeur** : la couverture photographique et
la fresque des vingt ans. Les border d'encre les ferait lire comme des vignettes.

**Le rythme vertical est normalisé**, et c'est un écart assumé avec la maquette : elle
sépare ses blocs de 113 à 230 px sans règle apparente. Tout est ramené sur `--proj-gap`,
déclaré PAR PAGE — les deux maquettes ne respirent pas au même pas, 183 px chez J&M contre
93 chez Jimizz — et c'est le seul nombre à toucher pour resserrer ou aérer une page.

**Attention au PNG de la maquette : un de ses calques était masqué à l'export.** Il laissait
un vide de 601 px entre les marques et JacquIA, que j'ai d'abord pris pour un accident — la
tête « Les campagnes marketing » y était. Si un autre trou de cette taille apparaît, cherche
le calque avant de le combler.

**Cette tête annonce les DEUX blocs qui suivent**, JacquIA et le collage, d'où sa place. Elle
reprend telle quelle la grille de « Douze ans dans la maison » (`.proj-intro` : titre à 112 px,
texte à 720 px, calés en haut) — ne lui en donne pas une à elle. Comme les trois autres
sections de ce dessin, elle porte le carré topo d'À propos derrière elle, dans un
`.proj-block` : il se centre par `top: 0; bottom: 0; margin-block: auto` et **jamais par
`translate`**, la moitié des transitions de ces pages passant par cette propriété — une
valeur de centrage posée là serait effacée à la première révélation.

Le texte de cette tête était AUSSI dans le PNG, centré après les écrans de JacquIA, au mot
près. Il n'y est plus qu'ici — le laisser aux deux endroits le faisait lire deux fois à
1 500 px d'écart.

**La place qu'il laissait vide porte désormais un second `.jm-statement`**, demandé par
Vincent parce que JacquIA et le collage se suivaient sans transition. Ce n'est pas le texte
de la maquette revenu : c'est une phrase écrite pour cet endroit, qui passe de la campagne au
quotidien des réseaux sociaux et à la place des visuels auprès du public français. Même
format que l'énoncé du chantier — centré, 24 px, 910 px de large.

**Les trois plafonds du site tiennent** : les deux titres font 50 px pile, l'œil 24, le
corps du hero 20. Les paragraphes centrés montent à **24 px**, ce qui les met dans le
tiroir des sous-titres (30 px) et non dans celui du texte courant — ce sont des énoncés de
trois lignes, pas du corps.

**Une seule chose sort de la charte, et elle est à trancher** : la maquette compose TOUTE
la page en Clash Display, corps de texte compris, là où le reste du site réserve Clash aux
titres et donne Inter au texte courant. C'est repris tel quel — c'est le dessin de Vincent
— mais les deux pages projet ne se ressemblent plus sur ce point.

### Les compositions posées en pourcentage

Deux blocs suivent la convention du tas de photos de l'accueil : tout est en % d'un cadre
de référence, donc la composition se met à l'échelle d'un seul tenant.

- **JacquIA**, cadre 1472 × 1819 : la bannière en haut, puis trois écrans en escalier à
  intervalle CONSTANT — 30,15 % en largeur, 13,15 % en hauteur. C'est cette régularité qui
  fait lire l'escalier ; ne la casse pas pour rattraper un chevauchement. Le premier écran
  mord sur la bannière, et c'est ce qui la fait basculer du plan de fond au plan de l'objet.
- **Le collage**, cadre 1472 × 1037 : trois pièces qui se CHEVAUCHENT — le Bitomètre passe
  sur l'affiche des Swame Awards. Garde les recouvrements : posées côte à côte, elles se
  liraient comme trois visuels perdus au milieu du cadre. L'ordre du DOM donne l'ordre de
  peinture (tout est en `z-index: auto`) ET l'ordre de la cascade.

### La couverture photographique, et son traitement

C'est le seul asset de la page qui demande autre chose qu'un redimensionnement, et ça vaut
d'être lu — tout est dans l'en-tête de `tools/build_jm.py`.

Dans la maquette, la photo est très assombrie, jusqu'à l'encre du site, **mais le tampon
« Jacquie & Michel » reste net et lumineux par-dessus**. Les deux ne peuvent donc pas
sortir de la même courbe, et le logo est pourtant CUIT dans `cover.png` : il n'y a pas de
calque à récupérer. On le retrouve par ce qui le distingue de la photo, qui est en noir et
blanc — le logo est le seul endroit **saturé** (l'anneau rose) ou **quasi blanc** (le
lettrage). Ce masque ne demande aucune coordonnée à tenir à jour.

Le reste sort en **teinte plate à opacité variable** : la maquette compose la photo en
additif au-dessus de l'encre, donc son apport est le même sur les trois canaux. Une couleur
unique portée par un alpha en (gris)^1,52 redonne exactement le même rendu — mesuré à 1,6 %
d'écart moyen — pour un fichier qui n'est plus qu'une carte d'alpha.

**L'alpha n'est pas un luxe** : c'est lui qui laisse le motif topographique passer dans les
noirs, comme dans la maquette. Une couverture opaque le masquerait.

**Le motif ne couvre pas la bande**, il en occupe le coin bas-gauche et rien d'autre —
mesuré en soustrayant la photo traitée à la maquette : il tient dans 400 × 320 px sur une
bande de 1512 × 637, et ailleurs le résidu tombe à zéro. Étalé partout il cesserait d'être
un décor pour devenir une texture, ce qui écrase la photo.

**Les opacités des deux calques topo ne sont pas au jugé.** Dans la maquette, un trait
dépasse son fond de 12 niveaux sur le panneau et de 26 sur la couverture ; le trait de
`topo.svg` est `#22345f`, soit 17,6 de plus que `--navy` et 44,6 de plus que `--ink`. D'où
0,66 et 0,58. Si tu changes un fond, refais ce calcul plutôt que de tâtonner.

La maquette pique en plus des croix de repérage tous les 70 px sur la couverture. Elles
viennent d'un autre relevé, qui n'est pas dans le dépôt — `gen_map.py` le régénère, mais
dans un `src/` non servi. Les courbes seules font le travail.

### Un seul bloc n'est pas cliquable, et c'est motivé

Quatre des cinq blocs d'images portent `data-viewer` et s'ouvrent en grand. **JacquIA
non** : le site de la campagne est encore en ligne, à `https://jacquia.com/`, donc l'ouvrir
en visionneuse serait proposer la photocopie à côté de l'original.

**La bannière EST le lien, et son libellé n'apparaît qu'au survol** — c'est l'image entière
qu'on clique, pas un bouton posé à côté d'elle. Un voile d'encre et une pastille `.case-btn`
« Voir le site » s'y fondent, `target="_blank"` + `rel="noopener"` + un `aria-label` qui
annonce le nouvel onglet. Un bouton posé SOUS la composition a été essayé et retiré : il se
lisait comme une légende, pas comme une porte.

Trois choses à ne pas défaire :

- **la pastille revient au clavier** (`:focus-visible`, pas seulement `:hover`) et **reste
  visible sur un écran tactile** (`@media (hover: none)`), où il n'y a pas de survol du
  tout. Une affordance qui n'existe qu'à la souris est une affordance qui n'existe pas ;
- **la pastille est `aria-hidden`**, et c'est l'`aria-label` du lien qui porte le sens : au
  lecteur d'écran, un « Voir le site » qui double le libellé du lien n'ajoute rien ;
- **un voile d'encre, pas un flou.** La bannière est magenta vif, donc l'assombrir suffit.
  Le `backdrop-filter` de la visionneuse n'est là que parce qu'elle, elle se pose sur du
  sombre.

Sans le `data-viewer`, les quatre images du bloc redeviennent des images : ni curseur
`zoom-in`, ni cible de clic, ni arrêt au clavier. Il n'y a rien d'autre à retirer.

Les quatre autres blocs gardent la visionneuse parce que leurs pièces n'existent plus qu'en
image : les sites ont été refaits, les marques fermées ou revendues, les campagnes sont
passées, la fresque des vingt ans n'est plus en ligne.

### Les assets, et ce que le script ne peut pas rattraper

Les vingt-cinq `.webp` sont produits par **`tools/build_jm.py`**, jamais à la main. Il lit
la largeur des pièces posées en pourcentage **dans le CSS** et en déduit la cible en
densité 2 ; les cases de grille, qui ne portent aucune largeur, ont leur nombre dans le
manifeste. Il est idempotent et **n'agrandit jamais**.

**Douze des vingt-cinq sources sont en 1x**, et il le dit à chaque passe : les quatre mises
en scène, les trois écrans de JacquIA, les trois du collage et la couverture sortent à leur
taille native, donc molles sur un écran retina. Il faut les réexporter deux fois plus grand
depuis Figma. Les douze marques, la bannière et la fresque, elles, sont à la bonne taille.

### La grille des réseaux

Sous le collage, **seize visuels des réseaux sociaux, quatre par rangée en desktop et deux
sous 620 px** — demandé par Vincent. Le collage montre trois temps forts, la grille montre
le rythme : la même marque tenue d'une fête à l'autre, sur dix ans.

**Les cases sont carrées, les fichiers ne le sont pas**, et c'est le point. Les sources
vont de la story verticale (0,56) à la bannière de boutique (3:1) : aucune case ne les
tiendrait toutes entières, et des cases à hauteur variable casseraient les rangées. Le
recadrage est donc en CSS (`aspect-ratio: 1` + `object-fit: cover`) et **jamais dans
l'export** — c'est ce qui laisse la visionneuse ouvrir chaque visuel EN ENTIER. Cinq
cases ont leur titre loin du centre et portent un `object-position` à modificateur,
relevé sur le rendu ; les onze autres tiennent au centre.

**Ce qui n'y est pas, et pourquoi** : Halloween et le Bitomètre sont déjà dans le collage
juste au-dessus ; les quatre ordinateurs de `social-network/` (elite, jmtv, pornovoisines,
pornudeo) doublent les mises en scène des sites ; la story « Instagram Story 1@2x » est
reprise, mais trois bannières très allongées (Pâques et Halloween de la boutique, fête des
pères) ne gardent rien de lisible en carré.
Pas de parallaxe, même consigne que les deux autres grilles.

Les `.webp` sortent de **`tools/build_social.py`**, qui ramène le PETIT côté de chaque
source à la case en densité 2 (694 px) — c'est lui qui remplit la case — et n'agrandit
jamais. Il ne lit pas le CSS : la case est déduite de la grille (cadre, colonnes,
gouttière), trois nombres en tête du script. Il signale les fichiers de `social/` que plus
rien ne charge. 1,1 Mo pour les seize, tous en `loading="lazy"`.

Deux titres portent un `<br>` volontaire (« Douze ans / dans la maison », et l'énoncé du
chantier après « optimisation. ») : ils ne se produiraient pas tout seuls à ces largeurs, et
ce sont les charnières du propos.

## La page Jimizz (`projet-jimizz.html`)

Intégration de la maquette de Vincent (1512 px de large ; le PNG n'est plus sur le
disque, voir « Le ménage du 11 septembre 2026 »).

**Elle est bâtie sur LE MÊME GABARIT que `projet-jm.html`**, et ce n'est pas une
impression : les deux PNG donnent les mêmes nombres au pixel — panneau de couverture à
62/142/82 px de padding, œil en Garamond italique 24 px, titre 50 px, corps 20 px sur 1,25,
liste des compétences à 25 + 12 px, cadre de 1472, colonne de texte de 1288, intro en
536fr / 680fr avec 72 px de gouttière. C'est ce qui a fait passer les primitives communes
sous le préfixe neutre `.proj-*` (voir la page J&M). Seuls **cinq blocs** portent `.jmz-`.

L'ordre est : `couverture > bande de marque > « Le projet Crypto de Jacquie & Michel »
> le site (collage + deux mises en scène) > la composition de l'app
> « Un univers 3.0 complet » > les quatre plateformes`. **L'alternance EST la structure** :
un texte, puis ce dont il parle. Il n'y a donc que trois titres visibles — le `h1` et les
deux `h2` — et les blocs d'images sont des `<section>` nommées par `aria-label`.

### Trois largeurs, et c'est la maquette qui les dit

- **PLEINE LARGEUR** — la bande de marque, le collage du site et la composition de l'app.
  Les deux premières sont des bandes (`.proj-band`, le mécanisme partagé) ; la troisième est
  bornée à 1512 px, parce que c'est une composition d'objets et non une photo : laissée
  libre, elle grossirait d'un tiers sur un écran de 2560 ;
- **LA BANDE, 1350 px** (`--jmz-band`) — les deux mises en scène et le collage des
  plateformes. Plus étroite que le cadre de 1472 du panneau, et c'est délibéré : la maquette
  pose ces deux blocs à 80 px des bords, contre 20 px pour le panneau ;
- **LA COLONNE, 1288 px** (`--proj-col`) — les deux textes, comme chez J&M.

**Le rythme vertical est ramené sur un seul nombre**, `--proj-gap`, qui vaut ici 93 px — la
valeur dominante de la maquette, contre 183 chez J&M. Cinq transitions s'en écartent par un
coefficient, et toutes dans le même sens : **ce qui borde un TEXTE respire plus, ce qui
prolonge une IMAGE respire moins** (×1,50 avant le collage du site, ×0,27 avant les mises en
scène, ×0,86 avant l'app, ×0,48 avant le second texte, ×2,15 avant les plateformes). Les
coefficients sont les rapports relevés sur le PNG, pas des valeurs choisies — d'où les
décimales. Baisse `--proj-gap` et toute la page se resserre en gardant ses proportions.

Le ×0,48 surprend jusqu'à ce qu'on sache pourquoi : les trois écrans du dashboard portent
leur **ombre douce dans leur alpha**, et celle du dernier remplit 134 px sous lui. Le cadre
de la composition descend donc bien plus bas que ce qu'on voit, et 45 px de marge suffisent.
Le resserrement n'y change rien : les tailles n'ont pas bougé, donc l'ombre non plus.

### Les deux compositions, posées en pourcentage

Même convention que le tas de photos de l'accueil et JacquIA : tout est en % d'un cadre de
référence, donc la composition se met à l'échelle d'un seul tenant.

- **la composition de l'app**, cadre **1512 × 1716** : trois écrans, une fusée et cinq
  pièces d'or. Le cadre est pleine largeur et non le cadre de 1472 parce que la composition
  va d'un bord à l'autre, et il est exactement borné par la pièce du haut et par l'ombre de
  l'écran du bas — **si tu bouges une pièce, recalcule-le**, un cadre trop haut laisserait
  un vide au bas de la section ;
- **les quatre plateformes**, cadre **1350 × 1749** : la marketplace en fond, puis le
  dashboard, le quizz et le centre d'aide. Elles se CHEVAUCHENT — le dashboard mord sur la
  marketplace (50 px), le centre d'aide sur le quizz (88 px) — et ce sont ces deux contacts
  qui font tenir le collage. Posées côte à côte, elles se liraient comme quatre captures
  perdues au milieu du cadre.

**LES POSITIONS SONT CELLES DE LA MAQUETTE, RESSERRÉES.** Vincent trouvait le groupe trop
écarté, et il l'était : les trois écrans et la fusée se lisaient comme quatre visuels posés
côte à côte plutôt que comme une masse — exactement le reproche qu'avait valu sa première
version au groupement Jimizz de la section projets de l'accueil.

**Le resserrement est une contraction vers le barycentre des trois écrans**, ×0,84 en
largeur et ×0,72 en hauteur, et rien d'autre : les tailles ne changent pas (donc aucun
`.webp` à réexporter), le barycentre est conservé — le léger décentrage du groupe vers la
gauche, 40 px, est donc celui de la maquette et pas un effet de bord du calcul — et le cadre
est passé de 2475 à 2048 px de haut.

**Puis l'écran de staking a été remonté de 332 px**, encore à la demande de Vincent : il
restait 372 px de vide entre le bas du portefeuille et son haut, et l'escalier s'y cassait.
Il en reste 40, la pièce d'or qui le suit a remonté avec lui, et le cadre est descendu à
1716 px. Les deux passes ont raccourci la page de 760 px en tout.

**LES CINQ PIÈCES D'OR ONT SUIVI LE DÉPLACEMENT DE LEUR ÉCRAN** au lieu d'être contractées
elles aussi, et c'est le point : contractée pour son propre compte, une pièce aurait glissé
le long du téléphone au lieu de rester derrière le coin qu'elle touche. Leur position
relative à leur écran est donc **inchangée depuis la maquette, au pixel**. Si tu resserres
encore, garde ce partage.

Les trois écrans ne se recouvrent toujours pas : ils sont séparés sur au moins un axe — 13 px
en largeur entre le menu et le portefeuille, 40 px en hauteur entre le portefeuille et le
staking. Mais ces 40 px sont désormais serrés, et c'est la seule exception à la règle des
amplitudes ci-dessous.

**L'ORDRE DU DOM DE LA COMPOSITION DE L'APP EST RELEVÉ, PAS CHOISI.** Tout est en
`z-index: auto`, donc l'ordre du DOM est l'ordre de peinture, et il a été lu une pièce à la
fois en zoomant sur les recouvrements du PNG : les quatre premières pièces passent
**derrière** l'écran qu'elles touchent, la cinquième — la seule nette — **devant**. Si tu
réordonnes, une pièce changera de plan sans prévenir.

L'arrondi des quatre captures de plateformes est **cuit dans leur alpha** : aucun
`border-radius` en CSS, et si tu réexportes une capture, garde-le dans l'image.

### Le parallaxe : une contrainte arithmétique, pas un réglage au goût

`--par` allant de -1 à +1, **deux pièces qui se chevauchent dérivent l'une par rapport à
l'autre de DEUX FOIS l'écart de leurs amplitudes**. Au-delà de leur recouvrement, elles se
décollent en cours de route et le collage se défait. C'est la seule chose à savoir pour
toucher aux amplitudes de cette page, et c'est ce qui explique le partage :

- **la profondeur est portée par ce qui ne touche personne** — les trois écrans et la fusée,
  de 60 à 150 px ;
- **chaque pièce collée à un écran reste à 6 px de lui**, soit 12 px de dérive au pire. Elles
  flottent avec leur écran au lieu de s'en détacher ;
- sur les plateformes, 18 px d'écart entre les deux paires qui se touchent (36 px de dérive
  pour 50 et 88 px de recouvrement), et un écart libre entre les deux paires, qui ne se
  touchent pas : 26 → 44 → 92 → 110 px, d'autant plus rapide qu'on est devant.

**Une seule exception, et elle est mesurée** : depuis que l'écran de staking est remonté, il
n'est plus qu'à 40 px sous le portefeuille pour 70 px d'écart d'amplitude — donc jusqu'à
140 px de dérive relative, et les deux se croisent en cours de route. Ce que ça donne à voir
tient dans leur recouvrement HORIZONTAL, qui vaut 6,6 px : le coin arrondi de l'un passe
derrière celui de l'autre sur six pixels de large. Baisser l'amplitude du staking à 80 px
supprimerait le croisement, et supprimerait avec lui l'essentiel de la profondeur — c'est le
mauvais échange.

Si tu creuses un de ces écarts, **remesure le recouvrement**.

### Les assets

Les dix-sept `.webp` sont produits par **`tools/build_jimizz.py`**, jumeau de `build_jm.py` :
il lit les `width: %` des pièces DANS LE CSS, en déduit la cible en densité 2, et
n'agrandit jamais. Déplacer une pièce ou changer sa largeur, relancer, et l'export suit.

**Les sources sont toutes en @2x pile** — les exports Figma tombent exactement au double de
leur taille d'affichage — **à une exception : la bande de marque**, en 1512 px pour 1512 px
d'affichage. C'est la seule pièce molle de la page sur un écran retina, et le script le
redit à chaque passe. À réexporter deux fois plus grand.

**L'ALPHA EST COMPRESSÉ AVEC PERTE** (`ALPHA_QUALITY = 70`), et c'est le seul réglage qui ne
vienne pas de `build_jm.py`. Les trois écrans du dashboard portent une ombre douce qui pèse
plus lourd que la capture elle-même : 1 160 Ko à eux trois en alpha sans perte, contre 843.
Mesuré sur l'image composée au-dessus de l'encre de la page, le prix est de 0,2 niveau
d'écart moyen sur 255 et rien au 99e centile — invisible. Descendre plus bas (50) ne gagne
plus rien.

**Trois choses dépendent des alpha, et aucune ne se rattrape en CSS** : l'arrondi des
captures de plateformes, l'ombre douce des trois écrans (qui règle l'espace jusqu'au texte
suivant, voir plus haut), et le dégradé vertical des deux mises en scène, qui les fait
fondre dans l'encre de la page — leurs coins descendent à 140 et 101 sur 255. D'où le mode
RGBA partout et jamais un aplatissement sur fond opaque.

Au total 1 867 Ko servis pour 12 Mo de sources, et **22 Ko seulement au premier rendu** :
tout le reste est en `loading="lazy"`, vérifié au moniteur réseau.

### Deux décors empruntés à l'accueil

- **le carré topo derrière les deux blocs de texte**, comme les deux sections de la page J&M
  (voir le gabarit). La bande de marque a un temps porté à la place un liseré de 65 px de
  courbes dépassant sous elle, dans le coin gauche — c'était ce que montrait le PNG, et
  c'était justement la coquille : ce fragment était le HAUT du carré topo de la section
  suivante, mal placé dans la maquette. Le carré est à sa place, le liseré est retiré ;
- **un carré topo dans la composition de l'app**, `topo-square-left.svg`, largement
  recouvert par l'écran du menu : on n'en voit que la bande qui dépasse à gauche. Il est
  resté **au bord du cadre** quand tout le reste s'est resserré — ce décor déborde du côté
  gauche, il ne suit pas l'écran ; seule sa hauteur a suivi. La maquette
  y pique des croix de repérage tous les 66 px là où celles du carré sont tous les 52 —
  elles viennent du même autre relevé que la couverture J&M, qui n'est pas dans le dépôt.
  Sur 108 px de large aux trois quarts cachés, le carré du dépôt fait le travail.

## Les transitions de page

Entre deux pages, **un panneau d'encre monte du bas, recouvre l'écran en portant un
COLLAGE DES SEPT STICKERS DU HERO, puis POURSUIT SA MONTÉE et libère la page suivante.**
Un seul geste coupé en deux par la navigation : ce qui a couvert sort par le haut, ça ne
revient pas sur ses pas. Le dessin est dans `css/style.css` (« LE VOILE DE TRANSITION »),
la mécanique dans `js/veil.js`. Il a porté le NOM avant le collage — c'était plus sobre,
et ça se lisait comme un écran de chargement.

**Il y a eu une `@view-transition` native ici, et elle a été retirée.** Elle marchait —
vérifié dans le CSSOM — mais elle ne se VOYAIT pas : un fondu croisé de 360 ms entre deux
pages sombres au dessin quasi identique ne donne rien à regarder, et elle ne jouait que sur
les navigateurs qui la connaissent. **Ne la remets pas EN PLUS du voile** : le navigateur
prendrait son instantané pendant que le panneau bouge, et les deux se marcheraient dessus.

**`js/veil.js` est un quatrième fichier, et c'est motivé.** Sa moitié « arrivée » doit
s'exécuter AVANT LE PREMIER RENDU, sans quoi la page suivante apparaît un instant à nu
avant d'être recouverte — `main.js`, qui charge en bas, est hors de course. Le seul autre
moyen serait de recopier le même bloc dans les quatre en-têtes, et c'est le genre de
doublon dont l'une des copies finit par mentir. Il est chargé en tête des **quatre** pages.

Le partage habituel tient : **le JS ne pose que deux classes** sur la racine, `is-leaving`
et `is-entering`, et tout le dessin est en CSS — comme `--open` du parcours ou `--out` du
tas de photos.

**LE PANNEAU EST UN PSEUDO-ÉLÉMENT DE `html`, LE COLLAGE EST DU DOM**, et ce partage est
la sûreté du procédé, pas une commodité :

- **ce qui COUVRE ne peut pas échouer.** Au premier rendu de la page qui arrive, il n'y a
  pas encore de `<body>` où insérer quoi que ce soit ; une classe sur la racine, elle,
  s'applique tout de suite. Le panneau est donc là dès la première image ;
- **ce qui DÉCORE peut se permettre une image de retard.** Le collage est monté par le JS
  dès que `<body>` existe. S'il arrivait tard, on verrait un panneau d'encre nu — jamais la
  page à nu.

Ne déplace pas le panneau dans le DOM pour « faire pareil » : c'est exactement la garantie
qu'on perdrait. Corollaire gratuit : **sans JS il n'y a ni classe ni collage, donc pas de
voile**, et le clic n'est pas intercepté — même règle que `.js-motion`.

**Le collage est du CHROME, donc c'est le JS qui le fabrique** — même règle que la
visionneuse, et l'inverse exact de celle du reveal. La liste des sept fichiers est dans
`veil.js`, TOUTE la géométrie est dans le CSS : le JS ne sait pas où les pièces se posent.

**Le montage attend `<body>` avec un `MutationObserver`, et pas `DOMContentLoaded`**, qui
vient après tout le document : l'observateur rend la main à l'instant où la balise s'ouvre,
donc avant qu'un seul contenu ne soit analysé. Vérifié — la classe et le collage sont en
place pendant que `document.readyState` vaut encore `loading`.

**Une page qui arrive SANS voile monte quand même le collage, au `load`.** Ce n'est pas du
zèle : les sept stickers pèsent 232 Ko, et c'est ce qui les met en cache pour le départ
suivant sans rien disputer au premier rendu (mesuré : 0 Ko de transfert au voile suivant).
Un filet dans le gestionnaire de clic le monte à la volée si l'on part avant.

### Le collage, et son parallaxe

**Les sept pièces se chevauchent**, et c'est la seule chose à préserver : posées côte à
côte elles se liraient comme sept vignettes perdues au milieu du cadre — même leçon que le
groupement Jimizz de l'accueil et le collage des campagnes de la page J&M. Mesuré, chacune
en touche au moins une autre (sept contacts), et le cadre de 640 × 440 est occupé à
57/56 px de marge horizontale et 23/24 px de marge verticale.

Tout est posé **en pourcentage d'un cadre de référence**, comme le hero, le tas de photos
et les groupements des projets. La rotation de repos vit dans `--rot` — ce sont les valeurs
mêmes du hero, les fichiers sont à plat.

**L'ordre du DOM est l'ordre de peinture ET l'ordre de profondeur**, de l'arrière vers
l'avant, et il règle les séries qui vont toutes ensemble : `--out-y` (de combien la pièce
traîne derrière le panneau à l'aller), `--out-x/r/s` (sa dérive, sa rotation et son échelle
de départ), `--d` (son retard), `--away-y/r` (de combien elle s'échappe EN PLUS du panneau
au retour). Si tu réordonnes les pièces, garde-les croissantes.

**`--out-y` ET `--away-y` SONT EN `vh`, et c'est le point.** `--out-y` a d'abord été en
PIXELS — 26 à 60 px — et Vincent a dit que le collage ne bougeait pas du tout. Il avait
raison, et ce n'était pas un bug : le conteneur, lui, traverse 100 vh, soit 800 px sur un
portable. Le décalage propre d'une pièce pesait donc **5 % du mouvement** et se perdait
dedans — on ne voyait qu'un bloc qui monte. Une pièce doit traîner d'une **fraction de
l'écran** pour qu'on la voie rattraper le panneau. C'est 12 vh au fond et 42 devant, soit
96 à 336 px mesurés en 1280 × 800 : celle de devant parcourt 42 % de plus que le panneau.

**Le panneau et le collage partagent LA MÊME animation, à la lettre** : c'est ce qui les
tient collés sans un seul calcul, et c'est pour ça que les pièces n'ont à porter que ce qui
leur est propre. Sépare-les et ils dériveront.

**À l'aller elles rattrapent le panneau**, l'une après l'autre, en tournant (de -34° à
+40° de départ) et en grandissant (de ×0,64 à ×0,78). **Elles empruntent la courbe du
panneau** et non `--ease-out` : c'est ce qui fait lire la traîne comme un retard sur un
même mouvement plutôt que comme sept animations indépendantes. Le dernier retard plus la
durée doivent tenir dans `--veil-close + --veil-hold` — 168 + 528 = 696 pour 820 de
fenêtre — sinon la page s'en va avant que la dernière pièce ne soit posée.

**Au retour c'est une remontée, et rien d'autre** : pas de fondu, pas d'échelle, pas de
retard. Elles partent toutes ensemble, sur la même courbe et la même durée que le panneau,
et **l'effet vient du seul écart entre leurs `--away-y`** — mesuré, le conteneur fait
-800 px et les pièces ajoutent de -64 px au fond à -288 px devant, soit 4,5×. Même principe
que la sortie du tas de photos de l'accueil : n'y remets ni retard ni courbe. Seule la
rotation leur est propre (`--away-r`), et elle **alterne de signe** — sans quoi l'envol se
lirait comme une seule image qu'on translate.

**Aucune pièce ne peut se retrouver exposée sur la page**, et c'est arithmétique : le
panneau remonte de 100 vh, chaque pièce de 100 vh PLUS son `--away-y`, donc elle va
toujours au moins aussi vite que lui. Une pièce plus lente sortirait par le bas du panneau
et se verrait par-dessus le contenu. Garde tous les `--away-y` négatifs.

À l'aller, la garantie est la même dans l'autre sens : les `--out-y` sont tous POSITIFS,
donc une pièce part toujours plus bas que sa place et reste sous le bord d'attaque du
panneau tant qu'elle le rattrape. Un `--out-y` négatif la ferait sortir par le haut,
au-dessus du panneau, avant que celui-ci ne l'ait couverte.

**Les trois durées sont déclarées dans le CSS et LUES par le JS**, jamais réécrites de
l'autre côté : `--veil-close` (420 ms), `--veil-hold` (120 ms) et `--veil-open` (560 ms)
vivent dans `:root`, et `veil.js` va chercher les deux premières dans le style calculé pour
savoir quand lancer la navigation. Même principe que `bakeRelief()`, qui lit le chemin de
la tuile dans le fond CSS plutôt que de le redire. **Change un nombre, les deux côtés
suivent.** Total ≈ 1,1 s, réseau en plus.

**LE PRIX, ASSUMÉ : le clic est intercepté**, donc la navigation part avec
`--veil-close + --veil-hold` de retard. C'est le SEUL endroit du site où le JS se met en
travers d'un geste du visiteur, et c'est ce qui permet au voile d'être fermé avant que la
page ne s'en aille. Tout le reste passe sans être touché, et la liste est à tenir : ancre
de la même page (le défilement lissé du header en dépend), lien sortant, `mailto:`,
`target="_blank"`, `download`, clic milieu, Cmd/Ctrl/Maj/Alt-clic. Vérifié un par un.

**Le voile ne joue QUE d'une page du site à une autre.** Le drapeau est posé en partant et
consommé en arrivant : quelqu'un qui débarque d'un moteur de recherche ne regarde pas un
panneau d'encre se retirer — ce serait un écran de chargement, pas une transition. Le
bouton Précédent non plus, faute d'avoir pu intercepter le départ.

**Deux filets, et il faut les deux** : la classe `is-entering` est retirée sur
`animationend` (avec vérification du nom de l'animation — `animationend` remonte jusqu'à la
racine depuis toute la page, l'atterrissage du tas de photos compris), et à défaut par un
minuteur. Sans le second, un onglet ouvert en arrière-plan — où les animations ne tournent
pas — resterait sous un panneau d'encre plein écran.

En mouvement réduit, `veil.js` sort avant de poser la moindre classe : aucune règle ne
s'applique et le clic n'est pas intercepté. Il n'y a rien à neutraliser en CSS.


### L'arrivée sur l'accueil ne défile plus sous les yeux

Deux choses, réglées par le script en tête d'`index.html` — **en tête, parce que ça se joue
avant le premier rendu**, même parti que l'amorce de motion des trois pages projet.

**`scroll-behavior: smooth` s'applique aussi au saut vers l'ancre d'une NAVIGATION**, et pas
seulement au clic sur une ancre interne. Revenir sur `index.html#projets` faisait donc
descendre la page en douceur… à travers les 717 vh du parcours. La classe `is-arriving`
repasse en `auto` le temps du chargement et s'en va au `load` — qui est précisément le
moment où le navigateur cesse de re-viser le fragment. Les ancres du header, elles, gardent
leur défilement lissé.

**Et le retour d'une page projet repose la page où on l'avait laissée.** On mémorise la
position en partant (`pagehide`, dans `sessionStorage`), on la restaure en revenant : on
retrouve la carte qu'on regardait, et l'état du parcours avec.

- **le signal est l'ancre `#projets`, et rien d'autre** : c'est celle des liens « Tous les
  projets » des trois pages projet. Les autres liens du header — à propos, parcours,
  contact — se posent normalement sur la leur, et quelqu'un qui arrive de l'extérieur sur
  `#projets` n'a rien en mémoire, donc il a le saut vers l'ancre. **Le repli EST le
  comportement d'avant**, il n'y a rien de plus à prévoir ;
- **on retire l'ancre de l'URL** (`replaceState`), et c'est ce qui évite le clignotement :
  sans ça le navigateur pose d'abord la page sur la section, et on la déplace ensuite. Il
  n'y a plus qu'un positionnement. L'URL dit alors la vérité — on n'est pas « à la section
  projets », on est là où on était ;
- **trois rendez-vous et pas un seul** (`DOMContentLoaded`, `pagereveal`, `load`) : la
  hauteur du document n'est complète qu'une fois les images posées, et une cible plus basse
  que le document se fait écrêter en silence. Mesuré, c'est le premier qui travaille — le
  document a déjà sa hauteur pleine à `DOMContentLoaded`, donc **il n'existe aucune image
  où la page serait peinte en haut**. `pagereveal` tombe juste après, avant la première
  occasion de rendu : c'est la dernière barrière avant que quoi que ce soit ne se voie ;
- **le visiteur est prioritaire** : au premier geste de sa part, on lâche l'affaire.

Le tout dans un try/catch — `sessionStorage` lève en navigation privée sur certains
navigateurs, et une page d'accueil n'a pas à dépendre d'un espace de stockage.

### Ce que le panneau ne peut pas montrer

Le voile lui-même ne s'y voit pas : **le panneau masqué gèle les animations CSS**, donc une
animation en `both` reste figée sur sa première image. Ce qui se vérifie quand même, et qui
a été vérifié : les pseudo-éléments n'existent pas sans classe (`content: none`), ils
couvrent bien tout l'écran en encre une fois la classe posée, le clic est intercepté ou non
selon le type de lien, le drapeau passe d'une page à l'autre, et `is-entering` est posée
**pendant que le document est encore en `loading`** — donc avant le premier rendu.

Deux autres pièges du panneau, à ajouter à celui de `requestAnimationFrame` :

- **il sert des HTML en cache.** Un `<script>` ajouté en tête de page ne sera pas là au
  chargement suivant, et on cherche longtemps pourquoi le code « ne s'exécute pas ». Le
  rafraîchissement documenté plus haut ne couvre que `style.css` et `main.js` : ajoute les
  pages elles-mêmes à la liste des `fetch(…, {cache: 'reload'})` ;
- **il a un viewport de hauteur NULLE.** `717vh` y vaut 0, la piste du parcours se replie
  entièrement, `--pull` tombe à 0 et le document fait 7 300 px au lieu de plus de 12 000.
  **Aucune mesure verticale n'y veut rien dire** — seules les mesures horizontales et les
  rapports position mémorisée / position restaurée tiennent.


## La motion des pages projet (`js/main.js`, quatrième IIFE)

Deux mouvements sur les trois pages projet, et deux seulement : la **couverture se pose au
chargement**, les **blocs se révèlent au scroll**. Le corps de texte n'est jamais révélé
paragraphe par paragraphe — on ne fait pas apparaître sous les yeux de quelqu'un le texte
qu'il est en train de lire. Un bloc, une révélation.

**Une seule courbe pour tout ce qui entre** : `--ease-out`, `cubic-bezier(.23, 1, .32, 1)`,
déclarée dans `:root`. C'est le premier token de motion du site — les 27 transitions
antérieures utilisaient `ease` ou une courbe écrite en clair. Les mouvements de survol
gardent `ease` : à 180 ms la courbe ne se voit pas.

**La source de vérité est le HTML.** Ce qui se révèle est décidé par un attribut
`data-reveal` posé à la main dans la page, comme les `data-at` des étapes du parcours. Le JS
ne fait que le déclencher, le CSS que le dessiner. Cinq valeurs :

| valeur | effet |
|---|---|
| `data-reveal` | le bloc monte de 10 px et se fond |
| `data-reveal="group"` | le conteneur ne bouge pas, ses enfants se posent l'un après l'autre (70 ms d'écart, **jusqu'à seize**) |
| `data-reveal="group scatter"` | un groupe dont chaque enfant part de SON décalage, et plus lentement |
| `data-reveal="pin"` | seule la pastille du volet (`::before`) éclot, de 0,72 à 1 |
| `data-reveal="zoom"` | une bande pleine largeur se referme sur son cadre, de 1,045 à 1 |

**L'attribut est une LISTE DE MOTS, et les sélecteurs le lisent en `~=`.** C'est ce qui
permet à `scatter` d'être un `group` — même cascade, mêmes retards — sans dupliquer
l'échelle des onze retards. Si tu ajoutes une variante, fais-en un mot de plus plutôt
qu'une valeur de plus.

**Le décalage de départ d'un enfant vit dans des variables**, `--out-x`, `--out-y`,
`--out-r`, `--out-s`, déclarées dans la règle CSS de la pièce et jamais dans le HTML — mêmes
noms et même principe que les groupements de la section projets de l'accueil. **Les deux
états sont écrits en dur** : aucune de ces variables ne CHANGE d'un état à l'autre, c'est
la déclaration qui change. Une variable qui change en cours de transition ne s'interpole
pas, elle saute.

La cascade allait jusqu'à **quatre** enfants ; elle va à douze depuis la grille des marques
de la page J&M, où les huit dernières cases se posaient toutes ensemble. La traîne fait
770 ms sur un mur d'images, et rien n'a changé sur les groupes de trois ou quatre de Beepz.
Puis à **seize** pour la grille des réseaux, même page, même raison : 1 050 ms de traîne.

**`.js-motion` porte tous les états masqués, et elle est posée par un script en TÊTE de
page**, avant le premier rendu — pas depuis `main.js` en bas. C'est ce qui évite de voir la
page s'afficher en entier puis se cacher. Corollaire à ne jamais enfreindre : **la
visibilité d'un contenu ne dépend pas du JS**. Sans JS la classe n'existe pas, en mouvement
réduit le script ne la pose pas, et dans les deux cas rien n'est masqué. Un garde-fou de
2,5 s la retire si `main.js` ne s'est pas annoncé (`data-motion="ready"`) — réseau coupé,
404 : le texte réapparaît au lieu de rester invisible.

**Le déclencheur est un balayage géométrique, pas un `IntersectionObserver`**, et c'est
délibéré : l'observateur ne signale que les FRANCHISSEMENTS. Un saut d'un seul rendu — gros
crans de molette, `scrollTo`, position restaurée, ancre du sommaire — peut faire passer un
bloc de « sous la fenêtre » à « au-dessus » sans une image intermédiaire où il croise le
bord : aucune notification, et le bloc reste masqué pour toujours. On relit donc la position
de ce qui reste à révéler, une fois par image (`requestAnimationFrame`), sur un écouteur de
scroll passif qui **se débranche quand la liste est vide**.

**La couverture s'anime par cinq règles nommées**, pas par des `nth-child` : la structure du
hero bouge encore, et un sélecteur de position décalerait les retards en silence au premier
bloc ajouté. `.case-back` (0), `.case-hero__text` (70 ms), les trois `.plate` de l'arrière
vers l'avant (140/210/280 ms), `.topo` (350 ms). Si un de ces noms disparaît, sa règle
devient sans effet et l'élément s'affiche **sans animation, jamais masqué**.

On anime `translate` et `opacity`, jamais `transform` : les plaques portent déjà
`transform: rotate(var(--rot))`, et les deux propriétés se composent d'elles-mêmes — même
raison que `pile-land` sur l'accueil. Ni l'un ni l'autre ne déclenche de calcul de mise en
page.

**Ce qui n'a pas pu être vérifié dans le panneau** : la révélation au scroll elle-même. Le
panneau navigateur ne rend rien quand il est masqué (`document.hidden`), donc ni
`requestAnimationFrame` ni `IntersectionObserver` n'y tournent — un piège qui fait conclure
à tort que le code est en cause. Les états, les courbes, les retards et le chemin « sans JS »
ont été vérifiés en lisant le CSSOM et en posant les attributs à la main.

**Et un second piège, plus vicieux : les TRANSITIONS sont gelées elles aussi.** Poser
`data-reveal-in` à la main puis lire `getComputedStyle().opacity` renvoie alors la valeur
interpolée coincée au départ, c'est-à-dire l'ANCIEN état — de quoi croire que la règle ne
s'applique pas, ou pire, qu'un contenu reste masqué sans JS alors qu'aucune règle ne le
masque. Deux gestes suffisent avant de mesurer :

```js
document.head.appendChild(Object.assign(document.createElement('style'),
  {textContent:'*{transition-duration:0s !important}'}));
document.querySelectorAll('*').forEach(e => e.getAnimations().forEach(a => a.finish()));
```

Le second est le plus important : une transition déjà lancée survit au changement de règle,
et c'est ELLE qui tient la valeur, pas la feuille de style.

## Le parallaxe des pages projet (`js/main.js`, huitième IIFE)

Ce qui donne son glissé à une page longue, ce n'est pas la vitesse du scroll, c'est
**l'écart entre ce qui avance vite et ce qui avance lentement** — même principe que la
sortie du tas de photos de l'accueil.

Trois règles, les mêmes que partout ailleurs :

- **le HTML décide.** Un élément porte `data-parallax`, et c'est tout : ni amplitude, ni
  direction dans l'attribut. On lit la page et on sait ce qui bouge ;
- **le JS ne pose qu'un nombre**, `--par`, entre -1 (la pièce touche le haut de la fenêtre)
  et +1 (elle en touche le bas). Comme `--out` du tas et `--open` du parcours ;
- **le CSS compose**, via `--par-amp` dans la règle de chaque pièce. Une amplitude
  **positive** fait passer la pièce plus vite que la page — elle vient devant ; une
  **négative** la retient — elle passe derrière.

**Le parallaxe écrit dans `transform`, la révélation dans `translate`.** Ce n'est pas un
hasard : ce sont deux propriétés distinctes, qui se composent d'elles-mêmes, donc une pièce
peut être révélée ET parallaxée sans que l'une écrase l'autre. Même raison que `pile-land`
sur l'accueil. **Ne les ramène pas sur la même propriété.**

**L'AMORTISSEMENT EST CE QU'ON RESSENT, et le scroll n'est PAS détourné.** La valeur
courante ne saute pas sur sa cible, elle court après (`SUIVI`, 0,11 du reste par image). Le
défilement de la page reste parfaitement natif — inertie du trackpad, barre, clavier,
restauration de position — mais les images traînent d'un cheveu puis se reposent, et c'est
ça qui se lit comme de la fluidité.

Intercepter la molette pour animer `scrollTop` soi-même a été écarté : ça coûte l'inertie
native (sur un trackpad macOS elle est déjà meilleure que tout ce qu'on écrirait), la
restauration de position, et la moitié du clavier — pour un gain que la traîne donne déjà.
Le parcours de l'accueil, lui, intercepte bel et bien la molette, mais parce qu'il a besoin
de s'ARRÊTER sur des marques ; ce n'est pas le même problème. Si tu veux quand même un
scroll piloté, c'est une décision à prendre pour tout le site, pas pour une page.

**La boucle s'arrête quand tout est posé** (`EPS`), et le prochain scroll la relance : une
page immobile ne doit pas tourner à 60 images par seconde.

### `--par-gain` : le seul bouton de volume

Il multiplie toutes les amplitudes d'une page d'un coup, et il est déclaré **par page** —
`.jm` en porte un, `.jmz` un autre. **C'est lui qu'on touche pour rendre le parallaxe plus
franc ou plus discret**, jamais les amplitudes une à une. Il est déjà rabattu à `.52` sous
620 px sur les deux pages, où le même déplacement en pixels pèse trois fois plus lourd sur
un écran trois fois plus étroit.

Le MÉCANISME, lui, est unique et vit dans le bloc du gabarit (`[data-parallax]`) : c'est
aussi là qu'est consignée la seule contrainte dure du procédé — deux pièces qui se
chevauchent dérivent de deux fois l'écart de leurs amplitudes, donc au-delà de leur
recouvrement elles se décollent.

### Les amplitudes

| pièce | amplitude | pourquoi |
|---|---|---|
| les deux bandes pleine largeur | `-clamp(30px, 4.4vw, 66px)` | retenues, c'est le fond qui défile derrière son cadre |
| la bannière JacquIA | `-40px` | le plan de fond de sa composition |
| les trois écrans JacquIA | `24 / 92 / 160px` | trois plans distincts, de plus en plus rapides |
| le collage | `30 / 80 / 130px` | d'autant plus rapide qu'on est devant |
| le carré topo des campagnes | `-80px` | le décor dérive à contretemps du texte |

**LES DEUX GRILLES N'ONT PAS DE PARALLAXE, ET C'EST UNE CONSIGNE.** Les quatre mises en
scène et les douze marques n'ont qu'une révélation au scroll. Elles ont porté un
cisaillement **par colonne** — 26/92 px sur les sites, 18/54/90 px sur les marques —, l'idée
étant qu'un plan glisse derrière un autre et que l'alignement des rangées se défasse puis se
refasse ; Vincent l'a fait retirer. Sur des pièces alignées en grille, ça se lit comme un
défaut d'alignement plutôt que comme de la profondeur : la grille est justement ce qui
promet que les rangées sont droites. Les compositions **libres** de la page — JacquIA, le
collage — le gardent, elles, parce qu'elles ne promettent aucun alignement. Ne recâble pas
les grilles ; si tu devais le faire, ce serait par colonne et jamais par vignette.

**LES TROIS ÉCRANS DE JACQUIA ONT DES AMPLITUDES TRÈS DIFFÉRENTES, ET C'EST DEMANDÉ.** Il a
été écrit ici le contraire — que leur escalier devait garder son intervalle constant. Vincent
a tranché dans l'autre sens : il veut voir les trois plans se détacher franchement. L'escalier
respire donc de 169 px à 305 px selon la position dans la fenêtre (mesuré), sans jamais
s'inverser ni se croiser. Ne le « corrige » pas.

### Trois invariants, tous mesurés

- **les bandes ne découvrent jamais un bord.** Elles se débordent elles-mêmes de
  `--par-over` en haut ET en bas, et `--par-amp` vaut exactement ce débord ; `--par` étant
  borné à ±1, le déplacement ne peut pas excéder la réserve (vérifié aux deux extrêmes :
  0,00 px de découvert). Si tu montes l'amplitude, monte le débord du même geste — les deux
  sont le même nombre pour cette raison. Le prix, assumé : la bande est rognée d'environ un
  cinquième de sa largeur, et la couverture, qui est une source 1x, y perd un peu de
  finesse. Sur une image ramenée à une teinte plate, ça ne se voit pas ;
- **l'écran 1 mord toujours sur la bannière** : leur recouvrement va de 252 à 124 px, jamais
  à zéro. C'est ce contact qui fait basculer la bannière du plan de fond au plan de l'objet ;
- **le Bitomètre reste en contact avec l'affiche** : 362 à 162 px de recouvrement. C'est lui
  qui fait tenir le collage — s'il s'en détache, on retombe sur trois visuels posés côte à
  côte.

**Ce qui n'a pas pu être mesuré dans le panneau** : le coût par image. Le panneau masqué
gèle `requestAnimationFrame`, donc la boucle ne tourne pas et un profil n'y voudrait rien
dire (même piège que la révélation au scroll, voir plus haut). Ce qui est vérifié : les
dix pièces de la page J&M et les vingt-deux de la page Jimizz n'écrivent que `transform`,
propriété de compositeur, et la boucle se débranche à l'arrêt.

## La visionneuse (`js/main.js`, septième IIFE)

Cliquer une image d'une page projet l'ouvre en grand. Trois principes, les mêmes que
partout ailleurs sur ce site :

- **le HTML décide.** Un conteneur porte `data-viewer="<nom du groupe>"` et toutes les
  images qu'il contient forment **une** galerie qu'on parcourt aux flèches. Le groupe est
  donc l'unité éditoriale — les dix écrans du rail, les quatre emails, les vingt visuels
  réseaux — et pas une liste à plat de soixante images sans rapport ;
- **le JS ne pose qu'un état** : ouvert, fermé, index courant. Toute la mise en scène est
  dans le CSS ;
- **le marquage est fabriqué par le JS**, et c'est **l'inverse exact de la règle du
  reveal**. Là-bas le contenu ne doit jamais dépendre du JS, donc `.js-motion` est posée en
  tête de page ; ici la visionneuse n'est que du chrome, donc sans JS il ne doit rester ni
  bouton mort ni `<dialog>` inerte. Les images restent des images.

**C'est un `<dialog>` natif ouvert par `showModal()`**, et ce choix vaut son pesant de code
non écrit : couche supérieure, fond `::backdrop`, piège à focus, fermeture par Échap,
arrière-plan rendu inerte et focus rendu au déclencheur — tout est offert par le navigateur.
Ne le remplace pas par un `<div>` en `position: fixed`.

**`data-full` sur une vignette ouvre une AUTRE image que celle de la page.** Les quatre
emails de Beepz sont servis rognés sous leur appel à l'action — c'est ce qu'il faut dans la
grille — mais la visionneuse ouvre l'email entier. Deux conséquences, toutes deux voulues :

- **la version longue n'est référencée que par cet attribut**, donc le navigateur ne la
  télécharge qu'au clic. Les 488 Ko des quatre emails complets ne coûtent rien au
  chargement de la page (vérifié : zéro requête avant le premier clic) ;
- **la visionneuse passe en mode défilant** (`is-full`) : l'image reprend sa largeur
  naturelle et c'est la scène qui défile. Un email de 3 068 px ramené à la hauteur de la
  fenêtre donnerait 3 px de corps de texte — « en grand » veut donc dire ici « à taille
  réelle, et on fait défiler ». Le défilement repart du haut à chaque changement d'image.

En mobile la largeur de l'écran l'emporte et l'email est réduit à ~44 % ; c'est le zoom du
navigateur qui prend le relais, d'où l'importance de ne JAMAIS ajouter `user-scalable=no`
ni `maximum-scale` au `<meta name="viewport">` des pages projet.

Cinq points à ne pas défaire :

- **le décor n'est jamais cliquable.** Le filtre est `alt` non vide et aucun ancêtre en
  `aria-hidden` — le critère de l'accessibilité, pas une liste de classes à tenir à jour.
  Une image sans texte alternatif est décorative par définition, et comme la légende de la
  visionneuse EST cet `alt`, elle s'ouvrirait de toute façon sans légende. C'est ce filtre
  qui écarte le ciel des scènes de `projet-jm.html` ;
- **la légende est l'`alt` de l'image**, jamais un second attribut. Il est déjà écrit,
  descriptif et en français dans toutes les pages projet ; le doubler ferait deux textes à
  tenir à jour, et l'un des deux finirait par mentir ;
- **`min-width: 0` et `min-height: 0` sur `.viewer__img` ne sont pas cosmétiques.** Un
  élément de grille a une taille minimale *automatique* égale à sa taille intrinsèque, et
  pour une image elle l'emporte sur `max-height`. Sans ces deux lignes une capture d'email
  de 881 px de haut sort de la fenêtre par le bas et recouvre la légende — mesuré à 146 px
  en 1280 × 860 ;
- **le fond est flouté, pas seulement assombri.** Le site est sombre de bout en bout, donc
  un voile d'encre sur de l'encre ne détache rien : à `.93` le titre de la page restait
  parfaitement lisible derrière l'image. C'est le `backdrop-filter` qui fait le travail,
  comme la porte NSFW de `projet-jm.html` ;
- **un glissement n'est pas un clic.** Le rail des écrans se prend au doigt, et sans garde
  un geste qui finit sur une vignette déclenche aussi son `click`. On compare la position du
  pointeur entre l'appui et le clic : au-delà de 6 px, c'était un geste.

**La porte NSFW coupe `pointer-events`, ce qui arrête la souris mais PAS le clavier.** Sans
correctif on pouvait tabuler jusqu'à une image floutée et l'ouvrir en grand d'un Entrée,
par-dessus le voile. La focusabilité des images suit donc la case à cocher, pour chaque
`.nsfw__toggle` de la page. Si tu ajoutes une porte, elle est prise en charge toute seule.

## Les assets générés

`assets/home/hero/topo.svg`, `assets/home/trail/relief.svg` et l'attribut `d` du parcours sont tous
**produits par les scripts Python de `tools/`** (numpy / scipy / matplotlib, déjà installés).
Chacun utilise une graine fixe : relancer `gen_map.py` et `gen_route.py` reproduit les assets
versionnés **à l'octet près**, tu peux donc changer un paramètre et régénérer en confiance.
Voir `tools/README.md`, qui consigne aussi la seule lacune : `gen_topo.py` sort un SVG brut de
204 Ko alors que le `home/hero/topo.svg` livré en fait 132 Ko, une passe de nettoyage qui n'a pas
été conservée.

`gen_route.py` réécrit le `d` des **deux** `<path>` d'`index.html` ; ils doivent toujours
porter la même valeur.

Quatre autres scripts de `tools/` ne génèrent rien : ils **transforment** des originaux en
`.webp` servis, et ce sont eux qu'on relance quand un visuel change — `build_projects.py`
pour la section projets de l'accueil, `build_jm.py` pour toute la page J&M,
`build_jimizz.py` pour toute la page Jimizz, `build_social.py` pour la grille des réseaux
de la page J&M, et `build_shots.py`, qui ne sert plus aucune page depuis la refonte.

**Les trois premiers `build_*` partagent une seule règle**, et c'est elle qui les rend
utiles : ils vont lire les `width: %` des pièces DANS `css/style.css` plutôt que de les
redire. `build_social.py` n'en a pas besoin — ses cases de grille ne portent aucune
largeur en CSS, c'est la grille qui les décide. Une taille écrite deux fois, c'est toujours la seconde qui ment. Ils n'agrandissent
jamais et listent en fin de passe les sources trop petites pour la densité 2, avec l'échelle
d'export Figma qui corrigerait.

**`gen_favicon.py` est à part** : il ne dessine pas de terrain, il extrait le **W de Clash
Display** de la police et en sort les trois icônes du site, à la RACINE du dépôt et non dans
`assets/` — voir « L'icône et l'image de partage ». Lui aussi est reproductible à l'octet
près.

**`gen_map.py` et `assets/home/src/trail-map.svg` ne servent plus au site** : c'est la carte plate,
remplacée par la tuile en relief. Le script reste comme référence du terrain d'origine, mais
plus rien ne pointe dessus.

**Ordre des scripts.** `gen_relief.py` écrit lui aussi dans le `d` du parcours, après
`gen_route.py`. La chaîne est donc : `gen_route.py`, puis supprimer
`assets/home/trail/route-flat.path`, puis `gen_relief.py`.

## À préciser

Ces points ne sont pas encore arbitrés — demande plutôt que de supposer :

- **Le contenu de `#projets` et `#contact`.** Les sections existent et sont maquettées, mais
  leurs textes sont des **placeholders assumés**, marqués par la pastille `.todo`
  (« À compléter »). N'invente pas de projets ni de client à sa place : demande-lui le
  contenu. À propos et le parcours, eux, sont écrits pour de bon.
  L'adresse de `#contact`, elle, est réglée — voir « L'adresse de contact ». Les liens réseaux — **LinkedIn,
  Behance et Dribbble** — sont de vrais `<a>` (nouvel onglet), et ce sont les trois mêmes
  que porte le footer des quatre pages : garde les deux listes d'accord. GitHub a été
  retiré.
- **Le design des titres**, `.trail__intro` compris, qui doit être repris. En attendant, les
  cartes d'étape passent derrière « L'ASCENSION » et les deux textes se croisent : c'est
  **connu et assumé**, pas un bug. Ne le rattrape pas par un fond ou un dégradé sous le titre,
  le sujet sera traité par la refonte.
- **Une étape de minification**, si le poids servi devient un sujet. L'hébergement, lui,
  n'est plus une question ouverte — voir « La mise en ligne ».
- **La source de vérité du design** : savoir si le fichier Figma fait toujours foi.
- **La police du texte courant sur les pages J&M et Jimizz.** Leurs maquettes composent
  toute la page en Clash Display, corps compris ; le reste du site donne Inter au texte
  courant. C'est intégré tel quel, mais Beepz ne fait pas comme elles — à trancher pour de
  bon, dans un sens ou dans l'autre.
- **La porte NSFW.** La version précédente de `projet-jm.html` cachait ses captures derrière
  une case à cocher, parce que la marque est pour adultes et que la page s'ouvre souvent sur
  un poste de travail. La maquette n'en montre pas, donc elle n'a pas été remontée — le CSS
  `.nsfw` est resté, il suffit d'un conteneur pour la rétablir. À confirmer.
- **Les sources en 1x de la page J&M.** Douze des vingt-cinq pièces sont exportées à
  l'échelle 1 et sortent donc molles sur un écran retina ; `build_jm.py` les liste à chaque
  passe. Il faut les réexporter deux fois plus grand.
- **Le paragraphe de couverture de la page Jimizz.** La maquette y portait, mot pour mot, le
  paragraphe de `projet-jm.html` — « J&M est une marque française de contenu pour adultes
  fondée en 1999… » —, reste du gabarit dont elle est tirée. Il a été remplacé par un texte
  qui parle du projet, écrit d'après les deux textes de la page ; **il est à valider**, et un
  commentaire HTML le rappelle sur place. Les deux autres textes de la page sont ceux de la
  maquette, à quatre coquilles corrigées près (« Jacquie » pour « Jacqui », « a développé
  plusieurs plateformes », « écosystème », « NFT exclusifs » ; « quizz » est gardé, c'est le
  nom du site).
- **La source en 1x de la bande de marque de Jimizz.** `Rectangle 89.png` fait 1512 px pour
  1512 px d'affichage : c'est la seule pièce molle de la page sur un écran retina, et
  `build_jimizz.py` le redit à chaque passe.
- **Le carré topo de la composition de l'app.** La maquette y pique des croix de repérage
  tous les 66 px, celles de `topo-square-left.svg` sont tous les 52 : ce n'est pas le même
  relevé, et l'original n'est pas dans le dépôt. Sur 108 px de large aux trois quarts
  cachés par un écran, l'écart ne se voit pas — mais si le décor doit être exact, il faut
  retrouver ce relevé (ou le régénérer avec `gen_map.py`).
- **Les deux compositions de Jimizz en mobile.** À 390 px, les écrans du dashboard tombent
  à 140 px et les captures de plateformes à 163 px : elles se lisent comme des vignettes.
  C'est le même parti que JacquIA et le collage des campagnes sur la page J&M — la
  composition se met à l'échelle d'un tenant, et la visionneuse permet de les ouvrir en
  grand — mais les deux pages pourraient mériter un traitement mobile à part.
