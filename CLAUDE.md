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

Il est aussi **multi-fil et écoute en IPv4 comme en IPv6** : avec le module nu, Edge et Chrome
mettaient de longues secondes à charger la page — une connexion ouverte d'avance et restée
muette bloquait le seul fil du serveur, et `localhost` se résout d'abord en `::1` sous Windows.
**`.claude/launch.json` déclare deux configurations.** `portfolio` passe par `py`, le lanceur
Python de Windows — la machine de Vincent : `python3` n'y est qu'un raccourci vers le Microsoft
Store, et le panneau échouait au démarrage (code 9009). `portfolio-python3` est la même chose
pour macOS et Linux. Le script force aussi sa sortie en UTF-8 : redirigée par le panneau, elle
est en cp1252 sous Windows, qui ne sait pas écrire la flèche du message de démarrage, et le
serveur mourait dessus. À la main : `py tools/serve.py 4173` (Windows) ou
`python3 tools/serve.py 4173`.

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

Le site a affiché **une adresse Gmail pro** du 11 au 14 septembre 2026, le temps que la
redirection OVH se mette à livrer (le domaine venait d'être pris, et le quota des
redirections affichait 0 / 1000 alors que la redirection figurait dans la liste). Vincent a
demandé le retour à l'adresse du domaine : seul le contenu des deux `<span>` avait changé,
le balisage n'a jamais bougé. Si le dépannage devait resservir, c'est la même manœuvre.

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

**La section contact tient en trois lignes** : la tête commune, une phrase de disponibilité
(écrite avec Vincent, au vouvoiement — ne la réécris pas sans lui), et l'adresse, **centrée**
comme la tête. **Elle ne porte plus de liens réseaux** : LinkedIn, Behance et Dribbble sont
dans le footer juste en dessous, et Vincent a fait retirer le doublon. Ils ne vivent donc
plus qu'au footer des quatre pages, et dans le menu mobile qui les clone. Plus aucune
pastille `.todo` n'est posée sur la page ; la classe reste dans le CSS pour la prochaine.

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

### La mesure d'audience

**Umami Cloud**, choisi par Vincent (offre gratuite, 100 000 événements par mois). **Sans
cookie**, donc **sans bandeau de consentement** — c'est la raison du choix contre Google
Analytics, qui en aurait imposé un. N'ajoute aucun outil qui pose des cookies sans poser la
question du bandeau.

Le `<script defer>` est dans les **quatre** `<head>`, juste sous le `canonical`, avec le même
identifiant de site. Trois attributs, tous voulus :

- `data-domains="vincentw.fr"` — rien n'est envoyé ailleurs : le serveur local ne compte pas,
  et on peut tester sans polluer les chiffres. Si le domaine change, c'est une ligne de plus
  à reprendre avec le `CNAME` et les `og:` ;
- `data-exclude-hash="true"` — Umami compte comme une page vue tout `pushState` /
  `replaceState` qui change l'URL ; sans ça, l'ancre `#parcours` posée par le clic sur
  « Parcours » serait une page à part ;
- `defer` — il n'est pas sur le chemin du premier rendu.

**La dernière IIFE de `js/main.js` envoie les événements**, toujours par
`window.umami?.track` : si le script est bloqué, rien ne casse. Elle n'intercepte rien — pas
de `preventDefault`, le voile garde la main sur les liens. **N'utilise pas les attributs
`data-umami-event`** : Umami annule alors lui-même la navigation d'un lien pour la refaire
après son envoi, en travers du voile de transition.

- **`data-stat="<nom>"`** sur un bloc, le HTML décide : l'événement part la première fois que
  le bloc reste 1,5 s à l'écran. Posé sur les quatre sections de l'accueil
  (« Section : À propos »…) et sur la `.case-foot` des pages projet (« Fin de page »). Ce
  n'est pas qu'un compteur de lecture : **Umami mesure la durée d'une visite du premier au
  dernier signal**, donc sans eux quelqu'un qui lit tout l'accueil sans changer de page
  repartirait avec 0 s. Un nom d'événement fait au plus 50 signes ;
- **« Lien sortant »** (`vers` : le domaine) et **« Mail »**, par un écouteur de clic
  délégué — aucun balisage à tenir ;
- **« Visionneuse »** (`groupe` : le `data-viewer`), une ligne dans `open()` de la visionneuse.

