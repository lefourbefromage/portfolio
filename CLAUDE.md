# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Rédigé en français : le site, ses contenus et son mainteneur le sont aussi.

## Le projet

Portfolio personnel de Vincent Waldmann. Site statique, sans framework, sans étape de build
et sans gestionnaire de dépendances : `index.html`, `css/style.css` et `js/main.js` sont
servis tels qu'ils sont écrits. Tous les textes destinés aux visiteurs sont en français.

## Lancer le site

Le serveur de dev est déclaré dans `.claude/launch.json` — démarre-le avec le panneau
navigateur (`preview_start` avec `{name: "portfolio"}`), jamais avec Bash. C'est un simple
`python3 -m http.server 4173`. Il n'y a ni build, ni lint, ni tests.

**Le panneau met `style.css` et `main.js` en cache de façon agressive.** Un rechargement
ordinaire — même `navigate` avec `force: true` — continue de servir l'ancien fichier en
silence, et injecter une copie du `<script>` avec un paramètre anti-cache laisse *plusieurs*
instances des IIFE enregistrées, ce qui produit un état incompréhensible. Le rafraîchissement
fiable :

```js
await fetch('css/style.css', {cache: 'reload'}); await fetch('js/main.js', {cache: 'reload'}); location.reload();
```

Si une modification semble sans effet, compare les règles de `document.styleSheets` avec un
`fetch()` frais du même fichier avant de conclure que le code est en cause. Et quand le
panneau est masqué, les captures d'écran retardent : fie-toi aux mesures du DOM.

## Versionnement

Dépôt git sur `main`, poussé vers `git@github-perso:lefourbefromage/portfolio.git`.

`github-perso` est un alias d'hôte SSH défini dans `~/.ssh/config`, ce n'est pas une faute de
frappe : il épingle la clé personnelle avec `IdentitiesOnly yes`. Utiliser `github.com` en
clair dans une URL de remote propose la clé *professionnelle* et échoue sur
`Permission denied (publickey)`. Garde l'alias dans tout remote ajouté ici.

Les skills vendorisées (`.agents/`, et les liens symboliques de `.claude/skills/`) sont
ignorées par git — 5,4 Mo que `skills-lock.json`, lui versionné, permet de restaurer.

## Système de design

### Palette : quatre couleurs

Tout est défini dans `:root`. **N'introduis pas de cinquième couleur** sans le demander.

| Token | Valeur | Usage |
|---|---|---|
| `--cream` | `#fef1da` | Blanc cassé : fond des sections claires, **ou** couleur de texte sur fond foncé |
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

- `--ink` `#060d22` — `hsl(226 70% 8%)`. Fond du site, et encre de la carte topographique.
- `--ink-rgb` `6 13 34` — pour les opacités : `rgb(var(--ink-rgb) / .32)`.
- `--cream-rgb`, `--navy-rgb` — même usage pour les deux autres.

**Ne réintroduis jamais une opacité en `rgba()` codée en dur.** La section parcours en a
compté jusqu'à dix, à neuf opacités différentes, ce qui rendait tout changement manuel.

Exceptions restant hors palette, à trancher un jour : `#44d444` (pastille « Disponible »),
`#4258a2` (bordure du badge de localisation), `#fffaf0` (fond des cartes du parcours).

### Typographie

Deux familles, toutes deux auto-hébergées dans `fonts/` en woff2 variable.

- **Clash Display** (`--font-display`, graisses 200–700) — titres en bold, ainsi que les
  sous-titres et les labels.
- **Inter** (`--font-body`, graisses 100–900) — texte courant, en regular.

`body` porte `--font-body` ; `--font-display` est appliqué explicitement aux onze sélecteurs
de titres et de labels. Un nouvel élément de texte hérite donc d'Inter par défaut, ce qui est
le comportement voulu.

## La structure de la page

`Hero > Projets > À propos > Parcours > Contact > Footer`, dans cet ordre, et la nav du
header comme celle du footer pointent toutes vers des sections qui existent bel et bien.

Le fond du site est sombre (`--ink`) partout **sauf** le parcours, qui est crème : c'est le
seul contraste fort de la page, et c'est ce qui fait ressortir la carte. Ne mets pas une
deuxième section claire à côté.

Les sections plates partagent trois primitives — `.section` (largeur max et rythme vertical),
`.section__eyebrow` / `.section__title` / `.section__lede` — et la pastille `.todo` qui
signale un contenu encore à écrire. Le parcours garde ses propres `.trail__eyebrow` et
`.trail__heading` parce qu'il est sur fond clair et que ses couleurs sont inversées.