**Pour que Vincent ne se compte pas lui-même** : ouvrir une fois `?stats=off` sur chaque
appareil et chaque navigateur (`?stats=on` pour revenir). Ça pose le drapeau
`umami.disabled` qu'Umami lit lui-même, puis retire le paramètre de l'URL.

Le panneau masqué gèle l'`IntersectionObserver` : les « Section : » ne s'y déclenchent pas,
le reste se vérifie en remplaçant `window.umami.track` par un journal.

## Le portfolio PDF

Pour les candidatures qui demandent un PDF : `python3 tools/build_pdf.py` produit
`tools/pdf/out/Vincent-Waldmann-Portfolio.pdf`, 18 pages A4 paysage, ~7 Mo. **Ce n'est
pas une impression du site** — les révélations au scroll et le header collant
la rendraient inutilisable — mais une page conçue pour ça, `tools/pdf/portfolio.html`,
avec sa propre feuille (`portfolio.css`) et la palette, les polices et les compositions
du site. Détails et pièges dans `tools/README.md`.

- **ses textes sont ceux du site, recopiés** : quand un texte change sur une page, il
  faut le reprendre là-bas aussi. Les seules phrases propres au PDF sont les libellés
  (« La campagne JacquIA », « Au quotidien, sur les réseaux »…) ;
- **le PDF ne doit jamais être commité** : il porte l'adresse de contact en clair.
  `tools/pdf/out/` est ignoré, et la source relit l'adresse dans `index.html` à
  l'impression, sans l'écrire ;
- **la grille des réseaux n'y garde que dix visuels sur seize**, les plus sages : le PDF
  s'ouvre souvent sur un poste de travail. Les écartés sont listés dans un commentaire ;
- l'ordre suit celui du site, sites et produit avant graphisme.

## Système de design

### Palette : quatre couleurs

Tout est défini dans `:root`. **N'introduis pas de cinquième couleur** sans le demander.

| Token | Valeur | Usage |
|---|---|---|
| `--cream` | `#fef1da` | Blanc cassé : couleur de texte sur fond foncé — c'est le cas partout — **ou** fond des rares surfaces claires (pastilles et plaques des pages projet) |
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

- `--ink` `#060d22` — `hsl(226 70% 8%)`. Fond du site, et pied du ciel de la carte. Ce fut
  aussi l'encre de la carte topographique, dont les courbes sont désormais tracées en crème.
- `--ink-rgb` `6 13 34` — pour les opacités : `rgb(var(--ink-rgb) / .32)`.
- `--cream-rgb`, `--navy-rgb`, `--green-rgb` — même usage pour les autres. Le dernier est arrivé avec
  les étapes du carnet (pastille de l'année, filet de l'étape active).

**Ne réintroduis jamais une opacité en `rgba()` codée en dur.** La section parcours en a
compté jusqu'à dix, à neuf opacités différentes, ce qui rendait tout changement manuel.

Exceptions restant hors palette, à trancher un jour : `#44d444` (pastille « Disponible »),
`#4258a2` (bordure du badge de localisation), `#fffaf0` (fond des plaques des pages projet).

### Typographie

Trois familles, toutes auto-hébergées dans `fonts/` en woff2 variable.

- **Clash Display** (`--font-display`, graisses 200–700) — titres en bold, ainsi que les
  sous-titres et les labels.
- **Inter** (`--font-body`, graisses 100–900) — texte courant, en regular.
- **EB Garamond** (`--font-serif`, graisses 400–800) — **en italique seulement**. Réservé à
  quatre usages, tous décidés par la maquette : les œils des **quatre** sections, les mots mis
  en avant dans le texte d'À propos, l'année des étapes du carnet. C'est la respiration du reste : ne l'étends pas sans le demander.
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

## Le bandeau de chantier, retiré

Un bandeau **rose et collant** a annoncé en tête des quatre pages que le site était en
construction, avec une pastille `v0.N` pour vérifier une mise en ligne depuis un
téléphone. **Vincent l'a fait retirer le 17 septembre 2026**, pastille comprise : le bloc
CSS et le `<div class="banner">` des quatre pages sont partis.

**Il en reste des `var(--banner-h, 0px)`, et c'est voulu** : le header et le menu mobile les lisent encore. Le token n'étant plus déclaré, le repli à `0px`
les rend à leur calage d'origine. Pour qu'un bandeau revienne, il suffit de redéclarer
`--banner-h` (et de rétablir `scroll-padding-top` sur `html`) : les trois lecteurs
suivront.

### Le numéro de version

**Lance `python3 tools/bump_version.py` juste avant chaque commit qui touche au site.**
Il pose `?v=0.N` sur `css/style.css`, `js/veil.js` et `js/main.js` dans les quatre
pages — N étant le nombre de commits de `main` plus un — et il est idempotent. Ne
l'édite pas à la main.

C'est ce qui empêche un navigateur mobile de servir le HTML neuf avec le CSS ou le JS de
la veille : une URL qui change ne peut pas venir du cache. Le numéro n'est plus affiché
nulle part ; il se lit dans le `<head>`, ou dans l'historique (v0.25 est le 25e commit).
Ce qui peut encore retarder, c'est le HTML lui-même : GitHub Pages le sert avec dix
minutes de cache.

## Le header

**Il est collant, et il s'efface quand on descend** : un geste vers le bas le fait remonter
hors de l'écran, le moindre geste vers le haut le fait revenir. Demandé par Vincent, sur les
quatre pages — c'est le même `<header class="site-header">` partout.

**`sticky` et pas `fixed`**, pour la même raison que tout le reste : il garde sa place dans le
flux, donc rien sous lui n'a à être décalé d'une hauteur à recopier, et au sommet de la page
il est exactement là où il a toujours été. Visuellement c'est la même chose. Il est à
`z-index: 7000`, sous le voile (9000).

**Le partage habituel** : le JS (`js/main.js`, dernière IIFE) ne pose que deux classes,
`is-stuck` dès que la page a quitté son sommet et `is-hidden` en descendant ; le dessin est
dans le CSS.

- **le dégradé d'encre est un `::before` pleine largeur** (le header, lui, reste borné à
  1512px) qui DÉBORDE sous lui de `--header-fade` : c'est ce qui le fond dans la page au lieu
  de tracer un bord. Il n'apparaît qu'avec `is-stuck`, sans quoi il assombrirait le haut du
  panneau du hero au chargement ;
- **le masquage remonte de sa hauteur PLUS `--header-fade`**, sinon la frange du dégradé
  resterait visible en haut de l'écran ;
- **les déplacements se CUMULENT dans un même sens** (8px vers le haut pour revenir, 24px vers
  le bas pour partir) : l'inertie d'un trackpad envoie des deltas d'un pixel dans les deux
  sens en fin de course, et un seuil nul le ferait clignoter ;
- **un clic sur une ancre de la page le cache et gèle la détection** jusqu'à 220ms sans
  scroll. Sans ça, un saut vers une section plus HAUTE le laissait affiché pile sur la tête
  de la section — et il ne faut pas compenser par un `scroll-padding-top` à la hauteur du
  header : les sauts vers le bas se poseraient 70px trop bas.
- **il revient au clavier** (`:has(:focus-visible)`) — pas `:focus-within`, qui le garderait
  affiché après un clic de souris sur un lien du menu, pendant le saut.

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
  du document. Teste toujours l'ouverture APRÈS avoir scrollé ;
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
défilement ici.

**Le fond du site est sombre de bout en bout**, parcours compris. Il l'a été *sauf* pour le
parcours, qui était crème ; cette inversion a été retirée. La carte porte à la place son
propre ciel (`--trail-sky`, défini sur `.trail`), un dégradé de `--navy` vers `--ink` : le seul
écart de valeur de la page, et il reste sur l'axe des bleus. Il n'y a plus de section claire : n'en introduis pas.

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

Les quatre œils portent un numéro d'ordre : `01.` À propos, `02.` parcours, `03.` projets,
`04.` contact.

`html` porte `scroll-behavior: smooth`, sous `prefers-reduced-motion: no-preference`.

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
`.trail__lead` DOIT porter exactement la même valeur : le fil pointillé du parcours part
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

**Le fil pointillé qui relie les deux sections vit dans le parcours** — voir « La section parcours ». Il n'est pas dans `.about__body`, parce que c'est un bloc de la section suivante.

**Le CV est là, en deux langues** — `assets/home/about/cv-fr.pdf` et `cv-en.pdf`, une page
A4 chacun, fournis par Vincent — depuis le 19 octobre 2026, ses CV « ATS », en texte réel (135 Ko). Le bouton a donc cessé d'être un `<span>`
(il l'était tant que le fichier manquait, pas d'ancre morte sur le site) : ce sont deux
`<a … download>` dans une `.about__cv-row`, le **français d'abord** et l'anglais en second,
plus discret. Trois choses à garder :