`html` porte `scroll-behavior: smooth`, sous `prefers-reduced-motion: no-preference`. Cliquer
une ancre qui traverse le parcours le fait donc défiler d'un trait : c'est voulu, la caméra
suit image par image sans casser.

## Le hero : un repère fixe adressé en pourcentages

`.hero__panel` est un contexte de container query (`container-name: panel`) verrouillé sur
`aspect-ratio: 1472 / 599`, la taille du cadre Figma. Chaque élément décoratif de
`.hero__decor` est positionné en **pourcentage de ce cadre**, et les tailles de texte sont en
`cqw`. Donc quand une demande est formulée en pixels (« descend la ligne de 10px »), convertis
contre cette taille de référence : **10px ≈ 0,679 % en horizontal, ≈ 1,669 % en vertical**.
La rotation de chaque sticker vit dans sa règle `.sticker-N` sous forme de `--rot`, pas dans
un `transform`.

Pour placer un élément par rapport à un tracé SVG décoratif (par exemple « mets UX au départ
de la flèche »), lis le point fractionnaire dans le `d` du SVG, multiplie-le par le `width:%`
de l'élément et par 1472/599 pour la composante verticale, puis ajoute ses `left`/`top`.

## Le décollage des stickers (`js/main.js`, première IIFE)

Draguer un sticker ne doit **pas le déplacer** : ça soulève un coin en 3D et ça revient en
place. Le JS n'écrit que `--tiltx`, `--tilty` et `--peel-scale` ; la transformation composée
vit entièrement dans la règle `.decor--sticker`. Garde ce partage : ajouter une translation
dans le JS casse l'intention. `setPointerCapture` est enveloppé dans un try/catch parce que
les drags synthétiques lèvent `NotFoundError`.

## La section parcours (`#parcours`)

La partie la plus délicate du site. `js/main.js`, deuxième IIFE.