- **le `download` porte le nom du fichier REÇU** (`Vincent-Waldmann-CV.pdf`), pas celui du
  dépôt : sans lui, le recruteur retrouve un « cv-fr.pdf » anonyme dans ses téléchargements.
  Les noms de fichiers, eux, suivent la règle des assets — rangés sous la section qui les
  charge, sans répéter le nom du dossier ;
- **le français reste le premier bouton** : le fil pointillé du parcours part de sous lui, à
  64px de son bord gauche (vérifié après l'ajout du second) ;
- **le survol n'existe que sur le lien** (`a.about__cv:hover`), même règle que
  `a.contact__mail:hover`.

**RELIS UN CV AVANT DE LE VERSER ICI** : le dépôt est public, donc tout ce qui y entre est
lisible de tous, historique compris — et un CV porte par nature des coordonnées. La première
livraison (11 septembre 2026) portait le Gmail personnel de Vincent, remplacé ensuite par
l'adresse de contact du site. **Les CV « ATS » en place depuis le 19 octobre 2026 portent de
nouveau le Gmail personnel**, versés tels quels à la demande de Vincent : une version publiée
devrait porter l'adresse du domaine, à réexporter. Le téléphone y est, et c'est son choix. Deux autres choses à regarder au passage :

- **les dates, et la carte suit désormais le CV.** ARES SAS (Jacquie & Michel) a longtemps
  été coupé en deux étapes sur la carte — 2013 Paris, puis 2016 Pau, pour montrer
  l'évolution des tâches — quand le CV n'en fait qu'un poste, 2013-2023. **Vincent les a
  fait fusionner le 19 octobre 2026**, « pour être raccord avec le CV » : une seule étape,
  2013, « Lead Web Designer · ARES SAS · Paris & Pau ». Ne la recoupe pas sans lui.

  **Chaque étape de la carte porte l'année d'ARRIVÉE**, elle : septembre 2012 pour
  l'alternance, décembre 2023 pour Budapest. Cette dernière a fait l'aller-retour 2023 →
  2024 → 2023, le temps que les deux CV s'accordent entre eux ; c'est réglé, les trois
  disent la même chose ;
- **le poids** — un export Affinity pèse 3,2 Mo la page, dont 3,0 pour le seul motif topo
  du fond. **`python3 tools/shrink_cv.py` le ramène à 0,46 Mo** sans toucher au texte (150
  dpi, aplati sur le blanc, niveaux de gris, JPEG) : à relancer après chaque nouvel export,
  c'est sans effet sur un fichier déjà allégé. Les fichiers servis sont les versions
  allégées — ne verse pas l'export brut dans le dépôt. **Ne le lance PAS sur les CV « ATS »** :
  ils pèsent 135 Ko, et leur texte doit rester du texte — c'est ce que lisent les logiciels de
  tri des candidatures ; `shrink_cv.py` le rastériserait.

Le texte est **du vrai contenu**, écrit avec Vincent : douze ans d'expérience depuis 2013,
les années sur des sites à très forte audience, et le « couteau suisse ». Le nombre d'années
est écrit en toutes lettres dans le chapô, et c'est **le compte du CV (douze), pas 2026 − 2013** :
Vincent l'a aligné sur son CV le 19 octobre 2026. Il apparaît aussi dans les deux descriptions
du `<head>` (`description` et `og:description`) et dans le PDF — un commentaire HTML le rappelle.
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

**Elle tient en un écran, et elle ne capte plus le défilement.** L'ancienne version était une
piste de 717 vh épinglée, avec une révélation, une marche caméra et un mode auto : tout ça est
parti. La section est maintenant une tête de section, puis un corps à deux colonnes :

- **à gauche (60 % de la largeur), les quatre étapes, en permanence**, de la plus récente à la plus ancienne
  (2025 → 2012), dans l'ordre qu'attend un recruteur. Ce sont des `<button>` qui portent
  `data-at` : la fraction de la route où se trouve l'étape. Chaque étape affiche l'année, le
  poste, l'entreprise et le lieu ; **chaque étape affiche sa description** sous le poste, pour que la lecture ne demande aucun geste.
  **Au repos, une étape n'a ni fond ni bordure** — demandé par Vincent : la carte (filet,
  fond de bleu translucide, arrondi, du langage de la section Projets) n'apparaît qu'au
  survol et sur l'étape active. Une version calquée sur les cartes projet, avec une tuile
  d'année, a été jugée trop massive, puis une version encadrée au repos aussi. Le poste d'abord, puis **sur la même ligne l'année (pastille verte) et
  l'entreprise en Garamond italique rose** — le septième usage du Garamond, comme le
  sous-titre `.pcard__tag` —, puis la description. **L'étape active prend le vert du
  chemin** : filet vert, pastille de l'année pleine, `scale: 1.02`. Pas de liseré gauche
  épais : Vincent n'en veut pas. Le <li>
  est la carte : il contient le bouton et les pastilles de projet ;