**Forme.** Une piste `.trail` très haute (`height: 617vh`) avec une scène en
`position: sticky`. La progression du scroll vaut
`-trail.getBoundingClientRect().top / runway`, limitée par rAF.

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
pleine marche et 1 sur une étape ; le zoom va de `ZOOM_TRAVEL` (0,95 — on prend du recul, on
couvre du terrain) à `ZOOM_STOP` (1,55 — on se penche sur la carte). **`ZOOM_W` doit rester
sous la demi-distance entre deux étapes** (0,035 aujourd'hui) : au-delà, les fenêtres
d'approche se recouvrent, le zoom ne redescend jamais à `ZOOM_TRAVEL` et la carte reste plaquée
de bout en bout. Il a fallu le baisser de 0,048 à 0,030 en rapprochant les cartes. `ZOOM_W` est plus large
que `DWELL_W` **exprès** : l'objectif bouge déjà avant que le scroll ne se mette à résister,
et continue de bouger pendant la pause, ce qui évite que les ~55 % de scroll passés à l'arrêt
paraissent morts. Le profil `GRADE` ne pilote plus le zoom, seulement le rythme.

Sous `ZOOM_TRAVEL`, on voit plus de carte : à 2560×1440 il reste 1 142 px de marge entre le
coin d'écran le plus exposé et le bord du 7200×7200. Descendre nettement sous 0,95 finirait
par laisser voir le crème derrière les contours.

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

**Tout tient à une division.** `fraction()` mesure la progression sur
`trail.offsetHeight + innerHeight`, c'est-à-dire sur *toute la traversée* de la section — du
moment où son bord haut entre par le bas de l'écran à celui où son bord bas sort par le haut.
Il n'y a donc aucune couture à recoller : la densité de scroll est uniforme par construction,
le marcheur ne change jamais d'allure, ni quand la scène se pose ni quand elle se décolle. Une
version antérieure calculait les points de couture à l'avance ; elle dérivait de 5 % sur
mobile, où `vh` et `window.innerHeight` ne sont pas d'accord à cause de la barre d'URL. Ne
réintroduis pas ce découpage explicite.

Le `height` du CSS ne règle donc pas la vitesse, seulement **deux rendez-vous** : à 617 vh
(100 d'entrée + 417 de piste + 100 de sortie), l'entrée dans l'aimant de la première carte
tombe pile quand la section achève de se poser, et la sortie de l'aimant de la dernière pile
quand elle commence à se retirer. Mesuré à 3 px près sur le tracé, aux deux bouts. Le changer
décale ces rendez-vous sans rien casser. C'est aussi pourquoi **il n'y a pas de hauteur
réduite en mobile** : les 100 vh d'entrée et de sortie ne rétrécissent pas.

`LEAD_RUN` est près du double de `TAIL_RUN`, et ce n'est pas une faute de frappe : le terrain
d'avant la première carte est plus plat, donc moins cher, donc il en faut davantage pour
dépenser les mêmes 100 vh. C'est aussi ce qui a forcé à **décaler toutes les étapes plus loin
sur le tracé** (première carte à 0,133 au lieu de 0,10) : avec l'ancienne position il n'y
avait pas assez de chemin en amont pour payer l'entrée.

Conséquence de l'amorce : la partie basse du tracé est désormais visible dès l'entrée, et la
marge au bord de la carte y est au plus juste — **324 px mesurés en 3440×1440**, le format le
plus large vérifié. Au-delà, le crème apparaîtrait derrière les contours.

Conséquence : la fraction brute du parcours ne vaut jamais 0 ni 1 — l'affichage du HUD montre
donc délibérément `scrolled`, et non `p`.

**Deux tracés superposés, au `d` identique.** `.trail__track` est la route grise en
pointillés devant ; `.trail__track-done` est verte, pleine, et se révèle par
`stroke-dasharray: ${walked} ${total}`. Cette astuce ne fonctionne que parce que la ligne
parcourue n'est *pas* en pointillés — si elle le redevenait, il faudrait un `<mask>` et un
tracé de révélation distinct.

Ajouter ou déplacer une étape se fait en éditant `data-at` dans `index.html` ; les positions à
l'écran sont calculées par `getPointAtLength`. Mais **quatre valeurs se recalculent ensemble**
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
Garde `GLIDE_MAX` assez haut pour qu'aucune marche ne soit écrêtée sur un écran courant,
sinon la plus longue irait plus vite que les autres, ce qui s'entend tout de suite.

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

**La traîne est hors du mode auto, dans les deux sens.** Une fois sur la dernière carte, un
geste vers le bas n'est plus absorbé : on repasse en scroll manuel, et c'est ce scroll-là qui
emmène à la fois la scène hors de l'écran et le marcheur plus loin sur le chemin. Et à l'intérieur de la traîne, plus rien n'est intercepté — sans
ça, remonter d'un cran vous ramenait aussitôt sur la dernière carte. C'est le rôle du garde
`fraction() > LAST_MARK` dans `targetFor()`, qui est le point de passage unique des trois
gestionnaires (molette, doigt, clavier). Un geste vers le haut *depuis* la dernière carte,
lui, reste automatique : on remonte bien d'étape en étape.

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

## Les assets générés

`assets/hero-topo.svg`, `assets/trail-map.svg` et l'attribut `d` du parcours sont tous
**produits par les scripts Python de `tools/`** (numpy / scipy / matplotlib, déjà installés).
Chacun utilise une graine fixe : relancer `gen_map.py` et `gen_route.py` reproduit les assets
versionnés **à l'octet près**, tu peux donc changer un paramètre et régénérer en confiance.
Voir `tools/README.md`, qui consigne aussi la seule lacune : `gen_topo.py` sort un SVG brut de
204 Ko alors que le `hero-topo.svg` livré en fait 132 Ko, une passe de nettoyage qui n'a pas
été conservée.

`gen_route.py` réécrit le `d` des **deux** `<path>` d'`index.html` ; ils doivent toujours
porter la même valeur.

## À préciser

Ces points ne sont pas encore arbitrés — demande plutôt que de supposer :

- **Le contenu de `#projets`, `#a-propos` et `#contact`.** Les sections existent et sont
  maquettées, mais leurs textes sont des **placeholders assumés**, marqués par la pastille
  `.todo` (« À compléter »). N'invente pas de projets, de client ou de bio à sa place :
  demande-lui le contenu. L'adresse de `#contact` est `adresse@a-completer.fr`, et les liens
  réseaux sont des `<span>`, pas des `<a>`, pour ne pas laisser d'ancre morte.
- **L'hébergement**, donc si les chemins doivent rester relatifs et si une étape de
  minification est un jour nécessaire.
- **La source de vérité du design** : savoir si le fichier Figma fait toujours foi.