- **à droite (40 %), la carte**, dans une fenêtre `.trail__view` aux coins arrondis. Survoler une
  étape, l'atteindre au clavier ou la cliquer la rend active : la caméra glisse jusqu'à son
  point et le tracé vert se dessine jusque-là. **La carte y reste** quand le pointeur quitte
  la liste — demandé par Vincent, sans quoi aller vers une pastille de projet ou sur la carte
  la faisait dézoomer. La vue d'ensemble n'est que l'état de départ.

**Sur mobile (≤ 900px), la liste seule**, sans bande de carte en en-tête, comme demandé. La
carte est masquée (`display: none`) et les boutons sont désactivés par le JS : ils ne
prétendent rien. **Sans JS**, la carte est aussi masquée (la règle est sous
`@media (scripting: enabled)`) et la liste se lit seule.

**Le fil pointillé d'À propos** (`.trail__lead`) relie le bouton CV à la tête de section. Il
n'est plus collé à rien : c'est un bloc normal de hauteur fixe, dont la boîte est celle
d'À propos (`--about-col`) — il part donc sous le bouton et finit au centre de la page, sous
l'œil. Il est caché sur mobile.

**La carte est une seule transformation.** `.trail__map` fait 7200 × 7200 px ; le JS lui pose
`translate(...) scale(s)` pour amener le point visé au centre de la fenêtre. La vue
d'ensemble cadre le tracé (`FIT`), une étape se regarde à `FOCUS` (1). Le glissement est un
`requestAnimationFrame` de 900 ms (`GLIDE_MS`, courbe cubique), et **c'est le JS qui le joue,
pas une transition CSS**, pour que les repères restent exactement à leur taille. Les repères
(`.trail__pin`) se remettent à l'échelle inverse via `--k`, posé à chaque image.

**Le tracé vert est le MÊME chemin, recoupé** — même raison qu'avant : WebKit (tous les
navigateurs iOS) ignore `stroke-dasharray` sur ce tracé. `drawWalked()` recoupe le `d` au point
atteint ; le `d` ne doit toujours être fait que de `M` et de `L` (`gen_route.py` /
`gen_relief.py`). Le tracé gris est **plein** : un tiret en unités de carte disparaît à
l'échelle d'ensemble, et un tiret en `non-scaling-stroke` ne se règle pas sur l'échelle.

**Le relief reste une tuile unique**, cuite une fois en canvas (`bakeRelief()`), pour la même
raison : Chrome redessine les 192 tracés de la tuile à chaque changement d'échelle, et la carte
clignote. Le SVG reste la source, et le repli sur le fond CSS d'origine est conservé.

**Les textes des étapes viennent des CV « ATS » de Vincent** (FR et EN, octobre 2026, hors
dépôt) — à reprendre ici ET dans `tools/pdf/portfolio.html`, qui les recopie. Le CV compte
trois postes, la carte quatre étapes :

- **ARES SAS (2013–2023) est UNE étape**, comme dans le CV — elle a été coupée en deux
  (Paris 2013, Pau 2016) jusqu'au 19 octobre 2026, et Vincent l'a fait fusionner. Elle
  garde le point de 2013 sur le tracé (`data-at="0.203"`) ;
- **2012, Nouveau Monde DDB, n'est plus dans le CV** (une alternance) : l'étape garde son
  ancien texte, elle raconte le départ du parcours ;
- les descriptions sont **condensées** : une puce de ZXY (la priorisation avec les équipes)
  est laissée de côté pour que la liste tienne.

**Ce sont aussi les CV téléchargeables** (`cv-fr.pdf`, `cv-en.pdf`), versés le 19 octobre 2026 à
la demande de Vincent — voir le bouton CV d'À propos.

**Le titre** (`Carnet de routes`, œil `02.`) est provisoire : Vincent veut revoir les textes du
site dans leur ensemble. Il suit la tête commune des quatre sections (voir plus haut).

Les repères de la carte gardent l'année en libellé : le texte complet n'est que dans la liste,
une seule source de vérité. L'année se pose à droite du repère, sauf si le bouton porte
`data-label="above"` ou `"below"` : 2012 est au-dessus, 2013 et 2023 au-dessous, demandé
par Vincent parce que les repères sont proches et que leurs années se chevauchaient.

**Chaque étape porte ses projets** (`.trail__projs`, sous la description) — demandé par
Vincent : 2025 Beepz, VPN.free, TGP Creator ; 2023 Swame ; 2013 Jacquie & Michel, Straceo,
Jimizz (les projets des deux anciennes étapes ARES, réunis) ; 2012 rien. Un projet est un lien quand sa page existe (Beepz, Jimizz,
J&M, avec les icônes de la section Projets), un `<span>` sinon — pas de lien mort. Le bloc
est un FRÈRE du bouton de l'étape, jamais dedans : un lien dans un `<button>` n'est pas du
HTML valide.

**Beepz** : son visuel (`assets/home/projects/beepz.svg`) est la photo lifestyle de `assets/beepz/`, voilée, avec
l'icône de la marque et le nom centrés (comme les autres visuels de cartes).

**Sur mobile, les pastilles ne portent que le nom du projet** (sans « Voir le projet »), et
leur logo est ROND (`.trail__proj-icon`, `border-radius: 50%`). VPN.free et TGP Creator ont
leur logo : le favicon de la démo (`vpn-free-icon.svg`, sur un disque sombre) et son logo
(`tgp-icon.svg`). Straceo a l'icône de sa marque (`straceo-icon.png`, 180 px, depuis straceo.com) et JacquIA le
marqueur de son logo (`jacquia-icon.svg`, depuis le header de jacquia.com) ; tous les logos sont
rognés en rond. Il ne reste aucun placeholder sur les pastilles.

**Liens et visuels externes** : Swame ouvre son étude Behance, VPN.free la démo
(vpnfree-self.vercel.app) ; son visuel est l'image Open Graph de la démo
(`assets/home/projects/vpn-free.svg`) : l'image Open Graph de la démo (1200 × 630) en fond,
assombrie (voile à 72 %), avec le logo blanc vpn.free centré (favicon.svg de la démo, variante sombre), JacquIA (2023) jacquia.com — tous dans un nouvel onglet
(`target="_blank" rel="noopener"`, relayé à la carte). Straceo ouvre straceo.com (même règle) : son visuel
(`assets/home/projects/straceo.svg`) est le fond de la page de connexion de straceo.com
(`statics/css/img/login-page/background.ecf69babcc8b.webp`, 845 × 1081, intégré en data URI et
recadré en 16:10) avec le logo crème du site posé au centre (`logo-light.svg`, tracé inline). **TGP Creator** ouvre sa démo (tgp-creator-demo.vercel.app/editeur) ; son visuel
(`assets/home/projects/tgp-creator.svg`) est un fond noir, la photo de foule (`6.webp`, fournie par Vincent) en
transparence (38 %), le logo de la démo (`logo.svg`) et le nom centrés. Les
placeholders (`.trail__proj-icon--ph`, l'initiale sur un carré pointillé) ne restent que pour
les projets sans icône ni page. Swame n'ayant pas d'icône carrée, la
sienne cadre en CSS le « a » en bulle de `assets/jm/marques/swame.webp` — une entorse au
rangement des assets, à corriger le jour où une icône existe.

**Sur desktop, les projets deviennent une pile de cartes au-dessus du repère de leur
étape.** Le JS les CLONE en `.trail__card` dans un `.trail__deck` posé dans la carte au
point du repère, pose `has-deck` sur la section, et le CSS masque alors les pastilles de la
liste : un seul lien par projet dans la page. **La pile suit le zoom de la carte**, comme le
terrain — demandé par Vincent ; seuls les repères et leurs années gardent leur taille
(`--k`). Elle a d'abord été contre-mise à l'échelle comme eux, et ne grandissait pas quand
on zoomait.

- **le dessin des cartes suit l'exemple donné par Vincent** (une capture de piles façon
  « Mobbin ») : carte de 180 px de large, **haute de son contenu** (le visuel en 16:10, le
  nom, les puces — d'abord fixée à 236 px, trop haute une fois le titre réduit au nom), le
  visuel en haut, puis **le seul nom de la
  marque** et deux puces (l'année, puis le libellé du projet). Pas de petit logo ni
  de ligne de titre : le logo est dans le visuel, demandé par Vincent. Une carte lit
  `data-name`, `data-image` et `data-tag` sur sa pastille (libellé : « Étude de cas » par défaut
pour un projet avec page, « À venir » sans, « Prototype » pour VPN.free et TGP Creator,
« Site en ligne » pour JacquIA et Straceo) ; sans image, un morceau de relief et
  l'initiale ;
- **au repos**, la carte du dessus est presque droite et les autres dépassent derrière,
  tournées d'un côté puis de l'autre (table `REST` dans le JS) ; **au survol ou au
  clavier**, elles s'étalent en éventail (`FAN_X`, `FAN_R`) et la pile passe devant ses
  voisines. Le JS ne pose que les variables, le passage est en CSS ;
- **une pile n'entre que si la carte est zoomée ET son repère dans le cadre** : le JS
  pose `is-shown` sur la pile au-dessus de l'échelle `NEAR` (0,6) quand son repère est
  visible. L'entrée — les cartes montent et se posent, du fond vers le dessus (`--d`) — se
  rejoue donc chaque fois qu'on fait revenir une pile dans le champ. La vue d'ensemble ne
  montre que le tracé et les années ;
- **les titres « Projet à documenter »** sont des placeholders, comme les icônes `--ph`.

**La carte se fait glisser à la souris** (`cursor: grab`) : la caméra suit le pointeur,
bornée à la carte, et un glissement de caméra en cours est interrompu. Pas depuis une carte
de projet, qui reste un lien. La position tient jusqu'à la prochaine étape survolée, et un
redimensionnement repose la caméra sur l'étape active.

**Elle se zoome et se dézoome** : deux boutons ronds en haut à droite (fabriqués par le JS,
zoom autour du centre, en glissant), et **la molette ou le pincement du trackpad sur la
carte**, autour du pointeur — vers le bas on dézoome, demandé par Vincent. Bornes `MIN_S` et
`MAX_S`. **Aux bornes, la molette rend la main à la page** : la carte est haute, et sans ça
elle piégerait le défilement. On dézoome jusqu'au bout, puis la page repart.

**La caméra cadre la pile ET le repère**, demandé par Vincent : sur une étape qui porte des
projets, elle vise le milieu des deux, donc le repère tombe sous le centre de la moitié de la
hauteur de la pile (`lift()`, qui la mesure sur la pile elle-même — aucun nombre recopié du
CSS). Sans pile, ou carte dézoomée, le repère est au centre. Le test de l'étape au centre
vise le même point.

**L'étape au centre s'active toute seule** quand on fait glisser ou qu'on zoome : si un
repère tombe à moins de `CENTER_R` (18 % du petit côté) du centre, l'étape devient active,
sa ligne s'allume dans la liste et le chemin avance jusqu'à elle (`walkTo`, le tracé seul,
sans toucher à la caméra). Ce test ne tourne PAS pendant les glissements lancés par la
liste, sinon une étape traversée en route s'allumerait au passage.

**Sur mobile, ce sont les pastilles sous les textes** ; sans JS aussi, puisque la carte n'y
est pas.

Points à retenir si tu retouches la section :

- **`data-at` est une fraction du `d` de `.trail__track`**, pas une position à l'écran : déplacer
  une étape se fait en changeant cette fraction, et le repère, la caméra et le tracé suivent ;
- **le tracé plat de référence** (`assets/home/trail/route-flat.path`) et la chaîne de génération
  (`gen_route.py`, puis supprimer le `.path`, puis `gen_relief.py`) sont inchangés : la carte
  garde l'altitude, et le `d` porte le relief ;
- **les tailles de la carte** sont `FIT` et `FOCUS` dans le JS, la hauteur de la fenêtre dans
  `.trail__view` (`clamp(440px, 62vh, 580px)`) : la liste ne doit pas dépasser cette hauteur,
  sinon la carte grandit et la caméra doit se recalculer ;
- **sous mouvement réduit**, la caméra se pose d'un coup (`glide` le teste) ; aucune transition
  CSS n'existe dans la section.

## La section projets (`#projets`, « Ascensions récentes »)

Trois projets — Beepz, Jacquie & Michel, Jimizz (J&M en deuxième place, demandé par Vincent) — en trois cartes à gauche, et à
droite **un seul emplacement** où trois groupements de visuels se superposent :
survoler une carte fait entrer le sien. C'est la maquette de Vincent, intégrée
telle quelle.

**Le JS ne pose qu'un état**, la classe `is-active` déplacée d'un `<li>` à
l'autre (`js/main.js`, troisième IIFE). Le fondu, les décalages d'entrée, l'échelle de la
carte : tout est dans le CSS, comme `--out` du tas de
photos. La classe part du HTML, sur le premier projet (Beepz depuis la réorganisation) — **sans JS, en mouvement
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
morte tant que la page n'existait pas, même règle que le bouton CV ; la page existe, la carte est un `<a>`, et rien d'autre n'a changé.
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
par morceaux. Seule la porte est revenue, et sur un autre bloc que le sien — voir
« Les quatre sites, sous porte ».

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

### Les quatre sites, sous porte

Les quatre mises en scène sont floutées derrière une porte NSFW — la marque est pour
adultes et la page s'ouvre souvent sur un poste de travail. **Il y en a QUATRE, une par
vignette, et c'est une consigne de Vincent** : une porte unique posée sur la grille
découvrirait les quatre d'un coup, alors qu'ici on ne révèle que le visuel qu'on a
désigné, les trois autres restant floutés.

Le mécanisme est celui du bloc « Le gate NSFW » du CSS, sans une ligne de JS : une case à
cocher native, le contenu et les deux étiquettes en frères derrière elle (`~`). **L'ordre
du DOM le porte en entier** — input, `.nsfw__content`, `.nsfw__gate`, `.nsfw__hide-rail` —
et le déplacer casse la porte en silence.

Le voile d'origine avait été dessiné pour un bloc de 2 356 px ; `.nsfw--tile` le ramène à
un carré de 630, par trois écarts consignés dans sa règle CSS : **coins droits** (les
16 px d'arrondi laisseraient les quatre coins de la photo ressortir du voile), **panneau
centré et non collant** (il n'y a rien à suivre en défilant sur une vignette entière à
l'écran), et **pas de `.nsfw__note`** (répétée quatre fois côte à côte, la phrase devient
du bruit).

Deux choses qui marchent déjà et qu'il ne faut pas défaire : l'IIFE de la visionneuse
recale la focusabilité des images sur **chaque** `.nsfw__toggle` de la page, donc les
quatre portes sont prises en charge sans rien y ajouter ; et la case porte un `aria-label`
propre à son visuel, les deux étiquettes étant `aria-hidden` — sans quoi le nom accessible
concaténerait « Contenu adulte Afficher Masquer ».

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
et `is-entering`, et tout le dessin est en CSS — comme `--out` du
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
descendre la page en douceur… à travers toute la section parcours. La classe `is-arriving`
repasse en `auto` le temps du chargement et s'en va au `load` — qui est précisément le
moment où le navigateur cesse de re-viser le fragment. Les ancres du header, elles, gardent
leur défilement lissé.

**Et le retour d'une page projet repose la page où on l'avait laissée.** On mémorise la
position en partant (`pagehide`, dans `sessionStorage`), on la restaure en revenant : on
retrouve là où on était.

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
  et +1 (elle en touche le bas). Comme `--out` du tas ;
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

- **Les titres et les textes du site**, à revoir dans leur ensemble. « Carnet de routes » est gardé pour le moment ; le texte des étapes vient du CV.
- **Une étape de minification**, si le poids servi devient un sujet. L'hébergement, lui,
  n'est plus une question ouverte — voir « La mise en ligne ».
- **La source de vérité du design** : savoir si le fichier Figma fait toujours foi.
- **La police du texte courant sur les pages J&M et Jimizz.** Leurs maquettes composent
  toute la page en Clash Display, corps compris ; le reste du site donne Inter au texte
  courant. C'est intégré tel quel, mais Beepz ne fait pas comme elles — à trancher pour de
  bon, dans un sens ou dans l'autre.
- **La porte NSFW SUR LES AUTRES BLOCS.** Elle est revenue sur les quatre mises en scène
  (voir « Les quatre sites, sous porte »), et la question se repose pour les douze marques,
  le collage des campagnes et la grille des réseaux — qui montrent eux aussi du contenu pour
  adultes, et qui n'en portent pas. À trancher avec Vincent.
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
